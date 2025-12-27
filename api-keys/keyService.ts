import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { storage } from '../storage';

export interface SELFKey {
  id: string;
  licenseeId: string;
  tier: 'evaluation' | 'startup' | 'professional' | 'enterprise' | 'academic';
  environment: 'development' | 'staging' | 'production';
  doctrineVersion: string;
  secret: string;
  hash: string;
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
  status: 'active' | 'suspended' | 'terminated' | 'expired';
  violationCount: number;
  lastViolation: string | null;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  key?: SELFKey;
}

export interface License {
  id: string;
  tier: 'evaluation' | 'startup' | 'professional' | 'enterprise' | 'academic';
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'suspended';
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  complianceStatus: 'passed' | 'failed' | 'pending';
}

export interface Violation {
  keyId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: Date;
}

function getCurrentDoctrineVersion(): string {
  return process.env.SELF_DOCTRINE_VERSION || '1.8.2';
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTierLimits(tier: string): { conversations: number } {
  const limits: Record<string, { conversations: number }> = {
    evaluation: { conversations: 100 },
    startup: { conversations: 1000 },
    professional: { conversations: 10000 },
    enterprise: { conversations: 100000 },
    academic: { conversations: 5000 }
  };
  return limits[tier] || limits.evaluation;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function generateComplianceTokens(tier: string): string[] {
  const baseToken = `CT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = tier === 'evaluation' ? 1 : tier === 'startup' ? 2 : 3;
  return Array.from({ length: count }, (_, i) => `${baseToken}-${tier.toUpperCase().substring(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`);
}

export async function verifyLicense(licenseeId: string): Promise<License> {
  // Check if license exists in database
  const license = await storage.getLicense(licenseeId);
  if (!license || license.status !== 'active') {
    throw new Error('Invalid or inactive license');
  }

  // Verify payment status (simplified for now)
  if (license.paymentStatus !== 'paid') {
    throw new Error('Payment required for key generation');
  }

  // Check compliance status
  if (license.complianceStatus === 'failed') {
    throw new Error('Compliance violation prevents key generation');
  }

  return license;
}

export function generateKey(license: License): SELFKey {
  const id = uuidv4();
  const secret = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = bcrypt.hashSync(secret, salt);

  const tierLimits = getTierLimits(license.tier);
  const currentPeriod = getCurrentPeriod();

  const watermarkRequired = license.tier !== 'evaluation';
  const auditTrailRequired = true;
  const complianceTokens = generateComplianceTokens(license.tier);

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

export async function storeKey(key: SELFKey): Promise<void> {
  // Store in database
  await storage.createApiKey(key);

  // Add to license record
  await storage.addKeyToLicense(key.licenseeId, key.id);

  // Log creation
  await logKeyEvent(key.id, 'created', {
    licenseeId: key.licenseeId,
    tier: key.tier,
    environment: key.environment
  });
}

export async function validateRequest(keyId: string, environment: string): Promise<ValidationResult> {
  // Find key
  const apiKey = await storage.getApiKey(keyId);
  if (!apiKey) {
    return { valid: false, reason: 'invalid_key' };
  }

  // Check status
  if (apiKey.status !== 'active') {
    return { valid: false, reason: 'inactive_key' };
  }

  // Verify environment match
  if (apiKey.environment !== environment) {
    return { valid: false, reason: 'environment_mismatch' };
  }

  // Check expiration
  if (new Date() > apiKey.expiresAt) {
    return { valid: false, reason: 'expired_key' };
  }

  // Verify doctrine version
  if (apiKey.doctrineVersion !== getCurrentDoctrineVersion()) {
    return { valid: false, reason: 'doctrine_mismatch' };
  }

  // Check conversation limit
  if (apiKey.conversationCount >= apiKey.maxConversations) {
    return { valid: false, reason: 'limit_exceeded' };
  }

  return { valid: true, key: apiKey };
}

export async function trackUsage(keyId: string, conversationId: string): Promise<void> {
  // Increment counter
  await storage.incrementKeyUsage(keyId);

  // Log usage
  await logConversation(keyId, conversationId);

  // Check for limit breach
  const key = await storage.getApiKey(keyId);
  if (key && key.conversationCount > key.maxConversations) {
    await handleLimitBreach(key);
  }
}

export async function handleLimitBreach(key: SELFKey): Promise<void> {
  // Suspend key if limit exceeded
  await storage.updateKeyStatus(key.id, 'suspended');

  // Log violation
  await logKeyEvent(key.id, 'limit_breach', {
    conversationCount: key.conversationCount,
    maxConversations: key.maxConversations
  });

  // Notify licensee (implementation would go here)
}

export async function rotateKey(keyId: string): Promise<SELFKey> {
  // Get current key
  const oldKey = await storage.getApiKey(keyId);
  if (!oldKey) {
    throw new Error('Key not found');
  }

  // Generate new key
  const license = await verifyLicense(oldKey.licenseeId);
  const newKey = generateKey({
    ...license,
    environment: oldKey.environment
  });

  // Mark old key as expired
  await storage.updateKeyStatus(keyId, 'expired');
  await storage.updateKeyExpiration(keyId, new Date());

  // Store new key
  await storeKey(newKey);

  // Notify licensee (implementation would go here)
  await notifyKeyRotation(oldKey.licenseeId, oldKey, newKey);

  return newKey;
}

export async function handleViolation(keyId: string, violation: Violation): Promise<void> {
  // Record violation
  await storage.createViolation({
    keyId,
    type: violation.type,
    severity: violation.severity,
    details: violation.details,
    timestamp: new Date()
  });

  // Increment violation count
  await storage.incrementViolationCount(keyId, violation.type);

  // Determine action
  const key = await storage.getApiKey(keyId);
  if (!key) return;

  const action = determineEnforcementAction(key, violation);

  // Execute action
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

function determineEnforcementAction(key: SELFKey, violation: Violation): 'warning' | 'suspend' | 'terminate' {
  // Simple enforcement logic - would be more sophisticated in production
  if (violation.severity === 'critical') {
    return 'terminate';
  }

  if (key.violationCount >= 3 || violation.severity === 'high') {
    return 'suspend';
  }

  return 'warning';
}

async function suspendKey(keyId: string, violation: Violation): Promise<void> {
  await storage.updateKeyStatus(keyId, 'suspended');
  await logKeyEvent(keyId, 'suspended', {
    reason: violation.type,
    severity: violation.severity
  });
}

async function terminateKey(keyId: string, violation: Violation): Promise<void> {
  await storage.updateKeyStatus(keyId, 'terminated');
  await storage.updateKeyExpiration(keyId, new Date());
  await logKeyEvent(keyId, 'terminated', {
    reason: violation.type,
    severity: violation.severity
  });
}

async function logKeyEvent(keyId: string, eventType: string, data: any): Promise<void> {
  await storage.createKeyEvent({
    keyId,
    eventType,
    data,
    timestamp: new Date()
  });
}

async function logConversation(keyId: string, conversationId: string): Promise<void> {
  await storage.createConversationLog({
    keyId,
    conversationId,
    timestamp: new Date()
  });
}

async function notifyKeyRotation(licenseeId: string, oldKey: SELFKey, newKey: SELFKey): Promise<void> {
  // Implementation would send email or notification
  console.log(`Key rotation notification for ${licenseeId}: old key ${oldKey.id} replaced with ${newKey.id}`);
}

async function sendWarning(licenseeId: string, violation: Violation): Promise<void> {
  // Implementation would send warning notification
  console.log(`Warning sent to ${licenseeId} for violation: ${violation.type}`);
}
