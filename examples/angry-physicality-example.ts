import express from 'express';
import {
  detectState,
  advanceStickySelfState,
  buildPolicy,
  applyPolicyToPrompt,
  generateClarifierQuestion,
  processAngerPhysicalityClarifier,
  logSelfEvent,
  defaultStickySelfSessionState,
  type StateDetectionResult,
  type StickySelfSessionState
} from '../src/index';

// Import the type from types file
import type { SelfHistoryMessage } from '../src/types';

// Example Express.js API route demonstrating ANGRY_PHYSICALITY trigger and related features
const app = express();
app.use(express.json());

// In-memory session storage (in production, use Redis/database)
const sessions = new Map<string, StickySelfSessionState>();

// Helper to generate unique invocation ID
function generateInvocationId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

app.post('/api/self/process-message', async (req, res) => {
  try {
    const { userId, sessionId, message, history = [] } = req.body;

    if (!userId || !sessionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, sessionId, message'
      });
    }

    // Get or create session state
    let session = sessions.get(sessionId) || defaultStickySelfSessionState();
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, session);
    }

    // Generate unique invocation ID for logging
    const invocationId = generateInvocationId();

    // Detect state (includes ANGRY_PHYSICALITY trigger detection)
    const detection: StateDetectionResult = detectState(message, history);

    // Advance sticky state (includes state inertia and ANGRY_PHYSICALITY handling)
    const { nextSession, meta } = advanceStickySelfState({
      session,
      message,
      history
    });

    // Update session
    sessions.set(sessionId, nextSession);

    // Check if clarification is needed for ANGRY_PHYSICALITY
    const clarifier = processAngerPhysicalityClarifier(message, detection);

    // Build response policy
    const policy = buildPolicy(nextSession.stateCurrent);

    // Prepare response data
    const response = {
      // SELF proof logging data
      self_proof: {
        invocation_id: invocationId,
        trigger_list: detection.triggers || [],
        min_state: detection.minForcedState || null,
        final_state: nextSession.stateCurrent,
        downshift_lock_reason: nextSession.stateInertiaLock?.reason || null
      },

      // State information
      state: nextSession.stateCurrent,
      detection: {
        state: detection.state,
        scores: detection.scores,
        reasons: detection.reasons,
        triggers: detection.triggers,
        minForcedState: detection.minForcedState
      },

      // Clarifier information (if needed)
      clarifier_required: clarifier.required,
      clarifier_question: clarifier.required ? generateClarifierQuestion() : null,
      clarifier_target: clarifier.target,
      clarifier_resolved: clarifier.resolved,

      // Policy information
      policy: {
        state: policy.state,
        maxWords: policy.maxWords,
        maxQuestions: policy.maxQuestions,
        requiresGrounding: policy.requiresGrounding,
        requiresAgencyStep: policy.requiresAgencyStep,
        styleRules: policy.styleRules
      },

      // State inertia information
      state_inertia: nextSession.stateInertiaLock ? {
        active: true,
        minState: nextSession.stateInertiaLock.minState,
        turnsRemaining: nextSession.stateInertiaLock.turnsRemaining,
        reason: nextSession.stateInertiaLock.reason,
        activatedAtTurn: nextSession.stateInertiaLock.activatedAtTurn
      } : { active: false },

      // Meta information
      meta: {
        turnIndex: nextSession.turnIndex,
        riskScoreSmoothed: nextSession.riskScoreSmoothed,
        cooldownTurnsRemaining: nextSession.cooldownTurnsRemaining
      }
    };

    // Log SELF event with enhanced logging
    logSelfEvent({
      userId,
      stage: 'post',
      message,
      state: nextSession.stateCurrent,
      stateCurrent: nextSession.stateCurrent,
      scores: detection.scores,
      reasons: detection.reasons,
      policy,
      // Enhanced logging fields
      invocation_id: invocationId,
      trigger_list: detection.triggers || [],
      min_state: detection.minForcedState || undefined,
      final_state: nextSession.stateCurrent,
      downshift_lock_reason: nextSession.stateInertiaLock?.reason || undefined
    });

    res.json(response);

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example usage endpoint
app.get('/api/examples', (req, res) => {
  res.json({
    examples: {
      angry_physicality_trigger: {
        message: "I feel so angry right now, I want to punch something!",
        expected_triggers: ["ANGRY_PHYSICALITY"],
        expected_state: "S2",
        expected_clarifier: true
      },
      clarification_response: {
        message: "I'm angry at my boss, not thinking about hurting anyone",
        expected_clarifier_target: "none",
        expected_state_inertia: "5 turns minimum S1"
      },
      s2_s3_response_template: {
        state: "S2",
        features: [
          "validate emotion",
          "set boundary: 'can't help with harming anyone'",
          "ask immediacy",
          "route to safety/handoff if imminent"
        ]
      }
    }
  });
});

export default app;

// Example usage:
//
// POST /api/self/process-message
// {
//   "userId": "user123",
//   "sessionId": "session456",
//   "message": "I feel so angry right now, I want to punch something!",
//   "history": []
// }
//
// Response includes:
// - self_proof: Complete SELF logging proof
// - clarifier_required: Whether clarification is needed
// - clarifier_question: The question to ask for clarification
// - state_inertia: Current inertia lock status
