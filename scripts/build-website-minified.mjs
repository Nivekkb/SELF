#!/usr/bin/env node
/**
 * SELF Website Build Script with Minification
 * 
 * Uses esbuild for fast minification and bundling of CSS/JS.
 * Inlines assets into HTML for single-file deployment.
 */

import fs from "node:fs";
import path from "node:path";

// Check if esbuild is available, if not use basic minification
let esbuild = null;
try {
  esbuild = await import("esbuild");
} catch {
  console.log("[build-website] esbuild not available, using basic minification");
}

const root = process.cwd();
const websiteDir = path.join(root, "website");
const outDir = path.join(websiteDir, "dist");

const stylesPath = path.join(websiteDir, "styles.css");
const configPath = path.join(websiteDir, "site-config.js");
const siteJsPath = path.join(websiteDir, "site.js");
const logoCandidatePaths = [path.join(root, "SELF.png"), path.join(websiteDir, "SELF.png")];

/**
 * Basic CSS minification (used when esbuild is not available)
 */
function minifyCss(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove whitespace
    .replace(/\s+/g, " ")
    // Remove spaces around special characters
    .replace(/\s*([{};:,>+~])\s*/g, "$1")
    // Remove unnecessary semicolons
    .replace(/;}/g, "}")
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Basic JS minification (used when esbuild is not available)
 */
function minifyJs(js) {
  return js
    // Remove single-line comments (preserve URLs)
    .replace(/(?<!:)\/\/.*$/gm, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove leading/trailing whitespace on lines
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    // Remove spaces around operators
    .replace(/\s*([{};:,=+\-*/<>!&|()])\s*/g, "$1")
    .trim();
}

/**
 * Minify CSS using esbuild or fallback
 */
async function processCss(css) {
  if (esbuild) {
    try {
      const result = await esbuild.transform(css, {
        loader: "css",
        minify: true,
      });
      return result.code;
    } catch (error) {
      console.warn("[build-website] esbuild CSS minification failed, using fallback");
    }
  }
  return minifyCss(css);
}

/**
 * Minify JS using esbuild or fallback
 */
async function processJs(js) {
  if (esbuild) {
    try {
      const result = await esbuild.transform(js, {
        loader: "js",
        minify: true,
        target: "es2020",
      });
      return result.code;
    } catch (error) {
      console.warn("[build-website] esbuild JS minification failed, using fallback");
    }
  }
  return minifyJs(js);
}

/**
 * Minify HTML
 */
function minifyHtml(html) {
  return html
    // Remove HTML comments (preserve conditional comments)
    .replace(/<!--(?!\[)[\s\S]*?-->/g, "")
    // Remove whitespace between tags
    .replace(/>\s+</g, "><")
    // Remove leading/trailing whitespace in text nodes
    .replace(/>\s+([^<]+?)\s+</g, ">$1<")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Inline and minify assets into HTML
 */
async function inlineAssets(html, css, configJs, siteJs) {
  let out = html;

  // Inline minified CSS
  const minifiedCss = await processCss(css);
  out = out.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["']\.\/styles\.css["']\s*\/?>/i,
    `<style>${minifiedCss}</style>`,
  );

  // Remove preload hints (not needed for inlined assets)
  out = out.replace(
    /<link\s+rel=["']preload["']\s+href=["']\.\/styles\.css["']\s+as=["']style["']\s*\/?>/i,
    "",
  );

  out = out.replace(
    /<link\s+rel=["']preload["']\s+href=["']\.\/site\.js["']\s+as=["']script["']\s*\/?>/i,
    "",
  );

  // Inline minified JS
  const minifiedConfigJs = await processJs(configJs);
  const minifiedSiteJs = await processJs(siteJs);
  out = out.replace(
    /<script\s+src=["']\.\/site-config\.js["']>\s*<\/script>\s*<script\s+src=["']\.\/site\.js["']>\s*<\/script>/i,
    `<script>${minifiedConfigJs}</script><script>${minifiedSiteJs}</script>`,
  );

  // Minify the final HTML
  return minifyHtml(out);
}

/**
 * List HTML pages in website directory
 */
function listHtmlPages() {
  const entries = fs.readdirSync(websiteDir, { withFileTypes: true });
  return entries
    .filter((ent) => ent.isFile() && ent.name.endsWith(".html"))
    .map((ent) => ent.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get output path for a page
 */
function outPathForPage(fileName) {
  if (fileName === "index.html") return path.join(outDir, "index.html");
  const slug = fileName.replace(/\.html$/i, "");
  return path.join(outDir, slug, "index.html");
}

/**
 * Calculate and log file size savings
 */
function logSizeSavings(original, minified, label) {
  const originalSize = Buffer.byteLength(original, "utf8");
  const minifiedSize = Buffer.byteLength(minified, "utf8");
  const savings = originalSize - minifiedSize;
  const percentage = ((savings / originalSize) * 100).toFixed(1);
  
  console.log(
    `[build-website] ${label}: ${originalSize} → ${minifiedSize} bytes (${percentage}% saved)`
  );
}

// Main build process
async function build() {
  console.log("[build-website] Starting minified build...");
  const startTime = Date.now();

  // Read source files
  const css = fs.readFileSync(stylesPath, "utf8");
  const configJs = fs.readFileSync(configPath, "utf8");
  const siteJs = fs.readFileSync(siteJsPath, "utf8");

  // Ensure output directory exists
  fs.mkdirSync(outDir, { recursive: true });

  // Get list of HTML pages
  const pages = listHtmlPages();
  if (!pages.includes("index.html")) {
    throw new Error("[build-website] Missing required website/index.html");
  }

  // Process each page
  for (const fileName of pages) {
    const inPath = path.join(websiteDir, fileName);
    const html = fs.readFileSync(inPath, "utf8");
    const out = await inlineAssets(html, css, configJs, siteJs);
    const outPath = outPathForPage(fileName);
    
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, out, "utf8");
    
    logSizeSavings(html, out, path.relative(root, outPath));
  }

  // Copy logo
  for (const candidate of logoCandidatePaths) {
    if (fs.existsSync(candidate)) {
      fs.copyFileSync(candidate, path.join(outDir, "SELF.png"));
      console.log(`[build-website] copied SELF.png`);
      break;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[build-website] Build completed in ${duration}ms`);
}

// Run build
build().catch((error) => {
  console.error("[build-website] Build failed:", error);
  process.exit(1);
});