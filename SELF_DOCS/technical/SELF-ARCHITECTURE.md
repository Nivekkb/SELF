# SELF™ ARCHITECTURE OVERVIEW

**Canonical System Design & Version Authority**
*(Version 1.0 - Locked & Immutable)*

---

## 🏗️ 1-Page ASCII Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SELF™ SAFETY SYSTEM                                 │
│                        "Prevent AI Harm in Emotions"                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DOCTRINE LAYER (CANONICAL)                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ DS_00: Scope & Authority        DS_06: Autonomy Respected             │   │
│  │ DS_01: Control Layer            DS_07: Restraint Explainable          │   │
│  │ DS_02: State Inference          DS_08: Metrics Observe Safety         │   │
│  │ DS_03: Cold-Start Containment   DS_09: Attrition Accepted             │   │
│  │ DS_04: Recovery Affirmative     DS_10: Failure Costs System           │   │
│  │ DS_05: Exit Governed            DS_11: Separate Environments          │   │
│  │                                 DS_12: Unsafe Outcomes Named          │   │
│  │                                 DS_13: Violation Is Decision          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         ▲                       ▲                       ▲                     │
│         │                       │                       │                     │
│         └─────── HARD INVARIANTS ─────── SOFT INVARIANTS ──────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SAFETY ENFORCEMENT LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │   HARD (H0-H6)  │  │   SOFT (S1-S5)  │  │  CONDITIONAL    │               │
│  │ • Doctrine      │  │ • Probing       │  │ • SAF_006       │               │
│  │ • Provenance    │  │ • Exit Logic    │  │   (Exit Intent) │               │
│  │ • Exit Safety   │  │ • Content       │  │                 │               │
│  │ • Cold Start    │  │ • Reset Abuse   │  └─────────────────┘               │
│  └─────────────────┘  └─────────────────┘                                     │
│         ▲                       ▲                                             │
│         │                       │                                             │
│         └────────── DOCTRINAL ERROR SYSTEM ────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SAFETY BOUNDARY PROTECTION                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Raw Error →    │  │  Doctrinal      │  │  Boundary       │               │
│  │  Doctrinal      │  │  Error System   │  │  Wrappers       │               │
│  │  Conversion     │  │  (27 Errors)    │  │  (External      │               │
│  │                 │  │                 │  │   Calls)        │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             EXTERNAL SYSTEMS                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │   API Endpoints │  │   User Apps     │  │   Monitoring    │               │
│  │   (Protected)   │  │   (Safe)        │  │   Systems       │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TRACEABLE SAFETY LOGGING                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Event Schema   │  │  Audit Trails   │  │  Error Context  │               │
│  │  (Complete)     │  │  (Immutable)    │  │  (Doctrinal)    │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 VERSION PINNING STATEMENT

### Canonical Versions (Locked)
```
SELF Engine Version:     1.0.0 (Locked - No Breaking Changes)
Doctrine Version:        1.0   (Frozen - Immutable)
TypeScript Version:      5.0+  (Minimum Required)
Node.js Version:         18.0+ (Minimum Required)

Version Pinning Rules:
├── Patch versions (1.0.X) allowed for bug fixes only
├── Minor versions (1.X.0) require safety review board approval
├── Major versions (X.0.0) require unanimous maintainer consensus
└── Doctrine changes require 90-day public review + implementation migration
```

### Compatibility Guarantees
```
├── API contracts stable within major version
├── Log schemas backward compatible within major version
├── Configuration formats stable within major version
└── Safety properties preserved across all versions
```

---

## 🚫 NON-GOALS & SCOPE LIMITATIONS

### Explicitly Out of Scope
SELF is **not designed** to:

**❌ Clinical Therapy**
- No diagnostic capabilities
- No treatment recommendations
- No therapeutic interventions
- No clinical outcome guarantees

**❌ General AI Safety**
- Not applicable to non-emotional contexts
- Not designed for general AI safety problems
- Emotional context specific only

**❌ Performance Optimization**
- Not optimized for speed or efficiency
- Safety constraints take precedence over performance
- Response delays acceptable for safety

**❌ User Experience Maximization**
- Not designed to maximize engagement
- Not optimized for conversational flow
- Safety restrictions may reduce fluency

**❌ Universal Applicability**
- Not suitable for all emotional contexts
- Cultural biases may exist
- Language and context specific limitations

**❌ Absolute Guarantees**
- No 100% safety guarantees possible
- Probabilistic safety bounds only
- Human judgment remains final authority

**❌ Automated Resolution**
- Cannot replace human clinical judgment
- Requires human oversight and intervention
- Not a fully autonomous safety system

**❌ Commercial Optimization**
- Not designed for revenue maximization
- Safety costs may impact business metrics
- Ethical constraints override economic incentives

---

## 🔒 DOCTRINE CANONICAL LOCK

### Immutable Doctrine Declaration

**The SELF Design Doctrine (Version 1.0) is hereby declared CANONICAL and IMMUTABLE.**

#### Lock Conditions
```
├── No doctrine section may be modified without 90-day public review
├── All proposed changes require unanimous maintainer approval
├── Implementation migration plans required for any changes
├── Safety impact assessment mandatory for all proposals
└── No changes allowed that reduce safety properties
```

#### Canonical Doctrine Sections (Locked)
1. **DS_00: Scope & Authority** - Core system boundaries
2. **DS_01: Control Layer** - AI governance model
3. **DS_02: State Inference** - Probabilistic safety approach
4. **DS_03: Cold-Start Containment** - Initial interaction safety
5. **DS_04: Recovery Affirmative** - Evidence-based normalization
6. **DS_05: Exit Governed** - Controlled disengagement
7. **DS_06: Autonomy Respected** - User agency preservation
8. **DS_07: Restraint Explainable** - Transparent restrictions
9. **DS_08: Metrics Observe Safety** - Measurement boundaries
10. **DS_09: Attrition Accepted** - Containment cost acceptance
11. **DS_10: Failure Costs System** - Safety responsibility assignment
12. **DS_11: Separate Environments** - Data isolation requirements
13. **DS_12: Unsafe Outcomes Named** - Known limitation documentation
14. **DS_13: Violation Is Decision** - Override governance

#### Foundation Principles (Supporting)
- **Safety as Sole Criterion** - Core mission focus
- **Conservative Failure Mode** - Fail-safe design
- **Explicit Over Implicit** - Transparency requirement
- **Human Judgment Authority** - Final decision authority
- **Bounded Risk Acceptance** - Realistic safety bounds
- **Ethics Before Economics** - Value prioritization
- **Evolution Through Rigor** - Change management
- **Collective Responsibility** - Shared accountability

---

## 🏆 SYSTEM GUARANTEES

### Safety Guarantees (Provided)
- ✅ No raw errors cross safety boundaries
- ✅ All doctrine violations detected and classified
- ✅ Hard invariants cannot be bypassed
- ✅ Soft invariants require explicit override
- ✅ Complete audit trails maintained
- ✅ Conservative bias in uncertainty
- ✅ Human judgment preserved as final authority

### Guarantees Not Provided
- ❌ 100% safety (probabilistic bounds only)
- ❌ Performance optimization
- ❌ Universal applicability
- ❌ Clinical therapeutic outcomes
- ❌ Business metric optimization

---

## 📋 IMPLEMENTATION CHECKLIST

- [x] Doctrine locked as canonical (Version 1.0)
- [x] Version pinning established
- [x] Non-goals explicitly documented
- [x] Architecture diagram created
- [x] Safety guarantees clarified
- [x] Scope limitations defined
- [x] Compatibility requirements specified

**This document serves as the architectural foundation and scope definition for SELF Version 1.0.**

*All implementations must conform to these canonical specifications.*
