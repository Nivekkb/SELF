# SELF (Support‑First Logic Engine) — Pre‑Seed Equity Offering Memorandum (Draft Template)

Version: 0.1  
Last updated: 2025-12-26  
Status: Draft template (pre‑seed)

> This document is a **template** intended to help you organize an investor-facing memorandum for the SELF technology. It is **not** legal advice and is **not** a solicitation. Securities offerings have jurisdiction-specific requirements; you should review this with qualified counsel before distribution.

## 0) Notice / Confidentiality

This memorandum (the “Memorandum”) is provided solely to selected prospective investors on a confidential basis for evaluating a possible investment in **[[ISSUER_LEGAL_NAME]]** (the “Company”). This Memorandum does not constitute an offer to sell or the solicitation of an offer to buy any securities in any jurisdiction where such offer or solicitation would be unlawful.

No person has been authorized to provide information different from, or in addition to, that contained in this Memorandum. Any such information must not be relied upon.

Forward-looking statements involve risks and uncertainties. Actual results may differ materially.

## 1) Offering Summary (Pre‑Seed)

### 1.1 Issuer
- **Legal name:** [[ISSUER_LEGAL_NAME]]
- **Jurisdiction of incorporation:** [[JURISDICTION]]
- **Registered address:** [[REGISTERED_ADDRESS]]
- **Website:** [[SELF_WEBSITE_OR_LANDING_PAGE]]
- **Primary contact:** [[FOUNDER_NAME]], [[FOUNDER_EMAIL]]

### 1.2 What Is Being Financed
The Company is developing and commercializing **SELF (Support‑First Logic Engine)**, a safety + governance + assurance layer that helps AI systems avoid making emotional interactions worse and provides testable, operational safety guarantees.

This raise finances productization of SELF, enterprise readiness, assurance tooling, and early GTM.

### 1.3 Security Type (choose one)
Select the structure you are actually using:

Option A — SAFE:
- **Instrument:** SAFE (post‑money / pre‑money)  
- **Valuation cap:** [[VALUATION_CAP]]  
- **Discount:** [[DISCOUNT]]  
- **MFN:** [[YES_NO]]  
- **Pro‑rata / side letter:** [[YES_NO]]  

Option B — Convertible Note:
- **Principal:** [[NOTE_PRINCIPAL]]  
- **Interest:** [[INTEREST_RATE]]  
- **Maturity:** [[MATURITY_DATE]]  
- **Conversion discount / cap:** [[DISCOUNT_CAP]]  

Option C — Priced Equity Round:
- **Security:** Common / Preferred [[SERIES]]  
- **Pre‑money valuation:** [[PREMONEY]]  
- **Amount raised:** [[RAISE_AMOUNT]]  

### 1.4 Round Size, Minimums, and Closing
- **Target raise:** [[RAISE_AMOUNT_TARGET]]
- **Hard cap:** [[HARD_CAP]]
- **Minimum investment:** [[MIN_CHECK]]
- **Close mechanics:** rolling closes / single close on [[DATE]]
- **Use of proceeds runway:** [[RUNWAY_MONTHS]] months (base plan)

### 1.5 Use of Proceeds (summary)
High-level use of funds:
- [[PCT_ENGINEERING]]% engineering (SDK hardening, integration paths, packaging)
- [[PCT_ASSURANCE]]% assurance tooling (tests, audit events, evaluation harness)
- [[PCT_GTM]]% GTM (lighthouse customers, partnerships, collateral)
- [[PCT_LEGAL]]% legal + IP + compliance
- [[PCT_BUFFER]]% operating buffer

### 1.6 Current Stage (Pre‑Seed)
- **Company stage:** pre‑seed
- **Product stage:** [[MVP / BETA / GA]]  
- **Current traction:** [[USERS / PILOTS / REVENUE / LOIs]]  
- **Key milestones next 12 months:** see Section 6

## 2) Company & Product Overview

### 2.1 Mission
To make emotionally safe AI interactions the default by providing a practical, enforceable, testable safety layer for AI systems in emotionally charged contexts.

### 2.2 The Problem SELF Solves
In real-world deployments, AI failures often show up as:
- emotional escalation and invalidation
- boundary violations (e.g., coercive or dependency-forming behavior)
- unsafe handling of crisis signals
- misaligned “helpfulness” under vulnerability
- untestable, non-auditable safety posture

### 2.3 The SELF Approach (high-level)
SELF is built around:
- **Support-first policies** (what the system should do and avoid)
- **State-aware constraints** (risk-sensitive response rules)
- **Repair/enforcement** of model output
- **Governance layer** and change control
- **Assurance artifacts**: tests, threat model, guarantee matrix

This converts “safety intent” into enforceable behavior and evidence.

## 3) Market

### 3.1 Ideal Early Customers
Segments where emotional safety failures create material risk:
- AI customer support / complaint resolution
- coaching and wellness (non-clinical)
- education and youth-facing experiences
- community moderation / group chat facilitation

### 3.2 Buyer Personas
- Product owners shipping AI features
- Trust & Safety / Risk leads
- Security / Privacy and Legal stakeholders

### 3.3 Market Drivers
- growing AI adoption in “high empathy” surfaces
- rising regulatory scrutiny on harm (beyond refusal categories)
- enterprise demand for auditability and incident readiness

## 4) Business Model

### 4.1 Revenue Streams (planned)
- **B2B licensing** of SELF (SDK)
- **Assurance program** (evaluation + artifacts + review cadence)
- **Integration services** (fixed-fee packages)
- (optional) **Compliance kit** product for regulated deployments

### 4.2 Pricing Philosophy
Pricing should align with:
- liability and risk reduction value
- customer scale (MAU, sessions, seats)
- level of assurance and support

See: `SELF_DOCS/business/SELF-PRICING.md`

## 5) Technology, IP, and Defensibility

### 5.1 Technology Components
- policy profiles
- state detection and overlays
- repair/enforcement functions
- audit event schema
- test harnesses and red-team tooling

### 5.2 IP Position (fill in)
- **Ownership:** [[IP_OWNERSHIP_STATEMENT]]
- **Open source / proprietary split:** [[OSS_SPLIT]]
- **Trademarks:** [[TRADEMARKS]]

### 5.3 Defensibility
Moat is built via:
- governance + doctrine that competitors rarely operationalize
- testable guarantees and assurance practices
- integration maturity and enterprise adoption

## 6) Roadmap & Milestones (12 months)

Insert your specific milestones. Example structure:

Q1:
- stabilize SDK APIs; integration guides for 1–2 platforms
- publish/refresh guarantee matrix and failure modes

Q2:
- audit export / compliance reporting
- first lighthouse deployments (LOIs → pilots → paid)

Q3:
- compliance kit v1 + incident response playbooks
- reviewer program / third-party assurance pathway

Q4:
- expand to additional use-cases; refine pricing; case studies

## 7) Team

### 7.1 Founder(s)
- [[FOUNDER_NAME]] — [[BACKGROUND_SUMMARY]]

### 7.2 Planned Key Hires (pre‑seed appropriate)
- SDK engineer
- assurance/security engineer
- GTM/partnerships (fractional or first hire)

## 8) Financials (High Level)

At pre‑seed, investors typically expect:
- an operating budget for the next 12–18 months
- assumptions behind pricing and sales cycle
- burn and runway under base/bear scenarios

Attach:
- `[[FINANCIAL_MODEL_FILE]]` (spreadsheet)

## 9) Risk Factors (Illustrative, Not Exhaustive)

Investing in early-stage companies is high risk. Risk factors include:

- **Technical risk:** emotional safety is complex; failures may occur.
- **Product risk:** integration burden may slow adoption.
- **Market risk:** buyers may under-invest until incident-driven.
- **Regulatory/claims risk:** messaging must avoid medical/clinical claims.
- **Security/privacy risk:** any AI stack can be attacked or misused.
- **Competitive risk:** large vendors may ship partial substitutes.
- **Key-person risk:** pre‑seed execution relies heavily on founder(s).

## 10) Legal / Compliance Notes (Template)

- This is an early-stage technology offering. Do not represent SELF as guaranteeing outcomes in clinical/medical settings.
- Ensure your contracts, marketing, and documentation match your actual capabilities.
- Confirm securities compliance (investor qualification, exemptions, disclosures) with counsel.

## 11) Subscription / Included Documents (Data Room)

This memorandum is supported by the attached or referenced documents listed in:
- `SELF_DOCS/business/SELF_DATA_ROOM_INDEX.md`

## Appendix A — Deal Terms (Fill-In Sheet)

- **Instrument:** [[SAFE/NOTE/EQUITY]]
- **Target:** [[RAISE_AMOUNT_TARGET]]
- **Cap / pre-money:** [[VALUATION_CAP_OR_PREMONEY]]
- **Discount:** [[DISCOUNT]]
- **Pro-rata:** [[YES_NO_DETAILS]]
- **MFN:** [[YES_NO]]
- **Board:** [[BOARD_PLAN]]
- **Information rights:** [[YES_NO]]
- **Closing date:** [[DATE]]

