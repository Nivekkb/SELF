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

## Nginx (simple static host)

Recommended config for a static site with assets:

```nginx
root /var/www/html;
index index.html;

location / {
  # Serve real files/directories; fall back to homepage for unknown paths.
  try_files $uri $uri/ /index.html;
}
```

Important: deploy the entire `website/dist/` folder (not just `index.html`), or routes like
`/audit-readiness/` and `/enterprise-compliance/` will fall back to the homepage.

If your Nginx config is currently hard-wired to a single file (like `try_files /get-support-first.html =404;`), deploy the single-file build and point Nginx at `index.html` (or rename it).

If `https://governedbyself.com/sitemap.xml` or `https://governedbyself.com/robots.txt` are returning HTML, you are likely serving `index.html` for every path. Make sure you deploy the entire `website/dist/` folder (not just `index.html`), and consider pinning these files:

```nginx
location = /sitemap.xml { try_files $uri =404; }
location = /robots.txt { try_files $uri =404; }
```
