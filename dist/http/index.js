import { createServer } from "node:http";
import crypto from "node:crypto";
import { API_METADATA, checkAPIHealth } from "../api/index.js";
import { adjustPolicyForVariant, applyPolicyToPrompt, applySocialPolicyOverrides, applyStateGatedResponseContract, detectState, generateClarifierQuestion, getEffectivePolicy, getS1Variant, getS2Variant, logSelfEvent, maybeAddFollowUpQuestion, processAngerPhysicalityClarifier, repairOutput, rewriteContinuityQuestions, rewriteSpokenMemoryRecall, validateOutput, } from "../index.js";
function normalizeHeader(value) {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}
function getBearerToken(req) {
    const auth = normalizeHeader(req.headers.authorization);
    if (auth && auth.toLowerCase().startsWith("bearer "))
        return auth.slice("bearer ".length).trim();
    const xApiKey = normalizeHeader(req.headers["x-api-key"]);
    return xApiKey;
}
function timingSafeEqual(a, b) {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length)
        return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}
function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("content-length", Buffer.byteLength(payload));
    res.end(payload);
}
function sendText(res, status, body) {
    res.statusCode = status;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.setHeader("content-length", Buffer.byteLength(body));
    res.end(body);
}
async function readJsonBody(req, maxBodyBytes) {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        if (total > maxBodyBytes) {
            const error = new Error("Request body too large");
            error.statusCode = 413;
            throw error;
        }
        chunks.push(buf);
    }
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw)
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        const error = new Error("Invalid JSON body");
        error.statusCode = 400;
        throw error;
    }
}
function getClientId(req, token) {
    if (token)
        return `key:${token.slice(0, 8)}`;
    const forwardedFor = normalizeHeader(req.headers["x-forwarded-for"]);
    if (forwardedFor)
        return `ip:${forwardedFor.split(",")[0].trim()}`;
    const addr = req.socket.remoteAddress || "unknown";
    return `ip:${addr}`;
}
function createPerMinuteLimiter(requestsPerMinute) {
    const windowMs = 60000;
    const buckets = new Map();
    return (clientId) => {
        const now = Date.now();
        const existing = buckets.get(clientId);
        if (!existing || now - existing.windowStart >= windowMs) {
            buckets.set(clientId, { windowStart: now, count: 1 });
            return { allowed: true, remaining: requestsPerMinute - 1 };
        }
        if (existing.count >= requestsPerMinute)
            return { allowed: false, remaining: 0 };
        existing.count += 1;
        return { allowed: true, remaining: Math.max(0, requestsPerMinute - existing.count) };
    };
}
function pickVariant(state, args) {
    if (args.variant)
        return args.variant;
    if (!args.seed)
        return "control";
    if (state === "S1")
        return getS1Variant(args.seed);
    if (state === "S2")
        return getS2Variant(args.seed);
    return "control";
}
function toHistory(value) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const item of value) {
        if (!item || typeof item !== "object")
            continue;
        const role = item.role;
        const content = item.content;
        if ((role === "user" || role === "assistant" || role === "system") && typeof content === "string") {
            out.push({ role, content });
        }
    }
    return out;
}
export function createSelfHttpServer(options = {}) {
    const host = options.host || "0.0.0.0";
    const port = options.port ?? 8787;
    const maxBodyBytes = options.limits?.maxBodyBytes ?? 1000000;
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
            }
            else if (apiKey && token && !timingSafeEqual(token, apiKey)) {
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
                    },
                });
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
                const seed = typeof body.seed === "string"
                    ? body.seed
                    : typeof body.sessionId === "string" || typeof body.userId === "string"
                        ? `${String(body.userId || "")}:${String(body.sessionId || "")}`.trim()
                        : undefined;
                const variant = typeof body.variant === "string" ? body.variant : pickVariant(detection.state, { seed });
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
                    logSelfEvent({
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
                    }, { enabled: true, logPath: options.logging?.selfLogPath });
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
                const policy = body.policy;
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
                    logSelfEvent({
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
                    }, { enabled: true, logPath: options.logging?.selfLogPath });
                }
                sendJson(res, 200, { output: finalOutput, validation, repaired });
                if (requestLogs) {
                    const ms = Date.now() - started;
                    console.log(`[self-http] ${req.method} ${url.pathname} 200 ${ms}ms`);
                }
                return;
            }
            sendJson(res, 404, { error: "not_found" });
        }
        catch (err) {
            const statusCode = typeof err === "object" && err && "statusCode" in err && typeof err.statusCode === "number"
                ? err.statusCode
                : 500;
            sendJson(res, statusCode, { error: "internal_error" });
            if (requestLogs) {
                console.error("[self-http] request failed", err);
            }
        }
    });
    // Keep host/port defaults discoverable (used by startSelfHttpServer).
    server.__selfHttpHost = host;
    server.__selfHttpPort = port;
    return server;
}
export async function startSelfHttpServer(options = {}) {
    const host = options.host || "0.0.0.0";
    const port = options.port ?? 8787;
    const server = createSelfHttpServer({ ...options, host, port });
    await new Promise((resolve) => {
        server.listen(port, host, () => resolve());
    });
    const url = `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`;
    return { server, url, host, port };
}
//# sourceMappingURL=index.js.map