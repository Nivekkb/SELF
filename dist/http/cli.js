import { startSelfHttpServer } from "./index.js";
function envBool(name, defaultValue) {
    const raw = process.env[name];
    if (raw === undefined)
        return defaultValue;
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized))
        return true;
    if (["0", "false", "no", "n", "off"].includes(normalized))
        return false;
    return defaultValue;
}
function envInt(name, defaultValue) {
    const raw = process.env[name];
    if (!raw)
        return defaultValue;
    const num = Number.parseInt(raw, 10);
    return Number.isFinite(num) ? num : defaultValue;
}
async function main() {
    const host = process.env.SELF_HTTP_HOST || "0.0.0.0";
    const port = envInt("SELF_HTTP_PORT", 8787);
    const apiKey = process.env.SELF_HTTP_API_KEY || process.env.SELF_API_KEY;
    const authMode = (process.env.SELF_HTTP_AUTH_MODE || (apiKey ? "required" : "optional"));
    const corsEnabled = envBool("SELF_HTTP_CORS", true);
    const corsOrigin = process.env.SELF_HTTP_CORS_ORIGIN;
    const rateLimitEnabled = envBool("SELF_HTTP_RATE_LIMIT", false);
    const requestsPerMinute = envInt("SELF_HTTP_RATE_LIMIT_PER_MINUTE", 120);
    const requestLogs = envBool("SELF_HTTP_REQUEST_LOGS", true);
    const selfLogs = envBool("SELF_HTTP_SELF_LOGS", true);
    const selfLogPath = process.env.SELF_HTTP_SELF_LOG_PATH;
    const { server, url } = await startSelfHttpServer({
        host,
        port,
        cors: { enabled: corsEnabled, origin: corsOrigin },
        auth: { mode: authMode, apiKey },
        rateLimit: { enabled: rateLimitEnabled, requestsPerMinute },
        logging: { requestLogs, selfLogs, selfLogPath },
    });
    console.log(`[self-http] listening on ${url}`);
    const shutdown = () => {
        console.log("[self-http] shutting down...");
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 5000).unref();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((err) => {
    console.error("[self-http] fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map