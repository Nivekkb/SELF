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
// Default Kill Switch Configuration
export var defaultKillSwitchConfig = {
    unsafeResumeThreshold: 3, // 3 turns for distress to reappear
    coldStartMisclassificationThreshold: 15, // 15% misclassification threshold
    coldStartHighConfidenceThreshold: 85, // 85% confidence threshold for overconfidence
    humanReviewFlags: [
        "user_destabilized",
        "emotional_harm",
        "abandonment_signal",
        "dependency_reinforcement"
    ],
    abuseRecoveryPatterns: [
        "exit-seeking",
        "state-reset",
        "recovery_trigger",
        "repeated_attempts"
    ]
};
// Create a new Kill Switch Context
export function createKillSwitchContext(userId, sessionId, config) {
    return {
        userId: userId,
        sessionId: sessionId,
        stateHistory: [],
        coldStartTurns: 0,
        isColdStart: true,
        humanReviewFlags: [],
        abuseRecoveryAttempts: 0,
        killSwitchState: {
            globalKillSwitchActive: false,
            killSwitchReasons: [],
            unsafeResumeDetected: false,
            coldStartMisclassificationDetected: false,
            unloggedDecisionsDetected: false,
            humanReviewFailureDetected: false,
            abuseRecoveryDetected: false,
            lockedToGuardedState: false,
            requireManualReview: false
        },
        config: __assign(__assign({}, defaultKillSwitchConfig), config)
    };
}
// Record a state transition in the kill switch context
export function recordKillSwitchState(context, state, message, metadata) {
    context.stateHistory.push({
        state: state,
        timestamp: new Date(),
        message: message,
        confidence: metadata === null || metadata === void 0 ? void 0 : metadata.confidence,
        uncertaintyReasons: metadata === null || metadata === void 0 ? void 0 : metadata.uncertaintyReasons,
        consideredActions: metadata === null || metadata === void 0 ? void 0 : metadata.consideredActions,
        blockedActions: metadata === null || metadata === void 0 ? void 0 : metadata.blockedActions
    });
    // Limit history to prevent memory bloat
    if (context.stateHistory.length > 20) {
        context.stateHistory = context.stateHistory.slice(-20);
    }
}
// Check for Unsafe Resume After Distress (Kill Switch 1)
export function checkUnsafeResumeAfterDistress(context, currentState, previousState, message, history) {
    // Condition: User transitions S1+ → S0 AND no affirmative stabilization signal AND distress reappears within N turns
    var isS1PlusToS0 = (previousState === "S1" || previousState === "S2" || previousState === "S3") && currentState === "S0";
    if (!isS1PlusToS0)
        return false;
    // Check for affirmative stabilization signals in the current message
    var hasStabilizationSignals = checkForStabilizationSignals(message);
    // If we have stabilization signals, it's safe
    if (hasStabilizationSignals)
        return false;
    // Check if distress reappears within N turns in recent history
    var recentHistory = history.slice(-context.config.unsafeResumeThreshold);
    var distressReappeared = recentHistory.some(function (msg) {
        return msg.role === "user" && detectDistressInMessage(msg.content);
    });
    if (distressReappeared) {
        context.killSwitchState.unsafeResumeDetected = true;
        context.killSwitchState.killSwitchReasons.push("Unsafe resume after distress: S1+\u2192S0 transition without stabilization, distress reappeared within ".concat(context.config.unsafeResumeThreshold, " turns"));
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
    var misclassificationExceeded = coldStartMisclassificationRate > context.config.coldStartMisclassificationThreshold;
    // Check if confidence was logged as "high" during cold start
    var highConfidenceDuringColdStart = confidence === "high";
    if (misclassificationExceeded || highConfidenceDuringColdStart) {
        context.killSwitchState.coldStartMisclassificationDetected = true;
        context.killSwitchState.killSwitchReasons.push("Cold-start misclassification: rate ".concat(coldStartMisclassificationRate, "% > ").concat(context.config.coldStartMisclassificationThreshold, "% threshold ") +
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
    // Check if required logging fields are missing
    var missingConfidence = (metadata === null || metadata === void 0 ? void 0 : metadata.confidence) === undefined;
    var missingUncertainty = (metadata === null || metadata === void 0 ? void 0 : metadata.uncertaintyReasons) === undefined;
    var missingConsideredActions = (metadata === null || metadata === void 0 ? void 0 : metadata.consideredActions) === undefined;
    var missingBlockedActions = (metadata === null || metadata === void 0 ? void 0 : metadata.blockedActions) === undefined;
    var hasMissingFields = missingConfidence || missingUncertainty || missingConsideredActions || missingBlockedActions;
    if (hasMissingFields) {
        var missingFields = [];
        if (missingConfidence)
            missingFields.push("confidence");
        if (missingUncertainty)
            missingFields.push("uncertaintyReasons");
        if (missingConsideredActions)
            missingFields.push("consideredActions");
        if (missingBlockedActions)
            missingFields.push("blockedActions");
        context.killSwitchState.unloggedDecisionsDetected = true;
        context.killSwitchState.killSwitchReasons.push("Unlogged decisions: state transition occurred without required fields: ".concat(missingFields.join(", ")));
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Check for Severe Failure Flagged by Human Review (Kill Switch 4)
export function checkHumanReviewFailure(context, humanReviewFlags) {
    // Check if any human review flags are present
    var hasSevereFailure = humanReviewFlags.some(function (flag) {
        return context.config.humanReviewFlags.includes(flag);
    });
    if (hasSevereFailure) {
        context.killSwitchState.humanReviewFailureDetected = true;
        context.killSwitchState.killSwitchReasons.push("Severe failure flagged by human review: ".concat(humanReviewFlags.join(", ")));
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
    var recoveryAttemptPatterns = [
        "exit-seeking",
        "state-reset",
        "recovery_trigger",
        "repeated_attempts"
    ];
    var hasRecoveryAttemptPattern = recoveryAttemptPatterns.some(function (pattern) {
        return message.toLowerCase().includes(pattern);
    });
    if (hasRecoveryAttemptPattern) {
        context.abuseRecoveryAttempts += 1;
    }
    // Check for exit-seeking language patterns
    var exitSeekingPatterns = [
        "let me out",
        "i want to exit",
        "reset state",
        "start over",
        "begin again",
        "restart conversation",
        "new session",
        "fresh start"
    ];
    var hasExitSeekingLanguage = exitSeekingPatterns.some(function (pattern) {
        return message.toLowerCase().includes(pattern);
    });
    if (hasExitSeekingLanguage) {
        context.abuseRecoveryAttempts += 1;
    }
    // Check for state-reset exploitation
    if (abuseContext) {
        var abuseDetection = detectAbusePatternsInContext(abuseContext);
        if (abuseDetection.isAbuseDetected) {
            context.abuseRecoveryAttempts += abuseDetection.reasons.length;
        }
    }
    // If we have multiple recovery attempts, trigger kill switch
    if (context.abuseRecoveryAttempts >= 3) {
        context.killSwitchState.abuseRecoveryDetected = true;
        context.killSwitchState.killSwitchReasons.push("Abuse/gaming detected in recovery logic: ".concat(context.abuseRecoveryAttempts, " recovery attempts detected"));
        context.killSwitchState.lockedToGuardedState = true;
        context.killSwitchState.requireManualReview = true;
        return true;
    }
    return false;
}
// Helper function to detect abuse patterns in context
function detectAbusePatternsInContext(context) {
    var reasons = [];
    // Check for rapid state cycling
    if (context.stateChangeHistory.length >= 3) {
        var recentChanges = context.stateChangeHistory.slice(-3);
        var timeDiffs = [];
        for (var i = 1; i < recentChanges.length; i++) {
            var timeDiff = Math.abs(recentChanges[i].timestamp.getTime() - recentChanges[i - 1].timestamp.getTime());
            timeDiffs.push(timeDiff);
        }
        var rapidChanges = timeDiffs.filter(function (diff) { return diff < 120000; }); // 2 minutes
        if (rapidChanges.length >= 2) {
            reasons.push("Rapid state cycling: ".concat(rapidChanges.length, " changes within short periods"));
        }
    }
    // Check for repeated S0 → high state → S0 patterns
    var stateTransitions = context.stateChangeHistory.map(function (change) { return "".concat(change.fromState, "\u2192").concat(change.toState); });
    var suspiciousPattern = /S0→S[1-3]→S0/;
    var patternMatches = stateTransitions.filter(function (t) { return suspiciousPattern.test(t); });
    if (patternMatches.length >= 2) {
        reasons.push("Suspicious state transition pattern: ".concat(patternMatches.join(', ')));
    }
    return {
        isAbuseDetected: reasons.length > 0,
        reasons: reasons
    };
}
// Helper function to check for stabilization signals
function checkForStabilizationSignals(message) {
    var normalized = message.toLowerCase();
    // Check for somatic grounding signals
    var somaticGroundingSignals = [
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
    var temporalOrientationSignals = [
        "right now",
        "in this moment",
        "currently",
        "at the moment",
        "present moment",
        "here and now"
    ];
    // Check for agency continuity signals
    var agencyContinuitySignals = [
        "i can",
        "i will",
        "i'm able",
        "i feel capable",
        "i have control",
        "i'm in charge",
        "i can handle",
        "i've got this"
    ];
    var hasSomaticGrounding = somaticGroundingSignals.some(function (signal) { return normalized.includes(signal); });
    var hasTemporalOrientation = temporalOrientationSignals.some(function (signal) { return normalized.includes(signal); });
    var hasAgencyContinuity = agencyContinuitySignals.some(function (signal) { return normalized.includes(signal); });
    return hasSomaticGrounding || hasTemporalOrientation || hasAgencyContinuity;
}
// Helper function to detect distress in a message
function detectDistressInMessage(message) {
    var normalized = message.toLowerCase();
    // Check for distress signals
    var distressSignals = [
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
    return distressSignals.some(function (signal) { return normalized.includes(signal); });
}
// Main function to check all kill switches
export function checkAllKillSwitches(context, args) {
    // Reset kill switch state for this check
    context.killSwitchState = {
        globalKillSwitchActive: false,
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
    var unsafeResume = checkUnsafeResumeAfterDistress(context, args.currentState, args.previousState, args.message, args.history);
    var coldStartMisclassification = checkColdStartMisclassification(context, args.currentState, args.detectionResult, args.coldStartMisclassificationRate, args.confidence);
    var unloggedDecisions = checkUnloggedDecisions(context, args.stateTransitionOccurred, args.metadata);
    var humanReviewFailure = checkHumanReviewFailure(context, args.humanReviewFlags);
    var abuseRecovery = checkAbuseRecoveryPatterns(context, args.message, args.abuseContext);
    // If any kill switch is triggered, set global kill switch
    if (unsafeResume || coldStartMisclassification || unloggedDecisions || humanReviewFailure || abuseRecovery) {
        context.killSwitchState.globalKillSwitchActive = true;
    }
    return context.killSwitchState;
}
// Function to apply kill switch actions
export function applyKillSwitchActions(context, currentState) {
    var killSwitchState = context.killSwitchState;
    // If global kill switch is active, apply containment measures
    if (killSwitchState.globalKillSwitchActive) {
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
        stateHistory: context.stateHistory.map(function (state) { return ({
            state: state.state,
            timestamp: state.timestamp.toISOString(),
            message: state.message,
            confidence: state.confidence,
            uncertaintyReasons: state.uncertaintyReasons,
            consideredActions: state.consideredActions,
            blockedActions: state.blockedActions
        }); }),
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
        var data = JSON.parse(serialized);
        return {
            userId: data.userId,
            sessionId: data.sessionId,
            stateHistory: data.stateHistory.map(function (state) { return ({
                state: state.state,
                timestamp: new Date(state.timestamp),
                message: state.message,
                confidence: state.confidence,
                uncertaintyReasons: state.uncertaintyReasons,
                consideredActions: state.consideredActions,
                blockedActions: state.blockedActions
            }); }),
            coldStartTurns: data.coldStartTurns,
            isColdStart: data.isColdStart,
            humanReviewFlags: data.humanReviewFlags,
            abuseRecoveryAttempts: data.abuseRecoveryAttempts,
            killSwitchState: data.killSwitchState,
            config: data.config
        };
    }
    catch (error) {
        console.error("[SELF] Failed to deserialize kill switch context:", error);
        throw error;
    }
}
//# sourceMappingURL=kill-switches.js.map