# Security Overview

This is a practical security overview for teams evaluating SELF for production.

If you need deeper detail, see:
- `technical/SELF-SECURITY.md` (security architecture summary)
- `technical/THREAT-MODEL.md` (canonical threat model)
- `SECURITY_DOCUMENTATION.md` (override prevention / invariants)

---

## What SELF is securing

SELF’s security goal is **harm prevention through conservative constraint** on support-critical AI behavior.

Security in SELF is not “prevent all attacks on the internet”; it is preventing these operational failures:
- unsafe behavior under emotional load
- silent weakening of constraints over time (“safety drift”)
- un-auditable decisions (“we can’t explain what happened”)
- implementation shortcuts that bypass governance steps

---

## Core security mechanisms (high-level)

SELF implements defense in depth:
- **input + state detection** (S0–S3 posture selection)
- **policy enforcement** (explicit constraints per posture)
- **output validation + repair** (postflight gate before shipping)
- **logging hooks** (pre/post events for auditability)
- **integrity controls** (guardrails against bypass/override patterns)

---

## Operational security responsibilities (your side)

To operate SELF securely, you must still:
- control secrets (API keys, env vars, log paths)
- restrict network access to the HTTP service
- enforce rate limiting at the edge (SELF can also rate limit)
- store logs securely (treat them as sensitive)
- maintain escalation paths (human support, crisis resources)

---

## What “secure integration” means

Secure integration is not optional:
- always call `/v1/pre` before generating a model draft
- always call `/v1/post` and ship only the returned output
- honor clarifier requirements and escalation behaviors

If an integration skips these steps, SELF’s guarantees do not apply.

