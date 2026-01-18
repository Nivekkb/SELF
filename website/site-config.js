// Edit this file to point CTAs to your real docs and contact channels.
window.SELF_SITE = {
  docsUrl: "/docs/",
  // Use "/#request" so CTAs work from sub-pages (recommended).
  // Or set to a form URL / mailto to jump directly into contact.
  requestUrl: "/#request",
  // Chat demo endpoint (recommended: Nginx proxy to your SELF HTTP service).
  // Example: "/self-api/v1/demo/chat" -> http://127.0.0.1:8787/v1/demo/chat
  demoApiUrl: "https://governedbyself.com/api/v1/demo/chat",
  // Optional endpoints (default to demoApiUrl with /chat -> /flag and /metrics).
  // Leave undefined to derive from demoApiUrl.
};
