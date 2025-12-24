# SELF Engine API Documentation

## Overview

The SELF (Support-First Logic Engine) API provides a comprehensive REST interface for emotional state detection, policy management, and safety validation. It wraps a chat pipeline with pre-LLM state detection, policy creation, system prompt injection, post-LLM validation, and adaptive state management with abuse prevention.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. In production deployments, consider adding authentication mechanisms.

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error

Error responses include a JSON object with an `error` field describing the issue.

## API Endpoints

### Health Check

**GET** `/health`

Returns the health status of the API server.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T14:09:24.144Z",
  "version": "1.0.0"
}
```

---

### Detect State

**POST** `/detect-state`

Detects the emotional state from a user message using lexicon matching and scoring.

**Request Body:**
```json
{
  "message": "string", // Required: The user message to analyze
  "history": [          // Optional: Previous conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
```json
{
  "state": "S0|S1|S2|S3",
  "scores": {
    "panic": 0,
    "hopelessness": 0,
    "selfHarm": 0,
    "shame": 0,
    "urgency": 0,
    "anger": 0,
    "angryPhysicality": 0,
    "reassurance": 0
  },
  "reasons": ["string"],
  "triggers": ["string"],
  "minForcedState": "S0|S1|S2|S3",
  "clarifierRequired": false,
  "clarifierReason": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/detect-state \
  -H "Content-Type: application/json" \
  -d '{"message": "I am feeling really anxious and scared"}'
```

---

### Build Policy

**POST** `/build-policy`

Builds a response policy based on the detected emotional state.

**Request Body:**
```json
{
  "state": "S0|S0_GUARDED|S1|S2|S3" // Required: The emotional state
}
```

**Response:**
```json
{
  "state": "S0",
  "allowedResponseClasses": ["string"],
  "maxWords": 180,
  "maxQuestions": 3,
  "bannedPhrases": ["string"],
  "styleRules": ["string"],
  "requiresGrounding": false,
  "requiresAgencyStep": false,
  "requiresCrisisSupport": false,
  "enforceNoHypotheticals": false,
  "requiresValidation": false,
  "isTerminalState": false,
  "suppressQuestions": false,
  "enforceRestPosture": false,
  "forbidMechanismNaming": false,
  "requiresLoopBreaker": false,
  "loopBreakerLine": "string",
  "requiresHandoffFraming": false,
  "handoffFramingLine": "string"
}
```

---

### Validate Output

**POST** `/validate-output`

Validates AI-generated output against a policy to ensure it meets safety requirements.

**Request Body:**
```json
{
  "output": "string", // Required: The AI-generated response to validate
  "policy": {         // Required: The policy object
    "state": "S0",
    "maxWords": 180,
    // ... other policy fields
  }
}
```

**Response:**
```json
{
  "ok": true,
  "violations": ["string"]
}
```

---

### Repair Output

**POST** `/repair-output`

Repairs AI-generated output that violates policy constraints.

**Request Body:**
```json
{
  "output": "string", // Required: The AI-generated response to repair
  "policy": {         // Required: The policy object
    // ... policy fields
  }
}
```

**Response:**
```json
{
  "repaired": "string"
}
```

---

### Is Safe to Resume

**POST** `/is-safe-to-resume`

Determines if it's safe to resume normal conversation based on current state and message.

**Request Body:**
```json
{
  "currentState": "S0|S0_GUARDED|S1|S2|S3", // Required: Current emotional state
  "message": "string",                       // Required: Current user message
  "history": [                               // Optional: Conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
```json
{
  "safeToResume": true,
  "confidence": "high|medium|low",
  "missingSignals": ["string"],
  "reasons": ["string"]
}
```

---

### Advance Sticky State

**POST** `/advance-sticky-state`

Advances the sticky state machine based on user input and session history.

**Request Body:**
```json
{
  "session": {        // Required: Current session state
    "stateCurrent": "S0",
    "riskScoreSmoothed": 0,
    "cooldownTurnsRemaining": 0,
    "consecutiveLowRiskUserTurns": 0,
    "pushCount": 0,
    "lastAffirmativeStabilizationAtTurn": null,
    "turnIndex": 0
  },
  "message": "string", // Required: User message
  "history": [         // Optional: Conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "params": {}         // Optional: Sticky state parameters
}
```

**Response:**
```json
{
  "nextSession": {
    // Updated session state
  },
  "detection": {
    // State detection result
  },
  "meta": {
    // Transition metadata
  }
}
```

---

### Abuse Prevention Context

#### Create Abuse Context

**POST** `/create-abuse-context`

Creates a new abuse prevention context for a user session.

**Request Body:**
```json
{
  "userId": "string",   // Required: User identifier
  "sessionId": "string" // Required: Session identifier
}
```

**Response:**
```json
{
  "userId": "string",
  "sessionId": "string",
  "conversationStartTime": "2025-12-19T14:09:24.144Z",
  "stateChangeHistory": [],
  "abuseWarnings": 0
}
```

#### Record State Change

**POST** `/record-state-change`

Records a state change in the abuse prevention context.

**Request Body:**
```json
{
  "context": {         // Required: Abuse prevention context
    // ... context fields
  },
  "fromState": "S0|S1|S2|S3", // Required: Previous state
  "toState": "S0|S1|S2|S3",   // Required: New state
  "reason": "string"          // Required: Reason for change
}
```

#### Persist Abuse Context

**POST** `/persist-abuse-context`

Serializes abuse prevention context for storage.

**Request Body:**
```json
{
  "context": { // Required: Abuse prevention context
    // ... context fields
  }
}
```

**Response:**
```json
{
  "serialized": "string"
}
```

#### Restore Abuse Context

**POST** `/restore-abuse-context`

Restores abuse prevention context from serialized data.

**Request Body:**
```json
{
  "serialized": "string" // Required: Serialized context
}
```

**Response:**
```json
{
  // Restored context object
}
```

---

### Get Adaptive State

**POST** `/get-adaptive-state`

Gets the adaptive state considering abuse prevention and safety checks.

**Request Body:**
```json
{
  "currentState": "S0|S1|S2|S3", // Required: Current state
  "message": "string",            // Required: User message
  "history": [                    // Optional: Conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "abuseContext": {               // Optional: Abuse prevention context
    // ... context fields
  }
}
```

**Response:**
```json
{
  "state": "S0|S1|S2|S3"
}
```

---

### Apply Social Policy Overrides

**POST** `/apply-social-policy-overrides`

Applies social policy overrides based on message content and detection.

**Request Body:**
```json
{
  "message": "string",     // Required: User message
  "detection": {           // Required: State detection result
    // ... detection fields
  },
  "policy": {              // Required: Current policy
    // ... policy fields
  },
  "history": [             // Optional: Conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "session": {             // Optional: Session data
    "pushCount": 0
  }
}
```

**Response:**
```json
{
  "policy": {
    // Updated policy with overrides
  },
  "meta": {
    // Override metadata
  }
}
```

---

### Calculate Confidence

**POST** `/calculate-confidence`

Calculates confidence level and uncertainty reasons for state detection.

**Request Body:**
```json
{
  "message": "string",     // Required: User message
  "history": [             // Optional: Conversation history
    {
      "role": "user|assistant",
      "content": "string"
    }
  ],
  "detection": {           // Required: State detection result
    // ... detection fields
  },
  "safetyCheck": {         // Optional: Safety check result
    "safeToResume": true,
    "reasons": ["string"]
  },
  "context": {             // Optional: Abuse prevention context
    // ... context fields
  }
}
```

**Response:**
```json
{
  "confidence": "high|medium|low",
  "uncertaintyReasons": ["string"]
}
```

---

### Track Safety Actions

**POST** `/track-safety-actions`

Tracks which safety actions were considered and taken.

**Request Body:**
```json
{
  "currentState": "S0|S1|S2|S3", // Required: Current state
  "detection": {                  // Required: State detection result
    // ... detection fields
  },
  "safetyCheck": {                // Required: Safety check result
    "safeToResume": true,
    "reasons": ["string"]
  },
  "abuseContext": {               // Optional: Abuse prevention context
    // ... context fields
  }
}
```

**Response:**
```json
{
  "consideredActions": ["string"],
  "blockedActions": {
    "action": "reason"
  }
}
```

---

### Log Event

**POST** `/log-event`

Logs a SELF engine event to the configured log destination.

**Request Body:**
```json
{
  "event": {           // Required: Event data
    "userId": "string",
    "stage": "pre|post",
    "message": "string",
    "state": "S0|S1|S2|S3",
    // ... other event fields
  },
  "options": {         // Optional: Logging options
    "enabled": true,
    "logPath": "string"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## State Definitions

- **S0**: Normal state - no distress detected
- **S0_GUARDED**: Transitional state after mild distress
- **S1**: Mild distress - requires basic support
- **S2**: Moderate distress - requires structured support
- **S3**: Severe distress - requires immediate crisis intervention

## Usage Examples

### Basic State Detection

```javascript
const response = await fetch('/api/detect-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I'm feeling really overwhelmed"
  })
});

const result = await response.json();
console.log(`Detected state: ${result.state}`);
```

### Complete Pipeline

```javascript
// 1. Detect state
const detection = await fetch('/api/detect-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, history })
}).then(r => r.json());

// 2. Build policy
const policy = await fetch('/api/build-policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ state: detection.state })
}).then(r => r.json());

// 3. Apply policy to system prompt
const systemPrompt = applyPolicyToPrompt(policy, basePrompt);

// 4. After LLM response, validate output
const validation = await fetch('/api/validate-output', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ output: llmResponse, policy })
}).then(r => r.json());

// 5. Repair if needed
if (!validation.ok) {
  const repair = await fetch('/api/repair-output', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ output: llmResponse, policy })
  }).then(r => r.json());

  finalOutput = repair.repaired;
}
```

## Error Handling

```javascript
try {
  const response = await fetch('/api/detect-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "" })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
  } else {
    const result = await response.json();
    // Handle success
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting in production deployments.

## Security Considerations

- Input validation is performed on all endpoints
- Large request bodies are limited to 10MB
- Consider adding authentication and authorization for production use
- Implement proper CORS configuration for web applications
- Add request logging and monitoring for production deployments

## Deployment

The API server can be started with:

```bash
npm run dev  # Development mode with tsx
npm run start # Production mode (requires building first)
```

Set the `PORT` environment variable to change the default port (3000).

## Support

For issues or questions about the SELF Engine API, refer to the main project documentation and codebase.
