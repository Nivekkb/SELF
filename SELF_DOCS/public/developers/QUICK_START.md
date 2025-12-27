# QUICK START (Developers)

SELF can run as:
- an SDK (library) inside your application, or
- a self-hosted HTTP service (fastest to integrate from any stack).

This quick start uses **HTTP API mode**.

---

## 1) Install + build

```bash
npm install
npm run build
```

---

## 2) Start the HTTP service

```bash
SELF_HTTP_PORT=8787 SELF_HTTP_API_KEY=your_key npm run start:http
```

Check health:

```bash
curl -sS http://localhost:8787/health
```

---

## 3) Call `/v1/pre` (detect + choose policy)

```bash
curl -sS http://localhost:8787/v1/pre \
  -H "Authorization: Bearer $SELF_HTTP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I feel like I can\u2019t do this anymore.",
    "history": []
  }'
```

Save the returned `policy` object for the next step.

---

## 4) Draft with your model, then call `/v1/post` (validate/repair)

Your app (or model) drafts a response. Then you validate/repair it against the policy:

```bash
curl -sS http://localhost:8787/v1/post \
  -H "Authorization: Bearer $SELF_HTTP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "I feel like I can\u2019t do this anymore.",
    "output": "I\u2019m really glad you told me. You don\u2019t have to carry this alone...",
    "policy": { "state": "S3", "maxWords": 180, "maxQuestions": 2, "bannedPhrases": [] }
  }'
```

In production, you send the full `policy` object returned by `/v1/pre` (not a simplified placeholder).

---

## 5) Next steps

- Read the Integration Guide for how SELF fits into your request flow.
- Use the API Reference for exact request/response payloads.
- Wire `selfLogs` to a persistent path (`logging.selfLogPath`) for auditability.

