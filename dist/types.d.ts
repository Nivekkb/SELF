export type SelfHistoryMessage = {
    role: string;
    content: string;
};
export interface StateDetectionResult {
    state: any;
    scores: Record<string, number>;
    reasons: string[];
    confidence?: "high" | "medium" | "low";
}
export interface AbusePreventionContext {
    userId: string;
    sessionId: string;
    conversationStartTime: Date;
    previousState?: any;
    stateChangeHistory: Array<{
        fromState: any;
        toState: any;
        timestamp: Date;
        reason: string;
    }>;
    abuseWarnings: number;
    lastStateChangeTime?: Date;
    coldStartTurns?: number;
    isColdStart?: boolean;
}
//# sourceMappingURL=types.d.ts.map