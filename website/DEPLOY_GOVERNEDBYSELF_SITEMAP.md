# governedbyself.com sitemap/robots deploy notes

This is the current Firebase Hosting flow to keep `sitemap.xml` and `robots.txt` valid for Google Search Console.

## 1) Build the site artifacts locally

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

## 2) Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

## 3) Verify from anywhere

```bash
curl -I https://governedbyself.com/sitemap.xml
curl -s https://governedbyself.com/sitemap.xml | head

curl -I https://governedbyself.com/robots.txt
curl -s https://governedbyself.com/robots.txt
```

Expected:

- `/sitemap.xml` returns XML (e.g. `Content-Type: text/xml`) and begins with `<?xml …?>`
- `/robots.txt` returns plain text and includes the `Sitemap:` line
