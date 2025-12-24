# SELF™ REVIEWER README

**Complete Guide for Safety System Validation**
*(Single Entry Point for Reviewers – Version 2.0)*

---

## 📜 SAFETY AUTHORITY DECLARATION

**This document set constitutes the COMPLETE SAFETY AUTHORITY for SELF v1.0.**

The following documents collectively define, implement, and validate the safety properties of the SELF (Support-First Logic Engine) system:

### Core Safety Documents
- **[DESIGN-AXIOM.md](DESIGN-AXIOM.md)** - Immutable design principles
- **[SELF-FOUNDATION.md](SELF-FOUNDATION.md)** - Core principles and architectural commitments
- **[SELF-DESIGN-DOCTRINE.md](SELF-DESIGN-DOCTRINE.md)** - Canonical doctrine (immutable)
- **[SELF-IDENTITY.md](SELF-IDENTITY.md)** - System purpose and boundaries
- **[SELF-PURPOSE.md](SELF-PURPOSE.md)** - Mission and success metrics

### Technical Implementation
- **[SELF-ARCHITECTURE.md](SELF-ARCHITECTURE.md)** - System design and version authority
- **[SELF-INVARIANTS-SYSTEM.md](SELF-INVARIANTS-SYSTEM.md)** - Hard/soft invariants architecture
- **[SELF-DOCTRINE-MATRIX.md](SELF-DOCTRINE-MATRIX.md)** - Doctrine-to-error mapping
- **[SELF-DOCTRINAL-ERRORS.md](SELF-DOCTRINAL-ERRORS.md)** - Error classification system

### Safety Mechanisms
- **[SELF-SAFETY-BOUNDARY.md](SELF-SAFETY-BOUNDARY.md)** - Boundary protection system
- **[SELF-HALT-CONTINUE.md](SELF-HALT-CONTINUE.md)** - Exit safety decision logic
- **[SELF-NODRIFT-CONTRACT.md](SELF-NODRIFT-CONTRACT.md)** - Principle preservation agreement

### Validation & Verification
- **[SELF-SECURITY.md](SELF-SECURITY.md)** - Security architecture and threat model
- **[SELF-LICENSE.md](SELF-LICENSE.md)** - Licensing and deployment requirements
- **[VOICE-CONTRACTS.md](VOICE-CONTRACTS.md)** - Voice data handling agreements
- **[LEGAL-DEFENSE-README.md](LEGAL-DEFENSE-README.md)** - Legal position and defense strategy
- **[THREAT-MODEL.md](THREAT-MODEL.md)** - Canonical threat model and adversarial assumptions
- **[ASSURANCE-BOUNTY.md](ASSURANCE-BOUNTY.md)** - Community-driven safety assurance program

**These documents are FROZEN as SELF v1.0 FINAL.**

No changes to safety properties, doctrine, or core architecture are permitted without following the amendment procedures outlined in [SELF-ARCHITECTURE.md](SELF-ARCHITECTURE.md).

**Reviewers must validate against this complete document set.** Implementation compliance requires adherence to all specifications contained herein.

---

---

## 🚀 Quick Start

**SELF is a safety-critical AI control layer** that prevents AI from making emotional interactions worse. This README provides everything reviewers need to validate the system's safety properties.

### 📋 Prerequisites
- Node.js 18+
- TypeScript 5.0+
- Basic understanding of AI safety principles

### 🏃‍♂️ Run & Verify Checklist

#### 1. Environment Setup
```bash
# Clone and install
git clone <repository>
cd packages/self-engine
npm install

# Verify TypeScript compilation
npm run build
# Should complete without errors
```

#### 2. Core Safety Verification
```bash
# Run test suite
npm test

# Verify invariants
tsx src/softInvariants.test.ts
tsx src/hardInvariants.test.ts

# Check doctrinal error system
tsx src/doctrinalErrors.test.ts
```

#### 3. Safety Boundary Testing
```bash
# Test boundary protection
tsx examples/safety-boundary-test.ts

# Verify doctrinal error conversion
tsx examples/doctrinal-error-test.ts
```

#### 4. Integration Validation
```bash
# Test end-to-end safety pipeline
tsx examples/integration-test.ts

# Verify state management
tsx examples/state-safety-test.ts
```

#### 5. Override Mechanism Audit
```bash
# Test override functionality
tsx examples/override-test.ts

# Verify time-limited enforcement
tsx examples/override-expiry-test.ts
```

---

## 📊 Traceable Safety Event Log Schema

### Core Event Structure
```typescript
interface SelfLogEvent {
  // Provenance
  doctrineVersion: "1.0";
  dataProvenance: "prod" | "test" | "demo";
  runId: string;
  sessionId: string;
  userId: string;

  // Temporal
  timestamp: string; // ISO 8601

  // Stage & Context
  stage: "pre" | "post";
  message: string;
  messageId?: number;

  // State Management
  state: EmotionalState;
  stateCurrent?: string;
  scores: Record<string, number>;
  reasons: string[];

  // Safety Signals
  affirmativeStabilizationSignals: string[];
  coldStartTurnIndex: number;
  isColdStart: boolean;

  // Decision Context
  confidence?: "high" | "medium" | "low";
  uncertaintyReasons?: string[];
  consideredActions?: string[];
  blockedActions?: Record<string, string>;

  // Policy & Response
  policy: Policy;
  validation?: ValidationResult;
  repaired?: boolean;

  // Override Tracking
  overrideReason?: string;
  refusalJustification?: string[];
  refusalDetected?: boolean;

  // Exit Safety
  exitType?: ExitType;
  exitIntentDetected?: boolean;
  exitClassificationMissing?: boolean;

  // Enhanced Safety Logging
  redteamRun?: string;
  aiPreview?: string;
  source?: string;
  redteamCandidates?: Array<{ category: string; phrase: string }>;

  // Doctrinal Context (added for traceability)
  doctrinalErrors?: DoctrinalError[];
  safetyBoundaryCrossings?: SafetyBoundaryEvent[];
  invariantViolations?: InvariantViolation[];
}
```

### Safety Boundary Event Schema
```typescript
interface SafetyBoundaryEvent {
  boundaryId: string;
  operationName: string;
  errorType: "raw" | "doctrinal" | "none";
  originalError?: string;
  doctrinalError?: DoctrinalError;
  resolution: "converted" | "passed" | "rejected";
  timestamp: string;
}
```

### Invariant Violation Schema
```typescript
interface InvariantViolation {
  invariantType: "hard" | "soft";
  code: string;
  doctrineSections: DoctrineSection[];
  severity: "hard" | "soft" | "conditional";
  context: Record<string, any>;
  resolved: boolean;
  overrideApplied?: boolean;
  timestamp: string;
}
```

### Doctrinal Error Schema
```typescript
interface DoctrinalError {
  code: string;
  message: string;
  doctrineSections: readonly DoctrineSection[];
  severity: "hard" | "soft" | "conditional";
  category: "security" | "behavioral" | "safety" | "compliance";
  context?: {
    currentState?: string;
    hasBlockers?: boolean;
    [key: string]: any;
  };
}
```

---

## ✅ Verification Checklist

### □ **Doctrine Integrity**
- [ ] All events reference doctrine version 1.0
- [ ] Doctrine sections properly enumerated (DS_00-DS_13)
- [ ] No doctrine violations without explicit justification
- [ ] Override mechanisms require founder approval

### □ **Hard Invariants (H0-H6)**
- [ ] **H0**: Doctrine version validation active
- [ ] **H1**: Provenance integrity enforced
- [ ] **H2**: Exit semantics properly validated
- [ ] **H3**: Non-action logging complete
- [ ] **H4**: Cold-start containment working
- [ ] **H5**: Override validity checked
- [ ] **H6**: Timestamp integrity maintained

### □ **Soft Invariants (S1-S5)**
- [ ] **S1**: Probing restrictions when settled
- [ ] **S2**: Low-confidence exit rationales required
- [ ] **S3**: Ambiguous physicality clarification enforced
- [ ] **S4**: Doctrine-backend exit blocking active
- [ ] **S5**: Reset-abuse patterns detected

### □ **Safety Boundary Protection**
- [ ] No raw errors cross safety boundaries
- [ ] All errors converted to doctrinal format
- [ ] Safety boundary wrappers active on public APIs
- [ ] External call protection functioning

### □ **Error Classification System**
- [ ] All errors mapped to doctrine sections
- [ ] Severity levels appropriate (Hard/Soft/Conditional)
- [ ] Conditional errors resolve correctly (SAF_006)
- [ ] Error categories properly assigned

### □ **State Management Safety**
- [ ] Cold-start periods enforced (5+ turns)
- [ ] State transitions logged with reasons
- [ ] Recovery requires affirmative stabilization
- [ ] Exit decisions properly governed

### □ **Override Mechanism**
- [ ] Overrides require explicit justification
- [ ] Time limits enforced on all overrides
- [ ] Override abuse detection active
- [ ] Founder approval required for safety overrides

### □ **Logging & Auditability**
- [ ] All safety decisions logged
- [ ] Event schema includes doctrinal context
- [ ] Audit trails maintain complete traceability
- [ ] Override usage tracked and reviewable

### □ **Configuration Validation**
- [ ] Policy configurations match doctrine requirements
- [ ] State thresholds properly calibrated
- [ ] Safety boundaries correctly implemented
- [ ] Kill switch mechanisms functional

### □ **Integration Testing**
- [ ] End-to-end safety pipeline verified
- [ ] Component interactions safe
- [ ] Error handling comprehensive
- [ ] Performance meets safety requirements

### □ **Threat Model Validation**
- [ ] Attack vectors addressed in implementation
- [ ] Mitigation strategies effective
- [ ] Monitoring detects adversarial behavior
- [ ] Recovery mechanisms functional

### □ **Legal Compliance**
- [ ] Privacy requirements met
- [ ] Data handling follows contracts
- [ ] Regulatory frameworks addressed
- [ ] Audit trails legally sufficient

---

## 🔧 Advanced Testing Procedures

### Automated Test Suites
```bash
# Run comprehensive safety test suite
npm run test:safety

# Execute adversarial input testing
npm run test:adversarial

# Validate doctrinal compliance
npm run test:doctrine

# Performance under safety constraints
npm run test:performance
```

### Manual Verification Steps

#### State Detection Accuracy
1. **Test Case Preparation**: Create diverse emotional scenarios
2. **Detection Validation**: Verify correct state assignment
3. **Confidence Assessment**: Check uncertainty quantification
4. **Edge Case Handling**: Test boundary conditions

#### Policy Enforcement
1. **Rule Application**: Verify policies applied correctly
2. **Banned Phrase Detection**: Test content filtering
3. **Response Generation**: Validate output compliance
4. **Override Tracking**: Audit administrative actions

#### Exit Decision Logic
1. **Intent Detection**: Test exit intent recognition
2. **Safety Assessment**: Validate blocker identification
3. **Stabilization Signals**: Check signal detection
4. **Posture Application**: Verify response policies

### Red Team Exercises

#### Safety Bypass Attempts
- **Context Poisoning**: Craft misleading conversation histories
- **Lexical Evasion**: Use ambiguous or coded language
- **State Manipulation**: Attempt to force inappropriate transitions
- **Timing Attacks**: Exploit response delays or state decay

#### Doctrine Exploitation
- **Ambiguity Exploitation**: Find unclear doctrine sections
- **Override Abuse**: Test administrative control mechanisms
- **Historical Analysis**: Use past behavior for prediction
- **Multi-Vector Attacks**: Combine multiple exploitation methods

#### Computational Stress Testing
- **Input Complexity**: Test with highly complex inputs
- **Resource Exhaustion**: Attempt to overwhelm processing
- **Timing Manipulation**: Exploit race conditions
- **Memory Pressure**: Test under constrained resources

---

## 📊 Metrics & Monitoring

### Safety Metrics Dashboard
- **State Distribution**: Track emotional state assignments
- **Confidence Levels**: Monitor detection certainty
- **Exit Patterns**: Analyze disengagement behaviors
- **Blocker Frequency**: Measure safety intervention rates

### Performance Metrics
- **Response Times**: Safety processing latency
- **Resource Usage**: Memory and CPU consumption
- **Error Rates**: Safety-related failure frequencies
- **Recovery Times**: Incident response effectiveness

### Compliance Metrics
- **Audit Coverage**: Logging completeness
- **Policy Adherence**: Rule enforcement accuracy
- **Override Usage**: Administrative action tracking
- **User Satisfaction**: Safety perception surveys

### Alerting & Escalation

#### Automated Alerts
- **Critical Safety Violations**: Immediate notification
- **System Degradation**: Performance threshold breaches
- **Unusual Patterns**: Anomaly detection triggers
- **Compliance Failures**: Regulatory requirement issues

#### Escalation Procedures
- **Level 1**: Automatic safety posture adjustment
- **Level 2**: Human review and intervention
- **Level 3**: System-wide containment activation
- **Level 4**: Complete system shutdown if necessary

---

## 🚨 Known Limitations

### 1. **Scope Boundaries**
**Limitation**: SELF only addresses emotional distress contexts
- **Impact**: Not applicable to non-emotional AI interactions
- **Mitigation**: Clear operational boundaries documented
- **Safety**: Prevents inappropriate application to non-emotional contexts

### 2. **State Detection Probabilistic Nature**
**Limitation**: Emotional state detection is inference, not certainty
- **Impact**: Potential false positives/negatives in state classification
- **Mitigation**: Conservative bias toward containment, confidence logging
- **Safety**: Built-in uncertainty handling and override mechanisms

### 3. **Cold-Start Vulnerability Window**
**Limitation**: First 5 turns operate with limited context
- **Impact**: Reduced accuracy during initial interactions
- **Mitigation**: Extended containment periods, conservative defaults
- **Safety**: Explicit cold-start safety posture with enhanced restrictions

### 4. **Override Mechanism Trust Dependency**
**Limitation**: Soft error overrides depend on human judgment
- **Impact**: Safety relies on responsible override usage
- **Mitigation**: Time-limited overrides, audit requirements, abuse detection
- **Safety**: Multiple safeguard layers prevent override exploitation

### 5. **Cultural Context Limitations**
**Limitation**: Emotional expression patterns may vary by culture
- **Impact**: Potential misinterpretation of emotional cues
- **Mitigation**: Configurable lexicons, conservative classification bias
- **Safety**: Designed for worst-case interpretation to avoid harm

### 6. **Performance vs Safety Trade-offs**
**Limitation**: Safety constraints may impact response speed/fluency
- **Impact**: More verbose or slower responses in high-safety states
- **Mitigation**: State-dependent optimization, acceptable performance costs
- **Safety**: Performance sacrifices are explicit and documented

### 7. **External System Dependencies**
**Limitation**: Safety depends on proper integration and monitoring
- **Impact**: Implementation errors could bypass safety mechanisms
- **Mitigation**: Comprehensive integration testing, runtime validation
- **Safety**: Multiple validation layers and audit requirements

### 8. **Recovery Detection Challenges**
**Limitation**: Genuine recovery vs false calm difficult to distinguish
- **Impact**: Potential over-containment during actual recovery
- **Mitigation**: Multi-signal recovery validation, override mechanisms
- **Safety**: Conservative bias prevents premature safety assumptions

### 9. **Data Persistence Policy**
**Limitation**: SELF does not persist raw user conversational content beyond operational necessity
- **Impact**: Limited conversational history retention
- **Mitigation**: Operational necessity drives retention policies
- **Safety**: Prevents unnecessary data exposure

### 10. **Doctrine Repetition Policy**
**Limitation**: Explicit doctrine note repetition without new information does not increase response permissibility
- **Impact**: Repeated doctrine notes don't enhance permissibility
- **Mitigation**: Focus on new information for permissibility assessment
- **Safety**: Maintains strict doctrine enforcement

---

## 🔍 Deep Validation Commands

### Doctrine Compliance Audit
```bash
# Check all doctrine references
npm run doctrine-audit

# Verify invariant enforcement
npm run invariant-check

# Test safety boundary integrity
npm run boundary-test
```

### Log Analysis Commands
```bash
# Analyze safety event patterns
npm run log-analysis -- --focus=safety

# Check doctrinal error distributions
npm run error-analysis -- --category=all

# Verify override usage patterns
npm run override-audit
```

### Performance Safety Validation
```bash
# Test safety under load
npm run stress-test -- --safety-mode

# Verify cold-start behavior
npm run cold-start-test

# Check state transition safety
npm run state-transition-test
```

---

## 📞 Emergency Contacts & Escalation

### Critical Safety Issues
- **Immediate Halt Required**: Hard invariant violations
- **Contact**: Safety team lead
- **Response Time**: < 1 hour

### System Integrity Issues
- **Override Abuse Detected**: Unauthorized safety bypasses
- **Contact**: Security team
- **Response Time**: < 4 hours

### Performance Degradation
- **Safety Impact**: Response delays affecting user safety
- **Contact**: Engineering team
- **Response Time**: < 24 hours

---

## 📚 Additional Resources

- **[Doctrine Matrix](SELF-DOCTRINE-MATRIX.md)**: Visual doctrine-to-error mapping
- **[Halt vs Continue](SELF-HALT-CONTINUE.md)**: Exit safety decision logic
- **[Doctrinal Errors](SELF-DOCTRINAL-ERRORS.md)**: Complete error classification system
- **[Safety Boundary](SELF-SAFETY-BOUNDARY.md)**: Boundary protection mechanisms
- **[Invariant System](SELF-INVARIANTS-SYSTEM.md)**: Hard vs soft invariants architecture

---

## 🎯 Reviewer Success Criteria

**✅ System Approved for Review** when all checklist items pass and:
- No hard invariant violations in test suite
- All safety boundaries properly enforced
- Override mechanisms have appropriate guardrails
- Error classification covers all doctrine sections
- Known limitations are acceptable for use case
- Audit trails provide complete traceability

**❌ System Requires Revision** if:
- Hard invariants can be bypassed
- Raw errors cross safety boundaries
- Override mechanisms lack proper controls
- Doctrine sections lack error coverage
- Known limitations exceed acceptable risk

---

*This README provides everything needed to validate SELF's safety properties. Use the checklist systematically and reference the linked documents for detailed implementation guidance.*
