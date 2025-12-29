import { loadStore, saveStore, getKeyRecord, upsertKeyRecord } from "./key-store.mjs";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const keyId = arg("id");
if (!keyId) {
  console.error("Usage: node revoke-key.mjs --id <keyId>");
  process.exit(2);
}

const store = loadStore();
const rec = getKeyRecord(store, keyId);
if (!rec) {
  console.error("not_found");
  process.exit(1);
}

upsertKeyRecord(store, keyId, { ...rec, revokedAt: new Date().toISOString() });
saveStore(store);
console.log("ok");

