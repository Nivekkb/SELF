import { EmotionalState } from "./config";
import { SelfHistoryMessage, AbusePreventionContext, StateDetectionResult } from "./types";
export interface KillSwitchConfig {
    readonly unsafeResumeThreshold: number;
    readonly coldStartMisclassificationThreshold: number;
    readonly coldStartHighConfidenceThreshold: number;
    readonly humanReviewFlags: readonly string[];
    readonly abuseRecoveryPatterns: readonly string[];
}
export declare const defaultKillSwitchConfig: KillSwitchConfig;
export type KillSwitchLevel = "guarded" | "containment" | "shutdown";
export interface KillSwitchState {
    globalKillSwitchActive: boolean;
    killSwitchLevel: KillSwitchLevel;
    killSwitchReasons: string[];
    unsafeResumeDetected: boolean;
    coldStartMisclassificationDetected: boolean;
    unloggedDecisionsDetected: boolean;
    humanReviewFailureDetected: boolean;
    abuseRecoveryDetected: boolean;
    lockedToGuardedState: boolean;
    requireManualReview: boolean;
}
export interface KillSwitchContext {
    userId: string;
    sessionId: string;
    stateHistory: Array<{
        state: EmotionalState;
        timestamp: Date;
        message: string;
        confidence?: "high" | "medium" | "low";
        uncertaintyReasons?: string[];
        consideredActions?: string[];
        blockedActions?: Record<string, string>;
    }>;
    coldStartTurns: number;
    isColdStart: boolean;
    humanReviewFlags: string[];
    abuseRecoveryAttempts: number;
    killSwitchState: KillSwitchState;
    config: KillSwitchConfig;
}
export declare function createKillSwitchContext(userId: string, sessionId: string, config?: Partial<KillSwitchConfig>): KillSwitchContext;
export declare function recordKillSwitchState(context: KillSwitchContext, state: EmotionalState, message: string, metadata?: {
    confidence?: "high" | "medium" | "low";
    uncertaintyReasons?: string[];
    consideredActions?: string[];
    blockedActions?: Record<string, string>;
}): void;
export declare function checkUnsafeResumeAfterDistress(context: KillSwitchContext, currentState: EmotionalState, previousState: EmotionalState, message: string, history: SelfHistoryMessage[]): boolean;
export declare function checkColdStartMisclassification(context: KillSwitchContext, currentState: EmotionalState, detectionResult: StateDetectionResult, coldStartMisclassificationRate: number, confidence: "high" | "medium" | "low"): boolean;
export declare function checkUnloggedDecisions(context: KillSwitchContext, stateTransitionOccurred: boolean, metadata?: {
    confidence?: "high" | "medium" | "low";
    uncertaintyReasons?: string[];
    consideredActions?: string[];
    blockedActions?: Record<string, string>;
}): boolean;
export declare function checkHumanReviewFailure(context: KillSwitchContext, humanReviewFlags: string[]): boolean;
export declare function checkAbuseRecoveryPatterns(context: KillSwitchContext, message: string, abuseContext?: AbusePreventionContext): boolean;
export declare function checkAllKillSwitches(context: KillSwitchContext, args: {
    currentState: EmotionalState;
    previousState: EmotionalState;
    message: string;
    history: SelfHistoryMessage[];
    detectionResult: StateDetectionResult;
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
}): KillSwitchState;
export declare function applyKillSwitchActions(context: KillSwitchContext, currentState: EmotionalState): EmotionalState;
export declare function serializeKillSwitchContext(context: KillSwitchContext): string;
export declare function deserializeKillSwitchContext(serialized: string): KillSwitchContext;
//# sourceMappingURL=kill-switches.d.ts.map