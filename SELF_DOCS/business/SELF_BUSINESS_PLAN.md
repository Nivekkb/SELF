# SELF (Support‑First Logic Engine) — Business Plan (Draft)

Version: 0.1  
Last updated: 2025-12-26  
Status: Draft for internal use / investor conversations (non-confidential summary version)

> This document is a working business plan for the **SELF (Support‑First Logic Engine)** technology. It is **not** a securities offering, and it does not constitute legal, tax, or investment advice. Replace placeholders (in `[[DOUBLE_BRACKETS]]`) with your specifics.

## 0) Executive Summary

SELF is a safety and governance layer designed to prevent AI systems from making emotional interactions worse. It focuses on the “everyday human cost” of AI interactions: distress amplification, invalidation, coercion, manipulation, boundary violations, and unsafe handling of vulnerable states.

**Thesis:** As AI becomes embedded in customer support, coaching, therapy-adjacent experiences, education, and workplace tools, **emotional safety** becomes both (1) a product requirement and (2) a governance/compliance requirement. SELF is a packageable layer that helps AI builders reliably implement support-first behavior with testable guarantees and operational controls.

**Business:** B2B licensing + assurance + integration services (with an eventual “SELF Compliance Kit” product). Market entry is via high-liability, high-trust AI experiences where safety failures are expensive.

**Funding goal:** [[RAISE_AMOUNT]] (equity / SAFE / priced round) to accelerate productization, assurance tooling, and enterprise partnerships.

## 1) Problem

AI is increasingly used in emotionally charged contexts:

- Customer support and complaints
- Coaching and mental wellness
- Education and youth-facing products
- Community moderation / social features
- Care navigation (therapy-adjacent, not clinical care)
- HR and workplace wellbeing

In these settings, “alignment” is not only about refusing harmful requests. A safe system must also avoid:

- escalating distress
- shaming/invalidating a user
- romantic/sexual boundary violations
- manipulative dependency loops
- unsafe crisis handling
- pseudo-clinical claims
- privacy leaks and social engineering vectors

Most teams patch these problems ad hoc with prompt rules. That approach is brittle, hard to test, and difficult to audit.

## 2) Solution: What SELF Is

SELF is a system of:

- **Policy profiles** (e.g., public-consumer) that constrain style, refusal behavior, escalation, and crisis overlays
- **State detection** for the user’s emotional risk level (e.g., S0–S3) and corresponding response constraints
- **Repair / enforcement functions** that rewrite or block unsafe model output
- **Governance documents** that define immutable principles and change control
- **Assurance mechanisms** (tests, bounties, disclosure levels) that make “safety” operational

SELF is designed to be integrated as a layer between:

1) user input → model prompt/tooling  
2) model output → end user

## 3) Product Offerings (Draft)

### 3.1 SELF Core (SDK)

**Who it’s for:** teams building LLM products with emotionally loaded interactions.  
**What they get:** enforcement functions, state modeling, guardrails, and test harnesses.

Deliverables:
- Node/TS package (current repo) with stable APIs
- Policy profile bundles
- Reference tests + red-team scripts
- Integration docs and checklists

#### 3.1.1 Explicit Commitments (Pre‑Seed, Product Promises)

These are product commitments for SELF Core; they are intended to be **operationally enforceable** (via versioning, tests, and logs), not “marketing claims.”

**API stability guarantees**
- **Semantic versioning:** breaking changes only on major versions.
- **Stability surface:** core public APIs are treated as stable once marked `stable` in release notes (initially: policy profiles, state detection outputs, repair/enforcement entrypoints).
- **Deprecation policy:** when we must change a stable API, we provide (a) a deprecation notice, (b) a migration guide, and (c) a compatibility window of **at least 1 minor release** (or **[[DEPRECATION_DAYS]] days**, whichever is longer).
- **Compatibility target:** patch/minor releases must be drop‑in upgrades for the stable surface (no behavioral regressions outside documented fixes).

**Logging design (auditability by default)**
- **Structured audit events:** SELF emits structured, machine-readable audit events describing safety-relevant decisions (e.g., detected state, overlays applied, repair actions taken, key failure modes).
- **Privacy-first payloads:** audit events are designed to avoid raw user content by default; when content is required for debugging, it is opt-in and configurable.
- **Deterministic schemas:** event names and fields are versioned; schema changes follow semver and include migration notes.
- **Integratable sinks:** events can be routed to a customer’s existing logging pipeline (stdout/jsonl, SIEM, data warehouse) without requiring a managed service.

**Regression and reliability commitment**
- **Release gates:** we do not publish a release unless the regression suite passes (core tests + policy conformance tests + known failure-mode fixtures).
- **Public failure-mode tracking:** issues that change safety behavior are mapped to documented failure modes and referenced in release notes.
- **Emergency response:** critical safety regressions trigger hotfix releases on the current stable major, with postmortem notes.

### 3.2 SELF Assurance (Program + Tooling)

**Who it’s for:** orgs needing evidence of safety posture.

Deliverables:
- Assurance bounty program (public/private variants)
- Evaluation harnesses + audit logs
- “Guarantee Matrix” and failure-mode documentation
- Change control and governance mapping

### 3.3 SELF Compliance Kit (Product)

**Who it’s for:** regulated or reputation-sensitive deployments.

Deliverables:
- Standard operating procedures (incident response, disclosure levels)
- Templates: customer comms, risk register, vendor assessment
- Enterprise reporting outputs (exportable audit events)
- Optional third-party review process (advisory board / reviewer program)

### 3.4 Services (Integration + Training)

Packaged services:
- Integration architecture and PR reviews
- Red-team facilitation
- Internal training for support-first interaction patterns

## 4) Why Now

- LLMs are entering “high empathy” surfaces rapidly.
- Regulators and platforms increasingly scrutinize harm in AI systems (even outside classic “safety” refusal categories).
- Enterprises want measurable risk reduction, not only “prompt guidelines.”
- Brand trust and churn are directly impacted by emotional harm events.

## 5) Differentiation / Moat

SELF differentiates by treating emotional safety as a **governance and assurance** problem, not only a prompt problem.

### 5.1 Why SELF Wins (Sharp Version)

**Behavior reliability under emotional load**
- SELF is state-aware (risk-sensitive constraints), not a one-size prompt.
- It enforces behavior via repair/containment logic, not “please follow the rules.”
- It is built to reduce the probability of the most common real-world harms: escalation, invalidation, coercion, boundary violations, and unsafe crisis handling.

**Governance as operating reality (not paperwork)**
- The governance layer is tied to enforcement and change control: policy profiles, documented failure modes, release gates, and audit events.
- “We are safe” becomes something you can **test, monitor, and explain**, not a PDF.

**Assurance as a product**
- Buyers can obtain structured artifacts (guarantee matrix mapping, failure mode coverage, auditability) that support procurement and defensible claims.
- The incentive structure funds ongoing safety work as adoption grows.

**Integration-first**
- SELF is packaged as an SDK layer that can sit between any model and any app surface.
- This avoids vendor lock-in and lets teams keep their own stack while hardening behavior.

### 5.2 Moat Components

- **Doctrine + governance layer** that constrains “what we ship” and how changes are ratified
- **Testability**: defined failure modes and enforceable repair logic
- **Operationalization**: incident response and assurance artifacts that enterprises can adopt
- **Distribution via trust**: safety credibility and alignment gating as a brand

## 6) Target Customers and Use Cases

Primary initial targets:
- AI companions / coaching platforms (non-clinical)
- Customer support copilots and “agentic support”
- Education platforms and youth-facing apps (high sensitivity)
- Community/group chat moderation assistants

Buyer personas:
- Head of Product / GM
- Trust & Safety / Risk
- Security / Privacy
- Legal / Compliance

## 7) Go-To-Market (GTM)

### 7.1 Beachheads

1) “High-trust, high-risk” startups shipping fast but needing safety credibility  
2) Mid-market companies adding AI to support/community surfaces  
3) Enterprise pilots where assurance artifacts are mandatory

### 7.2 Motion

- **Developer-led** entry: SDK + docs + public artifacts
- **Safety-led** close: assurance outputs + risk mitigation
- **Land-and-expand**: start with a single surface (support chat), expand to other products

### 7.3 Sales Assets (already in repo)

Use these as collateral (see `SELF_DOCS`):
- Executive brief and product overview
- Guarantee matrix
- Threat model and security docs
- Buyer protection explainer and alignment criteria

## 8) Business Model

### 8.1 Pricing (Draft)

Use the existing pricing framework as a base:
- `SELF_DOCS/business/SELF-PRICING.md`

Suggested packaging (public list pricing, USD):
- **SELF Core (Starter)**: $300 / month (up to 5,000 MAU)
- **SELF Core (Growth)**: $750 / month (up to 25,000 MAU)
- **SELF Core (Scale)**: $2,000 / month (up to 100,000 MAU)
- **SELF Core (Enterprise)**: annual contract (starts at $36,000 / year)
- **Assurance Proof add-on**: $7,500 / year (Lite), $25,000 / year (Standard), $75,000 / year (Enterprise)
- **Managed add-ons** (optional): usage-billed (e.g., managed evaluation runner, hosted assurance telemetry)
- **Services**: fixed-fee integration and workshops

### 8.2 “Values-aligned licensing”

SELF’s business model includes deliberate constraints:
- alignment criteria for buyers
- license termination and safety obligations
- “not-for-everyone” boundaries

## 9) Operations Plan

Core functions to build:
- Engineering: SDK hardening, API stability, integration docs
- Assurance: evaluation harnesses, bounty ops, reviewer program
- Partnerships: early lighthouse customers
- Legal: licensing and offering documentation

Milestones (draft):
- M0: stable SDK API + integration guides
- M1: enterprise-ready audit exports
- M2: compliance kit
- M3: lighthouse deployments + case studies

## 10) Team

Founder: [[FOUNDER_NAME]]  
Role: product + safety doctrine + architecture

Near-term hires (12 months, draft):
- Full-stack / SDK engineer
- Security/assurance engineer
- Partnerships / GTM lead (or fractional)
- Ops / program manager (bounty + reviews)

## 11) Financial Plan (Template)

This is a placeholder structure; insert your real numbers.

Inputs:
- pricing tiers and average contract value
- churn assumptions
- COGS (LLM usage if bundled, otherwise minimal)
- support and assurance cost per customer

Outputs:
- 24-month forecast
- break-even analysis
- sensitivity scenarios

Recommended: keep a spreadsheet model and summarize here.

## 12) Use of Proceeds (Draft)

Allocation of [[RAISE_AMOUNT]]:
- [[PCT_ENGINEERING]]% engineering (SDK hardening, packaging)
- [[PCT_ASSURANCE]]% assurance tooling and program ops
- [[PCT_GTM]]% GTM, partnerships, customer success
- [[PCT_LEGAL]]% legal, licensing, governance, offering costs
- [[PCT_RUNWAY]]% operating buffer

## 13) Risks and Mitigations (High Level)

Key risks:
- technical: safety is hard; edge cases persist
- market: buyers may underinvest in safety until an incident
- legal: claims must be carefully framed; avoid medical claims
- competitive: platform vendors may add safety layers

Mitigations:
- focus on assurance artifacts and proof, not marketing claims
- prioritize high-liability segments where safety is a budget line
- maintain doctrine + governance as differentiators

## 14) Appendix: Canonical SELF References in This Repo

Start here:
- `README.md`
- `SELF_DOCS/public/executives/EXECUTIVE-BRIEF.md`
- `SELF_DOCS/public/executives/SELF_PRODUCT_OVERVIEW.md`
- `SELF_DOCS/public/reviewers/SELF_SAFETY_GUARANTEE_MATRIX.md`
- `SELF_DOCS/public/technical/THREAT-MODEL.md`
- `SELF_DOCS/business/SELF-PRICING.md`
