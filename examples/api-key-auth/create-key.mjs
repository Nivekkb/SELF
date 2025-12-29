import crypto from "node:crypto";
import { loadStore, saveStore, upsertKeyRecord } from "./key-store.mjs";
import { hashSecret } from "./auth.mjs";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const name = arg("name") || "client";
const ttlDaysRaw = arg("ttlDays");
const ttlDays = ttlDaysRaw ? Number(ttlDaysRaw) : null;
const env = arg("env") || "live";
if (env !== "live" && env !== "test") throw new Error("env must be live|test");

const keyId = crypto.randomBytes(8).toString("hex");
const secret = crypto.randomBytes(24).toString("base64url");
const saltB64 = crypto.randomBytes(16).toString("base64");
const secretHash = hashSecret(secret, saltB64);

const createdAt = new Date().toISOString();
const expiresAt =
  ttlDays && Number.isFinite(ttlDays) && ttlDays > 0
    ? new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

const store = loadStore();
upsertKeyRecord(store, keyId, {
  name,
  env,
  saltB64,
  secretHash,
  createdAt,
  expiresAt,
  revokedAt: null,
  lastUsedAt: null,
});
saveStore(store);

const apiKey = `sk_${env}_${keyId}_${secret}`;
console.log(apiKey);
console.log(`keyId=${keyId}`);
if (expiresAt) console.log(`expiresAt=${expiresAt}`);
