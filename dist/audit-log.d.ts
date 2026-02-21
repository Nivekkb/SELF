export type SelfAuditEvent = {
    kind: "policy_profile_set";
    from: string;
    to: string;
} | {
    kind: "policy_hardening_violation";
    profile: string;
    violations: string[];
} | {
    kind: "policy_profile_rejected";
    profile: string;
    reason: string;
    details?: unknown;
} | {
    kind: "kill_switch_config_override_blocked";
    actorOpaqueId?: string;
    sessionOpaqueId?: string;
    attempted?: unknown;
    reason: string;
};
export declare function toOpaqueAuditId(label: "user" | "session", raw: string): string;
export declare function logSelfAuditEvent(event: SelfAuditEvent, options?: {
    logPath?: string;
}): void;
//# sourceMappingURL=audit-log.d.ts.map