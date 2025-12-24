# SELF Canonical Reading Order

## Official Guide to Understanding the SELF Safety System

### Overview

This document provides the authoritative reading order for understanding the SELF (Support-First Logic Engine) system. The documentation is extensive and interconnected, so following this canonical order ensures comprehensive understanding while avoiding confusion from prerequisite gaps.

**Reading Philosophy**: Start with high-level concepts, progress to implementation details, then move to validation and governance. Different audiences have different entry points but converge on core safety understanding.

---

## Foundational Stewardship Record (Immutable)

**About the Creator**: `ABOUT_THE_CREATOR.md`
- **Purpose**: Immutable record of creator background, motivations, and stewardship commitment
- **Status**: Frozen as of December 20, 2025 - requires extraordinary governance for changes
- **Importance**: Establishes authentic creator narrative and accountability framework
- **Reading Time**: 15-20 minutes

---

## Reading Order by Audience

### 1. Executive Stakeholders & Decision Makers

**Purpose**: High-level understanding for business decisions, risk assessment, and strategic planning
**Estimated Time**: 4-6 hours total
**Entry Point**: Business and safety overview

#### Complete Reading Order
See: `packages/self-engine/SELF_DOCS/executives/reading-order.md`

**Key Documents**:
- README.md - Project overview
- EXECUTIVE-BRIEF.md - Strategic framework
- ASSURANCE-STATUS.md - Program status
- SELF-DESIGN-DOCTRINE.md - Safety principles

**Exit Point**: Executives understand business case, safety approach, and validation status.

---

### 2. Safety Reviewers & Auditors

**Purpose**: Comprehensive validation of system safety claims and compliance
**Estimated Time**: 16-20 hours total
**Entry Point**: Foundational safety principles

#### Complete Reading Order
See: `packages/self-engine/SELF_DOCS/reviewers/reading-order.md`

**Key Documents**:
- SELF_EVIDENCE_AND_VALIDATION_LEDGER.md - Validation record
- REVIEWER-README.md - Validation procedures
- SELF_SAFETY_GUARANTEE_MATRIX.md - Guarantee framework
- SELF_FAILURE_MODES_AND_BOUNDARY_CONDITIONS.md - System limitations

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

#### Phase 1: Philosophical Foundations (8 hours)
1. **packages/self-engine/SELF_DOCS/researchers/doctrine_preface.md** (30 min) - Introduction to the doctrine
   - *Prerequisites*: None
   - *Key Takeaways*: Overview of doctrine purpose and researcher's role

2. **packages/self-engine/SELF_DOCS/researchers/constitutional_summary.md** (60 min) - Constitutional framework
   - *Prerequisites*: doctrine_preface.md
   - *Key Takeaways*: Core principles, rights, and governance structure

3. **packages/self-engine/SELF-DESIGN-DOCTRINE.md** (60 min) - Safety philosophy
   - *Prerequisites*: constitutional_summary.md
   - *Key Takeaways*: Immutable safety rules, core philosophy

4. **packages/self-engine/SELF-FOUNDATION.md** (45 min) - System foundations
   - *Prerequisites*: SELF-DESIGN-DOCTRINE.md
   - *Key Takeaways*: System identity and purpose

5. **packages/self-engine/SELF-PURPOSE.md** (30 min) - Mission and objectives
   - *Prerequisites*: SELF-FOUNDATION.md
   - *Key Takeaways*: Goals, boundaries, success criteria

6. **packages/self-engine/SELF-IDENTITY.md** (30 min) - System identity
   - *Prerequisites*: SELF-PURPOSE.md
   - *Key Takeaways*: System boundaries and constraints

7. **packages/self-engine/DESIGN-AXIOM.md** (45 min) - Design principles
   - *Prerequisites*: SELF-IDENTITY.md
   - *Key Takeaways*: Foundational design principles

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

#### Complete Reading Order
See: `packages/self-engine/SELF_DOCS/buyers/reading-order.md`

**Key Documents**:
- README.md - Buyer overview
- BUYER-PROTECTION-EXPLAINER.md - Protection mechanisms
- BUY-SELL-AGREEMENT-ESCROW.md - Acquisition terms
- VALUES-FIRST-SALES-CRITERIA.md - Evaluation criteria

**Exit Point**: Buyers can make informed acquisition decisions.

---

### 6. End Users & General Public

**Purpose**: Understanding system capabilities and limitations
**Estimated Time**: 2-3 hours total
**Entry Point**: User-friendly overview

#### Complete Reading Order
See: `packages/self-engine/SELF_DOCS/users/reading-order.md`

**Key Documents**:
- user_guide.md - Complete user guide and features
- safety_for_users.md - Safety protections and user rights
- best_practices.md - Effective and safe usage
- troubleshooting.md - Common issues and solutions

**Exit Point**: Users can effectively and safely use SELF as part of their wellness routine.

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
