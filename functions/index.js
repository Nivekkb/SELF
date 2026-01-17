import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createSelfHttpServer } from "./dist/http/index.js";

const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

const server = createSelfHttpServer();

export const selfApi = onRequest({ secrets: [GROQ_API_KEY] }, (req, res) => {
  const groqKey = GROQ_API_KEY.value();
  if (groqKey) process.env.GROQ_API_KEY = groqKey;

  if (req.url === "/api" || req.url === "/api/") {
    req.url = "/";
  } else if (req.url && req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }

  server.emit("request", req, res);
});
