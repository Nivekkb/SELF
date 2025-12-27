# Case Studies (Anonymized)

These are anonymized examples to show how SELF is used in practice. They are illustrative, not exhaustive.

---

## Case Study 1 — B2B SaaS support assistant

**Surface:** billing/account support inside a product.

**Observed risk:**
- hallucinated policy promises (“we refunded you”)
- inconsistent rules applied across sessions
- escalation gaps in distressed user interactions

**SELF configuration emphasis:**
- hard caps (questions/words) to reduce runaway interactions
- banned phrase enforcement for liability triggers
- audit logging hooks for post-incident review
- strict postflight validation before any message ships

**Outcome:** fewer “helpful” promises that become liabilities; higher reliability under load; easier auditability for enterprise stakeholders.

---

## Case Study 2 — Youth wellbeing check‑in

**Surface:** daily check-ins and emotional support prompts.

**Observed risk:**
- distress escalation with ambiguous language
- boundary drift into therapeutic claims
- unsafe “confident tone” under uncertainty

**SELF configuration emphasis:**
- state posture selection (S2/S3) with conservative defaults
- mandatory crisis resources and escalation behaviors when required
- question caps to avoid interrogation dynamics
- no “silent downgrades” posture (integrity-first operations)

**Outcome:** improved reliability under emotional load and clearer operational evidence for reviewers.

