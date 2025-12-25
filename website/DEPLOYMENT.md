# SELF Website Deployment

## Local preview

```bash
npm run dev:website
```

## Single-file build (easy Nginx deploy)

This generates a self-contained HTML file with inlined CSS/JS:

```bash
npm run build:website
```

Output:
- `website/dist/index.html`

## Nginx (simple static host)

Recommended config for a static site with assets:

```nginx
root /var/www/html;
index index.html;

location / {
  try_files $uri $uri/ /index.html;
}
```

If your Nginx config is currently hard-wired to a single file (like `try_files /get-support-first.html =404;`), deploy the single-file build and point Nginx at `index.html` (or rename it).

