# SELF – Red Team & Change Discipline TODO

## 🔒 1. Strengthen Red-Team Assertions (Core Priority)

### 1.1 Enforce Trigger Assertions
- [x] Update runTest() to assert expectedTriggers
- [x] Fail test when required trigger is missing
- [x] Optionally warn (not fail) on unexpected triggers
- [x] Normalize trigger names in test cases to match engine constants (e.g., IMPLIED_SELF_HARM, HARM_OTHERS, etc.)

### 1.2 Replace Generic expectedMinScore
- [x] Remove expectedMinScore (max score heuristic) - marked as deprecated
- [x] Introduce: `expectedScores?: ScoreExpectation[]`
- [x] Update runner to assert specific score keys
- [x] Refactor existing test cases to use keyed score expectations

### 1.3 Assert minForcedState
- [x] Add `expectedMinForcedState?: EmotionalState` to test case type
- [x] Assert forced state logic in runner
- [x] Add forced-state expectations for:
  - implied self-harm → S2
  - harm-others → S3
  - angry physicality → S2

---

## 🧪 2. Improve Red-Team Coverage Quality

### 2.1 Add "Must-Not" Safeguards (Future Layer)
- [x] Add optional fields: `forbiddenPatterns?: RegExp[]`
- [x] Add optional fields: `mustInclude?: string[]`
- [x] Only enforce lightweight invariants (not full text snapshots)

### 2.2 Expand Test Case Metadata
- [x] Add `notes?: string` (1–2 lines explaining why state is correct)
- [ ] Add `expectedDecision?: string` (maps to policy layer)
- [x] Document category intent in comments

---

## 📊 3. Upgrade Test Suite Reporting

### 3.1 Implement Category Rollups
- [x] Populate categoryResults in runTestSuite
- [x] Compute pass/fail per category
- [x] Add category pass rate to markdown report

### 3.2 Improve Critical Issue Filtering
- [x] Treat under-detection as critical only if test severity is high/critical
- [x] Reduce noise in criticalIssues

### 3.3 Make Config Real
- [x] Implement failOnOverDetection option
- [x] Add strictMode toggle
- [x] Pass config through runTest() properly

---

## 🧠 4. Engine Review & Clarifications

### 4.1 Angry Physicality Design Decision
- [ ] Decide: Should angryPhysicality contribute to totalScore?
- [ ] If not, add explicit comment documenting design intent

### 4.2 Trigger Consistency Audit
- [ ] Ensure all triggers emitted by detectState() are documented
- [ ] Align test cases with actual trigger constants
- [ ] Consider adding explicit "SELF_HARM_EXPLICIT" trigger for clarity

---

## 📦 5. Change Discipline Improvements

### 5.1 Add Release Notes Structure
- [ ] Create RELEASE_NOTES.md
- [ ] Add sections: Changed, Unchanged, Evidence

### 5.2 Add PR Classification Header
- [ ] Add change type categories:
  - P0 Safety Semantics
  - P1 Coverage/Detection
  - P2 Observability/Infra
  - P3 Refactor/Performance

### 5.3 Add Safety Guardrail Checklist
- [ ] Create checklist in CONTRIBUTING.md
- [ ] Include:
  - No invariant changes
  - No exit logic changes
  - No override changes
  - No audit schema drift

---

## 📚 6. Documentation Alignment
- [ ] Update doctrine docs to reflect forcing rules
- [ ] Explicitly document implied self-harm → S2 invariant
- [ ] Explicitly document harm-others → S3 invariant
- [ ] Clarify false-positive trap policy (no escalation without self-reference?)

---

## 🧩 7. Optional (High Value, Not Urgent)
- [ ] Add golden regression snapshot for state machine output
- [ ] Add history-based redteam test (repeated distress logic)
- [ ] Add multilingual redteam cases
- [ ] Add normalization trigger tests (INPUT_NORMALIZED)