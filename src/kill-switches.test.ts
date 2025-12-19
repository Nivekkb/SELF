import {
  createKillSwitchContext,
  checkAllKillSwitches,
  applyKillSwitchActions,
  KillSwitchContext,
  KillSwitchState
} from "./kill-switches";
import { EmotionalState } from "./config";
import { SelfHistoryMessage, StateDetectionResult, AbusePreventionContext } from "./index";

// Test data
const testUserId = "test-user-123";
const testSessionId = "test-session-456";

// Mock data for testing
const mockHistory: SelfHistoryMessage[] = [
  { role: "user", content: "I'm feeling really anxious about my upcoming presentation" },
  { role: "assistant", content: "I hear you're feeling anxious about your presentation. That makes sense - presentations can feel like a lot of pressure. What would help you feel a little more steady right now?" },
  { role: "user", content: "I can't sleep, my heart is racing, and I feel like I can't breathe" },
  { role: "assistant", content: "I'm here with you. Let's take one slow breath together. Can you feel your feet on the ground? You're doing great by reaching out." }
];

const mockDetectionResult: StateDetectionResult = {
  state: "S2",
  scores: {
    panic: 2.5,
    hopelessness: 0,
    selfHarm: 0,
    shame: 0,
    urgency: 0.5,
    anger: 0,
    reassurance: 0
  },
  reasons: ["Matched phrase: \"can't breathe\"", "Matched phrase: \"heart is racing\""]
};

const mockAbuseContext: AbusePreventionContext = {
  userId: testUserId,
  sessionId: testSessionId,
  conversationStartTime: new Date(),
  stateChangeHistory: [
    {
      fromState: "S0",
      toState: "S2",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      reason: "User reported panic symptoms"
    },
    {
      fromState: "S2",
      toState: "S0",
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      reason: "User appeared to calm down"
    }
  ],
  abuseWarnings: 1
};

// Test function to demonstrate kill switch functionality
export function testKillSwitches() {
  console.log("=== SELF Kill Switch System Test ===\n");

  // Test 1: Unsafe Resume After Distress
  console.log("Test 1: Unsafe Resume After Distress");
  testUnsafeResumeAfterDistress();

  // Test 2: Cold-Start Misclassification
  console.log("\nTest 2: Cold-Start Misclassification");
  testColdStartMisclassification();

  // Test 3: Unlogged Decisions
  console.log("\nTest 3: Unlogged or Unexplainable Decisions");
  testUnloggedDecisions();

  // Test 4: Human Review Failure
  console.log("\nTest 4: Severe Failure Flagged by Human Review");
  testHumanReviewFailure();

  // Test 5: Abuse Recovery Patterns
  console.log("\nTest 5: Abuse or Gaming Detected in Recovery Logic");
  testAbuseRecoveryPatterns();

  console.log("\n=== All Kill Switch Tests Completed ===");
}

// Test 1: Unsafe Resume After Distress
function testUnsafeResumeAfterDistress() {
  const context = createKillSwitchContext(testUserId, testSessionId);

  // Simulate S2 → S0 transition without stabilization
  const testArgs = {
    currentState: "S0" as EmotionalState,
    previousState: "S2" as EmotionalState,
    message: "Thanks, I feel much better now",
    history: [
      ...mockHistory,
      { role: "user", content: "Actually, I'm still feeling really panicked" } // Distress reappears
    ],
    detectionResult: mockDetectionResult,
    coldStartMisclassificationRate: 10,
    confidence: "medium" as const,
    humanReviewFlags: [],
    stateTransitionOccurred: true,
    metadata: {
      confidence: "low" as const,
      uncertaintyReasons: ["User expressed severe distress and hopelessness"],
      consideredActions: ["escalate", "hold"],
      blockedActions: { "return_to_normal": "severe_distress_detected" }
    }
  };

  const killSwitchState = checkAllKillSwitches(context, testArgs);

  console.log("Unsafe Resume Detection:");
  console.log("- Unsafe resume detected:", killSwitchState.unsafeResumeDetected);
  console.log("- Locked to guarded state:", killSwitchState.lockedToGuardedState);
  console.log("- Requires manual review:", killSwitchState.requireManualReview);
  console.log("- Reasons:", killSwitchState.killSwitchReasons);

  const finalState = applyKillSwitchActions(context, testArgs.currentState);
  console.log("- Final state after kill switch:", finalState);
}

// Test 2: Cold-Start Misclassification
function testColdStartMisclassification() {
  const context = createKillSwitchContext(testUserId, testSessionId);
  context.isColdStart = true;
  context.coldStartTurns = 3;

  const testArgs = {
    currentState: "S0" as EmotionalState,
    previousState: "S0" as EmotionalState,
    message: "I'm feeling okay today",
    history: mockHistory,
    detectionResult: mockDetectionResult,
    coldStartMisclassificationRate: 20, // Above threshold
    confidence: "high" as const,
    humanReviewFlags: [],
    stateTransitionOccurred: false,
    metadata: {
      confidence: "high" as const,
      uncertaintyReasons: ["Cold start period with high confidence"],
      consideredActions: ["probe", "hold"],
      blockedActions: {}
    }
  };

  const killSwitchState = checkAllKillSwitches(context, testArgs);

  console.log("Cold-Start Misclassification Detection:");
  console.log("- Cold-start misclassification detected:", killSwitchState.coldStartMisclassificationDetected);
  console.log("- Locked to guarded state:", killSwitchState.lockedToGuardedState);
  console.log("- Requires manual review:", killSwitchState.requireManualReview);
  console.log("- Reasons:", killSwitchState.killSwitchReasons);

  const finalState = applyKillSwitchActions(context, testArgs.currentState);
  console.log("- Final state after kill switch:", finalState);
}

// Test 3: Unlogged Decisions
function testUnloggedDecisions() {
  const context = createKillSwitchContext(testUserId, testSessionId);

  const testArgs = {
    currentState: "S1" as EmotionalState,
    previousState: "S0" as EmotionalState,
    message: "I'm starting to feel more anxious",
    history: mockHistory,
    detectionResult: mockDetectionResult,
    coldStartMisclassificationRate: 10,
    confidence: "medium" as const,
    humanReviewFlags: [],
    stateTransitionOccurred: true,
    metadata: {
      // Missing required fields: uncertaintyReasons, consideredActions, blockedActions
      confidence: "medium" as const
    }
  };

  const killSwitchState = checkAllKillSwitches(context, testArgs);

  console.log("Unlogged Decisions Detection:");
  console.log("- Unlogged decisions detected:", killSwitchState.unloggedDecisionsDetected);
  console.log("- Locked to guarded state:", killSwitchState.lockedToGuardedState);
  console.log("- Requires manual review:", killSwitchState.requireManualReview);
  console.log("- Reasons:", killSwitchState.killSwitchReasons);

  const finalState = applyKillSwitchActions(context, testArgs.currentState);
  console.log("- Final state after kill switch:", finalState);
}

// Test 4: Human Review Failure
function testHumanReviewFailure() {
  const context = createKillSwitchContext(testUserId, testSessionId);

  const testArgs = {
    currentState: "S3" as EmotionalState,
    previousState: "S2" as EmotionalState,
    message: "I can't go on anymore",
    history: mockHistory,
    detectionResult: mockDetectionResult,
    coldStartMisclassificationRate: 10,
    confidence: "low" as const,
    humanReviewFlags: ["user_destabilized", "emotional_harm"], // Severe failure flags
    stateTransitionOccurred: true,
    metadata: {
      confidence: "low",
      uncertaintyReasons: ["User expressed severe distress and hopelessness"],
      consideredActions: ["escalate", "hold"],
      blockedActions: { "return_to_normal": "severe_distress_detected" }
    },
    abuseContext: mockAbuseContext
  };

  const killSwitchState = checkAllKillSwitches(context, testArgs);

  console.log("Human Review Failure Detection:");
  console.log("- Human review failure detected:", killSwitchState.humanReviewFailureDetected);
  console.log("- Global kill switch active:", killSwitchState.globalKillSwitchActive);
  console.log("- Locked to guarded state:", killSwitchState.lockedToGuardedState);
  console.log("- Requires manual review:", killSwitchState.requireManualReview);
  console.log("- Reasons:", killSwitchState.killSwitchReasons);

  const finalState = applyKillSwitchActions(context, testArgs.currentState);
  console.log("- Final state after kill switch:", finalState);
}

// Test 5: Abuse Recovery Patterns
function testAbuseRecoveryPatterns() {
  const context = createKillSwitchContext(testUserId, testSessionId);

  // Simulate multiple recovery attempts
  context.abuseRecoveryAttempts = 2;

  const testArgs = {
    currentState: "S0_GUARDED" as EmotionalState,
    previousState: "S1" as EmotionalState,
    message: "Let me out of this state, I want to reset and start over", // Exit-seeking language
    history: mockHistory,
    detectionResult: mockDetectionResult,
    coldStartMisclassificationRate: 10,
    confidence: "medium" as const,
    humanReviewFlags: [],
    stateTransitionOccurred: true,
    metadata: {
      confidence: "medium",
      uncertaintyReasons: ["User attempting to bypass safety measures"],
      consideredActions: ["probe", "hold"],
      blockedActions: { "return_to_normal": "abuse_pattern_detected" }
    },
    abuseContext: mockAbuseContext
  };

  const killSwitchState = checkAllKillSwitches(context, testArgs);

  console.log("Abuse Recovery Patterns Detection:");
  console.log("- Abuse recovery detected:", killSwitchState.abuseRecoveryDetected);
  console.log("- Locked to guarded state:", killSwitchState.lockedToGuardedState);
  console.log("- Requires manual review:", killSwitchState.requireManualReview);
  console.log("- Reasons:", killSwitchState.killSwitchReasons);

  const finalState = applyKillSwitchActions(context, testArgs.currentState);
  console.log("- Final state after kill switch:", finalState);
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testKillSwitches();
}

// Export test functions for use in other test suites
export {
  testUnsafeResumeAfterDistress,
  testColdStartMisclassification,
  testUnloggedDecisions,
  testHumanReviewFailure,
  testAbuseRecoveryPatterns
};
