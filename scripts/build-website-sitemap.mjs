import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "website", "dist");

const rawBaseUrl = process.env.WEBSITE_BASE_URL || "https://governedbyself.com";
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

if (!fs.existsSync(distDir)) {
  throw new Error(`[build-website-sitemap] Missing dist directory: ${distDir}`);
}

function toUrlPath(filePath) {
  const rel = path.relative(distDir, filePath).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
}

const htmlFiles = [];
const stack = [distDir];
while (stack.length) {
  const dir = stack.pop();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) stack.push(full);
    else if (ent.isFile() && ent.name.endsWith(".html")) htmlFiles.push(full);
  }
}

const urlPaths = Array.from(new Set(htmlFiles.map(toUrlPath))).sort((a, b) => a.localeCompare(b));
const urls = urlPaths.map((p) => `${baseUrl}${p}`);

const lines = [];
lines.push('<?xml version="1.0" encoding="UTF-8"?>');
lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
for (const loc of urls) {
  lines.push("  <url>");
  lines.push(`    <loc>${loc}</loc>`);
  lines.push("  </url>");
}
lines.push("</urlset>");
lines.push("");

const outPath = path.join(distDir, "sitemap.xml");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`[build-website-sitemap] wrote ${path.relative(root, outPath)} (${urls.length} URLs)`);

const robotsLines = [];
robotsLines.push("User-agent: *");
robotsLines.push("Allow: /");
robotsLines.push("");
robotsLines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
robotsLines.push("");

const robotsPath = path.join(distDir, "robots.txt");
fs.writeFileSync(robotsPath, robotsLines.join("\n"), "utf8");
console.log(`[build-website-sitemap] wrote ${path.relative(root, robotsPath)}`);
