# SELF™ API Key Generation: Technical Implementation

## 🎯 Key Generation Philosophy

**API keys are not just authentication—they're safety enforcement.**

Our key generation system ensures:
1. **Tier-specific access** to prevent unauthorized usage
2. **Environment binding** to distinguish development from production
3. **Audit trail integration** for compliance verification
4. **Automatic expiration** for license management

**No manual key creation. No bypass mechanisms. No safety compromises.**

---

## 🔐 Key Generation Architecture

### 1. Key Structure

```typescript
interface SELFKey {
  // Unique identifier
  id: string; // UUID v4

  // License metadata
  licenseeId: string;
  tier: 'evaluation' | 'startup' | 'professional' | 'enterprise' | 'academic';
  environment: 'development' | 'staging' | 'production';
  doctrineVersion: string; // e.g., "1.8.2"

  // Security
  secret: string; // 64-character cryptographic random
  hash: string; // bcrypt hash of secret
  salt: string; // Unique salt for each key

  // Limits
  maxConversations: number;
  currentPeriod: string; // "2025-12"
  conversationCount: number;

  // Compliance
  watermarkRequired: boolean;
  auditTrailRequired: boolean;
  complianceTokens: string[];

  // Expiration
  createdAt: Date;
  expiresAt: Date; // License term end
  lastUsed: Date | null;
  lastAudit: Date | null;

  // Status
  status: 'active' | 'suspended' | 'terminated' | 'expired';
  violationCount: number;
  lastViolation: string | null;
}
```

---

## 🔧 Key Generation Process

### 1. License Verification

```typescript
async function verifyLicense(licenseeId: string): Promise<License> {
  // 1. Check license exists and is active
  const license = await db.licenses.find(licenseeId);
  if (!license || license.status !== 'active') {
    throw new Error('Invalid or inactive license');
  }

  // 2. Verify payment status
  const payment = await payments.check(licenseeId);
  if (!payment.isPaid) {
    throw new Error('Payment required for key generation');
  }

  // 3. Check compliance status
  const compliance = await audits.lastCompliance(licenseeId);
  if (compliance.status === 'failed') {
    throw new Error('Compliance violation prevents key generation');
  }

  return license;
}
```

---

### 2. Key Creation

```typescript
function generateKey(license: License): SELFKey {
  // 1. Generate cryptographic components
  const id = uuidv4();
  const secret = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = bcrypt.hashSync(secret, salt);

  // 2. Set tier-specific limits
  const tierLimits = getTierLimits(license.tier);
  const currentPeriod = getCurrentPeriod();

  // 3. Create compliance requirements
  const watermarkRequired = license.tier !== 'evaluation';
  const auditTrailRequired = true;
  const complianceTokens = generateComplianceTokens(license.tier);

  // 4. Calculate expiration
  const expiresAt = addYears(new Date(), 1);

  // 5. Build key object
  return {
    id,
    licenseeId: license.id,
    tier: license.tier,
    environment: license.environment,
    doctrineVersion: getCurrentDoctrineVersion(),
    secret,
    hash,
    salt,
    maxConversations: tierLimits.conversations,
    currentPeriod,
    conversationCount: 0,
    watermarkRequired,
    auditTrailRequired,
    complianceTokens,
    createdAt: new Date(),
    expiresAt,
    lastUsed: null,
    lastAudit: null,
    status: 'active',
    violationCount: 0,
    lastViolation: null
  };
}
```

---

### 3. Key Storage

```typescript
async function storeKey(key: SELFKey): Promise<void> {
  // 1. Encrypt sensitive data
  const encrypted = encryptKeyData(key);

  // 2. Store in database
  await db.keys.insert(encrypted);

  // 3. Add to license record
  await db.licenses.update(key.licenseeId, {
    $push: { apiKeys: key.id }
  });

  // 4. Log creation
  await logKeyEvent(key.id, 'created', {
    licenseeId: key.licenseeId,
    tier: key.tier,
    environment: key.environment
  });
}
```

---

### 4. Key Distribution

```typescript
async function distributeKey(keyId: string, method: 'email' | 'dashboard' | 'api'): Promise<void> {
  // 1. Retrieve key (without secret)
  const key = await db.keys.find(keyId);
  const safeKey = {
    id: key.id,
    licenseeId: key.licenseeId,
    tier: key.tier,
    environment: key.environment,
    doctrineVersion: key.doctrineVersion,
    maxConversations: key.maxConversations,
    status: key.status,
    expiresAt: key.expiresAt
  };

  // 2. Generate secure delivery
  const delivery = await generateDelivery(key, method);

  // 3. Send via selected method
  switch (method) {
    case 'email':
      await email.send({
        to: getLicenseeEmail(key.licenseeId),
        subject: 'Your SELF API Key',
        template: 'apiKeyDelivery',
        data: { key: safeKey, delivery }
      });
      break;

    case 'dashboard':
      await dashboard.addNotification(key.licenseeId, {
        type: 'keyDelivery',
        data: { key: safeKey, delivery }
      });
      break;

    case 'api':
      return delivery;
  }

  // 4. Log distribution
  await logKeyEvent(key.id, 'distributed', { method });
}
```

---

## 🔐 Key Validation

### 1. Request Validation

```typescript
async function validateRequest(key: string, environment: string): Promise<ValidationResult> {
  // 1. Find key
  const apiKey = await db.keys.find(key);
  if (!apiKey) {
    return { valid: false, reason: 'invalid_key' };
  }

  // 2. Check status
  if (apiKey.status !== 'active') {
    return { valid: false, reason: 'inactive_key' };
  }

  // 3. Verify environment match
  if (apiKey.environment !== environment) {
    return { valid: false, reason: 'environment_mismatch' };
  }

  // 4. Check expiration
  if (new Date() > apiKey.expiresAt) {
    return { valid: false, reason: 'expired_key' };
  }

  // 5. Verify doctrine version
  if (apiKey.doctrineVersion !== getCurrentDoctrineVersion()) {
    return { valid: false, reason: 'doctrine_mismatch' };
  }

  // 6. Check conversation limit
  if (apiKey.conversationCount >= apiKey.maxConversations) {
    return { valid: false, reason: 'limit_exceeded' };
  }

  return { valid: true, key: apiKey };
}
```

---

### 2. Usage Tracking

```typescript
async function trackUsage(keyId: string, conversationId: string): Promise<void> {
  // 1. Increment counter
  await db.keys.update(keyId, {
    $inc: { conversationCount: 1 },
    $set: { lastUsed: new Date() }
  });

  // 2. Log usage
  await logConversation(keyId, conversationId);

  // 3. Check for limit breach
  const key = await db.keys.find(keyId);
  if (key.conversationCount > key.maxConversations) {
    await handleLimitBreach(key);
  }
}
```

---

### 3. Compliance Verification

```typescript
async function verifyCompliance(keyId: string, output: any): Promise<ComplianceResult> {
  const key = await db.keys.find(keyId);

  // 1. Check watermark presence
  if (key.watermarkRequired && !output.selfMeta) {
    return { compliant: false, reason: 'missing_watermark' };
  }

  // 2. Verify compliance token
  if (key.watermarkRequired && !key.complianceTokens.includes(output.selfMeta?.complianceToken)) {
    return { compliant: false, reason: 'invalid_compliance_token' };
  }

  // 3. Check doctrine version
  if (output.selfMeta?.doctrineVersion !== key.doctrineVersion) {
    return { compliant: false, reason: 'doctrine_version_mismatch' };
  }

  // 4. Verify tier match
  if (output.selfMeta?.licenseTier !== key.tier) {
    return { compliant: false, reason: 'tier_mismatch' };
  }

  return { compliant: true };
}
```

---

## 🛡️ Security Measures

### 1. Key Rotation

```typescript
async function rotateKey(keyId: string): Promise<SELFKey> {
  // 1. Get current key
  const oldKey = await db.keys.find(keyId);

  // 2. Generate new key
  const newKey = generateKey({
    id: oldKey.licenseeId,
    tier: oldKey.tier,
    environment: oldKey.environment
  });

  // 3. Mark old key as expired
  await db.keys.update(keyId, {
    $set: {
      status: 'expired',
      expiresAt: new Date()
    }
  });

  // 4. Store new key
  await storeKey(newKey);

  // 5. Notify licensee
  await notifyKeyRotation(oldKey.licenseeId, oldKey, newKey);

  return newKey;
}
```

---

### 2. Violation Handling

```typescript
async function handleViolation(keyId: string, violation: Violation): Promise<void> {
  // 1. Record violation
  await db.violations.insert({
    keyId,
    type: violation.type,
    severity: violation.severity,
    details: violation.details,
    timestamp: new Date()
  });

  // 2. Increment violation count
  await db.keys.update(keyId, {
    $inc: { violationCount: 1 },
    $set: { lastViolation: violation.type }
  });

  // 3. Determine action
  const key = await db.keys.find(keyId);
  const action = determineEnforcementAction(key, violation);

  // 4. Execute action
  switch (action) {
    case 'warning':
      await sendWarning(key.licenseeId, violation);
      break;

    case 'suspend':
      await suspendKey(keyId, violation);
      break;

    case 'terminate':
      await terminateKey(keyId, violation);
      break;
  }
}
```

---

## 📊 Monitoring and Reporting

### 1. Usage Dashboard

```typescript
async function getUsageDashboard(licenseeId: string): Promise<Dashboard> {
  // 1. Get all active keys
  const keys = await db.keys.find({ licenseeId, status: 'active' });

  // 2. Calculate usage
  const usage = keys.map(key => ({
    keyId: key.id,
    tier: key.tier,
    environment: key.environment,
    used: key.conversationCount,
    limit: key.maxConversations,
    percentage: (key.conversationCount / key.maxConversations) * 100
  }));

  // 3. Get compliance status
  const compliance = await checkCompliance(licenseeId);

  // 4. Get violation history
  const violations = await db.violations.find({
    keyId: { $in: keys.map(k => k.id) },
    timestamp: { $gte: subMonths(new Date(), 3) }
  });

  return {
    licenseeId,
    period: getCurrentPeriod(),
    keys: usage,
    compliance,
    violations,
    nextAudit: getNextAuditDate(licenseeId)
  };
}
```

---

### 2. Monthly Reports

```typescript
async function generateMonthlyReport(licenseeId: string): Promise<Report> {
  // 1. Get usage data
  const usage = await getUsageData(licenseeId);

  // 2. Calculate safety metrics
  const safety = await calculateSafetyMetrics(licenseeId);

  // 3. Check compliance
  const compliance = await runComplianceAudit(licenseeId);

  // 4. Generate PDF
  const pdf = await generateReportPDF({
    licensee: await getLicensee(licenseeId),
    period: getLastMonth(),
    usage,
    safety,
    compliance
  });

  // 5. Deliver report
  await email.send({
    to: getLicenseeEmail(licenseeId),
    subject: 'SELF Monthly Safety Report',
    attachments: [{ filename: 'report.pdf', content: pdf }]
  });

  return { delivered: true, period: getLastMonth() };
}
```

---

## 🎯 Implementation Requirements

### 1. Database Schema

```typescript
// Keys Collection
interface KeysCollection {
  _id: ObjectId;
  id: string; // UUID
  licenseeId: string;
  tier: string;
  environment: string;
  doctrineVersion: string;
  hash: string; // bcrypt
  salt: string;
  maxConversations: number;
  currentPeriod: string;
  conversationCount: number;
  watermarkRequired: boolean;
  auditTrailRequired: boolean;
  complianceTokens: string[];
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date | null;
  lastAudit: Date | null;
  status: string;
  violationCount: number;
  lastViolation: string | null;
  encryptedData: string; // Encrypted sensitive data
}

// Violations Collection
interface ViolationsCollection {
  _id: ObjectId;
  keyId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: Date;
  resolved: boolean;
  resolution: string | null;
}

// Audits Collection
interface AuditsCollection {
  _id: ObjectId;
  licenseeId: string;
  keyId: string | null;
  type: 'random' | 'targeted' | 'self';
  period: string;
  results: AuditResults;
  timestamp: Date;
  auditor: string | null;
}
```

---

### 2. API Endpoints

```typescript
// Key Management
POST  /api/keys              // Generate new key
GET   /api/keys              // List all keys
GET   /api/keys/:id          // Get key details
POST  /api/keys/:id/rotate   // Rotate key
POST  /api/keys/:id/suspend  // Suspend key
POST  /api/keys/:id/terminate // Terminate key

// Usage Tracking
POST  /api/usage             // Record conversation
GET   /api/usage             // Get usage report
GET   /api/usage/:id         // Get specific usage

// Compliance
POST  /api/compliance        // Submit compliance data
GET   /api/compliance        // Get compliance status
POST  /api/compliance/audit  // Request audit

// Violations
GET   /api/violations        // List violations
POST  /api/violations/:id/resolve // Resolve violation
```

---

### 3. Client-Side Integration

```typescript
// Initialize with API key
import { initializeSELF } from 'self-engine';

const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.NODE_ENV,
  onViolation: (violation) => {
    console.error('SELF Violation:', violation);
    // Implement your violation handling
  },
  onLimit: () => {
    console.warn('SELF Limit Approaching');
    // Implement your limit handling
  }
});

// All operations automatically include key validation
const detection = await self.detectState(userMessage);
```

---

## 🔐 Security Best Practices

### 1. Key Management
- **Never store secrets in code** - Use environment variables
- **Rotate keys regularly** - At least annually, or after incidents
- **Restrict key access** - Only authorized personnel should handle keys
- **Monitor key usage** - Watch for unusual patterns

### 2. Environment Configuration
```env
# Required environment variables
SELF_API_KEY=your-tier-specific-key
SELF_ENVIRONMENT=production
SELF_DOCTRINE_VERSION=1.8.2
SELF_COMPLIANCE_TOKENS=CT-20251216-PRO-48271,CT-20251216-PRO-48272
```

### 3. Incident Response
```typescript
// Example incident handler
self.on('violation', (violation) => {
  // 1. Log internally
  logSecurityEvent('self_violation', violation);

  // 2. Notify team
  notifyTeam('#security-alerts', `SELF Violation: ${violation.type}`);

  // 3. Initiate remediation
  if (violation.severity === 'critical') {
    disableSELFFeatures();
    beginManualReview();
  }
});
```

---

## 📝 Implementation Checklist

### 1. Setup
- [ ] Configure database collections
- [ ] Set up encryption keys
- [ ] Implement key generation endpoints
- [ ] Configure monitoring dashboard

### 2. Integration
- [ ] Add API key to environment
- [ ] Initialize SELF with key
- [ ] Implement violation handlers
- [ ] Set up usage monitoring

### 3. Compliance
- [ ] Enable watermarking
- [ ] Configure audit trails
- [ ] Set up compliance tokens
- [ ] Schedule regular audits

### 4. Security
- [ ] Restrict key access
- [ ] Set up rotation schedule
- [ ] Configure violation alerts
- [ ] Test incident response

---

## 🎯 Key Generation Summary

**SELF's API key system ensures that:**
1. **Every operation is authenticated** with tier-specific keys
2. **All usage is tracked** for compliance verification
3. **Safety protocols are enforced** through technical measures
4. **Violations are detected** and handled automatically

**Without proper key management, SELF cannot guarantee safety.**

**Implementation requires discipline—but the safety benefits are worth it.**
