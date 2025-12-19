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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { DoctrineSection } from "./doctrine";
/**
 * Comprehensive doctrinal error classification system.
 * All security and behavioral failures in SELF must be tied to specific doctrine sections.
 */
var DoctrinalError = /** @class */ (function (_super) {
    __extends(DoctrinalError, _super);
    function DoctrinalError(code, message, doctrineSections, severity, category) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.doctrineSections = doctrineSections;
        _this.severity = severity;
        _this.category = category;
        _this.name = "DoctrinalError";
        return _this;
    }
    return DoctrinalError;
}(Error));
export { DoctrinalError };
/**
 * Security failures - doctrine violations that compromise system security
 */
export var SECURITY_ERRORS = {
    // Authentication & Authorization
    INVALID_API_KEY: {
        code: "SEC_001",
        message: "Invalid or unauthorized API key access",
        doctrineSections: [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS],
        severity: "hard",
        category: "security"
    },
    EXPIRED_SESSION: {
        code: "SEC_002",
        message: "Session expired but access attempted",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "hard",
        category: "security"
    },
    // Data Integrity
    TAMPERED_DATA: {
        code: "SEC_003",
        message: "Data integrity violation detected",
        doctrineSections: [DoctrineSection.DS_FOUNDATION_TRANSPARENCY],
        severity: "hard",
        category: "security"
    },
    // Rate Limiting & Abuse
    RATE_LIMIT_EXCEEDED: {
        code: "SEC_004",
        message: "Rate limit exceeded for safety protection",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION],
        severity: "soft",
        category: "security"
    }
};
/**
 * Behavioral failures - doctrine violations in AI behavioral constraints
 */
export var BEHAVIORAL_ERRORS = {
    // Response Content Violations
    BANNED_PHRASE_USED: {
        code: "BEH_001",
        message: "Banned phrase detected in AI response",
        doctrineSections: [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE],
        severity: "hard",
        category: "behavioral"
    },
    WORD_LIMIT_EXCEEDED: {
        code: "BEH_002",
        message: "Response exceeds maximum word limit",
        doctrineSections: [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE],
        severity: "soft",
        category: "behavioral"
    },
    QUESTION_LIMIT_EXCEEDED: {
        code: "BEH_003",
        message: "Response exceeds maximum question limit",
        doctrineSections: [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE],
        severity: "soft",
        category: "behavioral"
    },
    // Required Element Missing
    GROUNDING_MISSING: {
        code: "BEH_004",
        message: "Required grounding element missing from response",
        doctrineSections: [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "soft",
        category: "behavioral"
    },
    AGENCY_STEP_MISSING: {
        code: "BEH_005",
        message: "Required agency restoration step missing",
        doctrineSections: [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "soft",
        category: "behavioral"
    },
    CRISIS_SUPPORT_MISSING: {
        code: "BEH_006",
        message: "Required crisis support elements missing",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "hard",
        category: "behavioral"
    },
    // Content Type Violations
    HYPOTHETICAL_USED: {
        code: "BEH_007",
        message: "Hypothetical scenario used when prohibited",
        doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "soft",
        category: "behavioral"
    },
    MECHANISM_NAMED: {
        code: "BEH_008",
        message: "Surveillance mechanism named when prohibited",
        doctrineSections: [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE],
        severity: "hard",
        category: "behavioral"
    },
    // State-Specific Violations
    INVALID_S0_RESPONSE: {
        code: "BEH_009",
        message: "Response violates S0 terminal state constraints",
        doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_13_VIOLATION_IS_DECISION],
        severity: "soft",
        category: "behavioral"
    },
    INVALID_HIGH_STATE_RESPONSE: {
        code: "BEH_010",
        message: "Response violates high-state safety requirements",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "hard",
        category: "behavioral"
    }
};
/**
 * Safety failures - doctrine violations that risk user harm
 */
export var SAFETY_ERRORS = {
    // State Detection Failures
    FALSE_NEGATIVE_STATE: {
        code: "SAF_001",
        message: "Failed to detect distress when present",
        doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "hard",
        category: "safety"
    },
    FALSE_POSITIVE_STATE: {
        code: "SAF_002",
        message: "Incorrectly detected distress when absent",
        doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_06_AUTONOMY_RESPECTED],
        severity: "soft",
        category: "safety"
    },
    // Recovery Assessment Failures
    PREMATURE_NORMALIZATION: {
        code: "SAF_003",
        message: "Allowed return to normal without sufficient evidence",
        doctrineSections: [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE],
        severity: "hard",
        category: "safety"
    },
    FALSE_CALM_ACCEPTED: {
        code: "SAF_004",
        message: "Accepted false calm indicators as genuine recovery",
        doctrineSections: [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "hard",
        category: "safety"
    },
    // Exit Safety Failures
    UNSAFE_DISENGAGEMENT_ALLOWED: {
        code: "SAF_005",
        message: "Allowed disengagement without safety verification",
        doctrineSections: [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_06_AUTONOMY_RESPECTED],
        severity: "hard",
        category: "safety"
    },
    EXIT_INTENT_MISSED: {
        code: "SAF_006",
        message: "Failed to detect and safely handle exit intent",
        doctrineSections: [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "conditional", // Soft if state <= S1 and no blockers, Hard otherwise
        category: "safety"
    },
    // Crisis Response Failures
    CRISIS_ESCALATION_MISSING: {
        code: "SAF_007",
        message: "Failed to escalate when crisis indicators present",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "hard",
        category: "safety"
    },
    INADEQUATE_CONTAINMENT: {
        code: "SAF_008",
        message: "Applied insufficient containment for detected risk",
        doctrineSections: [DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE, DoctrineSection.DS_02_STATE_IS_INFERENCE],
        severity: "soft",
        category: "safety"
    }
};
/**
 * Compliance failures - doctrine violations in system operation
 */
export var COMPLIANCE_ERRORS = {
    // Logging Failures
    LOGGING_FAILURE: {
        code: "CMP_001",
        message: "Failed to log required safety event",
        doctrineSections: [DoctrineSection.DS_FOUNDATION_TRANSPARENCY],
        severity: "hard",
        category: "compliance"
    },
    AUDIT_TRAIL_BROKEN: {
        code: "CMP_002",
        message: "Audit trail continuity broken",
        doctrineSections: [DoctrineSection.DS_FOUNDATION_TRANSPARENCY],
        severity: "hard",
        category: "compliance"
    },
    // Configuration Violations
    INVALID_CONFIGURATION: {
        code: "CMP_003",
        message: "System configured in violation of doctrine requirements",
        doctrineSections: [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY],
        severity: "hard",
        category: "compliance"
    },
    // Override Violations
    UNAUTHORIZED_OVERRIDE: {
        code: "CMP_004",
        message: "Override applied without proper authorization",
        doctrineSections: [DoctrineSection.DS_13_VIOLATION_IS_DECISION],
        severity: "hard",
        category: "compliance"
    },
    OVERRIDE_ABUSE: {
        code: "CMP_005",
        message: "Override mechanism abused or exploited",
        doctrineSections: [DoctrineSection.DS_13_VIOLATION_IS_DECISION, DoctrineSection.DS_10_FAILURE_COST_SYSTEM],
        severity: "hard",
        category: "compliance"
    }
};
/**
 * Create a doctrinal error with proper classification
 */
export function createDoctrinalError(errorType, context) {
    // Find the error in all categories
    var allErrors = __assign(__assign(__assign(__assign({}, SECURITY_ERRORS), BEHAVIORAL_ERRORS), SAFETY_ERRORS), COMPLIANCE_ERRORS);
    var errorConfig = allErrors[errorType];
    if (!errorConfig) {
        throw new Error("Unknown doctrinal error type: ".concat(errorType));
    }
    var message = context ? "".concat(errorConfig.message, ": ").concat(context) : errorConfig.message;
    return new DoctrinalError(errorConfig.code, message, errorConfig.doctrineSections, errorConfig.severity, errorConfig.category);
}
/**
 * Get all doctrine sections referenced by an error
 */
export function getErrorDoctrineSections(error) {
    return error.doctrineSections;
}
/**
 * Resolve conditional severity based on context
 */
export function resolveConditionalSeverity(error, context) {
    if (error.severity !== "conditional") {
        return error.severity;
    }
    // SAF_006: Exit Intent Missed - conditional logic
    if (error.code === "SAF_006") {
        var state = context === null || context === void 0 ? void 0 : context.currentState;
        var hasBlockers = (context === null || context === void 0 ? void 0 : context.hasBlockers) || false;
        // State ranking: S0 = 0, S1 = 1, S2 = 2, S3 = 3
        var stateRank = state === "S0" ? 0 : state === "S1" ? 1 : state === "S2" ? 2 : state === "S3" ? 3 : 0;
        // Soft if state <= S1 and no blockers, Hard otherwise
        if (stateRank <= 1 && !hasBlockers) {
            return "soft";
        }
        else {
            return "hard";
        }
    }
    // Default to hard for unknown conditional errors
    return "hard";
}
/**
 * Check if an error requires immediate system halt
 */
export function requiresSystemHalt(error, context) {
    var resolvedSeverity = resolveConditionalSeverity(error, context);
    return resolvedSeverity === "hard";
}
/**
 * Categorize an error for reporting and handling
 */
export function categorizeError(error) {
    return {
        primaryCategory: error.category,
        severity: error.severity,
        doctrineImpact: error.doctrineSections.map(function (section) { return section.split('_').slice(-1)[0]; }) // Get last part of section ID
    };
}
//# sourceMappingURL=doctrinalErrors.js.map