export declare const DOCTRINE_VERSION: "1.0";
export declare enum DoctrineSection {
    DS_00_SCOPE_AND_AUTHORITY = "DS_00_SCOPE_AND_AUTHORITY",
    DS_01_SELF_IS_CONTROL_LAYER = "DS_01_SELF_IS_CONTROL_LAYER",
    DS_02_STATE_IS_INFERENCE = "DS_02_STATE_IS_INFERENCE",
    DS_03_COLD_START_CONTAINMENT = "DS_03_COLD_START_CONTAINMENT",
    DS_04_RECOVERY_AFFIRMATIVE = "DS_04_RECOVERY_AFFIRMATIVE",
    DS_05_EXIT_GOVERNED = "DS_05_EXIT_GOVERNED",
    DS_06_AUTONOMY_RESPECTED = "DS_06_AUTONOMY_RESPECTED",
    DS_07_RESTRAINT_EXPLAINABLE = "DS_07_RESTRAINT_EXPLAINABLE",
    DS_08_METRICS_OBSERVE_SAFETY = "DS_08_METRICS_OBSERVE_SAFETY",
    DS_09_ATTRITION_ACCEPTED = "DS_09_ATTRITION_ACCEPTED",
    DS_10_FAILURE_COST_SYSTEM = "DS_10_FAILURE_COST_SYSTEM",
    DS_11_SEPARATE_ENVIRONMENTS = "DS_11_SEPARATE_ENVIRONMENTS",
    DS_12_UNSAFE_OUTCOMES_NAMED = "DS_12_UNSAFE_OUTCOMES_NAMED",
    DS_13_VIOLATION_IS_DECISION = "DS_13_VIOLATION_IS_DECISION",
    DS_FOUNDATION_SAFETY_CRITERION = "DS_00_SCOPE_AND_AUTHORITY",// Maps to Foundation 0
    DS_FOUNDATION_CONSERVATIVE_FAILURE = "DS_01_SELF_IS_CONTROL_LAYER",// Maps to Foundation 1
    DS_FOUNDATION_EXPLICIT_IMPLICIT = "DS_02_STATE_IS_INFERENCE",// Maps to Foundation 2
    DS_FOUNDATION_HUMAN_AUTHORITY = "DS_06_AUTONOMY_RESPECTED",// Maps to Foundation 3
    DS_FOUNDATION_TRANSPARENCY = "DS_07_RESTRAINT_EXPLAINABLE",// Maps to Foundation 4
    DS_FOUNDATION_BOUNDED_RISK = "DS_12_UNSAFE_OUTCOMES_NAMED",// Maps to Foundation 5
    DS_FOUNDATION_ETHICS_ECONOMICS = "DS_13_VIOLATION_IS_DECISION"
}
export type DataProvenance = "prod" | "test" | "demo";
export type Confidence = "low" | "medium" | "high";
export type EmotionalState = "S0" | "S1" | "S2" | "S3" | "SAFE_DISENGAGEMENT";
export type ExitType = "EXIT_RECOVERY_CONFIRMED" | "EXIT_SAFE_DISENGAGEMENT" | "EXIT_UNSAFE_BLOCKED";
export type ConsideredAction = "probe" | "challenge" | "ground" | "offer_resources" | "allow_exit" | "block_exit" | "resume_normal" | "clarify_intent";
export type PolicyOverride = {
    doctrineVersion: typeof DOCTRINE_VERSION;
    doctrineSections: DoctrineSection[];
    overrideReason: string;
    overrideOwner: "founder";
    overrideIssuedAt: string;
    overrideExpiresAt: string;
    riskAccepted: string;
};
export type ExitDecision = {
    exitRequestedByUser: boolean;
    exitType: ExitType;
    blockersPresent: string[];
    resourcesSuggested: string[];
    userNotConfirmedRecovered: boolean;
    systemRationale: string;
};
export type NonActionLog = {
    consideredAction: ConsideredAction;
    blockedByRule: string;
    blockedBecause: string;
};
export type SelfEvent = {
    doctrineVersion: typeof DOCTRINE_VERSION;
    dataProvenance: DataProvenance;
    runId: string;
    sessionId: string;
    userId: string;
    isColdStart: boolean;
    coldStartTurnIndex: number;
    state: EmotionalState;
    confidence: Confidence;
    ambiguityFlags: string[];
    affirmativeStabilizationSignals: string[];
    exit?: ExitDecision;
    nonActions?: NonActionLog[];
    override?: PolicyOverride;
    timestamp: string;
};
//# sourceMappingURL=doctrine.d.ts.map