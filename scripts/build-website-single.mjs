import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const websiteDir = path.join(root, "website");
const outDir = path.join(websiteDir, "dist");

const stylesPath = path.join(websiteDir, "styles.css");
const configPath = path.join(websiteDir, "site-config.js");
const siteJsPath = path.join(websiteDir, "site.js");
const logoCandidatePaths = [path.join(root, "SELF.png"), path.join(websiteDir, "SELF.png")];

const css = fs.readFileSync(stylesPath, "utf8");
const configJs = fs.readFileSync(configPath, "utf8");
const siteJs = fs.readFileSync(siteJsPath, "utf8");

function inlineAssets(html) {
  let out = html;

  out = out.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["']\.\/styles\.css["']\s*\/?>/i,
    `<style>\n${css}\n</style>`,
  );

  out = out.replace(
    /<link\s+rel=["']preload["']\s+href=["']\.\/styles\.css["']\s+as=["']style["']\s*\/?>/i,
    "",
  );

  out = out.replace(
    /<link\s+rel=["']preload["']\s+href=["']\.\/site\.js["']\s+as=["']script["']\s*\/?>/i,
    "",
  );

  out = out.replace(
    /<script\s+src=["']\.\/site-config\.js["']>\s*<\/script>\s*<script\s+src=["']\.\/site\.js["']>\s*<\/script>/i,
    `<script>\n${configJs}\n</script>\n<script>\n${siteJs}\n</script>`,
  );

  return out;
}

function listHtmlPages() {
  const entries = fs.readdirSync(websiteDir, { withFileTypes: true });
  return entries
    .filter((ent) => ent.isFile() && ent.name.endsWith(".html"))
    .map((ent) => ent.name)
    .sort((a, b) => a.localeCompare(b));
}

function outPathForPage(fileName) {
  if (fileName === "index.html") return path.join(outDir, "index.html");
  const slug = fileName.replace(/\.html$/i, "");
  return path.join(outDir, slug, "index.html");
}

fs.mkdirSync(outDir, { recursive: true });

const pages = listHtmlPages();
if (!pages.includes("index.html")) {
  throw new Error(`[build-website] Missing required website/index.html`);
}

for (const fileName of pages) {
  const inPath = path.join(websiteDir, fileName);
  const html = fs.readFileSync(inPath, "utf8");
  const out = inlineAssets(html);
  const outPath = outPathForPage(fileName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, "utf8");
  console.log(`[build-website] wrote ${path.relative(root, outPath)}`);
}

for (const candidate of logoCandidatePaths) {
  if (fs.existsSync(candidate)) {
    fs.copyFileSync(candidate, path.join(outDir, "SELF.png"));
    break;
  }
}
