import fs from "node:fs";
import path from "node:path";

const distRoot = path.resolve(process.cwd(), "dist");

function hasExtension(spec) {
  const last = spec.split("/").pop() || "";
  return last.includes(".");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && fullPath.endsWith(".js")) files.push(fullPath);
  }
  return files;
}

if (!fs.existsSync(distRoot)) {
  console.error("dist folder not found:", distRoot);
  process.exit(1);
}

const files = walk(distRoot);
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;

  next = next.replace(/(\bfrom\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (m, p1, spec, p3) => {
    if (hasExtension(spec)) return m;
    return `${p1}${spec}.js${p3}`;
  });

  next = next.replace(/(\bimport\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g, (m, p1, spec, p3) => {
    if (hasExtension(spec)) return m;
    return `${p1}${spec}.js${p3}`;
  });

  if (next !== original) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`[self-engine] patched ${changed}/${files.length} dist js files for Node ESM specifier resolution`);

