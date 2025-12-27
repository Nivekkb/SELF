# SELF HTTP API Reference (v1)

This document describes the HTTP API exposed by `self-engine` when you run it as a service.

Start the server:

```bash
npm install
npm run build
SELF_HTTP_PORT=8787 SELF_HTTP_API_KEY=your_key npm run start:http
```

Base URL:

```
http://localhost:8787
```

---

## Authentication

Authentication is optional, but recommended for production.

When an API key is configured, pass it as either:
- `Authorization: Bearer <key>`
- `X-API-Key: <key>`

---

## Endpoints

### `GET /health`

Returns service health + metadata.

```bash
curl -sS http://localhost:8787/health
```

---

### `POST /v1/pre` — preflight (detect + policy)

Detects state and returns an enforceable policy object.

Request body:
- `message` (string, required)
- `history` (array, optional): list of `{ role: "user"|"assistant"|"system", content: string }`
- `userId` (string, optional)
- `sessionId` (string, optional)
- `seed` (string, optional): deterministic variant selection seed
- `variant` (string, optional): override variant selection
- `baseSystemPrompt` (string, optional): if provided, server returns `policyPrompt`

Example:

```bash
curl -sS http://localhost:8787/v1/pre \
  -H "Authorization: Bearer $SELF_HTTP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I feel like I can\u2019t do this anymore.",
    "history": [],
    "userId": "u_123",
    "sessionId": "s_456"
  }'
```

Response (shape overview):
- `detection` (state + scores + reasons)
- `variant`
- `policy` (the policy you must pass to `/v1/post`)
- `meta`
- `clarifier` (may require a clarifying question)
- `policyPrompt` (only if `baseSystemPrompt` was provided)

Operational rules:
- If `clarifier.required` is true, ask the clarifier question and stop this cycle.
- Persist the returned `policy` and use it verbatim in `/v1/post`.

---

### `POST /v1/post` — postflight (validate + repair)

Validates and (if needed) repairs a drafted model response so it matches the policy.

Request body:
- `userMessage` (string, required): the user message you’re responding to
- `output` (string, required): your model’s draft
- `policy` (object, required): the policy returned by `/v1/pre`

Example:

```bash
curl -sS http://localhost:8787/v1/post \
  -H "Authorization: Bearer $SELF_HTTP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "I feel like I can\u2019t do this anymore.",
    "output": "I\u2019m really glad you told me. You don\u2019t have to carry this alone...",
    "policy": { }
  }'
```

Response:
- `output` (string): the repaired (or original) response
- `validation` (object): validation result
- `repaired` (boolean)

Only ship the returned `output`.

---

## Operational notes

- Use TLS and restrict network access in production.
- Treat logs and request payloads as sensitive.
- Pair SELF with real escalation paths and disclosures; SELF is not a medical device.

