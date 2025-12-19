var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { DOCTRINE_VERSION, DoctrineSection } from "./doctrine";
var HardInvariantViolation = /** @class */ (function (_super) {
    __extends(HardInvariantViolation, _super);
    function HardInvariantViolation(code, message, doctrineSections) {
        var _this = _super.call(this, "".concat(code, ": ").concat(message)) || this;
        _this.code = code;
        _this.doctrineSections = doctrineSections;
        _this.name = "HardInvariantViolation";
        return _this;
    }
    return HardInvariantViolation;
}(Error));
export { HardInvariantViolation };
function requireField(val, code, msg, sections) {
    if (val === undefined || val === null)
        throw new HardInvariantViolation(code, msg, sections);
    return val;
}
/**
 * Enforces hard invariants that cannot be violated under any circumstances.
 * Hard invariants cause immediate system failure when breached.
 * These are absolute rules that preserve the fundamental safety properties of SELF.
 */
export function enforceHardInvariants(ev) {
    var _a, _b, _c;
    // H0: Doctrine version integrity - Foundation Section 0
    if (ev.doctrineVersion !== DOCTRINE_VERSION) {
        throw new HardInvariantViolation("H0_DOCTRINE_VERSION_MISMATCH", "Expected ".concat(DOCTRINE_VERSION, ", got ").concat(ev.doctrineVersion), [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY]);
    }
    // H1: Provenance integrity - Foundation Section 4 (Transparency)
    if (!ev.dataProvenance) {
        throw new HardInvariantViolation("H1_NO_PROVENANCE", "dataProvenance missing - violates transparency requirements", [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
    }
    if (!ev.runId) {
        throw new HardInvariantViolation("H1_NO_RUN_ID", "runId missing - violates auditability requirements", [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
    }
    // H2: Exit semantics integrity - Doctrine Section 5 (Exit Governed)
    if (ev.exit) {
        var x = ev.exit;
        // Must have a typed exit
        if (!x.exitType) {
            throw new HardInvariantViolation("H2_EXIT_TYPE_MISSING", "exit.exitType missing - violates exit governance", [DoctrineSection.DS_05_EXIT_GOVERNED]);
        }
        // Must record whether user asked to exit
        if (x.exitRequestedByUser === undefined) {
            throw new HardInvariantViolation("H2_EXIT_REQUESTED_MISSING", "exit.exitRequestedByUser missing - violates autonomy respect", [DoctrineSection.DS_06_AUTONOMY_RESPECTED]);
        }
        // Must be honest about recovery - Foundation Section 2 (Conservative Failure Mode)
        if (x.exitType === "EXIT_RECOVERY_CONFIRMED") {
            if (x.userNotConfirmedRecovered) {
                throw new HardInvariantViolation("H2_FALSE_RECOVERY_FLAG", "Recovery confirmed but userNotConfirmedRecovered=true - violates conservative failure mode", [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE]);
            }
            if ((_a = x.blockersPresent) === null || _a === void 0 ? void 0 : _a.length) {
                throw new HardInvariantViolation("H2_RECOVERY_WITH_BLOCKERS", "Recovery confirmed with blockersPresent=[".concat(x.blockersPresent.join(","), "] - violates evidence over assumption"), [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE]);
            }
            if (!((_b = ev.affirmativeStabilizationSignals) === null || _b === void 0 ? void 0 : _b.length)) {
                throw new HardInvariantViolation("H2_RECOVERY_WITHOUT_STABILIZATION", "Recovery confirmed without affirmative stabilization signals - violates evidence over assumption", [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE]);
            }
        }
        // EXIT_SAFE_DISENGAGEMENT must never pretend recovery - Foundation Section 2
        if (x.exitType === "EXIT_SAFE_DISENGAGEMENT") {
            if (x.userNotConfirmedRecovered !== true) {
                throw new HardInvariantViolation("H2_DISENGAGEMENT_MUST_NOT_CONFIRM", "Safe disengagement must set userNotConfirmedRecovered=true - violates conservative failure mode", [DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE, DoctrineSection.DS_06_AUTONOMY_RESPECTED]);
            }
            requireField(x.systemRationale, "H2_DISENGAGEMENT_RATIONALE", "Missing systemRationale for safe disengagement - violates explainable restraint", [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
        }
        // Required fields must be present - Foundation Section 4 (Transparency)
        requireField(x.resourcesSuggested, "H2_RESOURCES_FIELD_MISSING", "exit.resourcesSuggested missing - violates transparency requirements", [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
        requireField(x.blockersPresent, "H2_BLOCKERS_FIELD_MISSING", "exit.blockersPresent missing - violates transparency requirements", [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
    }
    // H3: Non-action logging integrity - Doctrine Section 7 (Restraint Explainable)
    if (ev.nonActions) {
        for (var _i = 0, _d = ev.nonActions; _i < _d.length; _i++) {
            var na = _d[_i];
            requireField(na.consideredAction, "H3_NONACTION_ACTION_MISSING", "nonActions.consideredAction missing - violates explainable restraint", [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
            requireField(na.blockedByRule, "H3_NONACTION_RULE_MISSING", "nonActions.blockedByRule missing - violates explainable restraint", [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
        }
    }
    // H4: Cold-start safety integrity - Doctrine Section 3 (Cold-Start Containment)
    if (ev.isColdStart && ev.state === "S0" && (!((_c = ev.affirmativeStabilizationSignals) === null || _c === void 0 ? void 0 : _c.length))) {
        throw new HardInvariantViolation("H4_COLDSTART_S0_WITHOUT_STABILIZATION", "Cold-start reached S0 without affirmative stabilization - violates containment over classification", [DoctrineSection.DS_03_COLD_START_CONTAINMENT, DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE]);
    }
    // H5: Override validity - Foundation Section 2 (Explicit Over Implicit)
    if (ev.override) {
        var now = Date.now();
        var exp = Date.parse(ev.override.overrideExpiresAt);
        if (Number.isNaN(exp) || exp < now) {
            throw new HardInvariantViolation("H5_OVERRIDE_EXPIRED", "Policy override has expired - violates explicit over implicit", [DoctrineSection.DS_FOUNDATION_EXPLICIT_IMPLICIT]);
        }
    }
    // H6: State transition logging - Foundation Section 4 (Transparency)
    if (!ev.timestamp) {
        throw new HardInvariantViolation("H6_TIMESTAMP_MISSING", "Event timestamp missing - violates complete auditability", [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
    }
}
/**
 * Validates that an event passes all hard invariant checks.
 * This function should be called before any event processing or persistence.
 */
export function validateEventIntegrity(ev) {
    enforceHardInvariants(ev);
}
/**
 * Hard invariants are absolute rules that cannot be violated.
 * They represent the fundamental safety boundaries that preserve SELF's integrity.
 * Violation of hard invariants indicates a system failure that requires immediate attention.
 *
 * Hard invariants differ from soft invariants in that:
 * - Hard invariants cause immediate failure
 * - Hard invariants cannot be overridden
 * - Hard invariants protect fundamental system properties
 * - Hard invariants are checked before any processing
 */
//# sourceMappingURL=hardInvariants.js.map