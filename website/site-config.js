// Edit this file to point CTAs to your real docs and contact channels.
window.SELF_SITE = {
  docsUrl: "/docs/",
  // Use "#request" to keep CTAs on-page (recommended so visitors see the request checklist).
  // Or set to a form URL / mailto to jump directly into contact.
  requestUrl: "#request",
  // Chat demo endpoint (recommended: Nginx proxy to your SELF HTTP service).
  // Example: "/self-api/v1/demo/chat" -> http://127.0.0.1:8787/v1/demo/chat
  demoApiUrl: "/self-api/v1/demo/chat",
  // Optional endpoints (default to demoApiUrl with /chat -> /flag and /metrics).
  demoFlagUrl: "/self-api/v1/demo/flag",
  demoMetricsUrl: "/self-api/v1/demo/metrics",
  demoReportUrl: "/self-api/v1/demo/report",
  demoHeroesUrl: "/self-api/v1/demo/heroes",
};
