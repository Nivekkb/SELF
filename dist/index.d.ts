import { type EmotionalState } from "./config";
import { ExitType } from "./exit-decision";
import { SelfHistoryMessage, AbusePreventionContext } from "./types";
export type SelfVariant = "control" | "s1_grounding" | "s1_agency" | "s1_strict" | "s2_strict";
export interface StateDetectionResult {
    state: EmotionalState;
    scores: Record<string, number>;
    reasons: string[];
    triggers?: string[];
    minForcedState?: EmotionalState;
    clarifierRequired?: boolean;
    clarifierReason?: string;
}
export interface AngerPhysicalityClarifier {
    required: boolean;
    reason: string;
    target: 'self' | 'others' | 'objects' | 'none' | 'unknown';
    resolved: boolean;
}
export declare function processAngerPhysicalityClarifier(message: string, detection: StateDetectionResult): AngerPhysicalityClarifier;
export declare function generateClarifierQuestion(): string;
export interface Policy {
    state: EmotionalState;
    allowedResponseClasses: string[];
    maxWords: number;
    maxQuestions: number;
    bannedPhrases: string[];
    styleRules: string[];
    requiresGrounding: boolean;
    requiresAgencyStep: boolean;
    requiresCrisisSupport: boolean;
    enforceNoHypotheticals: boolean;
    requiresValidation?: boolean;
    isTerminalState?: boolean;
    suppressQuestions?: boolean;
    enforceRestPosture?: boolean;
    forbidMechanismNaming?: boolean;
    requiresLoopBreaker?: boolean;
    loopBreakerLine?: string;
    requiresHandoffFraming?: boolean;
    handoffFramingLine?: string;
    requiresGovernanceFallback?: boolean;
    governanceFallbackLine?: string;
}
export interface ValidationResult {
    ok: boolean;
    violations: string[];
}
export interface SelfLogEvent {
    userId: string;
    stage: "pre" | "post";
    message: string;
    messageId?: number;
    state: EmotionalState;
    stateCurrent?: string;
    scores: Record<string, number>;
    reasons: string[];
    policy: Policy;
    validation?: ValidationResult;
    repaired?: boolean;
    variant?: SelfVariant;
    ruleIds?: string[];
    probeAllowed?: boolean;
    resolutionDetected?: boolean;
    exitReason?: string | null;
    exitType?: ExitType | null;
    exitIntentDetected?: boolean;
    exitClassificationMissing?: boolean;
    reentryFlag?: boolean | null;
    constraintsApplied?: string;
    redteamRun?: string;
    aiPreview?: string;
    confidence?: "high" | "medium" | "low";
    uncertaintyReasons?: string[];
    consideredActions?: string[];
    blockedActions?: Record<string, string>;
    requestedDepth?: string;
    effectiveDepth?: string;
    overrideReason?: string;
    refusalJustification?: string[];
    refusalDetected?: boolean;
    source?: string;
    redteamCandidates?: Array<{
        category: string;
        phrase: string;
    }>;
    invocation_id?: string;
    trigger_list?: string[];
    min_state?: EmotionalState;
    final_state?: EmotionalState;
    downshift_lock_reason?: string;
}
export type SelfUserIntent = "neutral" | "neutral_small_talk" | "distress" | "self_harm_implied" | "self_harm_explicit" | "harm_others" | "request_clinical_authority" | "request_therapy" | "meta_query" | "unclear";
export declare function classifyUserIntent(args: {
    message: string;
    detection: StateDetectionResult;
    isMetaQuery: boolean;
}): {
    intent: SelfUserIntent;
    signals: string[];
};
export declare function detectState(message: string, history?: SelfHistoryMessage[]): StateDetectionResult;
export declare function applyPolicyToPrompt(policy: Policy, baseSystemPrompt: string, variant?: SelfVariant): string;
export declare function applyStateGatedResponseContract(output: string, policy: Policy, userMessage: string): string;
export declare function maybeAddFollowUpQuestion(output: string, policy: Policy, userMessage: string): string;
export declare function rewriteContinuityQuestions(output: string, policy: Policy, userMessage: string): string;
export declare function rewriteSpokenMemoryRecall(output: string, policy: Policy, userMessage: string): string;
export declare function validateOutput(output: string, policy: Policy): ValidationResult;
export declare function repairOutput(output: string, policy: Policy): string;
export declare function getS1Variant(seed: string): SelfVariant;
export declare function getS2Variant(seed: string): SelfVariant;
export declare function adjustPolicyForVariant(policy: Policy, variant: SelfVariant): Policy;
export declare function needsValidationCue(message: string): boolean;
export declare function hasResolutionCue(message: string): {
    resolved: boolean;
    matches: string[];
};
export interface StabilitySignals {
    somaticGrounding: boolean;
    temporalOrientation: boolean;
    agencyContinuity: boolean;
    signalsDetected: string[];
}
export declare function detectStabilitySignals(message: string, history?: SelfHistoryMessage[]): StabilitySignals;
export interface SafeToResumeResult {
    safeToResume: boolean;
    confidence: "high" | "medium" | "low";
    missingSignals?: string[];
    reasons: string[];
}
export type SelfCoreState = "S0" | "S1" | "S2" | "S3";
export interface StickySelfSessionState {
    stateCurrent: SelfCoreState;
    riskScoreSmoothed: number;
    cooldownTurnsRemaining: number;
    consecutiveLowRiskUserTurns: number;
    pushCount: number;
    lastAffirmativeStabilizationAtTurn: number | null;
    turnIndex: number;
    stateInertiaLock?: {
        reason: string;
        minState: SelfCoreState;
        turnsRemaining: number;
        activatedAtTurn: number;
    };
}
export interface StickyStateParams {
    ewmaAlpha: number;
    stabilizationWindowTurns: number;
    lowRiskTurnsRequired: number;
    pushResetLowRiskTurns: number;
    pushElevateThreshold: number;
    cooldownTurnsAfterS2: number;
    cooldownTurnsAfterS3: number;
}
export declare const DEFAULT_STICKY_STATE_PARAMS: StickyStateParams;
export interface StickyStateTransitionMeta {
    detectedState: EmotionalState;
    stateBefore: SelfCoreState;
    stateAfter: SelfCoreState;
    riskScoreRaw: number;
    riskScoreSmoothed: number;
    lowRiskThisTurn: boolean;
    cooldownBefore: number;
    cooldownAfter: number;
    deescalationAttempted: boolean;
    deescalationAllowed: boolean;
    deescalationBlockedReasons: string[];
    escalationApplied: boolean;
    pushTriggered: boolean;
    pushMatches: string[];
    pushCountBefore: number;
    pushCountAfter: number;
    affirmativeStabilizationThisTurn: boolean;
    affirmativeStabilizationSeen: boolean;
    lastAffirmativeStabilizationAtTurn: number | null;
    confidence: "high" | "medium" | "low";
    uncertaintyReasons: string[];
    consideredActions: string[];
    blockedActions: Record<string, string>;
    overrideReason?: string;
}
export declare function defaultStickySelfSessionState(): StickySelfSessionState;
export declare function advanceStickySelfState(args: {
    session: StickySelfSessionState;
    message: string;
    history: SelfHistoryMessage[];
    params?: Partial<StickyStateParams>;
}): {
    nextSession: StickySelfSessionState;
    detection: StateDetectionResult;
    meta: StickyStateTransitionMeta;
};
export declare function isSafeToResumeNormalChat(args: {
    currentState: EmotionalState;
    message: string;
    history: SelfHistoryMessage[];
}): SafeToResumeResult;
export declare function detectAbusePatterns(context: AbusePreventionContext): {
    isAbuseDetected: boolean;
    reasons: string[];
};
export declare function applyStateDecay(currentState: EmotionalState, context: AbusePreventionContext): EmotionalState;
export declare function trackSafetyActions(args: {
    currentState: EmotionalState;
    detection: StateDetectionResult;
    safetyCheck: {
        safeToResume: boolean;
        reasons: string[];
    };
    abuseContext?: AbusePreventionContext;
}): {
    consideredActions: string[];
    blockedActions: Record<string, string>;
};
export declare function getAdaptiveState(args: {
    currentState: EmotionalState;
    message: string;
    history: SelfHistoryMessage[];
    abuseContext?: AbusePreventionContext;
}): EmotionalState;
export declare function createAbusePreventionContext(userId: string, sessionId: string): AbusePreventionContext;
export declare function recordStateChange(context: AbusePreventionContext, fromState: EmotionalState, toState: EmotionalState, reason: string): void;
export declare function persistAbuseContext(context: AbusePreventionContext): string;
export declare function restoreAbuseContext(serialized: string): Partial<AbusePreventionContext>;
export declare function generateMetaQuerySoftGateResponse(): string;
export declare function stripInternalStateLabelsFromResponse(output: string): string;
export declare function applyMetaQueryPrivacyProtection(output: string, message: string): string;
export declare function applySocialPolicyOverrides(args: {
    message: string;
    detection: StateDetectionResult;
    policy: Policy;
    history?: SelfHistoryMessage[];
    session?: {
        pushCount?: number;
    };
}): {
    policy: Policy;
    meta: {
        validationTriggered: boolean;
        resolutionDetected: boolean;
        angerContainment: boolean;
        isMetaQuery: boolean;
        paranoiaDetected: boolean;
        expertiseImmunityApplied: boolean;
        crisisOverlayApplied: boolean;
        unsafeDisengagementIntercept: boolean;
        certaintyLoopBreakerTriggered: boolean;
        intent: SelfUserIntent;
    };
};
export declare function isColdStart(context: AbusePreventionContext): boolean;
export declare function applyColdStartSafety(args: {
    currentState: EmotionalState;
    detection: StateDetectionResult;
    safetyCheck: {
        safeToResume: boolean;
        reasons: string[];
    };
    context: AbusePreventionContext;
}): EmotionalState;
export declare function calculateConfidenceAndUncertainty(args: {
    message: string;
    history: SelfHistoryMessage[];
    detection: StateDetectionResult;
    safetyCheck?: {
        safeToResume: boolean;
        reasons: string[];
    };
    context?: AbusePreventionContext;
}): {
    confidence: "high" | "medium" | "low";
    uncertaintyReasons: string[];
};
export declare function applyUncertaintyDrivenExitBehavior(args: {
    message: string;
    confidence: "high" | "medium" | "low";
    hasExitIntent: boolean;
    policy: Policy;
}): {
    adjustedPolicy: Policy;
    behaviorChangesApplied: string[];
};
export declare function logSelfEvent(event: SelfLogEvent, options?: {
    enabled?: boolean;
    logPath?: string;
}): void;
export declare function isMetaQueryAboutStateLabels(message: string): boolean;
export declare function checkForExitAndRestIntents(message: string): {
    hasExitIntent: boolean;
    hasRestIntent: boolean;
    hasExplicitConsentToEnd: boolean;
};
export declare function getAdaptiveStateWithKillSwitches(args: {
    currentState: EmotionalState;
    previousState: EmotionalState;
    message: string;
    history: SelfHistoryMessage[];
    killSwitchContext: any;
    coldStartMisclassificationRate: number;
    confidence: "high" | "medium" | "low";
    humanReviewFlags: string[];
    stateTransitionOccurred: boolean;
    metadata?: {
        confidence?: "high" | "medium" | "low";
        uncertaintyReasons?: string[];
        consideredActions?: string[];
        blockedActions?: Record<string, string>;
    };
    abuseContext?: AbusePreventionContext;
}): EmotionalState;
export { ExitType, StateType, getExitDecision, createDisengagementAcknowledgment, getExitPosturePolicy, hasExitIntent, isSafeToEnterRestFinal, createCooldownLock, isCooldownActive, canReEngage, getCooldownStatus, getRestStateSystemPrompt, getNormalSystemPrompt, exitRedTeamSeeds, trackCIAPMetric, interpretCIAPMetric, } from "./exit-decision";
export type { ExitDecision, ExitPosturePolicy, ExitDecisionContext, DisengagementAcknowledgment, CooldownLock, } from "./exit-decision";
export { getGovernanceAPI, getImmutableConfig, getImmutableDoctrine, getImmutableSafetyBoundaries, getImmutableDoctrineSections, preventOverride, verifySystemIntegrity, withImmutableGovernance } from "./governance-api";
export { getOverridePreventionSystem, blockConfigurationModification, blockDoctrineModification, blockSafetyBoundaryBypass, blockHardInvariantModification, blockSoftInvariantModification, blockStateDetectionModification, blockExitDecisionModification, blockKillSwitchModification, blockAPIKeyOverride, blockEnvironmentVariableOverride, blockCodeInjectionAttempt, preventOverrideAttempt, verifyOverridePreventionIntegrity } from "./override-prevention";
export { withSafetyBoundary, withAsyncSafetyBoundary, assertDoctrinalError, doctrinalizeError, safeExternalCall, selfEngineBoundary, selfEngineAsyncBoundary } from "./safetyBoundary";
export { enforceHardInvariants, validateEventIntegrity } from "./hardInvariants";
export { evaluateSoftInvariants, enforceSoftInvariants } from "./softInvariants";
export { DoctrinalError, createDoctrinalError, SECURITY_ERRORS, BEHAVIORAL_ERRORS, SAFETY_ERRORS, COMPLIANCE_ERRORS, categorizeError, requiresSystemHalt, resolveConditionalSeverity } from "./doctrinalErrors";
export { createKillSwitchContext, recordKillSwitchState, checkUnsafeResumeAfterDistress, checkColdStartMisclassification, checkUnloggedDecisions, checkHumanReviewFailure, checkAbuseRecoveryPatterns, checkAllKillSwitches, applyKillSwitchActions, serializeKillSwitchContext, deserializeKillSwitchContext } from "./kill-switches";
export { requireProd } from "./metricsGate";
export { recordSelfEvent } from "./recordSelfEvent";
export { DOCTRINE_VERSION, DoctrineSection } from "./doctrine";
export { getEffectivePolicy } from "./policy-profiles";
export type { EffectivePolicyContext } from "./policy-profiles";
//# sourceMappingURL=index.d.ts.map