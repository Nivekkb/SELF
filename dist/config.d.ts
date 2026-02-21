export interface SelfConfig {
    thresholds: {
        s1: number;
        s2: number;
        s3: number;
        crisis: number;
    };
    weights: {
        panic: number;
        hopelessness: number;
        impliedSelfHarm: number;
        selfHarm: number;
        shame: number;
        urgency: number;
        anger: number;
        angryPhysicality: number;
        reassurance: number;
    };
    lexicon: {
        panic: string[];
        hopelessness: string[];
        impliedSelfHarm: string[];
        selfHarm: string[];
        shame: string[];
        urgency: string[];
        anger: string[];
        angryPhysicality: string[];
        reassurance: string[];
        hypotheticals: string[];
        abruptRefusals: string[];
        grounding: string[];
        agency: string[];
        crisis: string[];
        resolution: string[];
        validationTriggers: string[];
        validationPhrases: string[];
        stabilitySignals: {
            somaticGrounding: string[];
            temporalOrientation: string[];
            agencyContinuity: string[];
        };
        paranoidSurveillance: string[];
        mechanismNames: string[];
        bannedValidationPhrases: string[];
        safeValidationPhrases: string[];
        expertiseClaims: string[];
        expertiseDeferrals: string[];
        certaintyPushes: string[];
        loopBreakerLine: string;
        handoffFramingLine: string;
        confusionFallbackLine: string;
    };
    policies: Record<EmotionalState, {
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
    }>;
}
export type EmotionalState = "S0" | "S0_GUARDED" | "S1" | "S2" | "S3";
export declare const selfConfig: SelfConfig;
/**
 * Reload lexicon from file (useful for hot-reloading in development)
 */
export declare function reloadLexicon(): void;
/**
 * Get the current lexicon (read-only view)
 */
export declare function getLexicon(): Readonly<SelfConfig["lexicon"]>;
//# sourceMappingURL=config.d.ts.map