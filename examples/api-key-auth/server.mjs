import http from "node:http";
import { requireApiKey } from "./auth.mjs";

const port = Number(process.env.PORT || 3009);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname.startsWith("/v1/")) {
    const auth = requireApiKey(req, res);
    if (!auth.ok) return;
  }

  if (req.method === "GET" && url.pathname === "/v1/ping") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, keyId: req.apiKey.keyId, name: req.apiKey.name || "" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => {
  console.log(`api-key-auth example listening on http://localhost:${port}`);
});

