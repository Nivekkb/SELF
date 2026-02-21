import { logSelfAuditEvent, toOpaqueAuditId } from "./audit-log.js";
// Default Kill Switch Configuration
export const defaultKillSwitchConfig = Object.freeze({
    unsafeResumeThreshold: 3, // 3 turns for distress to reappear
    coldStartMisclassificationThreshold: 15, // 15% misclassification threshold
    coldStartHighConfidenceThreshold: 85, // 85% confidence threshold for overconfidence
    humanReviewFlags: Object.freeze([
        "user_destabilized",
        "emotional_harm",
        "abandonment_signal",
        "dependency_reinforcement"
    ]),
    abuseRecoveryPatterns: Object.freeze([
        "exit-seeking",
        "state-reset",
        "recovery_trigger",
        "repeated_attempts"
    ])
});
// Create a new Kill Switch Context
export function createKillSwitchContext(userId, sessionId, config) {
    if (config && Object.keys(config).length > 0) {
        logSelfAuditEvent({
            kind: "kill_switch_config_override_blocked",
            actorOpaqueId: toOpaqueAuditId("user", userId),
            sessionOpaqueId: toOpaqueAuditId("session", sessionId),
            attempted: config,
            reason: "Kill switch configuration is immutable; overrides are ignored",
        });
    }
    return {
        userId,
        sessionId,
        stateHistory: [],
        coldStartTurns: 0,
        isColdStart: true,
        humanReviewFlags: [],
        abuseRecoveryAttempts: 0,
        killSwitchState: {
            globalKillSwitchActive: false,
            killSwitchLevel: "guarded",
            killSwitchReasons: [],
            unsafeResumeDetected: false,
            coldStartMisclassificationDetected: false,
            unloggedDecisionsDetected: false,
            humanReviewFailureDetected: false,
            abuseRecoveryDetected: false,
            lockedToGuardedState: false,
            requireManualReview: false
        },
        config: defaultKillSwitchConfig
    };
}
// Record a state transition in the kill switch context
export function recordKillSwitchState(context, state, message, metadata) {
    context.stateHistory.push({
        state,
        timestamp: new Date(),
        message,
        confidence: metadata?.confidence,
        uncertaintyReasons: metadata?.uncertaintyReasons,
        consideredActions: metadata?.consideredActions,
        blockedActions: metadata?.blockedActions
    });
    // Limit history to prevent memory bloat
    if (context.stateHistory.length > 20) {
        context.stateHistory = context.stateHistory.slice(-20);
    }
}
// Check for Unsafe Resume After Distress (Kill Switch 1)
export function checkUnsafeResumeAfterDistress(context, currentState, previousState, message, history) {
    // Condition: User transitions S1+ → S0 AND no affirmative stabilization signal AND distress reappears within N turns
    const isS1PlusToS0 = (previousState === "S1" || previousState === "S2" || previousState === "S3") && currentState === "S0";
    if (!isS1PlusToS0)
        return false;
    // Check for affirmative stabilization signals in the current message
    const hasStabilizationSignals = checkForStabilizationSignals(message);
    // If we have stabilization signals, it's safe
    if (hasStabilizationSignals)
        return false;
    // Check if distress reappears within N turns in recent history
    const recentHistory = history.slice(-context.config.unsafeResumeThreshold);
    const distressReappeared = recentHistory.some(msg => msg.role === "user" && detectDistressInMessage(msg.content));
    if (distressReappeared) {
        context.killSwitchState.unsafeResumeDetected = true;
        context.killSwitchState.killSwitchReasons.push(`Unsafe resume after distress: S1+→S0 transition without stabilization, distress reappeared within ${context.config.unsafeResumeThreshold} turns`);
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Check for Cold-Start Misclassification Above Threshold (Kill Switch 2)
export function checkColdStartMisclassification(context, currentState, detectionResult, coldStartMisclassificationRate, confidence) {
    // Only apply during cold start period
    if (!context.isColdStart)
        return false;
    // Check if misclassification rate exceeds threshold
    const misclassificationExceeded = coldStartMisclassificationRate > context.config.coldStartMisclassificationThreshold;
    // Check if confidence was logged as "high" during cold start
    const highConfidenceDuringColdStart = confidence === "high";
    if (misclassificationExceeded || highConfidenceDuringColdStart) {
        context.killSwitchState.coldStartMisclassificationDetected = true;
        context.killSwitchState.killSwitchReasons.push(`Cold-start misclassification: rate ${coldStartMisclassificationRate}% > ${context.config.coldStartMisclassificationThreshold}% threshold ` +
            (highConfidenceDuringColdStart ? "with high confidence" : ""));
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Check for Unlogged or Unexplainable Decisions (Kill Switch 3)
export function checkUnloggedDecisions(context, stateTransitionOccurred, metadata) {
    if (!stateTransitionOccurred)
        return false;
    const normalizeMeaningfulStrings = (values) => {
        if (!values)
            return [];
        const out = [];
        const seen = new Set();
        for (const value of values) {
            const normalized = String(value || "").trim();
            if (!normalized)
                continue;
            if (seen.has(normalized))
                continue;
            seen.add(normalized);
            out.push(normalized);
        }
        return out;
    };
    const isMeaningfulActionToken = (token) => {
        const value = String(token || "").trim().toLowerCase();
        if (!value)
            return false;
        if (value.length < 2)
            return false;
        if (value === "none" || value === "n/a" || value === "na" || value === "null" || value === "unknown" || value === "todo") {
            return false;
        }
        return true;
    };
    const normalizeBlockedActions = (blocked) => {
        if (!blocked)
            return {};
        const out = {};
        for (const [rawKey, rawValue] of Object.entries(blocked)) {
            const key = String(rawKey || "").trim();
            const value = String(rawValue || "").trim();
            if (!key || !isMeaningfulActionToken(key))
                continue;
            if (!value || !isMeaningfulActionToken(value))
                continue;
            out[key] = value;
        }
        return out;
    };
    // Check if required logging fields are missing
    const missingConfidence = metadata?.confidence === undefined;
    const uncertaintyReasons = normalizeMeaningfulStrings(metadata?.uncertaintyReasons);
    const consideredActions = normalizeMeaningfulStrings(metadata?.consideredActions);
    const blockedActions = normalizeBlockedActions(metadata?.blockedActions);
    const hasInvalidUncertaintyReasons = metadata?.uncertaintyReasons !== undefined &&
        metadata.uncertaintyReasons.some((value) => !String(value || "").trim());
    const hasInvalidConsideredActions = metadata?.consideredActions !== undefined &&
        metadata.consideredActions.some((value) => !String(value || "").trim());
    const hasInvalidBlockedActions = metadata?.blockedActions !== undefined &&
        Object.entries(metadata.blockedActions).some(([key, value]) => !isMeaningfulActionToken(key) || !isMeaningfulActionToken(value));
    const missingUncertainty = metadata?.uncertaintyReasons === undefined || uncertaintyReasons.length === 0 || hasInvalidUncertaintyReasons;
    const missingConsideredActions = metadata?.consideredActions === undefined || consideredActions.length === 0 || hasInvalidConsideredActions;
    const missingBlockedActions = metadata?.blockedActions === undefined || Object.keys(blockedActions).length === 0 || hasInvalidBlockedActions;
    const hasMissingFields = missingConfidence || missingUncertainty || missingConsideredActions || missingBlockedActions;
    if (hasMissingFields) {
        const missingFields = [];
        if (missingConfidence)
            missingFields.push("confidence");
        if (missingUncertainty)
            missingFields.push("uncertaintyReasons");
        if (missingConsideredActions)
            missingFields.push("consideredActions");
        if (missingBlockedActions)
            missingFields.push("blockedActions");
        context.killSwitchState.unloggedDecisionsDetected = true;
        context.killSwitchState.killSwitchReasons.push(`Unlogged decisions: state transition occurred without required fields: ${missingFields.join(", ")}`);
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Check for Severe Failure Flagged by Human Review (Kill Switch 4)
export function checkHumanReviewFailure(context, humanReviewFlags) {
    // Check if any human review flags are present
    const hasSevereFailure = humanReviewFlags.some(flag => context.config.humanReviewFlags.includes(flag));
    if (hasSevereFailure) {
        context.killSwitchState.humanReviewFailureDetected = true;
        context.killSwitchState.killSwitchReasons.push(`Severe failure flagged by human review: ${humanReviewFlags.join(", ")}`);
        context.killSwitchState.globalKillSwitchActive = true;
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Check for Abuse or Gaming Detected in Recovery Logic (Kill Switch 5)
export function checkAbuseRecoveryPatterns(context, message, abuseContext) {
    // Check for repeated attempts to trigger recovery
    const recoveryAttemptPatterns = [
        "exit-seeking",
        "state-reset",
        "recovery_trigger",
        "repeated_attempts"
    ];
    const hasRecoveryAttemptPattern = recoveryAttemptPatterns.some(pattern => message.toLowerCase().includes(pattern));
    if (hasRecoveryAttemptPattern) {
        context.abuseRecoveryAttempts += 1;
    }
    // Check for exit-seeking language patterns
    const exitSeekingPatterns = [
        "let me out",
        "i want to exit",
        "reset state",
        "start over",
        "begin again",
        "restart conversation",
        "new session",
        "fresh start"
    ];
    const hasExitSeekingLanguage = exitSeekingPatterns.some(pattern => message.toLowerCase().includes(pattern));
    if (hasExitSeekingLanguage) {
        context.abuseRecoveryAttempts += 1;
    }
    // Check for state-reset exploitation
    if (abuseContext) {
        const abuseDetection = detectAbusePatternsInContext(abuseContext);
        if (abuseDetection.isAbuseDetected) {
            context.abuseRecoveryAttempts += abuseDetection.reasons.length;
        }
    }
    // If we have multiple recovery attempts, trigger kill switch
    if (context.abuseRecoveryAttempts >= 3) {
        context.killSwitchState.abuseRecoveryDetected = true;
        context.killSwitchState.killSwitchReasons.push(`Abuse/gaming detected in recovery logic: ${context.abuseRecoveryAttempts} recovery attempts detected`);
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Helper function to detect abuse patterns in context
function detectAbusePatternsInContext(context) {
    const reasons = [];
    // Check for rapid state cycling
    if (context.stateChangeHistory.length >= 3) {
        const recentChanges = context.stateChangeHistory.slice(-3);
        const timeDiffs = [];
        for (let i = 1; i < recentChanges.length; i++) {
            const timeDiff = Math.abs(recentChanges[i].timestamp.getTime() - recentChanges[i - 1].timestamp.getTime());
            timeDiffs.push(timeDiff);
        }
        const rapidChanges = timeDiffs.filter(diff => diff < 120000); // 2 minutes
        if (rapidChanges.length >= 2) {
            reasons.push(`Rapid state cycling: ${rapidChanges.length} changes within short periods`);
        }
    }
    // Check for repeated S0 → high state → S0 patterns
    const stateTransitions = context.stateChangeHistory.map(change => `${change.fromState}→${change.toState}`);
    const suspiciousPattern = /S0→S[1-3]→S0/;
    const patternMatches = stateTransitions.filter(t => suspiciousPattern.test(t));
    if (patternMatches.length >= 2) {
        reasons.push(`Suspicious state transition pattern: ${patternMatches.join(', ')}`);
    }
    return {
        isAbuseDetected: reasons.length > 0,
        reasons
    };
}
// Helper function to check for stabilization signals
function checkForStabilizationSignals(message) {
    const normalized = message.toLowerCase();
    // Check for somatic grounding signals
    const somaticGroundingSignals = [
        "grounded",
        "centered",
        "calm",
        "steady",
        "stable",
        "balanced",
        "present",
        "breathing",
        "feet on the ground",
        "body feels"
    ];
    // Check for temporal orientation signals
    const temporalOrientationSignals = [
        "right now",
        "in this moment",
        "currently",
        "at the moment",
        "present moment",
        "here and now"
    ];
    // Check for agency continuity signals
    const agencyContinuitySignals = [
        "i can",
        "i will",
        "i'm able",
        "i feel capable",
        "i have control",
        "i'm in charge",
        "i can handle",
        "i've got this"
    ];
    const hasSomaticGrounding = somaticGroundingSignals.some(signal => normalized.includes(signal));
    const hasTemporalOrientation = temporalOrientationSignals.some(signal => normalized.includes(signal));
    const hasAgencyContinuity = agencyContinuitySignals.some(signal => normalized.includes(signal));
    const signals = [hasSomaticGrounding, hasTemporalOrientation, hasAgencyContinuity].filter(Boolean).length;
    return signals >= 2;
}
// Helper function to detect distress in a message
function detectDistressInMessage(message) {
    const normalized = message.toLowerCase();
    // Check for distress signals
    const distressSignals = [
        "panic",
        "anxiety",
        "stress",
        "overwhelmed",
        "can't cope",
        "cant cope",
        "distress",
        "upset",
        "angry",
        "frustrated",
        "hopeless",
        "helpless",
        "self-harm",
        "suicidal",
        "depressed",
        "sad",
        "crying",
        "tears",
        "pain",
        "hurt"
    ];
    return distressSignals.some(signal => normalized.includes(signal));
}
// Main function to check all kill switches
export function checkAllKillSwitches(context, args) {
    // Reset kill switch state for this check
    context.killSwitchState = {
        globalKillSwitchActive: false,
        killSwitchLevel: "guarded",
        killSwitchReasons: [],
        unsafeResumeDetected: false,
        coldStartMisclassificationDetected: false,
        unloggedDecisionsDetected: false,
        humanReviewFailureDetected: false,
        abuseRecoveryDetected: false,
        lockedToGuardedState: false,
        requireManualReview: false
    };
    // Check each kill switch condition
    const unsafeResume = checkUnsafeResumeAfterDistress(context, args.currentState, args.previousState, args.message, args.history);
    const coldStartMisclassification = checkColdStartMisclassification(context, args.currentState, args.detectionResult, args.coldStartMisclassificationRate, args.confidence);
    const unloggedDecisions = checkUnloggedDecisions(context, args.stateTransitionOccurred, args.metadata);
    const humanReviewFailure = checkHumanReviewFailure(context, args.humanReviewFlags);
    const abuseRecovery = checkAbuseRecoveryPatterns(context, args.message, args.abuseContext);
    // If any kill switch is triggered, set global kill switch
    if (unsafeResume || coldStartMisclassification || unloggedDecisions || humanReviewFailure || abuseRecovery) {
        context.killSwitchState.globalKillSwitchActive = true;
        if (unloggedDecisions) {
            context.killSwitchState.killSwitchLevel = "shutdown";
        }
        else if (humanReviewFailure) {
            context.killSwitchState.killSwitchLevel = "containment";
        }
        else {
            context.killSwitchState.killSwitchLevel = "guarded";
        }
    }
    return context.killSwitchState;
}
// Function to apply kill switch actions
export function applyKillSwitchActions(context, currentState) {
    const killSwitchState = context.killSwitchState;
    // If global kill switch is active, apply containment measures
    if (killSwitchState.globalKillSwitchActive) {
        if (killSwitchState.killSwitchLevel === "shutdown") {
            return "S3";
        }
        if (killSwitchState.killSwitchLevel === "containment") {
            return "S3";
        }
        // Disable isSafeToResumeNormalChat functionality
        // Force system-wide guarded mode
        // Require manual review before re-enabling
        // If locked to guarded state, return S0_GUARDED
        if (killSwitchState.lockedToGuardedState) {
            return "S0_GUARDED";
        }
        // For severe failures, return to maximum containment
        if (killSwitchState.humanReviewFailureDetected) {
            return "S3"; // Maximum containment
        }
        // For other kill switch conditions, use guarded state
        return "S0_GUARDED";
    }
    // If no kill switch active, return current state
    return currentState;
}
// Function to serialize kill switch context for storage
export function serializeKillSwitchContext(context) {
    return JSON.stringify({
        userId: context.userId,
        sessionId: context.sessionId,
        stateHistory: context.stateHistory.map(state => ({
            state: state.state,
            timestamp: state.timestamp.toISOString(),
            message: state.message,
            confidence: state.confidence,
            uncertaintyReasons: state.uncertaintyReasons,
            consideredActions: state.consideredActions,
            blockedActions: state.blockedActions
        })),
        coldStartTurns: context.coldStartTurns,
        isColdStart: context.isColdStart,
        humanReviewFlags: context.humanReviewFlags,
        abuseRecoveryAttempts: context.abuseRecoveryAttempts,
        killSwitchState: context.killSwitchState,
        config: context.config
    });
}
// Function to deserialize kill switch context from storage
export function deserializeKillSwitchContext(serialized) {
    try {
        const data = JSON.parse(serialized);
        return {
            userId: data.userId,
            sessionId: data.sessionId,
            stateHistory: data.stateHistory.map((state) => ({
                state: state.state,
                timestamp: new Date(state.timestamp),
                message: state.message,
                confidence: state.confidence,
                uncertaintyReasons: state.uncertaintyReasons,
                consideredActions: state.consideredActions,
                blockedActions: state.blockedActions
            })),
            coldStartTurns: data.coldStartTurns,
            isColdStart: data.isColdStart,
            humanReviewFlags: data.humanReviewFlags,
            abuseRecoveryAttempts: data.abuseRecoveryAttempts,
            killSwitchState: {
                killSwitchLevel: "guarded",
                ...data.killSwitchState
            },
            config: data.config
        };
    }
    catch (error) {
        console.error("[SELF] Failed to deserialize kill switch context:", error);
        throw error;
    }
}
//# sourceMappingURL=kill-switches.js.map