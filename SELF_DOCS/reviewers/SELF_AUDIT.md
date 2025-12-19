# SELF™ Tier 3 Audit Checklist
*(Pre-Release Ritual)*

This checklist must be completed before every SELF engine release.
No code changes are required—only discipline and verification.

---

## Release Gate Questions

### 1. Exit Taxonomy Integrity
- [ ] **Exit taxonomy unchanged?** Verify no new exit types have been added without doctrine approval
- [ ] **If new exit types were added:** Doctrine version must be bumped and changes documented

### 2. Override Discipline
- [ ] **Any overrides used in last 7 days?** Check logs for `PolicyOverride` entries
- [ ] **If overrides found:** List each with expiry date and justification reason
- [ ] **Verify all overrides have expired or are still valid**

### 3. Environment Integrity
- [ ] **Any non-prod data in prod tables?** Check for `dataProvenance !== "prod"` in production databases
- [ ] **If non-prod data found:** Treat as incident, investigate and remediate

### 4. Hard Invariant Compliance
- [ ] **Any H* violations ever recorded?** Check logs for `DoctrineViolation` with codes starting with "H"
- [ ] **If H* violations found:** Block deployment until each is explained and remediated

---

## Verification Process

1. **Run audit queries** against production logs and databases
2. **Document findings** in this checklist with timestamps
3. **Sign off** with your name and the current date
4. **Archive** this completed checklist with the release artifacts

---

## Sign-Off

**Auditor Name:** _________________________
**Date:** _________________________
**Release Version:** _________________________
**Doctrine Version:** _________________________

---

## Reminder

> "No code needed—just discipline."
> This ritual ensures the doctrine remains frozen and the system fails conservatively.
