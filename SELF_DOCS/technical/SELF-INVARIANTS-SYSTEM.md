# SELF™ INVARIANTS SYSTEM

**Hard and Soft Invariants Architecture**
*(Technical Specification – Version 1.0)*

---

## Overview

SELF implements a two-tier invariants system to enforce safety constraints:

**Hard Invariants**: Absolute rules that cannot be violated under any circumstances
**Soft Invariants**: Policy constraints that can be overridden with justification

This architecture ensures both unbreakable safety boundaries and flexible policy enforcement.

---

## Hard Invariants (H0-H6)

Hard invariants are absolute, non-negotiable rules that preserve the fundamental integrity of the SELF system. Violation of hard invariants indicates a critical system failure requiring immediate attention.

### H0: Doctrine Version Integrity
- **Rule**: All events must use the current doctrine version
- **Purpose**: Prevents version drift and ensures consistency
- **Failure Mode**: Immediate system halt
- **Foundation**: Scope and Authority (F0)

### H1: Provenance Integrity
- **Rule**: All events must include dataProvenance and runId
- **Purpose**: Enables auditability and prevents anonymous operations
- **Failure Mode**: Event rejection
- **Foundation**: Transparency as Accountability (F4)

### H2: Exit Semantics Integrity
- **Rule**: Exit decisions must be properly typed, honest, and complete
- **Purpose**: Prevents false recovery claims and ensures proper disengagement
- **Failure Mode**: Invalid exit rejection
- **Foundation**: Conservative Failure Mode (F1), Autonomy Respected (D6)

### H3: Non-Action Logging Integrity
- **Rule**: All restraint decisions must be logged with action and reason
- **Purpose**: Ensures explainable restraint and prevents silent blocking
- **Failure Mode**: Invalid logging rejection
- **Foundation**: Restraint Explainable (D7)

### H4: Cold-Start Safety Integrity
- **Rule**: Cold-start S0 states require affirmative stabilization signals
- **Purpose**: Prevents premature safety assumptions during initial interactions
- **Failure Mode**: Unsafe normalization rejection
- **Foundation**: Cold-Start Containment (D3), Recovery Affirmative (D4)

### H5: Override Validity
- **Rule**: Policy overrides must be unexpired and properly authorized
- **Purpose**: Prevents exploitation of override mechanisms
- **Failure Mode**: Invalid override rejection
- **Foundation**: Explicit Over Implicit (F2)

### H6: Event Timestamp Integrity
- **Rule**: All events must include valid timestamps
- **Purpose**: Enables temporal analysis and prevents replay attacks
- **Failure Mode**: Untimestamped event rejection
- **Foundation**: Transparency as Accountability (F4)

---

## Soft Invariants (S1-S5)

Soft invariants are policy-level constraints that enforce best practices and safety guidelines. Unlike hard invariants, soft invariants can be overridden with proper justification and time limits.

### S1: No Probing When Settled
- **Rule**: Probing is blocked when user shows settled indicators
- **Purpose**: Prevents unnecessary intervention when stabilization is achieved
- **Override**: Requires autonomy and restraint section references
- **Doctrine**: Autonomy Respected (D6), Restraint Explainable (D7)

### S2: Low-Confidence Exit Requires Explicit Rationale
- **Rule**: Low-confidence exits must include detailed rationales
- **Purpose**: Ensures careful consideration of uncertain disengagement
- **Override**: Requires state inference and autonomy references
- **Doctrine**: State Is Inference (D2), Autonomy Respected (D6)

### S3: Ambiguous Physicality Requires Clarification
- **Rule**: Ambiguous anger expressions require clarification before proceeding
- **Purpose**: Prevents misinterpretation of physical threat indicators
- **Override**: Requires inference and system cost references
- **Doctrine**: State Is Inference (D2), Failure Costs System (D10)

### S4: Doctrine-Backend Exit Blocking
- **Rule**: Exits are blocked when active doctrine violations exist
- **Purpose**: Ensures containment takes precedence over convenience
- **Override**: Requires exit governance and system cost references
- **Doctrine**: Exit Governed (D5), Failure Costs System (D10)

### S5: Reset-Abuse Persistent Test
- **Rule**: Detected reset abuse patterns must be blocked
- **Purpose**: Prevents exploitation of state reset mechanisms
- **Override**: Requires system cost and violation decision references
- **Doctrine**: Failure Costs System (D10), Violation Is Decision (D13)

---

## Architectural Differences

### Hard Invariants
- **Enforcement**: Automatic, cannot be bypassed
- **Scope**: Fundamental system properties
- **Violation Response**: Immediate failure
- **Purpose**: System integrity and safety boundaries
- **Override**: Impossible

### Soft Invariants
- **Enforcement**: Policy-level with override capability
- **Scope**: Operational best practices and guidelines
- **Violation Response**: Logged violation with override option
- **Purpose**: Safety optimization and abuse prevention
- **Override**: Requires justification and time limits

---

## Implementation Architecture

```
Event Processing Pipeline:
├── Input Validation
├── Hard Invariant Check (H0-H6) ← FAIL: System Error
├── State Detection & Policy Generation
├── Soft Invariant Evaluation (S1-S5)
├── Override Validation
├── Response Generation ← FAIL: Policy Violation (Overrideable)
└── Event Persistence
```

### Hard Invariant Layer
- Located in `hardInvariants.ts`
- Executed before any processing
- Throws `HardInvariantViolation` on failure
- Cannot be overridden

### Soft Invariant Layer
- Located in `softInvariants.ts`
- Executed after policy generation
- Throws `DoctrineViolation` on unapproved violations
- Can be overridden via policy overrides

---

## Override Mechanism

Soft invariants can be overridden through the `PolicyOverride` mechanism:

```typescript
{
  doctrineVersion: "1.0",
  doctrineSections: [DoctrineSection.DS_XX_XXX, DoctrineSection.DS_YY_YYY],
  overrideReason: "Specific justification for override",
  overrideOwner: "founder",
  overrideIssuedAt: "ISO timestamp",
  overrideExpiresAt: "ISO timestamp",
  riskAccepted: "Explicit risk acknowledgment"
}
```

### Override Requirements
- Must reference all violated doctrine sections
- Must include specific justification
- Must have defined expiration
- Must be approved by authorized personnel
- Must acknowledge accepted risks

---

## Error Handling

### Hard Invariant Violations
- **Exception**: `HardInvariantViolation`
- **Handling**: System-level error, requires immediate attention
- **Logging**: Critical error logs with full context
- **Recovery**: Manual intervention required

### Soft Invariant Violations
- **Exception**: `DoctrineViolation`
- **Handling**: Policy-level error, can be overridden
- **Logging**: Warning logs with violation details
- **Recovery**: Override application or policy adjustment

---

## Testing Strategy

### Hard Invariant Testing
- **Unit Tests**: Each invariant tested in isolation
- **Integration Tests**: Full event processing pipeline
- **Fuzz Testing**: Random input validation
- **Negative Testing**: Ensure invariants properly reject invalid events

### Soft Invariant Testing
- **Policy Tests**: Verify correct violation detection
- **Override Tests**: Validate override mechanism
- **Boundary Tests**: Test edge cases and thresholds
- **Regression Tests**: Prevent policy drift

---

## Monitoring and Alerting

### Hard Invariant Monitoring
- **Metrics**: Violation counts and types
- **Alerts**: Immediate alerts on any hard invariant violation
- **Dashboards**: Real-time system health monitoring
- **Audits**: Regular integrity audits

### Soft Invariant Monitoring
- **Metrics**: Violation patterns and override usage
- **Reports**: Weekly safety compliance reports
- **Trends**: Analysis of violation patterns over time
- **Audits**: Policy effectiveness reviews

---

## Future Evolution

### Adding Hard Invariants
- Requires unanimous maintainer approval
- Must protect fundamental safety properties
- Cannot be made overrideable later
- Requires comprehensive testing

### Adding Soft Invariants
- Can be added through standard development process
- Must include override justification requirements
- Should enhance safety without compromising performance
- Can be adjusted based on operational experience

---

## Final Architecture Principle

**Hard invariants define what is absolutely impossible.**
**Soft invariants define what should not happen without good reason.**

Together, they create a safety system that is both unbreakable in its core and adaptable in its application.
