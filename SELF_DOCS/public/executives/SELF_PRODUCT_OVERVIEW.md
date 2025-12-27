# SELF™ Product Overview

## Support‑First Logic Engine

### Runtime governance for support‑critical AI

**Public overview (draft)** | **Last updated: 2025-12-26**

---

## What SELF is

SELF (Support‑First Logic Engine) is a **runtime governance engine** that prevents emotional-harm failure modes in support‑critical AI systems.

SELF does not replace your model, your product policy, your compliance program, or your human escalation paths. It turns governance into **enforceable runtime constraints** and **audit-ready signals**.

---

## Where SELF sits

SELF sits between your support surface and your model/tools:

1) **Preflight** (before generating a draft): detect state (S0–S3) and select an explicit policy
2) **Draft** (your model/tools): generate a response using your stack
3) **Postflight** (before shipping): validate (and when possible repair) the draft to match the policy

This is why SELF is a governance engine: it makes your “safety policy” something the system has to obey, not something written in a PDF.

---

## How it works (high level)

### 1) Preflight: state + policy
SELF returns a policy object containing enforceable constraints (caps, disallowed content, posture requirements) and metadata. In higher-risk contexts, SELF may require a clarifying question or escalation framing.

### 2) Postflight: validate + repair
After your model drafts a response, SELF validates it against the policy. If there are violations, SELF attempts to repair the response into a compliant form. Your product should ship only the validated output.

### 3) Audit hooks (recommended)
SELF supports structured pre/post logging so teams can monitor behavior and keep governance stable over time. Log retention, access control, and incident response remain your operational responsibility.

---

## What you get

### For builders
- Support‑critical posture selection (S0–S3)
- Enforceable caps and behavioral constraints
- Draft validation/repair gate before responses ship
- Self‑hosted HTTP API mode for fast integration (or embed as a library)

### For organizations
- Reduced “safety drift” risk by enforcing governance steps in the request path
- Audit-ready signals for review, incident response, and stakeholder communication
- Optional Assurance Proof program for procurement-grade evidence (when purchased)

---

## What SELF does not do

- It is not a medical device and does not provide professional diagnosis.
- It does not replace crisis resources, disclosures, or human escalation.
- It does not guarantee perfect detection or perfect outcomes. It is a governance layer that is designed to degrade conservatively.

---

## Performance (humble + practical)

Performance depends on deployment environment, traffic shape, and how you integrate SELF into your pipeline. The intent is to keep governance overhead low and predictable, but teams should benchmark in their own infrastructure and treat any numbers as targets — not guarantees.

---

## Validation and assurance (roadmap intent)

SELF is early-stage. Validation should be treated as a program and evidenced per deployment rather than asserted globally.

Roadmap intent (subject to change):
- expand automated regression coverage and release gating
- formalize evaluation runbooks and evidence artifacts
- enable third‑party review/audits as the program matures

If you need procurement-grade evidence, use the Assurance Proof program and require explicit artifacts rather than relying on generalized claims.

---

## Future roadmap (intent)

Near-term focus:
- expand integration guidance and examples
- improve evaluation tooling and incident runbooks
- tighten governance evidence and reporting workflows

Longer-term intent:
- broader multi-surface/multi-user safety patterns
- deeper assurance workflows as enterprise requirements mature

---

## Contact Information

- **Website**: GovernedBySELF.com
- **Support**: [Kevin@GovernedBySELF.com](mailto:Kevin@GovernedBySELF.com)
- **Research**: [Kevin@GovernedBySELF.com](mailto:Kevin@GovernedBySELF.com)
- **Sales**: [Kevin@GovernedBySELF.com](mailto:Kevin@GovernedBySELF.com)

---

**© 2024 SELF Project. All rights reserved.**

