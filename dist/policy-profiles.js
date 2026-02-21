/**
 * SELF Policy Profiles — Server-Locked Hardening
 *
 * Goals:
 * - Profile selection is server-locked (no client-selected profiles).
 * - Profiles may only harden behavior (monotonic tightening; never relax).
 * - Safety features cannot be disabled by profiles.
 * - Fail-closed: invalid hardening patches are rejected + logged and the base policy remains in effect.
 *
 * Note:
 * - Profile definitions are intentionally NOT exported.
 */
import { selfConfig } from "./config.js";
import { logSelfAuditEvent } from "./audit-log.js";
function uniqueAppend(base, additions) {
    const seen = new Set();
    const result = [];
    for (const item of base) {
        const value = String(item || "").trim();
        if (!value)
            continue;
        if (seen.has(value))
            continue;
        seen.add(value);
        result.push(value);
    }
    if (!additions || additions.length === 0)
        return result;
    for (const item of additions) {
        const value = String(item || "").trim();
        if (!value)
            continue;
        if (seen.has(value))
            continue;
        seen.add(value);
        result.push(value);
    }
    return result;
}
function intersectAllowedClasses(base, requested) {
    if (!requested || requested.length === 0)
        return base;
    const allowed = new Set(base);
    const normalized = requested
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .filter((v) => allowed.has(v));
    // Invalid or empty subset request: keep base (do not apply hardening).
    if (normalized.length === 0)
        return base;
    return normalized;
}
function resolveServerLockedProfileType() {
    const raw = (process.env.SELF_POLICY_PROFILE || "").trim().toLowerCase();
    if (raw === "public-consumer" ||
        raw === "education" ||
        raw === "enterprise-internal" ||
        raw === "clinical-adjacent") {
        return raw;
    }
    if (!raw)
        return "public-consumer";
    // Fail-closed: unknown profile name cannot weaken safety; default to strictest known profile.
    logSelfAuditEvent({
        kind: "policy_profile_rejected",
        profile: raw,
        reason: "Unknown SELF_POLICY_PROFILE value; defaulting to clinical-adjacent",
    });
    return "clinical-adjacent";
}
const INTERNAL_POLICY_PROFILES = Object.freeze({
    "public-consumer": Object.freeze({
        type: "public-consumer",
        name: "Public Consumer",
        description: "Baseline SELF posture (no profile hardening applied).",
        patches: {},
    }),
    "education": Object.freeze({
        type: "education",
        name: "Education",
        description: "Tighter question/length caps and stronger anti-hypothetical posture.",
        patches: {
            S0_GUARDED: Object.freeze({
                maxQuestions: 0,
            }),
            S1: Object.freeze({
                maxQuestions: 1,
                enforceNoHypotheticals: true,
            }),
            S2: Object.freeze({
                maxWords: 110,
                maxQuestions: 1,
                enforceNoHypotheticals: true,
            }),
        },
    }),
    "enterprise-internal": Object.freeze({
        type: "enterprise-internal",
        name: "Enterprise Internal",
        description: "More conservative constraints and stronger boundary posture in elevated states.",
        patches: {
            S1: Object.freeze({
                maxQuestions: 1,
            }),
            S2: Object.freeze({
                maxWords: 100,
                maxQuestions: 1,
                requiresValidation: true,
            }),
            S3: Object.freeze({
                maxWords: 90,
                maxQuestions: 1,
                requiresValidation: true,
            }),
        },
    }),
    "clinical-adjacent": Object.freeze({
        type: "clinical-adjacent",
        name: "Clinical Adjacent",
        description: "Strict containment posture; ensure crisis support earlier.",
        patches: {
            S1: Object.freeze({
                maxWords: 120,
                maxQuestions: 1,
                enforceNoHypotheticals: true,
                requiresValidation: true,
            }),
            S2: Object.freeze({
                maxWords: 90,
                maxQuestions: 1,
                requiresCrisisSupport: true,
                enforceNoHypotheticals: true,
                requiresValidation: true,
            }),
            S3: Object.freeze({
                maxWords: 80,
                maxQuestions: 1,
                requiresValidation: true,
            }),
        },
    }),
});
let cachedServerProfile = null;
let loggedProfileOnce = false;
function getServerLockedProfile() {
    if (!cachedServerProfile)
        cachedServerProfile = resolveServerLockedProfileType();
    const profile = INTERNAL_POLICY_PROFILES[cachedServerProfile];
    if (!profile) {
        // Fail-closed: should never happen, but preserve safety by falling back to strict profile.
        return INTERNAL_POLICY_PROFILES["clinical-adjacent"];
    }
    return profile;
}
function applyHardening(args) {
    const patch = args.patch;
    if (!patch)
        return args.base;
    const base = args.base;
    const violations = [];
    const maxWords = typeof patch.maxWords === "number"
        ? patch.maxWords <= base.maxWords
            ? patch.maxWords
            : (violations.push(`maxWords attempted to increase (${patch.maxWords} > ${base.maxWords})`), base.maxWords)
        : base.maxWords;
    const maxQuestions = typeof patch.maxQuestions === "number"
        ? patch.maxQuestions <= base.maxQuestions
            ? patch.maxQuestions
            : (violations.push(`maxQuestions attempted to increase (${patch.maxQuestions} > ${base.maxQuestions})`), base.maxQuestions)
        : base.maxQuestions;
    const allowedResponseClasses = intersectAllowedClasses(base.allowedResponseClasses, patch.allowedResponseClasses);
    if (patch.allowedResponseClasses && allowedResponseClasses === base.allowedResponseClasses) {
        const baseSet = new Set(base.allowedResponseClasses);
        const requested = patch.allowedResponseClasses.filter((v) => baseSet.has(v));
        if (requested.length === 0) {
            violations.push("allowedResponseClasses attempted to remove all classes");
        }
    }
    const hardened = {
        ...base,
        maxWords,
        maxQuestions,
        allowedResponseClasses,
        bannedPhrases: uniqueAppend(base.bannedPhrases, patch.bannedPhrases),
        styleRules: uniqueAppend(base.styleRules, patch.styleRules),
        requiresGrounding: base.requiresGrounding || patch.requiresGrounding === true,
        requiresAgencyStep: base.requiresAgencyStep || patch.requiresAgencyStep === true,
        requiresCrisisSupport: base.requiresCrisisSupport || patch.requiresCrisisSupport === true,
        enforceNoHypotheticals: base.enforceNoHypotheticals || patch.enforceNoHypotheticals === true,
        requiresValidation: (base.requiresValidation ?? false) || patch.requiresValidation === true,
        suppressQuestions: (base.suppressQuestions ?? false) || patch.suppressQuestions === true,
        enforceRestPosture: (base.enforceRestPosture ?? false) || patch.enforceRestPosture === true,
        forbidMechanismNaming: (base.forbidMechanismNaming ?? false) || patch.forbidMechanismNaming === true,
        requiresLoopBreaker: (base.requiresLoopBreaker ?? false) || patch.requiresLoopBreaker === true,
        requiresHandoffFraming: (base.requiresHandoffFraming ?? false) || patch.requiresHandoffFraming === true,
        isTerminalState: (base.isTerminalState ?? false) || patch.isTerminalState === true,
    };
    if (violations.length) {
        logSelfAuditEvent({
            kind: "policy_profile_rejected",
            profile: args.profileName,
            reason: "Hardening patch attempted to relax safety; patch ignored for those fields",
            details: violations,
        });
    }
    return hardened;
}
/**
 * The only public API for profile-derived policy.
 *
 * - Server-locked: no profile can be passed in.
 * - Monotonic: profile patches can only tighten.
 * - Fail-closed: invalid patches are ignored and logged.
 */
export function getEffectivePolicy(context) {
    const profile = getServerLockedProfile();
    if (!loggedProfileOnce) {
        loggedProfileOnce = true;
        logSelfAuditEvent({
            kind: "policy_profile_set",
            from: "base",
            to: profile.type,
        });
    }
    const basePolicy = {
        state: context.state,
        ...selfConfig.policies[context.state],
    };
    return applyHardening({
        base: basePolicy,
        patch: profile.patches[context.state],
        profileName: profile.type,
    });
}
//# sourceMappingURL=policy-profiles.js.map