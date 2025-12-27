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
- `website/dist/sitemap.xml`
- `website/dist/robots.txt`

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

If `https://governedbyself.com/sitemap.xml` or `https://governedbyself.com/robots.txt` are returning HTML, you are likely serving `index.html` for every path. Make sure you deploy the entire `website/dist/` folder (not just `index.html`), and consider pinning these files:

```nginx
location = /sitemap.xml { try_files $uri =404; }
location = /robots.txt { try_files $uri =404; }
```
