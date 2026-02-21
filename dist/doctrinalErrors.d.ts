import { DoctrineSection } from "./doctrine";
/**
 * Comprehensive doctrinal error classification system.
 * All security and behavioral failures in SELF must be tied to specific doctrine sections.
 */
export declare class DoctrinalError extends Error {
    code: string;
    doctrineSections: readonly DoctrineSection[];
    severity: "hard" | "soft" | "conditional";
    category: "security" | "behavioral" | "safety" | "compliance";
    constructor(code: string, message: string, doctrineSections: readonly DoctrineSection[], severity: "hard" | "soft" | "conditional", category: "security" | "behavioral" | "safety" | "compliance");
}
/**
 * Security failures - doctrine violations that compromise system security
 */
export declare const SECURITY_ERRORS: {
    readonly INVALID_API_KEY: {
        readonly code: "SEC_001";
        readonly message: "Invalid or unauthorized API key access";
        readonly doctrineSections: readonly [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS];
        readonly severity: "hard";
        readonly category: "security";
    };
    readonly EXPIRED_SESSION: {
        readonly code: "SEC_002";
        readonly message: "Session expired but access attempted";
        readonly doctrineSections: readonly [DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
        readonly severity: "hard";
        readonly category: "security";
    };
    readonly TAMPERED_DATA: {
        readonly code: "SEC_003";
        readonly message: "Data integrity violation detected";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "hard";
        readonly category: "security";
    };
    readonly RATE_LIMIT_EXCEEDED: {
        readonly code: "SEC_004";
        readonly message: "Rate limit exceeded for safety protection";
        readonly doctrineSections: readonly [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
        readonly severity: "soft";
        readonly category: "security";
    };
};
/**
 * Behavioral failures - doctrine violations in AI behavioral constraints
 */
export declare const BEHAVIORAL_ERRORS: {
    readonly BANNED_PHRASE_USED: {
        readonly code: "BEH_001";
        readonly message: "Banned phrase detected in AI response";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "hard";
        readonly category: "behavioral";
    };
    readonly WORD_LIMIT_EXCEEDED: {
        readonly code: "BEH_002";
        readonly message: "Response exceeds maximum word limit";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly QUESTION_LIMIT_EXCEEDED: {
        readonly code: "BEH_003";
        readonly message: "Response exceeds maximum question limit";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly GROUNDING_MISSING: {
        readonly code: "BEH_004";
        readonly message: "Required grounding element missing from response";
        readonly doctrineSections: readonly [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly AGENCY_STEP_MISSING: {
        readonly code: "BEH_005";
        readonly message: "Required agency restoration step missing";
        readonly doctrineSections: readonly [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly CRISIS_SUPPORT_MISSING: {
        readonly code: "BEH_006";
        readonly message: "Required crisis support elements missing";
        readonly doctrineSections: readonly [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "hard";
        readonly category: "behavioral";
    };
    readonly HYPOTHETICAL_USED: {
        readonly code: "BEH_007";
        readonly message: "Hypothetical scenario used when prohibited";
        readonly doctrineSections: readonly [DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly MECHANISM_NAMED: {
        readonly code: "BEH_008";
        readonly message: "Surveillance mechanism named when prohibited";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "hard";
        readonly category: "behavioral";
    };
    readonly INVALID_S0_RESPONSE: {
        readonly code: "BEH_009";
        readonly message: "Response violates S0 terminal state constraints";
        readonly doctrineSections: readonly [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
        readonly severity: "soft";
        readonly category: "behavioral";
    };
    readonly INVALID_HIGH_STATE_RESPONSE: {
        readonly code: "BEH_010";
        readonly message: "Response violates high-state safety requirements";
        readonly doctrineSections: readonly [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "hard";
        readonly category: "behavioral";
    };
};
/**
 * Safety failures - doctrine violations that risk user harm
 */
export declare const SAFETY_ERRORS: {
    readonly FALSE_NEGATIVE_STATE: {
        readonly code: "SAF_001";
        readonly message: "Failed to detect distress when present";
        readonly doctrineSections: readonly [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
        readonly severity: "hard";
        readonly category: "safety";
    };
    readonly FALSE_POSITIVE_STATE: {
        readonly code: "SAF_002";
        readonly message: "Incorrectly detected distress when absent";
        readonly doctrineSections: readonly [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_06_AUTONOMY_RESPECTED];
        readonly severity: "soft";
        readonly category: "safety";
    };
    readonly PREMATURE_NORMALIZATION: {
        readonly code: "SAF_003";
        readonly message: "Allowed return to normal without sufficient evidence";
        readonly doctrineSections: readonly [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_01_SELF_IS_CONTROL_LAYER];
        readonly severity: "hard";
        readonly category: "safety";
    };
    readonly FALSE_CALM_ACCEPTED: {
        readonly code: "SAF_004";
        readonly message: "Accepted false calm indicators as genuine recovery";
        readonly doctrineSections: readonly [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE];
        readonly severity: "hard";
        readonly category: "safety";
    };
    readonly UNSAFE_DISENGAGEMENT_ALLOWED: {
        readonly code: "SAF_005";
        readonly message: "Allowed disengagement without safety verification";
        readonly doctrineSections: readonly [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_06_AUTONOMY_RESPECTED];
        readonly severity: "hard";
        readonly category: "safety";
    };
    readonly EXIT_INTENT_MISSED: {
        readonly code: "SAF_006";
        readonly message: "Failed to detect and safely handle exit intent";
        readonly doctrineSections: readonly [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
        readonly severity: "conditional";
        readonly category: "safety";
    };
    readonly CRISIS_ESCALATION_MISSING: {
        readonly code: "SAF_007";
        readonly message: "Failed to escalate when crisis indicators present";
        readonly doctrineSections: readonly [DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
        readonly severity: "hard";
        readonly category: "safety";
    };
    readonly INADEQUATE_CONTAINMENT: {
        readonly code: "SAF_008";
        readonly message: "Applied insufficient containment for detected risk";
        readonly doctrineSections: readonly [DoctrineSection.DS_01_SELF_IS_CONTROL_LAYER, DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "soft";
        readonly category: "safety";
    };
};
/**
 * Compliance failures - doctrine violations in system operation
 */
export declare const COMPLIANCE_ERRORS: {
    readonly LOGGING_FAILURE: {
        readonly code: "CMP_001";
        readonly message: "Failed to log required safety event";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "hard";
        readonly category: "compliance";
    };
    readonly AUDIT_TRAIL_BROKEN: {
        readonly code: "CMP_002";
        readonly message: "Audit trail continuity broken";
        readonly doctrineSections: readonly [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
        readonly severity: "hard";
        readonly category: "compliance";
    };
    readonly INVALID_CONFIGURATION: {
        readonly code: "CMP_003";
        readonly message: "System configured in violation of doctrine requirements";
        readonly doctrineSections: readonly [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY];
        readonly severity: "hard";
        readonly category: "compliance";
    };
    readonly UNAUTHORIZED_OVERRIDE: {
        readonly code: "CMP_004";
        readonly message: "Override applied without proper authorization";
        readonly doctrineSections: readonly [DoctrineSection.DS_13_VIOLATION_IS_DECISION, DoctrineSection.DS_00_SCOPE_AND_AUTHORITY];
        readonly severity: "hard";
        readonly category: "compliance";
    };
    readonly OVERRIDE_ABUSE: {
        readonly code: "CMP_005";
        readonly message: "Override mechanism abused or exploited";
        readonly doctrineSections: readonly [DoctrineSection.DS_13_VIOLATION_IS_DECISION, DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
        readonly severity: "hard";
        readonly category: "compliance";
    };
};
/**
 * Create a doctrinal error with proper classification
 */
export declare function createDoctrinalError(errorType: keyof typeof SECURITY_ERRORS | keyof typeof BEHAVIORAL_ERRORS | keyof typeof SAFETY_ERRORS | keyof typeof COMPLIANCE_ERRORS, context?: string): DoctrinalError;
/**
 * Get all doctrine sections referenced by an error
 */
export declare function getErrorDoctrineSections(error: DoctrinalError): readonly DoctrineSection[];
/**
 * Resolve conditional severity based on context
 */
export declare function resolveConditionalSeverity(error: DoctrinalError, context?: {
    currentState?: string;
    hasBlockers?: boolean;
}): "hard" | "soft";
/**
 * Check if an error requires immediate system halt
 */
export declare function requiresSystemHalt(error: DoctrinalError, context?: {
    currentState?: string;
    hasBlockers?: boolean;
}): boolean;
/**
 * Categorize an error for reporting and handling
 */
export declare function categorizeError(error: DoctrinalError): {
    primaryCategory: string;
    severity: string;
    doctrineImpact: string[];
};
//# sourceMappingURL=doctrinalErrors.d.ts.map