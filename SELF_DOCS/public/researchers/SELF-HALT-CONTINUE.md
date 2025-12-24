# SELF™ HALT vs CONTINUE

**SAF_006 as Source of Truth for Exit Safety Decisions**
*(Operational Logic – Version 1.0)*

---

## Core Principle

**SAF_006 (Exit Intent Missed) defines the source of truth for halt vs continue decisions.**

Every exit safety evaluation must pass through SAF_006's conditional severity logic.

---

## SAF_006 Conditional Severity Logic

### Error Definition
- **Code**: SAF_006
- **Message**: "Failed to detect and safely handle exit intent"
- **Doctrine**: DS_05_EXIT_GOVERNED, DS_10_FAILURE_COST_SYSTEM
- **Severity**: Conditional

### Conditional Rules

**SOFT (Continue with Override):**
- Current state ≤ S1 (S0 or S1)
- AND no active blockers present
- THEN: Allow override, system may continue with safety measures

**HARD (Halt System):**
- Current state ≥ S2 (S2 or S3)
- OR active blockers are present
- THEN: Immediate system halt, no override permitted

### State Ranking
```
S0 (Terminal)  → Rank 0
S1 (Mild)      → Rank 1
S2 (Moderate)  → Rank 2
S3 (Severe)    → Rank 3
```

### Blocker Definition
Active blockers include:
- Crisis indicators present
- Self-harm signals detected
- Multiple distress patterns
- Override abuse detected
- System integrity violations

---

## Implementation in Code

### Conditional Severity Resolution
```typescript
export function resolveConditionalSeverity(
  error: DoctrinalError,
  context?: {
    currentState?: string;
    hasBlockers?: boolean;
  }
): "hard" | "soft" {
  if (error.code === "SAF_006") {
    const state = context?.currentState;
    const hasBlockers = context?.hasBlockers || false;

    // State ranking: S0 = 0, S1 = 1, S2 = 2, S3 = 3
    const stateRank = state === "S0" ? 0 : state === "S1" ? 1 : state === "S2" ? 2 : state === "S3" ? 3 : 0;

    // Soft if state <= S1 and no blockers, Hard otherwise
    if (stateRank <= 1 && !hasBlockers) {
      return "soft";
    } else {
      return "hard";
    }
  }

  return error.severity;
}
```

### System Halt Decision
```typescript
export function requiresSystemHalt(
  error: DoctrinalError,
  context?: {
    currentState?: string;
    hasBlockers?: boolean;
  }
): boolean {
  const resolvedSeverity = resolveConditionalSeverity(error, context);
  return resolvedSeverity === "hard";
}
```

---

## Decision Flow for Exit Safety

```
Exit Intent Detected
        ↓
Evaluate SAF_006 Context
        ↓
Check State + Blockers
        ↓
├── State ≤ S1 AND No Blockers → SOFT (Continue with Override)
└── State ≥ S2 OR Has Blockers → HARD (Immediate Halt)
```

### Soft Path (Continue)
1. System logs SAF_006 violation as SOFT
2. Override mechanism activated
3. Safety measures enhanced (containment, monitoring)
4. System continues with heightened vigilance
5. Incident tracked for review

### Hard Path (Halt)
1. System logs SAF_006 violation as HARD
2. Immediate containment activation
3. All processing stops
4. Manual intervention required
5. Critical incident escalation

---

## Context Evaluation

### State Assessment
- **S0/S1**: Lower risk, override permitted with safeguards
- **S2/S3**: Higher risk, override prohibited, immediate halt required

### Blocker Detection
Blockers are evaluated by:
- Crisis pattern recognition
- Self-harm indicator analysis
- Multiple concurrent distress signals
- System integrity checks
- Override history review

---

## Override Conditions (Soft Path Only)

When SAF_006 resolves to SOFT, override requires:

1. **Authorized Personnel**: Founder-level approval required
2. **Time-Limited**: Maximum 24-hour override window
3. **Enhanced Monitoring**: Real-time safety metric tracking
4. **Containment Measures**: Additional safety protocols activated
5. **Incident Documentation**: Complete audit trail maintained

---

## Documentation as Source of Truth

**This document (SELF-HALT-CONTINUE.md) is the definitive source for halt vs continue decisions.**

All system components must implement SAF_006 conditional logic exactly as specified herein.

No other logic or configuration may override these rules.

---

## Testing and Validation

### Unit Tests
```typescript
describe("SAF_006 Conditional Severity", () => {
  it("should be SOFT for S1 with no blockers", () => {
    const error = createDoctrinalError("EXIT_INTENT_MISSED");
    const context = { currentState: "S1", hasBlockers: false };
    expect(resolveConditionalSeverity(error, context)).toBe("soft");
  });

  it("should be HARD for S2 with blockers", () => {
    const error = createDoctrinalError("EXIT_INTENT_MISSED");
    const context = { currentState: "S2", hasBlockers: true };
    expect(resolveConditionalSeverity(error, context)).toBe("hard");
  });
});
```

### Integration Tests
- End-to-end exit safety evaluation
- Override mechanism validation
- System halt verification
- Context evaluation accuracy

---

## Monitoring and Alerting

### Key Metrics
- SAF_006 trigger frequency by state
- Soft vs Hard resolution rates
- Override usage patterns
- System halt incidents

### Alert Conditions
- **Critical**: Any HARD SAF_006 resolution
- **Warning**: High frequency of SOFT SAF_006 resolutions
- **Info**: Override activation and outcomes

---

## Future Evolution

### Enhanced Context Evaluation
- Machine learning-based blocker detection
- Dynamic risk assessment
- Historical pattern analysis

### Granular Override Levels
- Multi-tier override authorization
- Conditional override terms
- Progressive safety measure activation

---

## Final Authority

**SAF_006 conditional severity logic is the absolute authority for exit safety decisions.**

All exit handling, override processing, and system halt decisions must conform to this logic.

This document serves as the immutable specification for halt vs continue behavior.

**Exit safety depends on unwavering adherence to SAF_006 as source of truth.**
