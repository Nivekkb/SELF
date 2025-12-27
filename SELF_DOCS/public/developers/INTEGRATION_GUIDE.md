# Integration Guide (SDK + HTTP API)

This guide describes a reliable integration pattern for SELF in a production support experience.

SELF is not a chatbot. It is the governance layer around your chatbot (or support workflow): detection, constraints, validation, and enforcement.

---

## Integration options

### Option A — HTTP API mode (recommended for fast integration)

Run `self-engine` as a small HTTP service and call:
- `POST /v1/pre` before your model call
- `POST /v1/post` after your model drafts output

This works from any language/runtime.

### Option B — SDK mode (embedded)

If you embed SELF directly as a library, you keep the same pipeline stages:
1) detect and select policy
2) apply/record governance decisions
3) validate/repair output before returning to the user

---

## The canonical request flow

### Step 1 — Preflight (detect + policy selection)

Your backend calls:

```http
POST /v1/pre
```

Inputs:
- `message` (required): the current user message
- `history` (optional): prior messages (`role`, `content`)
- `userId`, `sessionId` (optional): used to pick variants deterministically
- `baseSystemPrompt` (optional): if provided, SELF returns `policyPrompt`

Outputs you should persist for the request:
- `detection` (state + scores + reasons)
- `policy` (the enforceable constraints)
- `variant` (if using variants)
- `meta` (additional signals)
- `clarifier` (if SELF requires a clarifying question)

### Step 2 — If a clarifier is required, ask it (don’t proceed)

If `/v1/pre` returns `clarifier.required: true`, you should:
1) ask the clarifier question to the user, and
2) stop this cycle (don’t generate a full response yet).

This prevents false confidence in ambiguous high-risk situations.

### Step 3 — Generate a draft (your model / tools)

If you provided `baseSystemPrompt`, you may use `policyPrompt` as the model’s system prompt.

SELF does not force a model provider. You control:
- model choice
- tool access
- retrieval
- escalation paths

### Step 4 — Postflight (validate + repair)

After your model produces a draft, call:

```http
POST /v1/post
```

Inputs:
- `userMessage` (required): the user message you’re responding to
- `output` (required): the drafted response
- `policy` (required): the policy object returned by `/v1/pre`

Outputs:
- `output` (repaired and safe-to-ship if validation passes)
- `validation` (what passed/failed)
- `repaired` (boolean)

Only ship the returned `output`.

---

## Logging and auditability

Enable SELF logs for a deployment when you need governance evidence:
- keep `logging.selfLogs` enabled
- configure `logging.selfLogPath` to a durable location

SELF logs record pre/post decisions (state, scores, policy, validation, repair status). Treat logs as sensitive.

---

## CORS, auth, and rate limiting (HTTP mode)

The HTTP service supports:
- CORS (optional)
- API key auth (`Authorization: Bearer <key>` or `X-API-Key`)
- per-minute rate limiting

For production, use `SELF_HTTP_API_KEY` and set auth mode to required in your wrapper (or via CLI options, if you add them).

---

## Integration responsibilities (non-negotiables)

SELF does not replace:
- crisis resources and escalation
- human support workflows
- product policy and liability decisions

SELF enforces constraints and produces audit-ready signals. Your product must still implement escalation paths and disclosures.

