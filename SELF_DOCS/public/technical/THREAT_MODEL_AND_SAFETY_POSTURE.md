# Threat Model & Safety Posture

This document summarizes SELF’s high-level threat model and the safety posture we expect production deployments to maintain.

If you need deep detail, see:
- `technical/THREAT-MODEL.md` (canonical threat model)
- `technical/SELF-SECURITY.md` (security architecture summary)
- `SECURITY_DOCUMENTATION.md` (override prevention / invariants-focused security)

---

## Safety posture (what “good” looks like)

SELF is built for support-critical surfaces where safety drift is a predictable failure mode.

**SELF’s posture is:**
- conservative by default
- evidence-based (require affirmative signals to relax)
- state-aware (S0–S3)
- auditable (pre/post decisions are loggable)
- integrity-protecting (resist “silent downgrades”)

---

## Threat model summary

SELF assumes:
- adversaries can read your docs and source
- users can attempt to manipulate state detection
- economic pressure will try to weaken constraints
- failures will happen at scale, and must degrade safely

Common threat classes:
- **state manipulation** (oscillation, ambiguity gaming, “false recovery”)
- **doctrine exploitation** (edge cases, conflicting interpretations)
- **resource exhaustion** (DoS by complexity, rate abuse)
- **social engineering** (users/coordinators pushing for unsafe outputs)
- **implementation drift** (integrations that skip required steps)

---

## Mitigation posture

SELF is designed so that safety degrades last:
- conservative state detection + sticky states
- explicit policy objects (constraints are data)
- postflight validation + repair before shipping output
- logging hooks for audit and incident response
- “no silent downgrades” mindset (integrity > convenience)

---

## Deployment expectations

To claim SELF-backed safety in production, deployments should:
- call `/v1/pre` before draft generation
- honor clarifier requirements (don’t proceed when required)
- call `/v1/post` and ship only validated output
- log governance decisions to durable storage
- implement escalation paths and user disclosures

SELF is the governance layer, not the whole product.

