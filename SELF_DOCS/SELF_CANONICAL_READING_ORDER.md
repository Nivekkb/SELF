# SELF Canonical Reading Order

## Official Guide to Understanding the SELF Safety System

### Overview

This document provides the authoritative reading order for understanding the SELF (Support-First Logic Engine) system. The documentation is extensive and interconnected, so following this canonical order ensures comprehensive understanding while avoiding confusion from prerequisite gaps.

**Reading Philosophy**: Start with high-level concepts, progress to implementation details, then move to validation and governance. Different audiences have different entry points but converge on core safety understanding.

---

## Reading Order by Audience

### 1. Executive Stakeholders & Decision Makers

**Purpose**: High-level understanding for business decisions, risk assessment, and strategic planning
**Estimated Time**: 4-6 hours total
**Entry Point**: Business and safety overview

#### Phase 1: Strategic Understanding (2 hours)
1. **README.md** (30 min) - Project overview, features, philosophy
   - *Prerequisites*: None
   - *Key Takeaways*: What SELF does, core principles

2. **packages/self-engine/SELF_DOCS/executives/EXECUTIVE-BRIEF.md** (60 min) - Strategic acquisition framework
   - *Prerequisites*: README.md
   - *Key Takeaways*: Business case, pricing, risk framework

3. **ASSURANCE-STATUS.md** (30 min) - Current program status
   - *Prerequisites*: EXECUTIVE-BRIEF.md
   - *Key Takeaways*: Program timeline and transparency

#### Phase 2: Risk and Safety Overview (2-3 hours)
4. **packages/self-engine/SELF-DESIGN-DOCTRINE.md** (60 min) - Foundational safety principles
   - *Prerequisites*: README.md
   - *Key Takeaways*: Immutable safety rules, core philosophy

5. **packages/self-engine/SELF-FOUNDATION.md** (45 min) - System purpose and identity
   - *Prerequisites*: SELF-DESIGN-DOCTRINE.md
   - *Key Takeaways*: What SELF is and isn't, success metrics

6. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission and objectives
   - *Prerequisites*: SELF-FOUNDATION.md
   - *Key Takeaways*: Goals, boundaries, success criteria

#### Phase 3: Validation and Assurance (1-2 hours)
7. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (60 min) - Safety claims evidence
   - *Prerequisites*: Previous safety documents
   - *Key Takeaways*: Validation status, audit results, performance metrics

8. **packages/self-engine/REVIEWER-README.md** (45 min) - Validation checklist
   - *Prerequisites*: Ledger understanding
   - *Key Takeaways*: How to verify system safety

**Exit Point**: Executives now understand business case, safety approach, and validation status.

---

### 2. Safety Reviewers & Auditors

**Purpose**: Comprehensive validation of system safety claims and compliance
**Estimated Time**: 16-20 hours total
**Entry Point**: Foundational safety principles

#### Phase 1: Core Safety Understanding (6 hours)
1. **packages/self-engine/SELF-DESIGN-DOCTRINE.md** (60 min) - Immutable safety rules
2. **packages/self-engine/SELF-FOUNDATION.md** (45 min) - System identity and purpose
3. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission definition
4. **packages/self-engine/SELF-IDENTITY.md** (30 min) - System boundaries and constraints
5. **packages/self-engine/DESIGN-AXIOM.md** (45 min) - Foundational design principles

#### Phase 2: Technical Safety Architecture (6 hours)
6. **packages/self-engine/SELF-ARCHITECTURE.md** (60 min) - System design and invariants
7. **packages/self-engine/SELF-INVARIANTS-SYSTEM.md** (45 min) - Hard/soft invariants framework
8. **packages/self-engine/SELF-DOCTRINE-MATRIX.md** (45 min) - Doctrine-to-error mapping
9. **packages/self-engine/SELF-DOCTRINAL-ERRORS.md** (60 min) - Error classification system
10. **packages/self-engine/SELF-SAFETY-BOUNDARY.md** (45 min) - Boundary protection mechanisms

#### Phase 3: Safety Mechanisms (4 hours)
11. **packages/self-engine/SELF-HALT-CONTINUE.md** (45 min) - Exit decision logic
12. **packages/self-engine/SELF-SECURITY.md** (45 min) - Security architecture
13. **packages/self-engine/SELF-SAFETY-ENFORCEMENT-CONTRACT.md** (30 min) - Enforcement agreements
14. **packages/self-engine/SELF-SAFETY-PACKET.md** (30 min) - Safety implementation package
15. **VOICE-CONTRACTS.md** (30 min) - Voice data handling

#### Phase 4: Validation and Compliance (4-6 hours)
16. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (90 min) - Complete validation record
17. **packages/self-engine/REVIEWER-README.md** (60 min) - Validation checklist and procedures
18. **packages/self-engine/SELF_EXIT_GOVERNANCE_WHITEPAPER.md** (90 min) - Governance framework
19. **packages/self-engine/SELF_EXIT_FAILURE_POSTMORTEM.md** (60 min) - Failure analysis framework
20. **packages/self-engine/SELF_FAILURE_MODES_AND_BOUNDARY_CONDITIONS.md** (90 min) - System limitations
21. **packages/self-engine/SELF_SAFETY_GUARANTEE_MATRIX.md** (60 min) - Guarantee validation framework
22. **packages/self-engine/SELF_INTENTIONAL_TRADEOFFS.md** (60 min) - Design tradeoff documentation

**Exit Point**: Reviewers can comprehensively validate all safety claims and system compliance.

---

### 3. Developers & Engineers

**Purpose**: Technical implementation and system maintenance
**Estimated Time**: 12-16 hours total
**Entry Point**: System architecture and invariants

#### Phase 1: System Architecture (4 hours)
1. **packages/self-engine/SELF-ARCHITECTURE.md** (60 min) - System design principles
2. **packages/self-engine/SELF-INVARIANTS-SYSTEM.md** (45 min) - Invariants framework
3. **packages/self-engine/DESIGN-AXIOM.md** (45 min) - Design foundations
4. **packages/self-engine/SELF-SAFETY-BOUNDARY.md** (45 min) - Boundary implementation

#### Phase 2: Safety Implementation (5 hours)
5. **packages/self-engine/SELF-DOCTRINE-MATRIX.md** (45 min) - Error mapping
6. **packages/self-engine/SELF-DOCTRINAL-ERRORS.md** (60 min) - Error system
7. **packages/self-engine/SELF-HALT-CONTINUE.md** (45 min) - Exit logic
8. **packages/self-engine/SELF-SECURITY.md** (45 min) - Security controls
9. **packages/self-engine/SELF-SAFETY-ENFORCEMENT-CONTRACT.md** (30 min) - Enforcement patterns
10. **packages/self-engine/SELF_INTENTIONAL_TRADEOFFS.md** (45 min) - Implementation tradeoffs

#### Phase 3: Validation and Testing (5-6 hours)
11. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (60 min) - Validation requirements
12. **packages/self-engine/SELF_FAILURE_MODES_AND_BOUNDARY_CONDITIONS.md** (60 min) - System boundaries
13. **packages/self-engine/SELF_EXIT_FAILURE_POSTMORTEM.md** (45 min) - Failure analysis
14. **packages/self-engine/SELF_INTEGRATOR_RESPONSIBILITY_LIMITS.md** (45 min) - Integration boundaries
15. **packages/self-engine/SELF_DISCLOSURE_AND_ACCESS_LEVELS.md** (30 min) - Information access controls
16. **packages/self-engine/SELF_SAFETY_GUARANTEE_MATRIX.md** (45 min) - Guarantee validation
17. **packages/self-engine/REVIEWER-README.md** (45 min) - Testing procedures

**Exit Point**: Developers can implement, maintain, and validate the system safely.

---

### 4. AI Safety Researchers & Academics

**Purpose**: Deep understanding of safety mechanisms and research contributions
**Estimated Time**: 20-24 hours total
**Entry Point**: Foundational safety philosophy

#### Phase 1: Philosophical Foundations (6 hours)
1. **packages/self-engine/SELF-DESIGN-DOCTRINE.md** (60 min) - Safety philosophy
2. **packages/self-engine/SELF-FOUNDATION.md** (45 min) - System foundations
3. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission and objectives
4. **packages/self-engine/SELF-IDENTITY.md** (30 min) - System identity
5. **packages/self-engine/DESIGN-AXIOM.md** (45 min) - Design principles

#### Phase 2: Technical Deep Dive (8 hours)
6. **packages/self-engine/SELF-ARCHITECTURE.md** (60 min) - System architecture
7. **packages/self-engine/SELF-INVARIANTS-SYSTEM.md** (45 min) - Invariants framework
8. **packages/self-engine/SELF-DOCTRINE-MATRIX.md** (45 min) - Doctrine mapping
9. **packages/self-engine/SELF-DOCTRINAL-ERRORS.md** (60 min) - Error classification
10. **packages/self-engine/SELF-HALT-CONTINUE.md** (45 min) - Exit decision logic
11. **packages/self-engine/SELF-SAFETY-BOUNDARY.md** (45 min) - Boundary mechanisms

#### Phase 3: Validation and Research (6-8 hours)
12. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (90 min) - Research evidence
13. **packages/self-engine/SELF_FAILURE_MODES_AND_BOUNDARY_CONDITIONS.md** (90 min) - System limitations
14. **packages/self-engine/SELF_EXIT_FAILURE_POSTMORTEM.md** (60 min) - Failure research
15. **packages/self-engine/SELF_EXIT_GOVERNANCE_WHITEPAPER.md** (90 min) - Governance research
16. **packages/self-engine/SELF_SAFETY_GUARANTEE_MATRIX.md** (60 min) - Guarantee validation research
17. **packages/self-engine/SELF_INTENTIONAL_TRADEOFFS.md** (60 min) - Tradeoff research

#### Phase 4: Practical Application (2-4 hours)
18. **packages/self-engine/REVIEWER-README.md** (60 min) - Validation methodologies
19. **ASSURANCE-BOUNTY.md** (30 min) - Community research program
20. **LEGAL-DEFENSE-README.md** (45 min) - Legal research framework

**Exit Point**: Researchers can contribute to AI safety field and understand SELF's research implications.

---

### 5. Potential Buyers & Business Partners

**Purpose**: Due diligence and acquisition evaluation
**Estimated Time**: 8-10 hours total
**Entry Point**: Business and safety overview

#### Phase 1: Business Understanding (3 hours)
1. **README.md** (30 min) - System overview and features
2. **EXECUTIVE-BRIEF.md** (60 min) - Strategic framework and pricing
3. **ASSURANCE-STATUS.md** (30 min) - Program transparency
4. **BUYER-PROTECTION-EXPLAINER.md** (45 min) - Buyer protection mechanisms

#### Phase 2: Safety Assessment (4 hours)
5. **packages/self-engine/SELF-DESIGN-DOCTRINE.md** (45 min) - Safety philosophy
6. **packages/self-engine/SELF-FOUNDATION.md** (30 min) - System foundations
7. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission and boundaries
8. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (60 min) - Validation evidence
9. **packages/self-engine/SELF_SAFETY_GUARANTEE_MATRIX.md** (45 min) - Guarantee framework

#### Phase 3: Risk Evaluation (3-4 hours)
10. **packages/self-engine/SELF_FAILURE_MODES_AND_BOUNDARY_CONDITIONS.md** (60 min) - System limitations
11. **packages/self-engine/SELF_INTENTIONAL_TRADEOFFS.md** (45 min) - Design tradeoffs
12. **BUY-SELL-AGREEMENT-ESCROW.md** (45 min) - Acquisition terms
13. **VALUES-FIRST-SALES-CRITERIA.md** (45 min) - Evaluation criteria
14. **packages/self-engine/SELF_INTEGRATOR_RESPONSIBILITY_LIMITS.md** (30 min) - Integration responsibilities

**Exit Point**: Buyers can make informed acquisition decisions.

---

### 6. End Users & General Public

**Purpose**: Understanding system capabilities and limitations
**Estimated Time**: 2-3 hours total
**Entry Point**: User-friendly overview

#### Essential Reading (2 hours)
1. **README.md** (45 min) - System overview and features
   - *Focus*: Features, philosophy, user experience

2. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission and boundaries
   - *Focus*: What SELF does and doesn't do

3. **packages/self-engine/SELF-IDENTITY.md** (30 min) - System identity
   - *Focus*: Understanding system constraints

4. **packages/self-engine/SELF_EXIT_GOVERNANCE_WHITEPAPER.md** (45 min) - Safety governance
   - *Focus*: How user safety is protected

#### Optional Deep Dive (1 hour)
5. **packages/self-engine/SELF_EVIDENCE_AND_VALIDATION_LEDGER.md** (60 min) - Safety validation
   - *Focus*: Evidence of system reliability

**Exit Point**: Users understand system capabilities and trust in safety measures.

---

## Cross-Cutting Documents (Read as Needed)

### Legal and Compliance
- **packages/self-engine/SELF-COMMERCIAL-LICENSE.md** - Commercial licensing terms
- **packages/self-engine/SELF-LICENSE.md** - Open source licensing
- **packages/self-engine/LEGAL-DEFENSE-README.md** - Legal position and defense
- **THREAT-MODEL.md** - Security threat analysis
- **packages/self-engine/SELF_DISCLOSURE_AND_ACCESS_LEVELS.md** - Information access controls

### Business and Operations
- **BUY-SELL-AGREEMENT-ESCROW.md** - Acquisition terms
- **VALUES-FIRST-SALES-CRITERIA.md** - Buyer evaluation criteria
- **ASSURANCE-BOUNTY.md** - Community safety program
- **CONTRIBUTING.md** - Development contribution guidelines

### Technical Implementation
- **packages/self-engine/README.md** - Technical implementation guide
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **scripts/** - Build and deployment scripts
- **packages/self-engine/SELF_INTEGRATOR_RESPONSIBILITY_LIMITS.md** - Integration guidelines

---

## Reading Tips and Best Practices

### General Guidance
1. **Don't Skip Prerequisites**: Each document builds on previous understanding
2. **Take Breaks**: Complex safety concepts require mental processing time
3. **Reference as Needed**: Cross-reference between documents for clarity
4. **Focus on Your Role**: Different audiences need different depth levels

### Reading Strategies by Document Type

#### Foundational Documents (Philosophy/Identity)
- **Pace**: Read slowly, reflect on implications
- **Note-Taking**: Capture key principles and boundaries
- **Discussion**: Debate concepts with colleagues

#### Technical Documents (Architecture/Implementation)
- **Environment**: Set up development environment for hands-on understanding
- **Code References**: Examine actual implementation alongside documentation
- **Testing**: Run examples and verify behavior

#### Validation Documents (Evidence/Audits)
- **Skepticism**: Question claims and verify evidence chains
- **Patterns**: Look for consistency across multiple validation methods
- **Updates**: Check for recent entries and current status

#### Governance Documents (Policies/Processes)
- **Stakeholder Perspective**: Consider impact from different viewpoints
- **Practical Application**: Think about real-world implementation challenges
- **Improvement Opportunities**: Identify potential enhancements

### Quality Assurance Checklist

Before completing reading:
- [ ] Can you explain SELF's core safety philosophy?
- [ ] Do you understand the system's key limitations?
- [ ] Can you identify the main validation evidence?
- [ ] Are you familiar with governance processes?
- [ ] Can you discuss implementation challenges?

---

## Document Version Control

### Current Documentation Set
- **Version**: SELF v1.0 Complete Documentation Suite
- **Last Updated**: [Current Date]
- **Documents**: 30+ core documents + supporting materials
- **Total Pages**: ~600 pages across all documents

### Update Procedures
- **Major Releases**: Complete reading order review and updates
- **Minor Updates**: Section-specific modifications with cross-reference updates
- **Errata**: Corrections and clarifications distributed to all readers
- **New Documents**: Integrated into appropriate reading paths

### Document Status Legend
- ✅ **Current**: Up-to-date and authoritative
- 🔄 **Under Review**: Being updated or revised
- ⚠️ **Deprecated**: Superseded but kept for reference
- 📝 **Draft**: In development, not yet authoritative

---

## Support and Resources

### Getting Help
- **Documentation Issues**: File issues in the repository
- **Conceptual Questions**: Review foundational documents again
- **Technical Problems**: Check implementation guides
- **Safety Concerns**: Contact safety team immediately

### Additional Resources
- **Glossary**: Key terms and definitions
- **FAQs**: Common questions and answers
- **Examples**: Practical implementation examples
- **Community**: Discussion forums and support channels

### Feedback and Improvement
- **Reading Experience**: Share feedback on document clarity
- **Missing Information**: Report gaps in coverage
- **Suggested Improvements**: Propose enhancements to reading order
- **New Audiences**: Request customized reading paths

---

**Canonical Reading Order Version**: 2.0
**Effective Date**: [Current Date]
**Next Review Date**: [Date + 6 months]
**Maintenance Authority**: Documentation Team
