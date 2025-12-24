# SELF™ API Key Creation Guide: Complete Implementation Documentation

## Overview

This guide provides comprehensive documentation for creating, managing, and integrating SELF™ API keys. The API key system is the foundation of external safety, ensuring all access is authenticated, tracked, and constrained.

## Table of Contents

1. [Key Architecture](#key-architecture)
2. [Key Generation Process](#key-generation-process)
3. [API Endpoints](#api-endpoints)
4. [Client Integration](#client-integration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Compliance Requirements](#compliance-requirements)

---

## Key Architecture

### Key Structure

```typescript
interface SELFKey {
  // Unique identifier
  id: string;                    // UUID v4
  licenseeId: string;           // License owner
  
  // License metadata
  tier: 'evaluation' | 'startup' | 'professional' | 'enterprise' | 'academic';
  environment: 'development' | 'staging' | 'production';
  doctrineVersion: string;      // e.g., "1.8.2"
  
  // Security components
  secret: string;               // 64-character cryptographic random
  hash: string;                 // bcrypt hash of secret
  salt: string;                 // Unique salt for each key
  
  // Usage limits
  maxConversations: number;
  currentPeriod: string;        // "2025-12"
  conversationCount: number;
  
  // Compliance requirements
  watermarkRequired: boolean;
  auditTrailRequired: boolean;
  complianceTokens: string[];
  
  // Lifecycle management
  createdAt: Date;
  expiresAt: Date;              // License term end
  lastUsed: Date | null;
  lastAudit: Date | null;
  
  // Status and violations
  status: 'active' | 'suspended' | 'terminated' | 'expired';
  violationCount: number;
  lastViolation: string | null;
}
```

### Key Lifecycle

```
License Verification → Key Generation → Storage → Distribution → Usage → Monitoring → Rotation/Expiration
```

---

## Key Generation Process

### 1. License Verification

Before generating any key, verify the license status:

```typescript
async function verifyLicense(licenseeId: string): Promise<License> {
  // Check license exists and is active
  const license = await db.licenses.find(licenseeId);
  if (!license || license.status !== 'active') {
    throw new Error('Invalid or inactive license');
  }

  // Verify payment status
  const payment = await payments.check(licenseeId);
  if (!payment.isPaid) {
    throw new Error('Payment required for key generation');
  }

  // Check compliance status
  const compliance = await audits.lastCompliance(licenseeId);
  if (compliance.status === 'failed') {
    throw new Error('Compliance violation prevents key generation');
  }

  return license;
}
```

### 2. Key Creation

Generate a new key with proper security measures:

```typescript
function generateKey(license: License): SELFKey {
  // Generate cryptographic components
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = bcrypt.hashSync(secret, salt);

  // Set tier-specific limits
  const tierLimits = getTierLimits(license.tier);
  const currentPeriod = getCurrentPeriod();

  // Create compliance requirements
  const watermarkRequired = license.tier !== 'evaluation';
  const auditTrailRequired = true;
  const complianceTokens = generateComplianceTokens(license.tier);

  // Calculate expiration
  const expiresAt = addYears(new Date(), 1);

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

### 3. Key Storage

Securely store the generated key:

```typescript
async function storeKey(key: SELFKey): Promise<void> {
  // Encrypt sensitive data
  const encrypted = encryptKeyData(key);

  // Store in database
  await db.keys.insert(encrypted);

  // Add to license record
  await db.licenses.update(key.licenseeId, {
    $push: { apiKeys: key.id }
  });

  // Log creation
  await logKeyEvent(key.id, 'created', {
    licenseeId: key.licenseeId,
    tier: key.tier,
    environment: key.environment
  });
}
```

---

## API Endpoints

### Key Management Endpoints

```typescript
// POST /api/keys - Generate new key
interface GenerateKeyRequest {
  licenseeId: string;
  environment: 'development' | 'staging' | 'production';
  tier: 'evaluation' | 'startup' | 'professional' | 'enterprise' | 'academic';
}

interface GenerateKeyResponse {
  keyId: string;
  distributionMethod: 'email' | 'dashboard' | 'api';
  expiresAt: Date;
  complianceTokens: string[];
}

// GET /api/keys - List all keys for licensee
interface ListKeysResponse {
  keys: Array<{
    id: string;
    tier: string;
    environment: string;
    status: string;
    createdAt: Date;
    expiresAt: Date;
    conversationCount: number;
    maxConversations: number;
  }>;
}

// GET /api/keys/:id - Get key details
interface GetKeyResponse {
  id: string;
  licenseeId: string;
  tier: string;
  environment: string;
  status: string;
  usage: {
    conversationCount: number;
    maxConversations: number;
    currentPeriod: string;
  };
  compliance: {
    watermarkRequired: boolean;
    auditTrailRequired: boolean;
    complianceTokens: string[];
  };
  lifecycle: {
    createdAt: Date;
    expiresAt: Date;
    lastUsed: Date | null;
    lastAudit: Date | null;
  };
  violations: {
    count: number;
    lastViolation: string | null;
  };
}

// POST /api/keys/:id/rotate - Rotate key
interface RotateKeyResponse {
  oldKeyId: string;
  newKeyId: string;
  rotationDate: Date;
  distributionMethod: string;
}

// POST /api/keys/:id/suspend - Suspend key
interface SuspendKeyRequest {
  reason: string;
  duration?: number; // Optional duration in days
}

// POST /api/keys/:id/terminate - Terminate key
interface TerminateKeyRequest {
  reason: string;
  immediate?: boolean; // Whether to terminate immediately
}
```

### Usage Tracking Endpoints

```typescript
// POST /api/usage - Record conversation
interface RecordUsageRequest {
  keyId: string;
  conversationId: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
}

// GET /api/usage - Get usage report
interface GetUsageRequest {
  keyId?: string;
  licenseeId?: string;
  startDate?: Date;
  endDate?: Date;
  period?: 'hour' | 'day' | 'week' | 'month';
}

interface GetUsageResponse {
  usage: Array<{
    period: string;
    conversationCount: number;
    tokenUsage: number;
    complianceViolations: number;
  }>;
  limits: {
    maxConversations: number;
    currentConversations: number;
    remainingConversations: number;
  };
}

// GET /api/usage/:id - Get specific usage
interface GetSpecificUsageResponse {
  conversationId: string;
  keyId: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
  compliance: {
    watermarkPresent: boolean;
    complianceTokenValid: boolean;
    doctrineVersionMatch: boolean;
  };
}
```

### Compliance Endpoints

```typescript
// POST /api/compliance - Submit compliance data
interface SubmitComplianceRequest {
  keyId: string;
  complianceData: {
    watermarkPresent: boolean;
    complianceToken: string;
    doctrineVersion: string;
    outputContent: string;
  };
}

// GET /api/compliance - Get compliance status
interface GetComplianceResponse {
  keyId: string;
  licenseeId: string;
  compliance: {
    watermarkRequired: boolean;
    auditTrailRequired: boolean;
    complianceTokens: string[];
    lastAudit: Date | null;
    auditStatus: 'pending' | 'passed' | 'failed';
  };
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    resolved: boolean;
  }>;
}

// POST /api/compliance/audit - Request audit
interface RequestAuditResponse {
  auditId: string;
  keyId: string;
  status: 'requested' | 'in_progress' | 'completed';
  scheduledDate: Date;
  estimatedCompletion: Date;
}
```

---

## Client Integration

### 1. Environment Setup

```env
# Required environment variables
SELF_API_KEY=your-tier-specific-key
SELF_ENVIRONMENT=production
SELF_DOCTRINE_VERSION=1.8.2
SELF_COMPLIANCE_TOKENS=CT-20251216-PRO-48271,CT-20251216-PRO-48272

# Optional configuration
SELF_BASE_URL=https://api.self.framework
SELF_TIMEOUT=30000
SELF_RETRY_ATTEMPTS=3
```

### 2. Basic Integration

```typescript
import { initializeSELF } from 'self-engine';

// Initialize with API key
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.SELF_ENVIRONMENT,
  onViolation: (violation) => {
    console.error('SELF Violation:', violation);
    // Implement your violation handling
  },
  onLimit: () => {
    console.warn('SELF Limit Approaching');
    // Implement your limit handling
  }
});

// Use SELF for state detection
try {
  const detection = await self.detectState(userMessage);
  console.log('Detected state:', detection);
} catch (error) {
  if (error instanceof DoctrinalError) {
    console.error('Safety violation:', error.message);
  } else {
    console.error('System error:', error);
  }
}
```

### 3. Advanced Integration

```typescript
// Custom violation handler
const violationHandler = {
  onViolation: (violation) => {
    // Log to your monitoring system
    logSecurityEvent('self_violation', violation);
    
    // Notify security team
    notifyTeam('#security-alerts', `SELF Violation: ${violation.type}`);
    
    // Take automated action for critical violations
    if (violation.severity === 'critical') {
      disableSELFFeatures();
      beginManualReview();
    }
  },
  
  onLimit: (limitInfo) => {
    // Handle limit approaching
    console.warn('SELF usage limit approaching:', limitInfo);
    
    // Request additional capacity if needed
    if (limitInfo.percentage > 80) {
      requestAdditionalCapacity(limitInfo.keyId);
    }
  }
};

// Initialize with custom handlers
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.SELF_ENVIRONMENT,
  ...violationHandler
});
```

### 4. Compliance Integration

```typescript
// Ensure compliance in all outputs
const complianceMiddleware = {
  onOutput: (output) => {
    // Verify watermark presence
    if (!output.selfMeta) {
      throw new Error('Missing SELF watermark');
    }
    
    // Verify compliance token
    const tokens = process.env.SELF_COMPLIANCE_TOKENS?.split(',');
    if (!tokens?.includes(output.selfMeta.complianceToken)) {
      throw new Error('Invalid compliance token');
    }
    
    // Verify doctrine version
    if (output.selfMeta.doctrineVersion !== process.env.SELF_DOCTRINE_VERSION) {
      throw new Error('Doctrine version mismatch');
    }
    
    return output;
  }
};

// Apply compliance middleware
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.SELF_ENVIRONMENT,
  onOutput: complianceMiddleware.onOutput
});
```

---

## Security Best Practices

### 1. Key Management

**Storage:**
- Never store API keys in source code
- Use environment variables or secure key management systems
- Encrypt keys at rest and in transit
- Implement key rotation policies

**Access Control:**
- Restrict key access to authorized personnel only
- Use role-based access control (RBAC)
- Implement audit logging for key access
- Monitor for unauthorized key usage

### 2. Environment Configuration

```typescript
// Secure configuration example
const config = {
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.SELF_ENVIRONMENT,
  timeout: parseInt(process.env.SELF_TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.SELF_RETRY_ATTEMPTS || '3'),
  complianceTokens: process.env.SELF_COMPLIANCE_TOKENS?.split(',') || []
};

// Validate configuration
if (!config.apiKey) {
  throw new Error('SELF_API_KEY environment variable is required');
}

if (!['development', 'staging', 'production'].includes(config.environment)) {
  throw new Error('Invalid SELF_ENVIRONMENT value');
}
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
  
  // 4. Escalate if needed
  if (violation.type === 'override_attempt') {
    escalateToSecurityTeam(violation);
  }
});
```

### 4. Monitoring and Alerting

```typescript
// Set up monitoring
const monitor = {
  checkUsage: () => {
    // Monitor usage patterns
    const usage = getUsageMetrics();
    if (usage.percentage > 90) {
      alert('High usage detected');
    }
  },
  
  checkViolations: () => {
    // Monitor violation patterns
    const violations = getRecentViolations();
    if (violations.length > 5) {
      alert('High violation rate detected');
    }
  },
  
  checkCompliance: () => {
    // Monitor compliance status
    const compliance = getComplianceStatus();
    if (compliance.status === 'failed') {
      alert('Compliance failure detected');
    }
  }
};

// Schedule monitoring
setInterval(monitor.checkUsage, 60000);      // Check every minute
setInterval(monitor.checkViolations, 300000); // Check every 5 minutes
setInterval(monitor.checkCompliance, 3600000); // Check every hour
```

---

## Troubleshooting

### Common Issues

**1. Invalid API Key**
```
Error: Invalid or expired API key
```
**Solution:** Verify the API key is correct and not expired. Check the key status in the dashboard.

**2. Environment Mismatch**
```
Error: Environment mismatch - key is for production, current environment is development
```
**Solution:** Ensure the SELF_ENVIRONMENT matches the key's environment. Use separate keys for each environment.

**3. Usage Limit Exceeded**
```
Error: Conversation limit exceeded for current period
```
**Solution:** Monitor usage and request additional capacity if needed. Consider upgrading your license tier.

**4. Compliance Violation**
```
Error: Missing watermark in output
```
**Solution:** Ensure your integration includes compliance middleware. Verify compliance tokens are configured correctly.

**5. Doctrine Version Mismatch**
```
Error: Doctrine version mismatch - expected 1.8.2, got 1.7.5
```
**Solution:** Update your SELF installation to the latest version. Ensure all components use the same doctrine version.

### Debug Mode

Enable debug mode for troubleshooting:

```typescript
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY,
  environment: process.env.SELF_ENVIRONMENT,
  debug: true, // Enable debug logging
  onDebug: (debugInfo) => {
    console.log('SELF Debug:', debugInfo);
  }
});
```

### Support Contact

For technical support:
- **Email:** support@self.framework
- **Documentation:** https://docs.self.framework
- **Status Page:** https://status.self.framework
- **Community Forum:** https://community.self.framework

---

## Compliance Requirements

### 1. Watermarking

All SELF outputs must include watermarks:

```typescript
// Example watermark structure
interface SelfWatermark {
  selfMeta: {
    version: string;
    doctrineVersion: string;
    licenseTier: string;
    complianceToken: string;
    timestamp: Date;
    conversationId: string;
  };
}
```

### 2. Audit Trail

Maintain complete audit trails:

```typescript
// Required audit log entries
interface AuditLogEntry {
  timestamp: Date;
  keyId: string;
  operation: string;
  input: string;
  output: string;
  compliance: {
    watermarkPresent: boolean;
    complianceTokenValid: boolean;
    doctrineVersionMatch: boolean;
  };
  violations: string[];
}
```

### 3. Regular Audits

Schedule regular compliance audits:

```typescript
// Monthly compliance audit
async function runMonthlyAudit(licenseeId: string): Promise<AuditReport> {
  const keys = await getActiveKeys(licenseeId);
  const violations = await getViolations(licenseeId);
  const compliance = await checkCompliance(licenseeId);
  
  return {
    licenseeId,
    period: getCurrentMonth(),
    keys: keys.length,
    violations: violations.length,
    compliance: compliance.status,
    recommendations: generateRecommendations(violations, compliance)
  };
}
```

### 4. Violation Reporting

Report violations promptly:

```typescript
// Automatic violation reporting
async function reportViolation(violation: Violation): Promise<void> {
  // Log violation
  await logViolation(violation);
  
  // Notify compliance team
  await notifyComplianceTeam(violation);
  
  // Submit to SELF compliance system
  await submitViolationReport(violation);
  
  // Escalate if critical
  if (violation.severity === 'critical') {
    await escalateViolation(violation);
  }
}
```

---

## Implementation Checklist

### Setup
- [ ] Configure database collections for keys, violations, and audits
- [ ] Set up encryption keys and secure storage
- [ ] Implement key generation endpoints
- [ ] Configure monitoring dashboard

### Integration
- [ ] Add API key to environment variables
- [ ] Initialize SELF with proper configuration
- [ ] Implement violation handlers
- [ ] Set up usage monitoring
- [ ] Configure compliance middleware

### Compliance
- [ ] Enable watermarking in all outputs
- [ ] Configure audit trail logging
- [ ] Set up compliance token validation
- [ ] Schedule regular audits
- [ ] Implement violation reporting

### Security
- [ ] Restrict key access to authorized personnel
- [ ] Set up key rotation schedule
- [ ] Configure violation alerts
- [ ] Test incident response procedures
- [ ] Implement monitoring and alerting

---

## Conclusion

The SELF™ API key system provides comprehensive security and compliance for all external interactions. By following this guide, you can ensure proper key management, secure integration, and full compliance with SELF's safety requirements.

**Remember:**
- API keys are the foundation of external safety
- All usage must be tracked and audited
- Compliance violations must be handled promptly
- Security is everyone's responsibility

For additional support or questions, contact the SELF support team or refer to the technical documentation.
