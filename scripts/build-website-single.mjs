import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const websiteDir = path.join(root, "website");
const outDir = path.join(websiteDir, "dist");

const indexHtmlPath = path.join(websiteDir, "index.html");
const stylesPath = path.join(websiteDir, "styles.css");
const configPath = path.join(websiteDir, "site-config.js");
const siteJsPath = path.join(websiteDir, "site.js");
const logoCandidatePaths = [path.join(root, "SELF.png"), path.join(websiteDir, "SELF.png")];

const html = fs.readFileSync(indexHtmlPath, "utf8");
const css = fs.readFileSync(stylesPath, "utf8");
const configJs = fs.readFileSync(configPath, "utf8");
const siteJs = fs.readFileSync(siteJsPath, "utf8");

let out = html;

out = out.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']\.\/styles\.css["']\s*\/?>/i,
  `<style>\n${css}\n</style>`,
);

out = out.replace(
  /<script\s+src=["']\.\/site-config\.js["']>\s*<\/script>\s*<script\s+src=["']\.\/site\.js["']>\s*<\/script>/i,
  `<script>\n${configJs}\n</script>\n<script>\n${siteJs}\n</script>`,
);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), out, "utf8");

for (const candidate of logoCandidatePaths) {
  if (fs.existsSync(candidate)) {
    fs.copyFileSync(candidate, path.join(outDir, "SELF.png"));
    break;
  }
}

console.log(`[build-website] wrote ${path.relative(root, path.join(outDir, "index.html"))}`);
