# Project Architecture Research — 2025-12-30

**Status:** Draft
**Last Updated:** 2025-12-30
**Researched By:** ouroboros-researcher

---

**Repository root:** /home/oem/Desktop/self-engine

**Summary (tech stack & runtime):**
- Primary language: TypeScript (see `tsconfig.json`, `typescript` devDependency).
- Runtime: Node.js scripts and tooling (`node`, `tsx` used in dev scripts).
- Frontend: Static single-page site produced under `website/dist/` (scripts: `build-website`, `build-website-single.mjs`, `build-public-docs.mjs`). Output is pre-rendered HTML files and an SPA single-file build option.
- Packaging/build: `tsc` for library builds; website built by custom Node scripts. `package.json` scripts: `build`, `build:website`, `dev:website`.
- Deployment pattern: `rsync`/scp style uploads and direct `nginx` static hosting; some ad-hoc node server snippets exist (e.g., node static server created on remote during troubleshooting).
- SSL: Certs via Certbot/Let's Encrypt (`/etc/letsencrypt` referenced).
- Process supervision: no repository-native use of `pm2` or systemd service manifests found.
- Containerization/CI: No `Dockerfile`, `docker-compose.yml` or `.github/workflows` detected in repo.

**Service mapping (observed):**
- governedbyself.com → webroot: `/var/www/html` or `/var/www/html/governedbyself` (deploy notes indicate `/var/www/html/governedbyself`).
- serenixai.com / serenixdigital.com → webroot variants seen: `/var/www/html` and `/var/www/serenixai` (server-side edits and ssh commands reference `/var/www/html` and `/var/www/serenixai`; nginx configs for serenixdigital.com pointed at `/var/www/html`).
- Nginx site files: `/etc/nginx/sites-available/*.com` (examples: `/etc/nginx/sites-available/governedbyself.com`).
- Let's Encrypt: cert files under `/etc/letsencrypt/live/<domain>/`.
- Temporary deploy path and commands observed in terminal logs: backup tar to `/tmp/www_html_backup.<ts>.tgz` and `rsync -av --delete /tmp/dist_upload/ /var/www/html/` followed by `chown -R www-data:www-data /var/www/html` and `systemctl reload nginx`.

**Reproduction steps to reach current (mismatched content) state:**
1. Build website locally: `npm run build:website` (produces `website/dist/` with `index.html`, `sitemap.xml`, `robots.txt`).
2. Transfer artifacts to server (examples):
   - `scp -i ~/.ssh/... website/dist/* admin@<host>:/tmp/` or create `/tmp/dist_upload/` then `rsync -av --delete /tmp/dist_upload/ /var/www/html/`.
3. (If only `index.html` copied) Nginx SPA fallback `try_files $uri $uri/ /index.html;` will return `index.html` for missing files like `/sitemap.xml` or `/robots.txt`.
4. Reload nginx: `sudo systemctl reload nginx` (or `nginx -t && systemctl reload nginx`).
5. Result: domain serving wrong HTML for paths that should be static files — observed in incident where `governedbyself.com` returned homepage for `/sitemap.xml` and `/robots.txt`.

**Findings / Evidence:**
- `website/DEPLOYMENT.md` and `website/DEPLOY_GOVERNEDBYSELF_SITEMAP.md` document the exact mismatch issue and required nginx fixes.
- Terminal activity shows `rsync`-style deploy and `systemctl reload nginx` commands executed against `15.157.26.254`.
- Nginx configs in server managed at `/etc/nginx/sites-available/*` and certs at `/etc/letsencrypt` (server-side actions in logs).  A patched serenixdigital.com config was installed via SSH in terminal log.

**Risks / Gotchas:**
- Partial deploys (copying only `index.html`) cause sitemap/robots to be served as HTML; Search Console will reject sitemap.xml when content type/body invalid.
- No repository-managed deploy/CI means human error (uploading incomplete dist) is the primary risk.
- No automatic cert renewal checks visible in repo; rely on server's Certbot timers (confirm `certbot renew` cron/systemd timer on host).
- Multiple domains sharing same `root` (or misconfigured roots) can cause cross-domain content mashups when deploys target the wrong directory.

**Suggested next actions (short, prioritized):**
- Fix Nginx to pin `sitemap.xml` and `robots.txt` to real files (if not already):
  - Add `location = /sitemap.xml { try_files $uri =404; }` and `location = /robots.txt { try_files $uri =404; }` and reload nginx.
- Enforce deploy completeness: use an atomic rsync-to-temp-and-rename pattern (upload to `/tmp/dist_upload/` then `rsync --delete` into live dir, or upload tar and `tar -x` into place) to avoid partial file states.
- Add a post-deploy check script that verifies `curl -I https://<domain>/sitemap.xml` returns non-HTML `Content-Type` and expected content; fail/rollback on mismatch.
- Add server-side ownership/mode steps (chown/chmod) as seen in logs to avoid permission issues.
- Inspect server for Certbot renewal: `sudo systemctl status certbot.timer` or `sudo certbot renew --dry-run` on host.
- Consider minimal automation: add a lightweight `deploy.sh` in repo that runs `npm run build:website`, rsyncs to server, runs remote `nginx -t && systemctl reload nginx`, and performs the sitemap/robots check.
- If frequent changes: introduce a simple CI pipeline (GitHub Actions) to run the website build and optionally deploy to server via SSH with an approved key.

**Matched skills (.github/skills):**
- No `.github/skills/` directory detected in repository. (No skill files matched.)

**Notes for implementers / next-phase tasks:**
- Confirm exact webroots on the server (SSH) and standardize the deploy target path (e.g., `/var/www/html/governedbyself` for governedbyself.com, `/var/www/serenixai` for serenixai.com).
- Verify and document Certbot renewal presence and email/contacts for expiry alerts.
- If multiple sites share `/var/www/html`, consider separate site roots to avoid accidental overwrites.

---

**Files reviewed:** `package.json`, `tsconfig.json`, `website/DEPLOYMENT.md`, `website/DEPLOY_GOVERNEDBYSELF_SITEMAP.md`, assorted `scripts/*.mjs`, and `website/dist/*` artifacts.

