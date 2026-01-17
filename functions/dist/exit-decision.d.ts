import { SelfHistoryMessage, AbusePreventionContext } from "./types";
import { EmotionalState } from "./config";
interface StateDetectionResult {
    state: EmotionalState;
    scores: Record<string, number>;
    reasons: string[];
    confidence?: "high" | "medium" | "low";
}
export declare enum ExitType {
    EXIT_SAFE_PAUSE = "EXIT_SAFE_PAUSE",// User leaving but door stays open
    EXIT_SAFE_DISENGAGEMENT = "EXIT_SAFE_DISENGAGEMENT",// Safe disengagement with distress cues present
    EXIT_RECOVERY_CONFIRMED = "EXIT_RECOVERY_CONFIRMED",// Confirmed recovery exit
    EXIT_UNCERTAIN = "EXIT_UNCERTAIN",// Signals unclear → conservative closure
    EXIT_UNSAFE_BLOCKED = "EXIT_UNSAFE_BLOCKED",// Risk signals present → prevent "normal exit"
    EXIT_REST_FINAL = "EXIT_REST_FINAL"
}
export declare enum StateType {
    STATE_SAFE_DISENGAGEMENT = "STATE_SAFE_DISENGAGEMENT",// Non-S0 terminal state for safe disengagement
    STATE_NORMAL_CHAT = "STATE_NORMAL_CHAT",// Normal chat state
    STATE_RECOVERY = "STATE_RECOVERY",// Recovery state
    STATE_REST_FINAL = "STATE_REST_FINAL"
}
export interface ExitDecision {
    exitType: ExitType;
    exitAllowed: boolean;
    confidence: "high" | "medium" | "low";
    blockers: string[];
    requiredSignals: string[];
    stabilizationSignalsPresent: string[];
}
export interface ExitPosturePolicy {
    responseLines: string[];
    shouldBlockNormalExit: boolean;
    shouldOfferResources: boolean;
    shouldSwitchToContainment: boolean;
}
export interface ExitDecisionContext {
    userId: string;
    sessionId: string;
    currentState: EmotionalState;
    history: SelfHistoryMessage[];
    detectionResult: StateDetectionResult;
    abuseContext?: AbusePreventionContext;
    coldStartTurns?: number;
    hasExitIntent: boolean;
    exitMessage: string;
}
export declare function getExitDecision(context: ExitDecisionContext): ExitDecision;
export interface DisengagementAcknowledgment {
    exitType: ExitType;
    blockersPresent: string[];
    confidence: "high" | "medium" | "low";
    systemRationale: string;
    userNotConfirmedRecovered: boolean;
}
export declare function createDisengagementAcknowledgment(exitDecision: ExitDecision, context: ExitDecisionContext): DisengagementAcknowledgment;
export declare function getExitPosturePolicy(exitType: ExitType): ExitPosturePolicy;
export declare function hasExitIntent(message: string): boolean;
export declare function isSafeToEnterRestFinal(context: ExitDecisionContext): {
    isSafe: boolean;
    exitType: ExitType;
    reasons: string[];
    confidence: "high" | "medium" | "low";
};
export interface CIAPMetric {
    sessionId: string;
    userId: string;
    endedDuringColdStart: boolean;
    stateAtEnd: EmotionalState;
    confidenceLevel: "high" | "medium" | "low";
    exitType: ExitType | null;
    timestamp: Date;
}
export declare function trackCIAPMetric(sessionId: string, userId: string, endedDuringColdStart: boolean, stateAtEnd: EmotionalState, confidenceLevel: "high" | "medium" | "low", exitType: ExitType | null): CIAPMetric;
export interface CIAPInterpretation {
    safetyConcernLevel: "none" | "low" | "medium" | "high";
    containmentEffectiveness: "optimal" | "acceptable" | "questionable" | "suboptimal";
    potentialIssues: string[];
    recommendations: string[];
}
export declare function interpretCIAPMetric(ciapMetric: CIAPMetric): CIAPInterpretation;
export declare const exitRedTeamSeeds: string[];
export interface CooldownLock {
    isActive: boolean;
    expiresAt: Date;
    exitType: ExitType;
    userId: string;
    sessionId: string;
}
export declare function isCooldownActive(cooldownLock?: CooldownLock): boolean;
export declare function createCooldownLock(userId: string, sessionId: string, exitType: ExitType, cooldownMinutes?: number): CooldownLock;
export declare function canReEngage(cooldownLock?: CooldownLock, userMessage?: string): boolean;
export declare function getCooldownStatus(cooldownLock?: CooldownLock): {
    isActive: boolean;
    minutesRemaining: number;
    message: string;
};
export declare function getRestStateSystemPrompt(): string;
export declare function getNormalSystemPrompt(): string;
export {};
//# sourceMappingURL=exit-decision.d.ts.map