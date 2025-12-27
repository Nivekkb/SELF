# SELF (Support‑First Logic Engine)

SELF is the internal library used by SerenixAI to enforce support-first, safety-oriented behavioral constraints.

- Source: `src/`
- Build output: `dist/` (committed; `npm run build` regenerates and patches ESM import specifiers for Node ESM)
- Docs: `SELF_DOCS/`

## Development

```bash
npm install
npm test
npm run build
```

## HTTP API

Run SELF as a small HTTP service (no external deps):

```bash
npm run build
SELF_HTTP_PORT=8787 SELF_HTTP_API_KEY=your_key npm run start:http
```

Endpoints:
- `GET /health`
- `POST /v1/pre` (detect state + return policy)
- `POST /v1/post` (validate/repair a drafted response against a policy)

## Website (Sales Landing)

This repo includes a simple sales-focused landing page in `website/`.

```bash
npm run dev:website
```
