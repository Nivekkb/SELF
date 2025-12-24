# SELF (Support‑First Logic Engine)

SELF is a lightweight, heuristic control layer that shapes an assistant’s responses based on the user’s emotional state. It wraps a chat pipeline with pre‑LLM state detection, policy creation, system prompt injection, post‑LLM validation, safe repair, and **adaptive state management with abuse prevention**.

## 🛑 SELF Release Gate Template

### Why This Exists

The SELF engine operates in one of the most sensitive domains imaginable: detecting and responding to human emotional distress. A single misclassification, premature normalization, or false safety claim can have profound consequences. This template exists because:

1. **Lives may depend on it**: Emotional safety systems cannot afford "move fast and break things" mentality
2. **Liability is existential**: False claims of safety create legal and moral exposure
3. **Trust is fragile**: Once broken by a preventable failure, it cannot be regained
4. **Complexity demands rigor**: Adaptive state management requires systematic verification
5. **Accountability must be explicit**: No implicit assumptions about what "safe enough" means

### What It Does

The `.github/PULL_REQUEST_TEMPLATE/SELF_RELEASE_GATE.md` template enforces rigorous release discipline for the SELF engine. This mandatory checklist ensures that every production-affecting release undergoes comprehensive verification of exit taxonomy integrity, override discipline, environment integrity, and hard invariant compliance. The template serves as a critical safeguard to prevent unintended policy changes, unauthorized overrides, data provenance violations, and doctrine breaches that could compromise the safety and reliability of emotional state management. By requiring explicit auditor sign-off and archival of findings, it creates an immutable audit trail that maintains accountability and enables post-release forensic analysis if needed.

📖 **[View the canonical SELF Design Doctrine](SELF-DESIGN-DOCTRINE.md)** for the foundational principles and constraints that govern all SELF engine development and release processes.

🛡️ **[Review the Complete Safety Packet](SELF-SAFETY-PACKET.md)** for the end-to-end protection demonstration that risk owners, lawyers, and safety leads can review in 10 minutes to conclude: "If this were our system, we'd be protected."

📄 **[Commercial License Terms](SELF_COMMERCIAL_LICENSE.md)** for ownership, usage rights, and compliance requirements.

💡 **[Licensing Rationale](SELF-LICENSING-RATIONALE.md)** explains why SELF's licensing model protects both users and implementers.

⚠️ **[Buyer Filter](SELF-NOT-FOR-YOU.md)** helps you determine if SELF's discipline aligns with your values and requirements.

💰 **[Pricing](SELF-PRICING.md)** provides realistic costs for responsible implementation.

🔒 **[Enforcement](SELF-ENFORCEMENT.md)** explains how we ensure pricing integrity and safety compliance.

🔑 **[Key Generation](SELF-KEY-GENERATION.md)** provides technical implementation details for API keys.

📜 **[Safety Enforcement Contract](SELF-SAFETY-ENFORCEMENT-CONTRACT.md)** formalizes the binding agreement for safety compliance.

🚫 **[Not For Everyone](SELF-NOT-FOR-EVERYONE.md)** explains why SELF requires specific capabilities and values.

## Core Features

### 🔍 State Detection & Policy Management
- **State detection**: `detectState(message, history?)` scans for lexicon matches and returns `{ state, scores, reasons }` across S0–S3.
- **Policy creation**: `buildPolicy(state)` maps the state to response caps and style constraints (allowed classes, `maxWords`, `maxQuestions`, `bannedPhrases`, `styleRules`, grounding/agency/crisis flags).
- **Prompt injection**: `applyPolicyToPrompt(policy, baseSystemPrompt)` appends a SELF policy block to the system prompt before calling the LLM.
- **Post-check & repair**: `validateOutput(output, policy)` verifies caps, banned phrases, hypotheticals, and required grounding/agency/crisis cues. `repairOutput(output, policy)` trims, softens, and appends the missing safety elements.

### 🎯 Sticky State Machine (Hysteresis + Cooldown)
SELF supports **fast escalation** and **slow de-escalation** using a sticky session state.

Plain-English definitions in this codebase:
- **Hysteresis**: escalation is allowed immediately (S0→S3 in one turn), but **de-escalation requires sustained evidence** (multiple low-risk turns + an affirmative stabilization signal) and can only drop **one level per turn**.
- **Cooldown**: after entering S2 or S3, SELF sets a **turn-based timer** that blocks de-escalation for several user turns even if the next message is calmer.

Key APIs:
- `advanceStickySelfState({ session, message, history })` → `{ nextSession, detection, meta }`
- `applySocialPolicyOverrides({ ..., session: { pushCount } })` to trigger loop-breakers reliably under certainty pressure

Default parameters (see `DEFAULT_STICKY_STATE_PARAMS` in `packages/self-engine/src/index.ts`):
- `lowRiskTurnsRequired = 3`: prevents “one calm turn” snap-back.
- `cooldownTurnsAfterS2 = 2`, `cooldownTurnsAfterS3 = 4`: prevents premature downshifts after high-risk spikes.
- `stabilizationWindowTurns = 6`: requires a recent affirmative stabilization signal before de-escalation.
- `pushElevateThreshold = 3`: repeated certainty pressure keeps state elevated and can trigger loop-breakers.
- `pushResetLowRiskTurns = 4`: push pressure doesn’t reset immediately after one calm turn.
- `ewmaAlpha = 0.35`: smooths risk score over turns (EWMA).

### 🛡️ Abuse Prevention System (NEW)
- **Abuse pattern detection**: `detectAbusePatterns()` identifies manipulation attempts like rapid state cycling and suspicious transition patterns.
- **State decay enforcement**: `applyStateDecay()` prevents immediate state drops when abuse is detected.
- **Session persistence**: Maintains abuse context across conversation restarts with `createAbusePreventionContext()`, `persistAbuseContext()`, and `restoreAbuseContext()`.
- **Comprehensive tracking**: `recordStateChange()` logs all state transitions for abuse analysis.

### 📝 Logging & Monitoring (ENHANCED)
- **Enhanced logging**: `logSelfEvent(...)` writes JSONL entries with state, scores, policy, validation result, and now includes abuse detection data.
- **Abuse pattern tracking**: Logs detected abuse attempts with detailed reasons for monitoring and analysis.
- **Confidence and uncertainty logging**: Logs include confidence levels ("high", "medium", "low") and uncertainty reasons to reflect inference uncertainty.
- **Considered and blocked actions**: SELF logs why safety actions were not taken to ensure auditability.

### 🚀 New Safety Features

#### 1. Positive Stabilization Signals
- **Enhanced safety checks**: `isSafeToResumeNormalChat()` now requires affirmative stabilization signals (grounding, temporal orientation, agency) not just absence of distress.
- **False calm detection**: Blocks premature normalization when recovery appears to be only politeness, gratitude, or closure language.
- **Fixes false calm**: Prevents early release when user seems calm but lacks genuine stabilization.

#### 2. Confidence & Uncertainty Logging
- **Confidence assessment**: `calculateConfidenceAndUncertainty()` evaluates confidence levels based on history length, conflicting signals, sudden improvements, and ambiguous language.
- **Uncertainty reasons**: Logs specific reasons for low/medium confidence to aid debugging and monitoring.
- **Structured logging**: Confidence levels and uncertainty reasons are included in log events.

#### 3. Considered But Not Taken Actions
- **Safety action tracking**: `trackSafetyActions()` records which safety actions were considered and why they were blocked.
- **Auditability**: Provides clear reasoning for safety decisions to ensure transparency and accountability.
- **Action logging**: Logs include considered actions and blocked actions with specific reasons.

#### 4. Cold-Start Safety Posture
- **Conservative initialization**: First N turns apply stricter safety constraints during cold start period.
- **Gradual trust building**: `isColdStart()` and `applyColdStartSafety()` prevent premature normalization during initial conversation.
- **Configurable duration**: Cold start turns configurable via `SELF_COLD_START_TURNS` environment variable.

#### 5. Safe Failure Definition
- **Explicit failure modes**: Clear definition of acceptable vs unacceptable failures.
- **Safety-first approach**: SELF prioritizes containment (holding too long) over premature normalization (early release).
- **Documented philosophy**: Failure modes explicitly stated in code comments.

#### 6. Structured Safety Decisions
- **Enhanced return contract**: `isSafeToResumeNormalChat()` returns structured `SafeToResumeResult` with confidence levels and missing signals.
- **Detailed reasoning**: Includes specific missing signals (grounding, temporal orientation, agency) when safe resumption is blocked.
- **Structured decision making**: Replaces boolean return with comprehensive safety assessment.

## How It Works: Complete Pipeline

### Basic Pipeline (Original)
1. **Pre‑LLM**: detect state → build policy → inject via `applyPolicyToPrompt` → optionally log pre‑check.
2. **Post‑LLM**: validate output → repair if needed → optionally log post‑check with violations.

### Enhanced Pipeline (With Sticky State + Safety Overrides)
1. **Pre‑LLM**:
   - Detect state with `detectState(message, history)`
   - Advance sticky session state with `advanceStickySelfState({ session, message, history })`
   - Build policy with `buildPolicy(stateCurrent)` (sticky state, not one-shot detection)
   - Inject policy via `applyPolicyToPrompt(policy, baseSystemPrompt)`
   - Log pre-check with `logSelfEvent()`

2. **Post‑LLM**:
   - Validate output with `validateOutput(output, policy)`
   - Repair if needed with `repairOutput(output, policy)`
   - (Optional) Check safe-to-resume with `isSafeToResumeNormalChat()` (legacy helper; sticky state is the primary mechanism)
   - Log post-check with `logSelfEvent()`

Depth preference note:
- User-facing “Short / Gentle / Deeper” is treated as a **preference only**. When safety constraints apply, SELF caps `maxWords` and the host can log `requestedDepth`, `effectiveDepth`, and `overrideReason`.

### Session Fields (Persisted by Host App)
Host apps should persist these per-user (or per-session) fields in a session store:
- `state_current` (S0–S3)
- `risk_score_smoothed` (EWMA)
- `cooldown_turns_remaining`
- `consecutive_low_risk_user_turns`
- `push_count`
- `last_affirmative_stabilization_at_turn`
- `turn_index`

SELF itself is pure/stateless; your app persists these and feeds them back each turn.

Repo note (SoulsynqAI):
- This repo persists the session fields in Postgres via `self_session_state` and stores per-message metadata in `messages.self_meta`. After pulling changes, run `npm run db:push` to apply the schema updates.

### Abuse Prevention Pipeline
1. **Initialize**: `createAbusePreventionContext(userId, sessionId)`
2. **Monitor**: Pass `abuseContext` to `getAdaptiveState()` for abuse detection
3. **Track**: Use `recordStateChange()` for all state transitions
4. **Persist**: `persistAbuseContext()` to save context across sessions
5. **Restore**: `restoreAbuseContext()` to load context when session resumes

## Tuning & Configuration

Edit `packages/self-engine/src/config.ts` to customize:

### Thresholds & Weights
- **Thresholds**: `thresholds.s1/s2/s3` set the combined score cutoffs
- **Weights**: Adjust `weights` to change how strongly each emotion category influences escalation

### Lexicon Customization
Update `lexicon.*` phrase lists for:
- Panic, hopelessness, self-harm, shame, urgency, anger
- Reassurance signals, hypotheticals, grounding cues
- Agency steps, crisis language, validation triggers
- **NEW**: Resolution cues and stabilization signals for safe-to-resume detection

### Policy Configuration
Adjust per-state limits in `policies[STATE]`:
- Response caps (`maxWords`, `maxQuestions`)
- Banned phrases and style rules
- Required safety steps (grounding, agency, crisis support)

### Safety Feature Settings
- **Cold start duration**: `SELF_COLD_START_TURNS` environment variable (default: 5)
- **Minimum durations**: Modify time requirements in `applyStateDecay()`
- **Abuse thresholds**: Adjust warning thresholds in `detectAbusePatterns()`
- **Pattern detection**: Customize suspicious pattern regex in abuse detection

## Integration Examples

### Basic Integration
```typescript
import { detectState, buildPolicy, applyPolicyToPrompt } from "self-engine";

// Simple state-based policy application
const detection = detectState(userMessage, conversationHistory);
const policy = buildPolicy(detection.state);
const systemPrompt = applyPolicyToPrompt(policy, baseSystemPrompt);
```

### Advanced Adaptive Integration with New Features
```typescript
import {
  detectState,
  getAdaptiveState,
  buildPolicy,
  applyPolicyToPrompt,
  isSafeToResumeNormalChat,
  calculateConfidenceAndUncertainty,
  trackSafetyActions,
  createAbusePreventionContext,
  recordStateChange,
  isColdStart,
  applyColdStartSafety
} from "self-engine";

// Initialize abuse prevention (once per session)
const abuseContext = createAbusePreventionContext(userId, sessionId);

// Adaptive state management with cold start safety
const detection = detectState(userMessage, conversationHistory);
let adaptiveState = getAdaptiveState({
  currentState: currentState,
  message: userMessage,
  history: conversationHistory,
  abuseContext: abuseContext
});

// Apply cold start safety if needed
if (isColdStart(abuseContext)) {
  adaptiveState = applyColdStartSafety({
    currentState: adaptiveState,
    detection,
    safetyCheck: isSafeToResumeNormalChat({
      currentState: adaptiveState,
      message: userMessage,
      history: conversationHistory
    }),
    context: abuseContext
  });
}

// Apply appropriate policy
const policy = buildPolicy(adaptiveState);
const systemPrompt = applyPolicyToPrompt(policy, baseSystemPrompt);

// Track state changes
if (adaptiveState !== currentState) {
  recordStateChange(abuseContext, currentState, adaptiveState, "user_message");
}

// Check if safe to resume normal operation with confidence assessment
const safetyCheck = isSafeToResumeNormalChat({
  currentState: adaptiveState,
  message: userMessage,
  history: conversationHistory
});

const { confidence, uncertaintyReasons } = calculateConfidenceAndUncertainty({
  message: userMessage,
  history: conversationHistory,
  detection,
  safetyCheck
});

// Track safety actions
const { consideredActions, blockedActions } = trackSafetyActions({
  currentState,
  detection,
  safetyCheck,
  abuseContext
});

// Log with enhanced data
logSelfEvent({
  userId,
  stage: "pre",
  message: userMessage,
  state: adaptiveState,
  scores: detection.scores,
  reasons: detection.reasons,
  policy,
  confidence,
  uncertaintyReasons,
  consideredActions,
  blockedActions,
  abuseDetection: detectAbusePatterns(abuseContext)
});
```

### Abuse Prevention with Session Persistence
```typescript
// At session start
let abuseContext = restoreAbuseContext(serializedContext) ||
                  createAbusePreventionContext(userId, sessionId);

// During conversation with new safety features
const detection = detectState(userMessage, conversationHistory);
const safetyCheck = isSafeToResumeNormalChat({
  currentState: currentState,
  message: userMessage,
  history: conversationHistory
});

let adaptiveState = getAdaptiveState({
  currentState: currentState,
  message: userMessage,
  history: conversationHistory,
  abuseContext: abuseContext
});

// Apply cold start if needed
if (isColdStart(abuseContext)) {
  adaptiveState = applyColdStartSafety({
    currentState: adaptiveState,
    detection,
    safetyCheck,
    context: abuseContext
  });
}

// Calculate confidence for logging
const { confidence, uncertaintyReasons } = calculateConfidenceAndUncertainty({
  message: userMessage,
  history: conversationHistory,
  detection,
  safetyCheck,
  context: abuseContext
});

// Track safety decisions
const { consideredActions, blockedActions } = trackSafetyActions({
  currentState,
  detection,
  safetyCheck,
  abuseContext
});

// At session end
const serializedContext = persistAbuseContext(abuseContext);
// Store serializedContext for next session
```

## Feature Flags & Framework Compatibility

- **Feature flagging**: Wire behind `SELF_ENABLED=true/false` or custom flags
- **Framework-agnostic**: Works with any chat pipeline (LangChain, Vercel AI, custom)
- **Brand-neutral**: Intentionally generic for easy integration into any product
- **Backward compatible**: All new features are optional and work with existing integrations

## Exporting & Deployment

This module is self-contained and portable:
```bash
# Copy to new project
cp -r packages/self-engine/ /path/to/new/project/

# Install dependencies
cd /path/to/new/project/
npm install
```

## Key Benefits

✅ **Adaptive Safety**: Dynamically adjusts to user's emotional state
✅ **Abuse Resistant**: Prevents manipulation via conversation restarting
✅ **Gradual Recovery**: Ensures genuine improvement before returning to normal state
✅ **Session Persistence**: Maintains safety context across conversations
✅ **Comprehensive Monitoring**: Tracks abuse patterns for analysis
✅ **Backward Compatible**: Works with existing SELF engine integrations
✅ **Enhanced Decision Making**: Structured safety assessments with confidence levels
✅ **Auditability**: Clear logging of safety actions and reasoning
✅ **False Calm Prevention**: Detects and blocks premature normalization

## Migration Guide

### From Basic SELF to Enhanced SELF
1. **Update imports**: Add new functions to your imports
2. **Initialize abuse context**: Add `createAbusePreventionContext()` to session startup
3. **Replace static state management**: Change direct `detectState()` calls to `getAdaptiveState()`
4. **Add state tracking**: Implement `recordStateChange()` calls
5. **Enhance logging**: Update logging to include confidence, uncertainty, and safety actions
6. **Add cold start safety**: Implement `isColdStart()` and `applyColdStartSafety()` checks
7. **Update safety checks**: Replace boolean safety checks with structured `SafeToResumeResult`

### Configuration Migration
- **Existing configs work unchanged**: All original settings are preserved
- **New settings are optional**: Abuse prevention and safety features can be added incrementally
- **Gradual rollout**: Enable features progressively (adaptive → abuse prevention → enhanced logging)

## Monitoring & Analytics

Enhanced logging provides rich data for:
- **State transition analysis**: Understand how users move through emotional states
- **Abuse pattern detection**: Identify and respond to manipulation attempts
- **Safety effectiveness**: Measure how well the system protects users
- **Recovery patterns**: Analyze genuine improvement trajectories
- **Confidence assessment**: Monitor system confidence and uncertainty reasons
- **Safety decisions**: Audit why specific safety actions were taken or blocked

```json
{
  "userId": "user123",
  "timestamp": "2023-12-15T14:30:00Z",
  "stage": "post",
  "message": "I feel much better now",
  "state": "S0",
  "previousState": "S1",
  "scores": { "panic": 0, "hopelessness": 0, ... },
  "policy": { "state": "S0", "maxWords": 180, ... },
  "validation": { "ok": true, "violations": [] },
  "confidence": "high",
  "uncertaintyReasons": [],
  "consideredActions": ["probe", "hold", "escalate", "return_to_normal"],
  "blockedActions": {},
  "abuseDetection": {
    "isAbuseDetected": false,
    "reasons": [],
    "abuseWarnings": 0
  },
  "transitionReason": "safe_to_resume"
}
```

## Support & Resources

- **TypeScript support**: Full type definitions for all functions including new safety features
- **Error handling**: Graceful degradation when features are unavailable
- **Documentation**: Comprehensive JSDoc comments in source for all new functions
- **Testing**: Example test patterns in `src/index.test.ts` including safety feature tests

## New Safety Features Summary

### 1. Positive Stabilization Signals in `isSafeToResumeNormalChat()`
- **Requires affirmative signals**: Grounding, temporal orientation, or agency continuity
- **Blocks false calm**: Detects and prevents premature normalization from politeness/gratitude
- **Enhanced safety**: Fixes false calm vulnerabilities

### 2. Confidence & Uncertainty Logging
- **Structured confidence**: "high", "medium", "low" levels based on clear criteria
- **Uncertainty reasons**: Specific explanations for reduced confidence
- **Enhanced monitoring**: Better visibility into system decision-making

### 3. Considered But Not Taken Actions
- **Action tracking**: Records all considered safety actions
- **Blocking reasons**: Clear explanations for why actions were blocked
- **Audit trail**: Ensures transparency and accountability

### 4. Cold-Start Safety Posture
- **Conservative initialization**: Stricter safety for first N turns
- **Configurable duration**: Adjustable via environment variable
- **Gradual trust**: Prevents premature normalization during onboarding

### 5. Safe Failure Definition
- **Explicit philosophy**: Acceptable vs unacceptable failures clearly documented
- **Safety-first**: Prioritizes containment over premature release
- **Code documentation**: Failure modes documented in source

### 6. Structured Safety Decisions
- **Enhanced return type**: `SafeToResumeResult` with confidence and missing signals
- **Detailed reasoning**: Specific missing signals identified
- **Better decisions**: Structured approach to safety assessments

The enhanced SELF engine now provides **comprehensive, adaptive, abuse-resistant emotional safety** with full backward compatibility, enhanced monitoring, and clear decision-making processes.
