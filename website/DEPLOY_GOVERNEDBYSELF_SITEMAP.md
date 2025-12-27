# governedbyself.com sitemap/robots deploy notes

This is a step-by-step record of what was done to fix Google Search Console rejecting `sitemap.xml` for `governedbyself.com`.

## What was broken (root cause)

`https://governedbyself.com/sitemap.xml` and `https://governedbyself.com/robots.txt` were returning the homepage HTML, because the Nginx config used an SPA fallback:

```nginx
try_files $uri $uri/ /index.html;
```

When `sitemap.xml` did not exist on disk, Nginx served `/index.html` instead (which is `text/html`), and Search Console rejects that as an invalid sitemap.

## 1) Build the site artifacts locally

On the build machine:

```bash
cd /home/oem/Desktop/self-engine
npm run build:website
```

This produces:

- `website/dist/index.html`
- `website/dist/docs/…`
- `website/dist/sitemap.xml`
- `website/dist/robots.txt`

Sanity check:

```bash
head -n 5 website/dist/sitemap.xml
cat website/dist/robots.txt
```

## 2) Connect to the server

This site resolves to `15.157.26.254` (not `15.175.26.254`).

```bash
ssh -i ~/.ssh/LightsailDefaultKey-ca-central-1.pem admin@15.157.26.254
```

## 3) Copy `sitemap.xml` + `robots.txt` to the web root

The governedbyself Nginx `root` is:

`/var/www/html/governedbyself`

Copy the files to `/tmp` first:

```bash
scp -i ~/.ssh/LightsailDefaultKey-ca-central-1.pem website/dist/sitemap.xml admin@15.157.26.254:/tmp/sitemap.xml
scp -i ~/.ssh/LightsailDefaultKey-ca-central-1.pem website/dist/robots.txt admin@15.157.26.254:/tmp/robots.txt
```

Then move into place with the same ownership/mode as the existing site files:

```bash
ssh -i ~/.ssh/LightsailDefaultKey-ca-central-1.pem admin@15.157.26.254 \
  'sudo install -o 29999 -g 29999 -m 664 /tmp/sitemap.xml /var/www/html/governedbyself/sitemap.xml && \
   sudo install -o 29999 -g 29999 -m 664 /tmp/robots.txt /var/www/html/governedbyself/robots.txt'
```

## 4) Update Nginx so these files never fall back to `index.html`

Edit:

`/etc/nginx/sites-available/governedbyself.com`

Add:

```nginx
location = /robots.txt {
  try_files $uri =404;
}

location = /sitemap.xml {
  try_files $uri =404;
}
```

Then validate + reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5) Verify from anywhere

```bash
curl -I https://governedbyself.com/sitemap.xml
curl -s https://governedbyself.com/sitemap.xml | head

curl -I https://governedbyself.com/robots.txt
curl -s https://governedbyself.com/robots.txt
```

Expected:

- `/sitemap.xml` returns XML (e.g. `Content-Type: text/xml`) and begins with `<?xml …?>`
- `/robots.txt` returns plain text and includes the `Sitemap:` line

