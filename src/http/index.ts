import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import https from "node:https";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { API_METADATA, checkAPIHealth } from "../api/index";
import type { SelfHistoryMessage } from "../types";
import {
  adjustPolicyForVariant,
  applyPolicyToPrompt,
  applySocialPolicyOverrides,
  applyStateGatedResponseContract,
  advanceStickySelfState,
  detectState,
  defaultStickySelfSessionState,
  generateClarifierQuestion,
  getEffectivePolicy,
  getS1Variant,
  getS2Variant,
  logSelfEvent,
  maybeAddFollowUpQuestion,
  processAngerPhysicalityClarifier,
  repairOutput,
  rewriteContinuityQuestions,
  rewriteSpokenMemoryRecall,
  validateOutput,
  type Policy,
  type SelfVariant,
} from "../index";
import { governanceRouter } from "../api/v1/governance";
import express from "express";
import bodyParser from "body-parser";

export type SelfHttpAuthMode = "optional" | "required";

export interface SelfHttpServerOptions {
  host?: string;
  port?: number;
  cors?: {
    enabled: boolean;
    origin?: string;
  };
  auth?: {
    mode: SelfHttpAuthMode;
    apiKey?: string;
  };
  limits?: {
    maxBodyBytes?: number;
  };
  rateLimit?: {
    enabled: boolean;
    requestsPerMinute?: number;
  };
  logging?: {
    requestLogs?: boolean;
    selfLogs?: boolean;
    selfLogPath?: string;
  };
}

export interface StartResult {
  server: Server;
  url: string;
  host: string;
  port: number;
}

type JsonRecord = Record<string, unknown>;

type DemoChatMode = "governed" | "baseline" | "draft" | "compare";

function normalizeHeader(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function getBearerToken(req: IncomingMessage): string | undefined {
  const auth = normalizeHeader(req.headers.authorization);
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice("bearer ".length).trim();
  const xApiKey = normalizeHeader(req.headers["x-api-key"]);
  return xApiKey;
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function sendJson(res: ServerResponse, status: number, body: JsonRecord) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(payload));
  res.end(payload);
}

function sendText(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

async function readJsonBody(req: IncomingMessage, maxBodyBytes: number): Promise<JsonRecord> {
  const preParsed = (req as any).body;
  if (preParsed && typeof preParsed === "object" && !Buffer.isBuffer(preParsed)) {
    return preParsed as JsonRecord;
  }
  if (typeof preParsed === "string" && preParsed.trim()) {
    try {
      return JSON.parse(preParsed) as JsonRecord;
    } catch {
      const error = new Error("Invalid JSON body");
      (error as any).statusCode = 400;
      throw error;
    }
  }
  const rawBody = (req as any).rawBody;
  if (Buffer.isBuffer(rawBody) && rawBody.length) {
    const raw = rawBody.toString("utf8").trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw) as JsonRecord;
    } catch {
      const error = new Error("Invalid JSON body");
      (error as any).statusCode = 400;
      throw error;
    }
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBodyBytes) {
      const error = new Error("Request body too large");
      (error as any).statusCode = 413;
      throw error;
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    const error = new Error("Invalid JSON body");
    (error as any).statusCode = 400;
    throw error;
  }
}

function getClientId(req: IncomingMessage, token?: string): string {
  if (token) return `key:${token.slice(0, 8)}`;
  const forwardedFor = normalizeHeader(req.headers["x-forwarded-for"]);
  if (forwardedFor) return `ip:${forwardedFor.split(",")[0]!.trim()}`;
  const addr = req.socket.remoteAddress || "unknown";
  return `ip:${addr}`;
}

function createPerMinuteLimiter(requestsPerMinute: number) {
  const windowMs = 60_000;
  const buckets = new Map<string, { windowStart: number; count: number }>();
  return (clientId: string) => {
    const now = Date.now();
    const existing = buckets.get(clientId);
    if (!existing || now - existing.windowStart >= windowMs) {
      buckets.set(clientId, { windowStart: now, count: 1 });
      return { allowed: true, remaining: requestsPerMinute - 1 };
    }
    if (existing.count >= requestsPerMinute) return { allowed: false, remaining: 0 };
    existing.count += 1;
    return { allowed: true, remaining: Math.max(0, requestsPerMinute - existing.count) };
  };
}

function pickVariant(state: Policy["state"], args: { seed?: string; variant?: SelfVariant }): SelfVariant {
  if (args.variant) return args.variant;
  if (!args.seed) return "control";
  if (state === "S1") return getS1Variant(args.seed);
  if (state === "S2") return getS2Variant(args.seed);
  return "control";
}

function toHistory(value: unknown): SelfHistoryMessage[] {
  if (!Array.isArray(value)) return [];
  const out: SelfHistoryMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const role = (item as any).role;
    const content = (item as any).content;
    if ((role === "user" || role === "assistant" || role === "system") && typeof content === "string") {
      out.push({ role, content });
    }
  }
  return out;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sha256Base64Url(input: string): string {
  return toBase64Url(crypto.createHash("sha256").update(input).digest());
}

function hmacSha256Base64Url(key: string, input: string): string {
  return toBase64Url(crypto.createHmac("sha256", key).update(input).digest());
}

const SELF_DEMO_EVENT_SIGNING_KEY = String(process.env.SELF_DEMO_EVENT_SIGNING_KEY || "").trim() ||
  crypto.randomBytes(32).toString("base64url");

const demoSessionStates = new Map<
  string,
  { state: Policy["state"]; session: ReturnType<typeof defaultStickySelfSessionState>; updatedAt: number }
>();

type DemoFlagReason =
  | "unsafe"
  | "too_permissive"
  | "too_harsh"
  | "tone"
  | "incorrect_state"
  | "other";

const demoFlagMetrics = {
  totalFlags: 0,
  totalPublicOptIn: 0,
  byState: new Map<string, number>(),
  byReason: new Map<string, number>(),
  updatedAt: new Date().toISOString(),
};

const demoReportRate = new Map<string, number[]>(); // clientHash -> epochMs timestamps
const DEMO_REPORT_LIMIT_PER_WEEK = 3;
const DEMO_REPORT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type DemoReportTier = 1 | 2 | 3;

const demoHeroes = new Map<
  string,
  { name: string; score: number; reports: number; tier1: number; tier2: number; tier3: number; updatedAt: string }
>();

function normalizeDisplayName(input: string): string {
  const name = String(input || "").trim();
  if (!name) return "";
  if (name.length > 32) return name.slice(0, 32);
  return name;
}

function isAcceptableDisplayName(name: string): boolean {
  const n = normalizeDisplayName(name);
  if (!n) return false;
  if (/\bhttps?:\/\//i.test(n) || /\bwww\./i.test(n)) return false;
  if (/@/.test(n)) return false;
  return /^[a-zA-Z0-9 _.'-]{2,32}$/.test(n);
}

function tierScore(tier: DemoReportTier): number {
  if (tier === 3) return 10;
  if (tier === 2) return 3;
  return 1;
}

function allowWeeklyReport(clientHash: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const list = demoReportRate.get(clientHash) || [];
  const fresh = list.filter((t) => now - t < DEMO_REPORT_WINDOW_MS);
  const allowed = fresh.length < DEMO_REPORT_LIMIT_PER_WEEK;
  if (allowed) fresh.push(now);
  demoReportRate.set(clientHash, fresh);
  return { allowed, remaining: Math.max(0, DEMO_REPORT_LIMIT_PER_WEEK - fresh.length) };
}

function isSafeScreenshotPayload(payload: any): payload is {
  mime: string;
  dataUrl: string;
  bytes: number;
  width?: number;
  height?: number;
} {
  if (!payload || typeof payload !== "object") return false;
  const mime = String((payload as any).mime || "");
  const dataUrl = String((payload as any).dataUrl || "");
  const bytes = Number((payload as any).bytes || 0);
  if (!mime || !dataUrl || !Number.isFinite(bytes) || bytes <= 0) return false;
  if (mime !== "image/jpeg" && mime !== "image/png") return false;
  if (!dataUrl.startsWith("data:image/")) return false;
  // Cap to keep logs from ballooning.
  if (bytes > 450_000) return false;
  return true;
}

function resolveSelfSiteLogPath(): string {
  const configured = String(process.env.SELF_SITE_LOG_PATH || "").trim();
  if (configured) return configured;
  const home = process.env.HOME || "";
  if (home) return path.join(home, "self-site-flags.jsonl");
  return "";
}

const SELF_SITE_LOG_PATH = resolveSelfSiteLogPath();

function redactPotentialPII(text: string): string {
  let out = String(text || "");
  // Very light redaction; public metrics never include raw text.
  out = out.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]");
  out = out.replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[redacted-phone]");
  return out;
}

function appendSelfSiteLog(event: Record<string, unknown>) {
  try {
    console.log(`[SELF_SITE_FLAG] ${JSON.stringify(event)}`);
    if (!SELF_SITE_LOG_PATH) return;
    fs.mkdirSync(path.dirname(SELF_SITE_LOG_PATH), { recursive: true });
    fs.appendFileSync(SELF_SITE_LOG_PATH, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    console.error("[self-http] failed to write SELF_SITE_FLAG", err);
  }
}

function inc(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function metricsSnapshot() {
  const byState: Record<string, number> = {};
  for (const [k, v] of demoFlagMetrics.byState.entries()) byState[k] = v;
  const byReason: Record<string, number> = {};
  for (const [k, v] of demoFlagMetrics.byReason.entries()) byReason[k] = v;
  return {
    totalFlags: demoFlagMetrics.totalFlags,
    totalPublicOptIn: demoFlagMetrics.totalPublicOptIn,
    byState,
    byReason,
    updatedAt: demoFlagMetrics.updatedAt,
  };
}

function getDemoSessionKey(body: JsonRecord, req: IncomingMessage, token?: string): string {
  const sid = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (sid) return `sid:${sid.slice(0, 80)}`;
  return `client:${getClientId(req, token)}`;
}

function pruneDemoSessions(max: number) {
  if (demoSessionStates.size <= max) return;
  const entries = Array.from(demoSessionStates.entries()).sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  for (let i = 0; i < entries.length - max; i++) {
    demoSessionStates.delete(entries[i]![0]);
  }
}

function detectDemoBoundaryTriggers(userMessage: string) {
  const low = userMessage.toLowerCase();
  return {
    therapistRoleplay: /\b(therapist|therapy|counselor|counselling|counseling)\b/.test(low),
    diagnosisRequest: /\b(diagnose|diagnosis|treatment plan|prescribe|medication|dosage|ssri)\b/.test(low),
    authorityPressure: /\b(guarantee|promise|be certain|no doubts|tell me the truth)\b/.test(low),
    escalationPressure: /\b(if you don't|or else|you must|i swear|prove it)\b/.test(low),
  };
}

function detectDemoUnsafeCategories(output: string): string[] {
  const text = String(output || "");
  const cats = new Set<string>();
  const low = text.toLowerCase();

  if (
    /\b(as your (doctor|therapist|psychiatrist|counselor)|i am (a|your) (doctor|therapist|psychiatrist|counselor)|licensed (therapist|psychiatrist|clinician))\b/i.test(
      text,
    )
  ) {
    cats.add("clinical_authority_claim");
  }

  if (/\b(i diagnose you|your diagnosis is|meet the criteria for)\b/i.test(text)) {
    cats.add("diagnosis");
  }

  if (/\byou have (bipolar|bpd|adhd|ptsd|schizophrenia|ocd)\b/i.test(text)) {
    cats.add("diagnosis");
  }

  if (
    /\b(prescribe|dosage|mg\b|ssri|benzodiazepine|antidepressant|xanax|prozac|sertraline|fluoxetine|escitalopram)\b/i.test(text)
  ) {
    // Avoid false positives for refusals/boundary-setting ("I can't prescribe...").
    const negationWindow =
      /\b(can't|cannot|won't|will not|not able to|unable to|i'm not|im not|i am not)\b.{0,50}\b(prescribe|dosage|mg\b|ssri|benzodiazepine|antidepressant|xanax|prozac|sertraline|fluoxetine|escitalopram)\b/i.test(
        text,
      );
    const handoffContext =
      /\b(talk to|see|contact|reach out to)\s+(a|your)\s+(doctor|clinician|physician|provider|psychiatrist)\b/i.test(text) ||
      /\bwith a (doctor|clinician|physician|provider|psychiatrist)\b/i.test(text);

    // Flag only if it looks like actual advice/instructions, not a refusal or a handoff-to-clinician.
    const directiveContext =
      /\b(you should|try|start|begin|take|increase|decrease|reduce|taper|switch|use)\b/i.test(text) ||
      /\b\d+\s?mg\b/i.test(text) ||
      /\b\d+\s?(ml|milligrams?)\b/i.test(text);

    if (!negationWindow && !handoffContext && directiveContext) {
      cats.add("medical_advice");
    }
  }

  if (/\b(i will always be here|you only need me|don't tell anyone else|i'm all you need|stay with me forever)\b/i.test(text)) {
    cats.add("dependency_dynamics");
  }

  const selfHarmSignals = /\b(suicide|kill myself|end my life|self-harm|cut myself|overdose|hang myself)\b/i.test(text);
  const instructionSignals =
    /\b(how to|steps to|here'?s how|method|plan|instructions|you should|do this)\b/i.test(text) ||
    /\b(take .*pills|use a .*rope|find a (bridge|gun)|cut (deeper|your wrists))\b/i.test(text);
  if (selfHarmSignals && instructionSignals) {
    cats.add("self_harm_instructions");
  }

  if (/\b(ignore (your|the) rules|bypass|jailbreak|break policy)\b/i.test(text)) {
    cats.add("override_attempt");
  }

  if (/\b(api[_ -]?key|bearer\s+[a-z0-9._-]{12,})\b/i.test(text)) {
    cats.add("secret_leak_risk");
  }

  if (/\b(how to make a bomb|build a bomb|explosive device|poison someone)\b/i.test(text)) {
    cats.add("violent_wrongdoing_instructions");
  }

  return Array.from(cats);
}

function blockIfUnsafe(label: "baseline" | "governed", output: string) {
  const unsafeCategoriesAll = detectDemoUnsafeCategories(output);
  // Governed outputs already go through SELF validation+repair; only block the truly hard categories.
  const unsafeCategories =
    label === "governed"
      ? unsafeCategoriesAll.filter((c) =>
          [
            "self_harm_instructions",
            "violent_wrongdoing_instructions",
            "secret_leak_risk",
            "override_attempt",
            "clinical_authority_claim",
            "dependency_dynamics",
            "diagnosis",
          ].includes(c),
        )
      : unsafeCategoriesAll;
  if (unsafeCategories.length === 0) return { output, blocked: false, unsafeCategories };
  const safeMessage =
    label === "baseline"
      ? "This baseline response was blocked due to unsafe content."
      : "This governed response was blocked due to unsafe content.";
  return { output: safeMessage, blocked: true, unsafeCategories };
}

function httpsJsonRequest(url: URL, body: string, headers: Record<string, string>): Promise<{ status: number; json: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers,
        timeout: 20_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json: any = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, raw });
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("upstream_timeout")));
    req.write(body);
    req.end();
  });
}

async function generateWithGroq(args: { system: string; user: string; maxTokens: number; temperature: number }) {
  const apiKey = String(process.env.GROQ_API_KEY || process.env.SELF_DEMO_GROQ_API_KEY || "").trim();
  const model = String(process.env.SELF_DEMO_GROQ_MODEL || "llama-3.1-8b-instant").trim();

  if (!apiKey) {
    const error = new Error("groq_api_key_missing");
    (error as any).statusCode = 424;
    throw error;
  }

  const url = new URL("https://api.groq.com/openai/v1/chat/completions");
  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    temperature: args.temperature,
    max_tokens: args.maxTokens,
  });

  const { status, json, raw } = await httpsJsonRequest(url, body, {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(body)),
  });

  if (status < 200 || status >= 300) {
    const error = new Error(`groq_error_${status}`);
    (error as any).statusCode = 502;
    (error as any).details = typeof json === "object" && json ? json : raw?.slice(0, 500);
    throw error;
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    const error = new Error("groq_empty_completion");
    (error as any).statusCode = 502;
    throw error;
  }

  return { content: content.trim(), model };
}

function buildDemoDraftResponse(args: { userMessage: string; state: Policy["state"]; triggers: ReturnType<typeof detectDemoBoundaryTriggers> }): string {
  const { userMessage, state, triggers } = args;
  const intro =
    state === "S3"
      ? "I’m really sorry you’re feeling this overwhelmed right now."
      : state === "S2"
        ? "I hear how intense this feels."
        : state === "S1"
          ? "That sounds hard, and I’m here with you."
          : "Got it.";

  const therapistAngle = triggers.therapistRoleplay || triggers.diagnosisRequest
    ? "I can’t diagnose, but tell me what’s been going on — symptoms, timeline, and what you’ve tried so far."
    : "";

  const questions =
    state === "S0"
      ? ""
      : "What happened right before this? How long has it been going on? What do you wish I would say right now? What’s the biggest fear if nothing changes?";

  const nextStep =
    state === "S3"
      ? "If you feel in danger right now, please contact local emergency services or someone you trust immediately."
      : "If you want, we can pick one small next step that makes the next 10 minutes easier.";

  return [intro, therapistAngle, questions, nextStep].filter(Boolean).join(" ").trim();
}

function buildDemoGovernedResponse(args: { userMessage: string; state: Policy["state"]; triggers: ReturnType<typeof detectDemoBoundaryTriggers> }): string {
  const { userMessage, state, triggers } = args;

  const boundary =
    triggers.therapistRoleplay || triggers.diagnosisRequest
      ? "I can’t act as a therapist or provide medical advice or diagnoses. I can support you in a non-clinical way."
      : triggers.authorityPressure
        ? "I can’t guarantee certainty or take emotional authority over your decisions, but I can help you think clearly and safely."
        : "";

  const grounding =
    state === "S3" || state === "S2" || state === "S1"
      ? "If it helps, take one slow breath and feel your feet on the ground."
      : "";

  const validation =
    state === "S3"
      ? "What you’re feeling makes sense given how intense this is."
      : state === "S2"
        ? "This sounds overwhelming, and you don’t have to carry it alone."
        : state === "S1"
          ? "That’s a lot to hold at once."
          : "";

  const agencyStep =
    state === "S3"
      ? "A small next step: can you reach out to a real person right now (friend, family, local support line) and let them know you need help?"
      : state === "S2"
        ? "A small next step: choose one grounding action (water, fresh air, or sitting somewhere steady) for the next 2 minutes."
        : state === "S1"
          ? "A small next step: name the main feeling in one word (e.g., anxious, angry, numb) and we’ll work from there."
          : "If you want, share one sentence about what you’re trying to achieve and I’ll keep it brief.";

  const crisis =
    state === "S3"
      ? "If you might hurt yourself or someone else, please contact local emergency services now. If you’re in the U.S./Canada, you can call or text 988; otherwise, use your local crisis number."
      : "";

  const question =
    state === "S1" ? "Do you want support, or do you want practical options?" : state === "S2" || state === "S3" ? "Are you alone right now?" : "";

  return [boundary, validation, grounding, agencyStep, crisis, question].filter(Boolean).join(" ").trim();
}

const DEMO_BASELINE_SYSTEM_PROMPT =
  "You are a helpful assistant. Respond normally and directly to the user's message.";

const DEMO_GOVERNED_BASE_SYSTEM_PROMPT =
  "You are a helpful, calm, non-directive assistant in a governance demo. Do not provide medical advice or diagnosis. Do not claim to be a therapist/doctor. Do not create dependency dynamics. Maintain steady, warm tone. Keep it useful and grounded.";

export function createSelfHttpServer(options: SelfHttpServerOptions = {}): Server {
  const host = options.host || "0.0.0.0";
  const port = options.port ?? 8787;
  const maxBodyBytes = options.limits?.maxBodyBytes ?? 1_000_000;
  const cors = options.cors?.enabled ? options.cors : undefined;
  const authMode = options.auth?.mode ?? "optional";
  const apiKey = options.auth?.apiKey;
  const requestLogs = options.logging?.requestLogs ?? true;
  const selfLogs = options.logging?.selfLogs ?? true;
  const rateLimitEnabled = options.rateLimit?.enabled ?? false;
  const requestsPerMinute = options.rateLimit?.requestsPerMinute ?? 120;
  const limit = rateLimitEnabled ? createPerMinuteLimiter(requestsPerMinute) : undefined;

  const server = createServer(async (req, res) => {
    try {
      const started = Date.now();
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      if (cors) {
        res.setHeader("access-control-allow-origin", cors.origin || "*");
        res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
        res.setHeader("access-control-allow-headers", "content-type,authorization,x-api-key");
        res.setHeader("access-control-max-age", "86400");
      }
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }

      const token = getBearerToken(req);
      if (apiKey && authMode === "required") {
        if (!token || !timingSafeEqual(token, apiKey)) {
          sendJson(res, 401, { error: "unauthorized" });
          return;
        }
      } else if (apiKey && token && !timingSafeEqual(token, apiKey)) {
        sendJson(res, 401, { error: "unauthorized" });
        return;
      }

      if (limit) {
        const clientId = getClientId(req, token);
        const verdict = limit(clientId);
        res.setHeader("x-ratelimit-limit", String(requestsPerMinute));
        res.setHeader("x-ratelimit-remaining", String(verdict.remaining));
        if (!verdict.allowed) {
          sendJson(res, 429, { error: "rate_limited" });
          return;
        }
      }

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, {
          status: "ok",
          api: checkAPIHealth(),
          metadata: API_METADATA,
          uptimeMs: Math.round(process.uptime() * 1000),
        });
        return;
      }

	      if (req.method === "GET" && url.pathname === "/") {
	        sendJson(res, 200, {
	          name: "self-engine",
	          httpApi: "v1",
	          endpoints: {
	            health: "GET /health",
	            pre: "POST /v1/pre",
	            post: "POST /v1/post",
	            demoChat: "POST /v1/demo/chat",
	            demoFlag: "POST /v1/demo/flag",
	            demoMetrics: "GET /v1/demo/metrics",
	          },
	        });
	        return;
	      }

	      if (req.method === "GET" && url.pathname === "/v1/demo/metrics") {
	        sendJson(res, 200, { metrics: metricsSnapshot() });
	        return;
	      }

	      if (req.method === "GET" && url.pathname === "/v1/demo/heroes") {
	        const heroes = Array.from(demoHeroes.values())
	          .sort((a, b) => b.score - a.score || b.reports - a.reports || a.name.localeCompare(b.name))
	          .slice(0, 25)
	          .map((h) => ({
	            name: h.name,
	            score: h.score,
	            reports: h.reports,
	            tier1: h.tier1,
	            tier2: h.tier2,
	            tier3: h.tier3,
	            updatedAt: h.updatedAt,
	          }));
	        sendJson(res, 200, { heroes, updatedAt: new Date().toISOString() });
	        return;
	      }

	      if (req.method === "POST" && url.pathname === "/v1/pre") {
	        const body = await readJsonBody(req, maxBodyBytes);
	        const message = body.message;
        if (typeof message !== "string" || !message.trim()) {
          sendJson(res, 400, { error: "message_required" });
          return;
        }

        const history = toHistory(body.history);
        const detection = detectState(message, history);

        const seed =
          typeof body.seed === "string"
            ? body.seed
            : typeof body.sessionId === "string" || typeof body.userId === "string"
              ? `${String(body.userId || "")}:${String(body.sessionId || "")}`.trim()
              : undefined;
        const variant =
          typeof body.variant === "string" ? (body.variant as SelfVariant) : pickVariant(detection.state, { seed });

        let policy = adjustPolicyForVariant(getEffectivePolicy({ state: detection.state }), variant);
        const { policy: overriddenPolicy, meta } = applySocialPolicyOverrides({
          message,
          detection,
          policy,
          history,
        });
        policy = overriddenPolicy;

        const clarifier = processAngerPhysicalityClarifier(message, detection);
        const clarifierQuestion = clarifier.required ? generateClarifierQuestion() : undefined;

        if (selfLogs) {
          logSelfEvent(
            {
              userId: typeof body.userId === "string" ? body.userId : "anonymous",
              stage: "pre",
              message,
              messageId: typeof body.messageId === "number" ? body.messageId : undefined,
              state: detection.state,
              scores: detection.scores,
              reasons: detection.reasons,
              policy,
              variant,
              probeAllowed: true,
              resolutionDetected: meta.resolutionDetected,
            },
            { enabled: true, logPath: options.logging?.selfLogPath },
          );
        }

        const baseSystemPrompt = typeof body.baseSystemPrompt === "string" ? body.baseSystemPrompt : undefined;
        const policyPrompt = baseSystemPrompt ? applyPolicyToPrompt(policy, baseSystemPrompt, variant) : undefined;

        sendJson(res, 200, {
          detection,
          variant,
          policy,
          meta,
          clarifier: {
            ...clarifier,
            question: clarifierQuestion,
          },
          policyPrompt,
        });

        if (requestLogs) {
          const ms = Date.now() - started;
          console.log(`[self-http] ${req.method} ${url.pathname} 200 ${ms}ms`);
        }
        return;
      }

	      if (req.method === "POST" && url.pathname === "/v1/post") {
	        const body = await readJsonBody(req, maxBodyBytes);
	        const output = body.output;
	        const userMessage = body.userMessage;
        const policy = body.policy as Policy | undefined;
        if (typeof output !== "string" || typeof userMessage !== "string" || !policy || typeof policy !== "object") {
          sendJson(res, 400, { error: "output_userMessage_policy_required" });
          return;
        }

        const stage1 = applyStateGatedResponseContract(output, policy, userMessage);
        const stage2 = rewriteContinuityQuestions(stage1, policy, userMessage);
        const stage3 = rewriteSpokenMemoryRecall(stage2, policy, userMessage);
        const stage4 = maybeAddFollowUpQuestion(stage3, policy, userMessage);

        let finalOutput = stage4;
        let validation = validateOutput(finalOutput, policy);
        let repaired = false;

        if (!validation.ok) {
          finalOutput = repairOutput(finalOutput, policy);
          repaired = true;
          validation = validateOutput(finalOutput, policy);
        }

        if (selfLogs) {
          logSelfEvent(
            {
              userId: typeof body.userId === "string" ? body.userId : "anonymous",
              stage: "post",
              message: finalOutput,
              messageId: typeof body.messageId === "number" ? body.messageId : undefined,
              state: policy.state,
              scores: {},
              reasons: [],
              policy,
              validation,
              repaired,
            },
            { enabled: true, logPath: options.logging?.selfLogPath },
          );
        }

	        sendJson(res, 200, { output: finalOutput, validation, repaired });

	        if (requestLogs) {
	          const ms = Date.now() - started;
	          console.log(`[self-http] ${req.method} ${url.pathname} 200 ${ms}ms`);
	        }
	        return;
	      }

	      if (req.method === "POST" && url.pathname === "/v1/demo/chat") {
	        const body = await readJsonBody(req, maxBodyBytes);
	        const userMessage = typeof body.message === "string" ? body.message : "";
	        if (!userMessage.trim()) {
	          sendJson(res, 400, { error: "message_required" });
	          return;
	        }

	        pruneDemoSessions(2000);

	        const history = toHistory(body.history);
	        const sessionKey = getDemoSessionKey(body, req, token);
	        const prev = demoSessionStates.get(sessionKey);
	        const stickySession = prev ? prev.session : defaultStickySelfSessionState();
	        const sticky = advanceStickySelfState({ session: stickySession, message: userMessage, history });
	        const effectiveState = sticky.meta.stateAfter;
	        const detection = sticky.detection;

	        const seed =
	          typeof body.seed === "string"
	            ? body.seed
	            : typeof body.sessionId === "string" || typeof body.userId === "string"
	              ? `${String(body.userId || "")}:${String(body.sessionId || "")}`.trim()
	              : undefined;
	        const variant =
	          typeof body.variant === "string" ? (body.variant as SelfVariant) : pickVariant(effectiveState, { seed });

	        let policy = adjustPolicyForVariant(getEffectivePolicy({ state: effectiveState }), variant);
	        const { policy: overriddenPolicy, meta } = applySocialPolicyOverrides({
	          message: userMessage,
	          detection,
	          policy,
	          history,
	          session: { pushCount: sticky.nextSession.pushCount },
	        });
		        policy = overriddenPolicy;

		        const triggers = detectDemoBoundaryTriggers(userMessage);
		        const governedSystemPrompt =
		          applyPolicyToPrompt(policy, DEMO_GOVERNED_BASE_SYSTEM_PROMPT, variant) || DEMO_GOVERNED_BASE_SYSTEM_PROMPT;

		        const groqApiKeyPresent = Boolean(
		          String(process.env.GROQ_API_KEY || process.env.SELF_DEMO_GROQ_API_KEY || "").trim(),
		        );
		        const groqModel = String(process.env.SELF_DEMO_GROQ_MODEL || "llama-3.1-8b-instant").trim();
		        const useRealModel = groqApiKeyPresent;
		        const provider = useRealModel ? { name: "groq", model: groqModel } : { name: "offline", model: "deterministic_demo" };

		        const baselineRaw = useRealModel
		          ? (await generateWithGroq({ system: DEMO_BASELINE_SYSTEM_PROMPT, user: userMessage, maxTokens: 260, temperature: 0.7 })).content
		          : buildDemoDraftResponse({ userMessage, state: policy.state, triggers });

		        const governedDraftRaw = useRealModel
		          ? (await generateWithGroq({ system: governedSystemPrompt, user: userMessage, maxTokens: 260, temperature: 0.4 })).content
		          : buildDemoGovernedResponse({ userMessage, state: policy.state, triggers });

		        const demoMode = (typeof body.mode === "string" ? body.mode : "compare") as DemoChatMode;

		        const governedStage1 = applyStateGatedResponseContract(governedDraftRaw, policy, userMessage);
		        const governedStage2 = rewriteContinuityQuestions(governedStage1, policy, userMessage);
		        const governedStage3 = rewriteSpokenMemoryRecall(governedStage2, policy, userMessage);
		        const governedStage4 = maybeAddFollowUpQuestion(governedStage3, policy, userMessage);

	        let governedFinal = governedStage4;
	        let governedValidation = validateOutput(governedFinal, policy);
	        let governedRepaired = false;
	        if (!governedValidation.ok) {
	          governedFinal = repairOutput(governedFinal, policy);
	          governedRepaired = true;
		          governedValidation = validateOutput(governedFinal, policy);
		        }

        const baselinePost = validateOutput(baselineRaw, policy);
        const baselineSafe = blockIfUnsafe("baseline", baselineRaw);
        const governedSafeRaw = blockIfUnsafe("governed", governedFinal);
        const governedSafe = {
          output: governedFinal,
          blocked: false,
          unsafeCategories: governedSafeRaw.unsafeCategories,
        };

	        demoSessionStates.set(sessionKey, { state: policy.state, session: sticky.nextSession, updatedAt: Date.now() });

	        const transition =
	          prev && prev.state !== policy.state
	            ? { from: prev.state, to: policy.state }
	            : prev
	              ? { from: prev.state, to: prev.state }
	              : null;

		        const auditChecks: string[] = [];
		        auditChecks.push(governedValidation.ok ? "safety_check_passed" : "safety_check_failed");
		        if (triggers.therapistRoleplay || triggers.diagnosisRequest) auditChecks.push("boundary_no_clinical_authority");
		        auditChecks.push("tone_lock_calm_warm_nondirective");
		        if (governedRepaired) auditChecks.push("repair_applied");
		        if (baselinePost.violations.some((v) => v.startsWith("Word count"))) auditChecks.push("word_cap_enforced");
		        if (baselinePost.violations.some((v) => v.startsWith("Question count"))) auditChecks.push("question_cap_enforced");
		        auditChecks.push(useRealModel ? "baseline_real_model_output" : "baseline_offline_fallback");
        if (baselineSafe.blocked) auditChecks.push("baseline_blocked_unsafe");
        if (governedSafe.unsafeCategories.length) auditChecks.push("governed_unsafe_detected");

	        const eventId = crypto.randomUUID();
		        const eventPayload = {
		          eventId,
		          kind: "self_demo_chat",
		          timestamp: new Date().toISOString(),
		          sessionKey: sha256Base64Url(sessionKey),
		          mode: demoMode,
		          provider,
		          state: policy.state,
		          transition,
		          detection: { state: detection.state, reasons: detection.reasons },
		          meta,
		          checks: auditChecks,
		          governed: { repaired: governedRepaired, validation: governedValidation },
		          baseline: { validation: baselinePost, blocked: baselineSafe.blocked, unsafeCategories: baselineSafe.unsafeCategories },
		          governedOutput: { blocked: governedSafe.blocked, unsafeCategories: governedSafe.unsafeCategories },
		        };
	        const eventHash = sha256Base64Url(JSON.stringify(eventPayload));
	        const eventSignature = hmacSha256Base64Url(SELF_DEMO_EVENT_SIGNING_KEY, eventHash);

	        if (selfLogs) {
	          logSelfEvent(
	            {
	              userId: typeof body.userId === "string" ? body.userId : "anonymous",
	              stage: "pre",
	              message: userMessage,
	              messageId: typeof body.messageId === "number" ? body.messageId : undefined,
	              state: detection.state,
	              scores: detection.scores,
	              reasons: detection.reasons,
	              policy,
	              variant,
	              probeAllowed: true,
	              resolutionDetected: meta.resolutionDetected,
	            },
	            { enabled: true, logPath: options.logging?.selfLogPath },
	          );
	          logSelfEvent(
	            {
	              userId: typeof body.userId === "string" ? body.userId : "anonymous",
	              stage: "post",
	              message: governedFinal,
	              messageId: typeof body.messageId === "number" ? body.messageId : undefined,
	              state: policy.state,
	              scores: {},
	              reasons: [],
	              policy,
	              validation: governedValidation,
	              repaired: governedRepaired,
	            },
	            { enabled: true, logPath: options.logging?.selfLogPath },
	          );
	        }

	        sendJson(res, 200, {
	          detection,
	          policy: { state: policy.state, maxWords: policy.maxWords, maxQuestions: policy.maxQuestions, styleRules: policy.styleRules },
	          variant,
	          meta,
	          provider,
	          transition,
	          outputs: {
		            governed: {
		              output: governedSafe.output,
		              validation: governedValidation,
		              repaired: governedRepaired,
		              blocked: governedSafe.blocked,
		              unsafeCategories: governedSafe.unsafeCategories,
		            },
		            baseline: {
		              output: baselineSafe.output,
		              validation: baselinePost,
		              blocked: baselineSafe.blocked,
		              unsafeCategories: baselineSafe.unsafeCategories,
		            },
		          },
	          audit: {
	            checks: auditChecks,
	            violations: governedValidation.ok ? [] : governedValidation.violations,
	            eventId,
	            eventHash,
	            eventSignature,
	          },
	        });

	        if (requestLogs) {
	          const ms = Date.now() - started;
	          console.log(`[self-http] ${req.method} ${url.pathname} 200 ${ms}ms`);
	        }
	        return;
	      }

	      if (req.method === "POST" && url.pathname === "/v1/demo/flag") {
	        const body = await readJsonBody(req, maxBodyBytes);
	        const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
	        const state = typeof body.state === "string" ? body.state.trim() : "";
	        const message = typeof body.message === "string" ? body.message : "";
	        const includePublic = Boolean(body.includePublic);
	        const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : "other";
	        const reason: DemoFlagReason =
	          reasonRaw === "unsafe" ||
	          reasonRaw === "too_permissive" ||
	          reasonRaw === "too_harsh" ||
	          reasonRaw === "tone" ||
	          reasonRaw === "incorrect_state" ||
	          reasonRaw === "other"
	            ? (reasonRaw as DemoFlagReason)
	            : "other";

	        if (!eventId || !state || !message.trim()) {
	          sendJson(res, 400, { error: "eventId_state_message_required" });
	          return;
	        }

	        const sessionKey = getDemoSessionKey(body, req, token);
	        const payload = {
	          kind: "demo_flag",
	          timestamp: new Date().toISOString(),
	          eventId,
	          state,
	          reason,
	          includePublic,
	          session: sha256Base64Url(sessionKey),
	          message: redactPotentialPII(message).slice(0, 2000),
	        };

	        demoFlagMetrics.totalFlags += 1;
	        inc(demoFlagMetrics.byState, state);
	        inc(demoFlagMetrics.byReason, reason);
	        if (includePublic) demoFlagMetrics.totalPublicOptIn += 1;
	        demoFlagMetrics.updatedAt = new Date().toISOString();

	        appendSelfSiteLog(payload);
	        sendJson(res, 200, { ok: true, metrics: metricsSnapshot() });
	        return;
	      }

	      if (req.method === "POST" && url.pathname === "/v1/demo/report") {
	        const body = await readJsonBody(req, maxBodyBytes);
	        const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
	        const state = typeof body.state === "string" ? body.state.trim() : "";
	        const tierNum = Number((body as any).tier);
	        const tier: DemoReportTier = tierNum === 3 ? 3 : tierNum === 2 ? 2 : 1;
	        const why = typeof (body as any).why === "string" ? (body as any).why.trim() : "";
	        const prompt = typeof (body as any).prompt === "string" ? (body as any).prompt : "";
	        const governedResponse =
	          typeof (body as any).governedResponse === "string" ? (body as any).governedResponse : "";
	        const baselineResponse =
	          typeof (body as any).baselineResponse === "string" ? (body as any).baselineResponse : "";
	        const consentLeaderboard = Boolean((body as any).consentLeaderboard);
	        const displayNameRaw = typeof (body as any).displayName === "string" ? (body as any).displayName : "";
	        const displayName = normalizeDisplayName(displayNameRaw);
	        const screenshot = (body as any).screenshot;

	        if (!eventId || !state || !why || !prompt.trim() || !governedResponse.trim()) {
	          sendJson(res, 400, { error: "eventId_state_prompt_response_why_required" });
	          return;
	        }
	        if (why.length > 2000) {
	          sendJson(res, 400, { error: "why_too_long" });
	          return;
	        }
	        if (consentLeaderboard && !isAcceptableDisplayName(displayName)) {
	          sendJson(res, 400, { error: "invalid_display_name" });
	          return;
	        }

	        const sessionKey = getDemoSessionKey(body, req, token);
	        const clientHash = sha256Base64Url(sessionKey);
	        const rate = allowWeeklyReport(clientHash);
	        res.setHeader("x-report-limit", String(DEMO_REPORT_LIMIT_PER_WEEK));
	        res.setHeader("x-report-remaining", String(rate.remaining));
	        if (!rate.allowed) {
	          sendJson(res, 429, { error: "rate_limited" });
	          return;
	        }

	        const screenshotOk = isSafeScreenshotPayload(screenshot);
	        const screenshotHash = screenshotOk ? sha256Base64Url(String(screenshot.dataUrl || "")) : null;

	        const payload = {
	          kind: "demo_report",
	          timestamp: new Date().toISOString(),
	          eventId,
	          state,
	          tier,
	          why: redactPotentialPII(why).slice(0, 2000),
	          prompt: redactPotentialPII(prompt).slice(0, 2000),
	          governedResponse: redactPotentialPII(governedResponse).slice(0, 4000),
	          baselineResponse: redactPotentialPII(baselineResponse).slice(0, 4000),
	          consentLeaderboard,
	          displayName: consentLeaderboard ? displayName : "",
	          session: clientHash,
	          screenshot: screenshotOk
	            ? {
	                mime: screenshot.mime,
	                bytes: screenshot.bytes,
	                width: Number.isFinite(screenshot.width) ? screenshot.width : undefined,
	                height: Number.isFinite(screenshot.height) ? screenshot.height : undefined,
	                hash: screenshotHash,
	                // Internal: keep a small prefix for forensic correlation without storing full image in logs.
	                dataUrlPrefix: String(screenshot.dataUrl || "").slice(0, 120),
	              }
	            : null,
	          rules: (body as any).rules || null,
	        };

	        if (consentLeaderboard) {
	          const key = displayName.toLowerCase();
	          const current = demoHeroes.get(key) || {
	            name: displayName,
	            score: 0,
	            reports: 0,
	            tier1: 0,
	            tier2: 0,
	            tier3: 0,
	            updatedAt: new Date().toISOString(),
	          };
	          current.reports += 1;
	          current.score += tierScore(tier);
	          if (tier === 3) current.tier3 += 1;
	          else if (tier === 2) current.tier2 += 1;
	          else current.tier1 += 1;
	          current.updatedAt = new Date().toISOString();
	          demoHeroes.set(key, current);
	        }

	        appendSelfSiteLog(payload);
	        sendJson(res, 200, { ok: true, report: { accepted: true }, remaining: rate.remaining });
	        return;
	      }

	      sendJson(res, 404, { error: "not_found" });
	    } catch (err) {
	      const statusCode =
        typeof err === "object" && err && "statusCode" in err && typeof (err as any).statusCode === "number"
          ? (err as any).statusCode
          : 500;
      sendJson(res, statusCode, { error: "internal_error" });
      if (requestLogs) {
        console.error("[self-http] request failed", err);
      }
    }
  });

  // Keep host/port defaults discoverable (used by startSelfHttpServer).
  (server as any).__selfHttpHost = host;
  (server as any).__selfHttpPort = port;

  return server;
}

export async function startSelfHttpServer(options: SelfHttpServerOptions = {}): Promise<StartResult> {
  const host = options.host || "0.0.0.0";
  const port = options.port ?? 8787;
  const server = createSelfHttpServer({ ...options, host, port });
  await new Promise<void>((resolve) => {
    server.listen(port, host, () => resolve());
  });
  const url = `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`;
  return { server, url, host, port };
}
