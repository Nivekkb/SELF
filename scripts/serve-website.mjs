import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, "..", "website");
const root = existsSync(path.join(websiteRoot, "dist")) ? path.join(websiteRoot, "dist") : websiteRoot;
const port = Number.parseInt(process.env.WEBSITE_PORT || "5174", 10);
const host = process.env.WEBSITE_HOST || "127.0.0.1";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleaned = decoded.replace(/\0/g, "");
  let rel = cleaned === "/" ? "/index.html" : cleaned;
  if (rel.endsWith("/")) rel = rel + "index.html";
  const resolved = path.resolve(root, "." + rel);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = createServer((req, res) => {
  try {
    const urlPath = req.url || "/";
    let filePath = safePath(urlPath);
    if (!filePath) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("bad request");
      return;
    }

    if (!existsSync(filePath) && !path.extname(filePath)) {
      const tryIndex = safePath(`${urlPath.replace(/\/+$/, "")}/`);
      if (tryIndex && existsSync(tryIndex)) filePath = tryIndex;
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const ct = contentTypes.get(ext) || "application/octet-stream";
    const buf = readFileSync(filePath);
    res.writeHead(200, { "content-type": ct, "content-length": buf.length });
    res.end(buf);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("internal error");
    console.error("[serve-website] error", err);
  }
});

server.listen(port, host, () => {
  console.log(`[serve-website] http://${host}:${port}`);
});
