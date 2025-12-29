import crypto from "node:crypto";
import { getKeyRecord, loadStore } from "./key-store.mjs";

function parseBearer(req) {
  const auth = String(req.headers?.authorization || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const x = String(req.headers?.["x-api-key"] || "").trim();
  return x || "";
}

export function parseApiKey(raw) {
  const key = String(raw || "").trim();
  const m = key.match(/^sk_(live|test)_([a-z0-9]{16,32})_([a-zA-Z0-9_-]{20,})$/);
  if (!m) return null;
  return { env: m[1], keyId: m[2], secret: m[3] };
}

export function hashSecret(secret, saltB64) {
  const salt = Buffer.from(saltB64, "base64");
  const derived = crypto.scryptSync(secret, salt, 32);
  return derived.toString("base64");
}

export function verifyApiKey(rawKey) {
  const parsed = parseApiKey(rawKey);
  if (!parsed) return { ok: false, error: "invalid_key_format" };

  const store = loadStore();
  const rec = getKeyRecord(store, parsed.keyId);
  if (!rec) return { ok: false, error: "unknown_key_id" };
  if (rec.revokedAt) return { ok: false, error: "revoked" };
  if (rec.expiresAt && Date.parse(rec.expiresAt) <= Date.now()) return { ok: false, error: "expired" };

  const expected = Buffer.from(String(rec.secretHash || ""), "base64");
  const actual = Buffer.from(hashSecret(parsed.secret, rec.saltB64), "base64");
  if (expected.length !== actual.length) return { ok: false, error: "invalid" };
  const ok = crypto.timingSafeEqual(expected, actual);
  if (!ok) return { ok: false, error: "invalid" };

  return { ok: true, keyId: parsed.keyId, name: rec.name || "", record: rec };
}

export function requireApiKey(req, res) {
  const raw = parseBearer(req);
  if (!raw) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "missing_api_key" }));
    return { ok: false };
  }
  const v = verifyApiKey(raw);
  if (!v.ok) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "invalid_api_key" }));
    return { ok: false };
  }
  req.apiKey = v;
  return { ok: true };
}
