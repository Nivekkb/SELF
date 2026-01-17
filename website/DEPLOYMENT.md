# SELF Website Deployment

## Local preview

```bash
npm run dev:website
```

## Single-file build (easy Nginx deploy)

This generates self-contained HTML files (with inlined CSS/JS) under pretty URLs:

```bash
npm run build:website
```

Output:
- `website/dist/index.html` (homepage)
- `website/dist/audit-readiness/index.html`
- `website/dist/enterprise-compliance/index.html`
- `website/dist/docs/*` (docs pages)
- `website/dist/sitemap.xml`
- `website/dist/robots.txt`

## Firebase Hosting (recommended)

The static site is served directly from `website/dist/` with no SPA rewrites.

One-time setup (when the Firebase project is ready; target project will be `roleos` once available):

```bash
firebase login
firebase use --add
```

Deploy:

```bash
npm run build:website
firebase deploy --only hosting
```

Custom domain:

- Hosting sites:
  - `self-engine.web.app` (default)
  - `self-engine.firebaseapp.com` (default)
  - `governedbyself.com` (custom, verified)
- Point DNS at Firebase via the records provided in the Hosting UI.

Note: `sitemap.xml` and `robots.txt` are built into `website/dist/` and will be served as static files.
