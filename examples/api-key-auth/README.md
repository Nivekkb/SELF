# Node API Key Auth (Drop‑In Template)

This is a tiny, dependency‑free API key system you can copy into any Node app.

It gives you:
- API key format with an ID for fast lookup: `sk_live_<keyId>_<secret>`
- Stored **hashed** secrets (never store raw keys)
- Optional expiry + revocation
- A minimal HTTP server example

## Quick start

1) Create a key store + mint a key:

```bash
node examples/api-key-auth/create-key.mjs --name "my-client" --ttlDays 90
```

This prints the API key once and writes to `examples/api-key-auth/keys.json`.

2) Run the example server:

```bash
node examples/api-key-auth/server.mjs
```

3) Call a protected endpoint:

```bash
curl -sS http://localhost:3009/v1/ping -H "Authorization: Bearer <PASTE_KEY>"
```

## Integrate into your app

Copy these files into your app (or import them directly):
- `key-store.mjs`
- `auth.mjs`

Use the middleware:

```js
import { requireApiKey } from "./auth.mjs";
// In Express you'd call requireApiKey(req, res, next)
```

## Revoke a key

```bash
node examples/api-key-auth/revoke-key.mjs --id <keyId>
```

