import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
function resolveAuditSalt() {
    const configured = String(process.env.SELF_AUDIT_SALT || "").trim();
    if (configured)
        return configured;
    // Default to a per-process salt so audit logs never contain stable user identifiers unless explicitly configured.
    return crypto.randomBytes(16).toString("base64url");
}
const AUDIT_SALT = resolveAuditSalt();
export function toOpaqueAuditId(label, raw) {
    const value = String(raw || "").trim();
    if (!value)
        return "";
    const digest = crypto
        .createHash("sha256")
        .update(`${AUDIT_SALT}:${label}:${value}`)
        .digest("base64url");
    return `${label}:${digest.slice(0, 16)}`;
}
function resolveAuditLogPath(explicit) {
    if (explicit)
        return explicit;
    if (process.env.SELF_AUDIT_LOG_PATH)
        return process.env.SELF_AUDIT_LOG_PATH;
    return "";
}
export function logSelfAuditEvent(event, options = {}) {
    const payload = { ...event, timestamp: new Date().toISOString() };
    try {
        // Always emit audit events (cannot be disabled). Log aggregation should capture stdout.
        console.log(`[SELF_AUDIT] ${JSON.stringify(payload)}`);
        // Optional file sink when explicitly configured.
        const logPath = resolveAuditLogPath(options.logPath);
        if (logPath) {
            fs.mkdirSync(path.dirname(logPath), { recursive: true });
            fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", "utf8");
        }
    }
    catch (error) {
        // Logging failures should not block the request pipeline
        console.error("[SELF] Failed to log audit event", error);
    }
}
//# sourceMappingURL=audit-log.js.map