# SELF™ DESIGN DOCTRINE

**Support-First Logic Engine**
*(Canonical – Frozen)*

---

## 0. Scope and Authority

This doctrine governs all behavior of SELF, including:

- state detection
- response constraints
- exit decisions
- logging
- metrics interpretation
- failure handling

No feature, optimization, or refactor may override this doctrine implicitly.
Any explicit violation must be documented, versioned, and justified.

---

## 1. SELF Is a Control Layer, Not a Generator

SELF does not generate responses.
SELF governs what responses are allowed, when, and under what constraints.

The language model is subordinate to SELF.

If the model output conflicts with SELF constraints, the output is invalid.

---

## 2. State Is an Inference, Not a Fact

All emotional states (S0–S3) are probabilistic interpretations, never certainties.

Therefore:

- State confidence and ambiguity must be logged
- Low confidence must alter system behavior
- No irreversible decision may rely on high-confidence assumptions alone

SELF assumes it can be wrong.

---

## 3. Cold-Start Is Governed by Containment, Not Classification

During the first N turns (cold start):

- SELF assumes insufficient information
- Exit is biased toward containment
- Early recovery is not inferred
- Linguistic calm is treated as unreliable

Cold-start behavior must reflect epistemic humility, even at the cost of friction or attrition.

---

## 4. Recovery Requires Affirmative Stabilization

Return to normal conversational mode (S0) is permitted only when at least one affirmative stabilization signal is present:

Examples include:

- somatic grounding confirmation
- temporal orientation
- agency with continuity

Absence of distress, politeness, gratitude, or exit language do not constitute recovery.

---

## 5. Exit Is a Governed Outcome

Leaving the system is not incidental.
Every exit must be classified as one of the following:

a) **EXIT_RECOVERY_CONFIRMED**
Recovery is explicitly confirmed under sufficient confidence.

b) **EXIT_SAFE_DISENGAGEMENT**
User exits while distress cues or uncertainty remain.
No recovery is assumed.

c) **EXIT_UNSAFE_BLOCKED**
Exit is denied due to imminent risk requiring containment.

No other exit semantics are permitted.

---

## 6. Autonomy Is Respected Without Abandonment

SELF must not:

- coerce continued interaction
- falsely infer safety
- emotionally over-attach at exit

When exit is allowed under uncertainty:

- responsibility remains with the system
- uncertainty is logged
- a neutral return path is provided
- no emotional hooks are used

---

## 7. Restraint Must Be Explainable

When SELF chooses not to act:

- the considered action must be logged
- the blocking rule must be logged
- uncertainty must be visible

Silence without rationale is treated as a system failure.

---

## 8. Metrics Observe Safety — They Do Not Define It

Metrics (EVR, PRR, CIAP, etc.) are diagnostic signals only.

They may not:

- redefine success
- override policy
- justify unsafe behavior

Safety policy constrains metrics, not the reverse.

---

## 9. Attrition Is an Accepted Safety Cost

Containment-induced disengagement (CIAP) is:

- neither success nor failure
- an expected outcome under uncertainty

Reducing harm takes precedence over maximizing retention.

---

## 10. Failure Must Cost the System, Not the User

When SELF fails:

- the system absorbs the cost (halt, degrade, restrict)
- the user is not blamed
- the logs must make the failure legible

Kill-switch conditions must be mechanical, not discretionary.

---

## 11. Demo, Test, and Production Are Strictly Separated

Simulated data must never:

- influence safety metrics
- trigger thresholds
- appear as real telemetry

All data must be provenance-tagged and visibly marked.

---

## 12. Known Unsafe Outcomes Must Be Named

SELF acknowledges that some risks remain unavoidable, including:

- silent disengagement after containment
- false negatives under metaphorical distress
- identity reset cold-start blindness

These are documented, monitored, and bounded — not denied.

---

## 13. Any Violation of This Doctrine Is a System Decision

Breaking this doctrine is not a mistake.
It is a conscious override and must be recorded as such.

Unconscious drift is the primary enemy.

---

## 14. Repetition Does Not Increase Permissibility

Repetition without new information does not increase response permissibility.

Repetition of doctrine principles, while reinforcing safety, does not enhance the permissibility of a response if the underlying conditions remain unchanged.

New information or changed context is required for permissibility assessment.

---

## Closing Constraint

SELF is not designed to feel good.
SELF is designed to fail conservatively, visibly, and honestly.

Any change that improves comfort at the expense of truth is a regression.

---

## Final instruction to future-you

If you ever find yourself wanting to "simplify" this:

1. Stop.
2. Re-read Section 10.
3. Then decide whether you are willing to own the new failure mode.
