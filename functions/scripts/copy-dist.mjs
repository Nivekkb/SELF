import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..", "..");
const srcDir = path.join(rootDir, "dist");
const destDir = path.join(__dirname, "..", "dist");

if (!fs.existsSync(srcDir)) {
  throw new Error(`dist_missing:${srcDir}`);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
