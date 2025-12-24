# SELF™ DOCTRINE → ERROR → ACTION MATRIX

**One-Page Safety System Reference for Reviewers**
*(Version 1.0)*

---

## Matrix Key

| Symbol | Meaning |
|--------|---------|
| 🔴 | HARD error → System halt |
| 🟡 | SOFT error → Override possible |
| 🔵 | CONDITIONAL → Context-dependent |
| ⚪ | No direct mapping |
| 📋 | Logging/Audit action |
| 🛑 | Containment action |
| 🔄 | Override/Recovery action |
| 🚫 | Termination action |

---

## Doctrine → Error → Action Matrix

| Doctrine Section | Error Code | Severity | Action | Rationale |
|------------------|------------|----------|--------|-----------|
| **DS_00: Scope & Authority** | CMP_003 | 🔴 HARD | 🚫 System halt + config audit | Invalid config violates core authority |
| | H0 | 🔴 HARD | 🚫 Immediate termination | Doctrine version mismatch |
| | - | - | 📋 Full audit logging | All authority violations logged |

| **DS_01: Control Layer** | H4 | 🔴 HARD | 🚫 System halt | Cold-start safety violated |
| | - | - | 📋 State transition logging | Control layer decisions tracked |

| **DS_02: State Inference** | SAF_001 | 🔴 HARD | 🚫 System halt | False negative risks safety |
| | SAF_002 | 🟡 SOFT | 🔄 Override with monitoring | False positive restricts autonomy |
| | SAF_004 | 🔴 HARD | 🚫 System halt | False calm acceptance |
| | BEH_004 | 🟡 SOFT | 🔄 Recovery step addition | Missing therapeutic anchoring |
| | BEH_005 | 🟡 SOFT | 🔄 Agency step insertion | User empowerment required |
| | BEH_007 | 🟡 SOFT | 🔄 Hypothetical removal | Prevents speculative harm |

| **DS_03: Cold-Start Containment** | H4 | 🔴 HARD | 🚫 System halt | Premature S0 without stabilization |
| | - | - | 📋 Cold-start duration logging | Containment periods tracked |

| **DS_04: Recovery Affirmative** | SAF_003 | 🔴 HARD | 🚫 System halt | Premature normalization |
| | SAF_004 | 🔴 HARD | 🚫 System halt | False recovery acceptance |
| | BEH_004 | 🟡 SOFT | 🔄 Grounding element addition | Recovery requires anchoring |
| | BEH_005 | 🟡 SOFT | 🔄 Agency step restoration | Recovery needs empowerment |

| **DS_05: Exit Governed** | SAF_005 | 🔴 HARD | 🚫 System halt | Unsafe disengagement |
| | SAF_006 | 🔵 CONDITIONAL | 🔄 Soft: Override w/containment<br>🔴 Hard: System halt | Context-dependent exit safety |
| | H2 | 🔴 HARD | 🚫 Invalid exit rejection | Exit semantics violated |

| **DS_06: Autonomy Respected** | H2 | 🔴 HARD | 🚫 System halt | Exit request handling failed |
| | BEH_009 | 🟡 SOFT | 🔄 S0 constraint enforcement | Terminal state boundaries |
| | SAF_002 | 🟡 SOFT | 🔄 Override permission | False restrictions reduced |

| **DS_07: Restraint Explainable** | H3 | 🔴 HARD | 🚫 System halt | Non-action not logged |
| | BEH_001 | 🔴 HARD | 🚫 Banned content rejection | Harmful response prevented |
| | BEH_002 | 🟡 SOFT | 🔄 Response truncation | Word limits enforced |
| | BEH_003 | 🟡 SOFT | 🔄 Question reduction | Interrogative pressure limited |
| | BEH_008 | 🔴 HARD | 🚫 Mechanism naming blocked | Paranoia escalation prevented |

| **DS_08: Metrics Observe Safety** | - | - | 📋 Metric collection | Safety-first measurement |
| | - | - | 📋 Performance vs safety logging | Trade-off decisions tracked |

| **DS_09: Attrition Accepted** | - | - | 📋 CIAP metric tracking | Containment cost monitoring |
| | - | - | 📋 Retention vs safety analysis | Economic trade-offs logged |

| **DS_10: Failure Costs System** | SAF_001 | 🔴 HARD | 🚫 System halt | Detection failure costs user safety |
| | SAF_007 | 🔴 HARD | 🚫 System halt | Crisis escalation missed |
| | BEH_006 | 🔴 HARD | 🚫 Crisis support rejection | Critical safety requirement |
| | SEC_002 | 🔴 HARD | 🚫 Session termination | Expired access risks safety |
| | SEC_004 | 🟡 SOFT | 🔄 Rate limit with monitoring | Safety protection balanced |

| **DS_11: Separate Environments** | SEC_001 | 🔴 HARD | 🚫 API access denied | Environment integrity |
| | H1 | 🔴 HARD | 🚫 Provenance validation failed | Data source separation |

| **DS_12: Unsafe Outcomes Named** | - | - | 📋 Known limitation documentation | Risk boundaries defined |
| | - | - | 📋 Failure mode tracking | Acceptable vs unacceptable failures |

| **DS_13: Violation Is Decision** | CMP_004 | 🔴 HARD | 🚫 Override denied | Unauthorized bypass |
| | CMP_005 | 🔴 HARD | 🚫 Override abuse blocked | Exploitation prevention |
| | BEH_009 | 🟡 SOFT | 🔄 State boundary enforcement | Violation handling |

---

## Quick Reference Guide

### Hard Errors (🔴) - Immediate System Halt
- Doctrine integrity violations (H0, CMP_003)
- Safety-critical failures (SAF_001, SAF_003, SAF_004, SAF_005, SAF_007)
- Content safety violations (BEH_001, BEH_006, BEH_008)
- System integrity breaches (H1, H2, H3, H4, SEC_001, SEC_002)

### Soft Errors (🟡) - Override Possible
- Response constraint violations (BEH_002, BEH_003, BEH_004, BEH_005, BEH_007)
- State detection over-caution (SAF_002)
- Performance limits (SEC_004)

### Conditional Errors (🔵) - Context Dependent
- SAF_006: Exit intent missed (Soft if state ≤ S1 + no blockers, Hard otherwise)

### Logging Actions (📋) - Audit Trail
- All state transitions and decisions
- Override usage and reasoning
- Performance vs safety trade-offs
- Known limitation encounters

### Containment Actions (🛑) - Safety Measures
- Response filtering and repair
- Access restriction and monitoring
- Enhanced validation requirements
- Fallback safety responses

### Override/Recovery Actions (🔄) - Controlled Continuation
- Authorized override with time limits
- Enhanced monitoring during override
- Automatic safety measure activation
- Incident tracking and review

### Termination Actions (🚫) - System Stop
- Immediate processing halt
- Manual intervention requirement
- Critical incident escalation
- Complete audit preservation

---

## Reviewer Checklist

- [ ] Each doctrine section maps to at least one error condition
- [ ] Error severities align with doctrine importance
- [ ] Actions preserve safety while enabling operation
- [ ] No doctrine violation lacks error coverage
- [ ] Error escalation matches safety criticality
- [ ] Override mechanisms have appropriate guardrails
- [ ] Audit trails capture all safety decisions

**This matrix ensures complete coverage: every doctrine principle → error detection → appropriate action.**

*Reviewers: Use this matrix to verify that all safety logic flows correctly from doctrine to enforcement.*
