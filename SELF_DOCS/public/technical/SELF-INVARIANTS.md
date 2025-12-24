# SELF™ INVARIANTS

**Soft Invariants and Behavioral Constraints**
*(Version 1.0)*

---

## Overview

Invariants are behavioral constraints enforced by the SELF system to ensure compliance with the Design Doctrine. Unlike hard rules that cause immediate failure, soft invariants allow for overrides but require explicit justification and documentation.

This document lists all defined soft invariants, their triggers, and associated doctrine sections.

---

## S1: No Probing When Settled

**Code:** `S1_PROBE_WHEN_SETTLED`

**Trigger:** Occurs when ambiguity flags include "settled" but the system still attempts to probe the user.

**Rationale:** Probing disrupts stabilization when the user shows signs of being settled. This invariant prevents unnecessary intervention when recovery signals are present.

**Doctrine Sections:** DS_06_AUTONOMY_RESPECTED, DS_07_RESTRAINT_EXPLAINABLE

**Override Requirements:** Must reference DoctrineSection.DS_06_AUTONOMY_RESPECTED and DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE, provide explicit reason, and expire within defined timeframe.

---

## S2: Low-Confidence Exit Requires Explicit Rationale

**Code:** `S2_LOWCONF_EXIT_RATIONALE_TOO_THIN`

**Trigger:** Occurs during low-confidence exits when the system rationale is too brief (less than 10 characters) and lacks sufficient detail.

**Rationale:** Low-confidence exits carry higher risk of unsafe disengagement. This invariant ensures that such decisions are thoroughly documented and reasoned.

**Doctrine Sections:** DS_02_STATE_IS_INFERENCE, DS_06_AUTONOMY_RESPECTED

**Override Requirements:** Must reference DoctrineSection.DS_02_STATE_IS_INFERENCE and DoctrineSection.DS_06_AUTONOMY_RESPECTED, provide explicit reason, and expire within defined timeframe.

---

## S3: Ambiguous Physicality Requires Clarification

**Code:** `S3_AMBIGUOUS_PHYSICALITY_UNCLARIFIED`

**Trigger:** Occurs when ambiguity flags include "angry_physicality_ambiguous" but the system failed to enforce clarification before allowing normal interaction to resume.

**Rationale:** When anger expressions contain ambiguous physicality (unclear targets for potential harm), the system must require explicit clarification to ensure safety. Proceeding without clarification risks missing imminent threats.

**Doctrine Sections:** DS_02_STATE_IS_INFERENCE, DS_10_FAILURE_COST_SYSTEM

**Override Requirements:** Must reference DoctrineSection.DS_02_STATE_IS_INFERENCE and DoctrineSection.DS_10_FAILURE_COST_SYSTEM, provide explicit reason, and expire within defined timeframe.

---

## S4: Doctrine-Backend Exit Blocking

**Code:** `S4_DOCTRINE_BACKEND_EXIT_BLOCK`

**Trigger:** Occurs when exit is attempted but ambiguity flags indicate active doctrine violations or unsafe conditions that should prevent exit.

**Rationale:** Exit decisions must respect doctrine constraints. When active violations exist that require containment, exit cannot be allowed even if other conditions seem met.

**Doctrine Sections:** DS_05_EXIT_GOVERNED, DS_10_FAILURE_COST_SYSTEM

**Override Requirements:** Must reference DoctrineSection.DS_05_EXIT_GOVERNED and DoctrineSection.DS_10_FAILURE_COST_SYSTEM, provide explicit reason, and expire within defined timeframe.

---

## S5: Reset-Abuse Persistent Test

**Code:** `S5_RESET_ABUSE_UNBLOCKED`

**Trigger:** Occurs when ambiguity flags include "reset_abuse_detected" but the system failed to block reset or manipulation attempts.

**Rationale:** Patterns of abusive state resets or session manipulation must be detected and prevented. These patterns indicate attempts to circumvent safety mechanisms.

**Doctrine Sections:** DS_10_FAILURE_COST_SYSTEM, DS_13_VIOLATION_IS_DECISION

**Override Requirements:** Must reference DoctrineSection.DS_10_FAILURE_COST_SYSTEM and DoctrineSection.DS_13_VIOLATION_IS_DECISION, provide explicit reason, and expire within defined timeframe.

---

## Enforcement Mechanism

Soft invariants are evaluated for each `SelfEvent` before persistence:

1. Violations are collected with specific codes and messages
2. Valid overrides are checked against referenced doctrine sections
3. Unapproved violations cause a `DoctrineViolation` exception
4. This prevents "silent drift" in telemetry and enforces accountability

---

## Adding New Invariants

When adding new soft invariants:

1. Assign a unique code starting with `S{N}_`
2. Provide clear trigger conditions
3. Reference relevant doctrine sections
4. Ensure override mechanism supports the new sections
5. Update this document immediately

---

## Future Invariants

The following invariants are planned for future implementation:

- Hook detection and prevention during uncertain exits
- Confidence threshold validations for state transitions
- Resource suggestion adequacy checks

*(This document will be updated as new invariants are defined)*
