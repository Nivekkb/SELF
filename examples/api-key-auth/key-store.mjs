import fs from "node:fs";
import path from "node:path";

const STORE_PATH = process.env.API_KEYS_PATH
  ? path.resolve(process.env.API_KEYS_PATH)
  : path.resolve(process.cwd(), "examples", "api-key-auth", "keys.json");

export function loadStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const json = raw ? JSON.parse(raw) : null;
    if (!json || typeof json !== "object") return { keys: {} };
    if (!json.keys || typeof json.keys !== "object") return { keys: {} };
    return json;
  } catch {
    return { keys: {} };
  }
}

export function saveStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export function getKeyRecord(store, keyId) {
  if (!store || !store.keys) return null;
  const rec = store.keys[keyId];
  return rec && typeof rec === "object" ? rec : null;
}

export function upsertKeyRecord(store, keyId, record) {
  if (!store.keys) store.keys = {};
  store.keys[keyId] = record;
}

