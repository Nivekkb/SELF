import { DoctrineSection } from "./doctrine";
import { DoctrineViolation } from "./doctrineCompliance";
function hasValidOverride(ev, sections) {
    if (!ev.override)
        return false;
    var now = Date.now();
    var exp = Date.parse(ev.override.overrideExpiresAt);
    if (Number.isNaN(exp) || exp < now)
        return false;
    // must reference the violated sections
    return sections.every(function (s) { return ev.override.doctrineSections.includes(s); });
}
export function evaluateSoftInvariants(ev) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var v = [];
    // Example S1: "no probing when settled" (you decide what "settled" means)
    // If ambiguity flag says settled, probing should be blocked
    if (((_a = ev.ambiguityFlags) === null || _a === void 0 ? void 0 : _a.includes("settled")) && ((_b = ev.nonActions) === null || _b === void 0 ? void 0 : _b.every(function (na) { return na.consideredAction !== "probe"; }))) {
        // ok (probe not attempted)
    }
    else if ((_c = ev.ambiguityFlags) === null || _c === void 0 ? void 0 : _c.includes("settled")) {
        v.push({
            code: "S1_PROBE_WHEN_SETTLED",
            message: "Probe occurred despite settled indicator",
            doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]
        });
    }
    // Example S2: Low confidence + exit should avoid "warm hooks"
    // You'll implement hook detection elsewhere; treat this as a placeholder
    if (ev.exit && ev.confidence === "low" && ev.exit.exitType !== "EXIT_UNSAFE_BLOCKED") {
        // require a rationale string be explicit + neutral (placeholder check)
        if (ev.exit.systemRationale.length < 10) {
            v.push({
                code: "S2_LOWCONF_EXIT_RATIONALE_TOO_THIN",
                message: "Low-confidence exit lacked explicit rationale",
                doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_06_AUTONOMY_RESPECTED]
            });
        }
    }
    // Example S3: Ambiguous physicality in anger requires clarification
    // When ANGRY_PHYSICALITY trigger fires but physicality target is ambiguous,
    // the system must require clarification and cannot proceed without it
    if ((_d = ev.ambiguityFlags) === null || _d === void 0 ? void 0 : _d.includes("angry_physicality_ambiguous")) {
        // Check if clarification was properly enforced
        var hasClarificationBlock = (_e = ev.nonActions) === null || _e === void 0 ? void 0 : _e.some(function (na) {
            return na.consideredAction === "resume_normal" &&
                na.blockedByRule.includes("CLARIFICATION_REQUIRED");
        });
        if (!hasClarificationBlock) {
            v.push({
                code: "S3_AMBIGUOUS_PHYSICALITY_UNCLARIFIED",
                message: "Ambiguous physicality in anger was not properly clarified before proceeding",
                doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
            });
        }
    }
    // Example S4: Doctrine-backend exit blocking
    // When exit is attempted but doctrine violations would result, block exit
    if (ev.exit && ev.exit.exitType !== "EXIT_UNSAFE_BLOCKED") {
        // Check if there are unresolved doctrine violations that should prevent exit
        var hasActiveViolations = (_f = ev.ambiguityFlags) === null || _f === void 0 ? void 0 : _f.some(function (flag) {
            return flag.includes("doctrine_violation") || flag.includes("unsafe_condition");
        });
        if (hasActiveViolations) {
            var hasExitBlock = (_g = ev.nonActions) === null || _g === void 0 ? void 0 : _g.some(function (na) {
                return na.consideredAction === "allow_exit" &&
                    na.blockedByRule.includes("DOCTRINE_VIOLATION_BLOCKING");
            });
            if (!hasExitBlock) {
                v.push({
                    code: "S4_DOCTRINE_BACKEND_EXIT_BLOCK",
                    message: "Exit attempted despite active doctrine violations requiring containment",
                    doctrineSections: [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
                });
            }
        }
    }
    // Example S5: Reset-abuse persistent test
    // Detect and prevent abusive patterns of state resets or session manipulation
    if ((_h = ev.ambiguityFlags) === null || _h === void 0 ? void 0 : _h.includes("reset_abuse_detected")) {
        // Check if reset/manipulation attempts were properly blocked
        var hasResetBlock = (_j = ev.nonActions) === null || _j === void 0 ? void 0 : _j.some(function (na) {
            return (na.consideredAction === "resume_normal" || na.consideredAction === "allow_exit") &&
                na.blockedByRule.includes("RESET_ABUSE_PREVENTION");
        });
        if (!hasResetBlock) {
            v.push({
                code: "S5_RESET_ABUSE_UNBLOCKED",
                message: "Reset abuse pattern detected but not properly prevented",
                doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION]
            });
        }
    }
    return v;
}
export function enforceSoftInvariants(ev) {
    var violations = evaluateSoftInvariants(ev);
    if (!violations.length)
        return;
    var unapproved = violations.filter(function (x) { return !hasValidOverride(ev, x.doctrineSections); });
    if (!unapproved.length)
        return;
    // Collect all doctrine sections from unapproved violations
    var allViolatedSections = unapproved.flatMap(function (v) { return v.doctrineSections; });
    // Fail closed at the boundary where you persist events, not at runtime response generation.
    // This prevents "silent drift" entering telemetry.
    throw new DoctrineViolation("S_SOFT_VIOLATION_WITHOUT_OVERRIDE", unapproved.map(function (u) { return "".concat(u.code, "(").concat(u.doctrineSections.join(","), "): ").concat(u.message); }).join(" | "), allViolatedSections);
}
//# sourceMappingURL=softInvariants.js.map