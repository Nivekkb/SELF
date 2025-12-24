# SELF™ Key Integration Examples: Practical Implementation Guide

## Overview

This guide provides practical code examples and integration patterns for implementing SELF™ API keys in real-world applications. Each example demonstrates best practices for security, compliance, and error handling.

## Table of Contents

1. [Basic Integration Examples](#basic-integration-examples)
2. [Advanced Integration Patterns](#advanced-integration-patterns)
3. [Security Implementation Examples](#security-implementation-examples)
4. [Compliance Integration Examples](#compliance-integration-examples)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Monitoring and Observability](#monitoring-and-observability)

---

## Basic Integration Examples

### 1. Simple Web Application

```typescript
// app.ts - Basic Express.js integration
import express from 'express';
import { initializeSELF } from 'self-engine';

const app = express();
app.use(express.json());

// Initialize SELF
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY!,
  environment: process.env.SELF_ENVIRONMENT!,
  onViolation: handleViolation,
  onLimit: handleLimitWarning
});

// Middleware to handle SELF violations
function handleViolation(violation: any) {
  console.error('SELF Violation:', violation);
  
  // Log to monitoring system
  logToMonitoring('self_violation', violation);
  
  // Notify security team for critical violations
  if (violation.severity === 'critical') {
    sendAlert('security-team', `Critical SELF violation: ${violation.type}`);
  }
}

function handleLimitWarning(limitInfo: any) {
  console.warn('SELF usage approaching limit:', limitInfo);
  
  // Send warning to operations team
  if (limitInfo.percentage > 80) {
    sendAlert('operations', `SELF usage at ${limitInfo.percentage}%`);
  }
}

// API endpoint using SELF
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Use SELF for state detection
    const detection = await self.detectState(message);
    
    // Process based on detected state
    const response = await processMessage(message, detection, userId);
    
    res.json({
      response,
      selfMeta: {
        detectedState: detection.state,
        confidence: detection.confidence,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    if (error instanceof DoctrinalError) {
      return res.status(400).json({
        error: 'Safety violation detected',
        details: error.message
      });
    }
    
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process message based on state
async function processMessage(message: string, detection: any, userId: string) {
  // Your application logic here
  return `Processed message for user ${userId}`;
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. CLI Application

```typescript
// cli.ts - Command-line interface
import { Command } from 'commander';
import { initializeSELF } from 'self-engine';
import readline from 'readline';

const program = new Command();

// Initialize SELF
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY!,
  environment: process.env.SELF_ENVIRONMENT!,
  onViolation: (violation) => {
    console.error(`⚠️  SELF Violation: ${violation.type}`);
    if (violation.severity === 'critical') {
      process.exit(1);
    }
  }
});

// Interactive chat command
program
  .command('chat')
  .description('Start interactive chat session')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('Starting SELF-powered chat session...');
    console.log('Type "exit" to quit\n');

    const askQuestion = () => {
      rl.question('> ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          rl.close();
          return;
        }

        try {
          const detection = await self.detectState(input);
          console.log(`State: ${detection.state} (confidence: ${detection.confidence})`);
          
          // Your chat logic here
          console.log('Response: [Your application response]');
          
        } catch (error) {
          if (error instanceof DoctrinalError) {
            console.error(`❌ Safety violation: ${error.message}`);
          } else {
            console.error(`❌ Error: ${error.message}`);
          }
        }

        askQuestion();
      });
    };

    askQuestion();
  });

// Batch processing command
program
  .command('batch')
  .description('Process messages in batch')
  .argument('<file>', 'Input file with messages')
  .action(async (file) => {
    const messages = await loadMessagesFromFile(file);
    
    for (const message of messages) {
      try {
        const detection = await self.detectState(message);
        console.log(`Message: ${message.substring(0, 50)}...`);
        console.log(`State: ${detection.state}`);
        
      } catch (error) {
        if (error instanceof DoctrinalError) {
          console.error(`Safety violation in message: ${message.substring(0, 50)}...`);
        }
      }
    }
  });

program.parse();

async function loadMessagesFromFile(file: string): Promise<string[]> {
  // Implementation to load messages from file
  return [];
}
```

### 3. Microservice Integration

```typescript
// service.ts - Microservice with SELF integration
import { Kafka } from 'kafkajs';
import { initializeSELF } from 'self-engine';

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'self-service',
  brokers: ['localhost:9092']
});

// Initialize SELF
const self = initializeSELF({
  apiKey: process.env.SELF_API_KEY!,
  environment: process.env.SELF_ENVIRONMENT!,
  onViolation: handleViolation
});

async function handleViolation(violation: any) {
  // Log violation
  await logViolation(violation);
  
  // Send to dead letter queue for manual review
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: 'self-violations',
    messages: [{
      value: JSON.stringify({
        violation,
        timestamp: new Date().toISOString(),
        service: 'self-service'
      })
    }]
  });
}

// Message processor
export class MessageProcessor {
  private producer = kafka.producer();
  private consumer = kafka.consumer({ groupId: 'self-processor' });

  async start() {
    await this.producer.connect();
    await this.consumer.connect();
    
    await this.consumer.subscribe({ topic: 'input-messages' });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const input = JSON.parse(message.value!.toString());
          
          // Process with SELF
          const detection = await self.detectState(input.text);
          
          // Send to output topic
          await this.producer.send({
            topic: 'processed-messages',
            messages: [{
              value: JSON.stringify({
                ...input,
                selfMeta: {
                  state: detection.state,
                  confidence: detection.confidence,
                  timestamp: new Date().toISOString()
                }
              })
            }]
          });
          
        } catch (error) {
          if (error instanceof DoctrinalError) {
            // Send to violations topic
            await this.producer.send({
              topic: 'violations',
              messages: [{
                value: JSON.stringify({
                  input: message.value!.toString(),
                  error: error.message,
                  timestamp: new Date().toISOString()
                })
              }]
            });
          }
        }
      }
    });
  }
}
```

---

## Advanced Integration Patterns

### 1. Multi-Tenant Architecture

```typescript
// multi-tenant.ts - Multi-tenant SELF integration
import { initializeSELF } from 'self-engine';

interface TenantConfig {
  tenantId: string;
  apiKey: string;
  environment: string;
  complianceTokens: string[];
  limits: {
    maxConversations: number;
    rateLimit: number;
  };
}

class TenantManager {
  private tenants = new Map<string, TenantConfig>();
  private selfInstances = new Map<string, any>();

  addTenant(config: TenantConfig) {
    this.tenants.set(config.tenantId, config);
    
    // Create tenant-specific SELF instance
    const self = initializeSELF({
      apiKey: config.apiKey,
      environment: config.environment,
      onViolation: (violation) => this.handleTenantViolation(config.tenantId, violation)
    });
    
    this.selfInstances.set(config.tenantId, self);
  }

  async processForTenant(tenantId: string, message: string) {
    const config = this.tenants.get(tenantId);
    if (!config) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const self = this.selfInstances.get(tenantId);
    return await self.detectState(message);
  }

  private async handleTenantViolation(tenantId: string, violation: any) {
    const config = this.tenants.get(tenantId);
    
    // Log tenant-specific violation
    await logTenantViolation(tenantId, violation);
    
    // Apply tenant-specific actions
    if (violation.severity === 'critical') {
      // Suspend tenant access
      await this.suspendTenant(tenantId);
    }
  }

  private async suspendTenant(tenantId: string) {
    // Implementation to suspend tenant
    console.log(`Suspending tenant ${tenantId} due to violations`);
  }
}

// Usage
const tenantManager = new TenantManager();

// Add tenants
tenantManager.addTenant({
  tenantId: 'acme-corp',
  apiKey: process.env.ACME_SELF_API_KEY!,
  environment: 'production',
  complianceTokens: ['CT-ACME-2025'],
  limits: {
    maxConversations: 10000,
    rateLimit: 100
  }
});

// Process messages per tenant
app.post('/api/:tenantId/process', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { message } = req.body;
    
    const result = await tenantManager.processForTenant(tenantId, message);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Circuit Breaker Pattern

```typescript
// circuit-breaker.ts - Circuit breaker for SELF integration
import { CircuitBreaker } from 'opossum';

class SelfCircuitBreaker {
  private breaker: CircuitBreaker;
  private self: any;

  constructor() {
    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });

    // Configure circuit breaker
    this.breaker = new CircuitBreaker(this.self.detectState.bind(this.self), {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 10
    });

    // Circuit breaker events
    this.breaker.on('open', () => {
      console.warn('SELF circuit breaker opened - fallback mode activated');
      logCircuitBreakerEvent('opened');
    });

    this.breaker.on('halfOpen', () => {
      console.log('SELF circuit breaker half-open - testing recovery');
      logCircuitBreakerEvent('half-open');
    });

    this.breaker.on('close', () => {
      console.log('SELF circuit breaker closed - normal operation resumed');
      logCircuitBreakerEvent('closed');
    });

    this.breaker.fallback((message) => {
      console.log('Using fallback for SELF detection');
      return {
        state: 'unknown',
        confidence: 0,
        fallback: true,
        reason: 'circuit breaker open'
      };
    });
  }

  async detectState(message: string) {
    try {
      return await this.breaker.fire(message);
    } catch (error) {
      if (error instanceof DoctrinalError) {
        throw error; // Don't fallback on safety violations
      }
      throw error; // Re-throw other errors
    }
  }

  private handleViolation(violation: any) {
    // Log violation but don't affect circuit breaker
    console.error('SELF violation:', violation);
  }
}

// Usage
const selfWithCircuitBreaker = new SelfCircuitBreaker();

app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await selfWithCircuitBreaker.detectState(message);
    res.json(result);
  } catch (error) {
    if (error instanceof DoctrinalError) {
      res.status(400).json({ error: 'Safety violation' });
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});
```

### 3. Rate Limiting Integration

```typescript
// rate-limiter.ts - Rate limiting for SELF usage
import { RateLimiterMemory } from 'rate-limiter-flexible';

class SelfRateLimiter {
  private rateLimiter: RateLimiterMemory;
  private self: any;

  constructor() {
    // Configure rate limiter (100 requests per minute)
    this.rateLimiter = new RateLimiterMemory({
      keyGen: (req) => req.ip,
      points: 100, // Number of points
      duration: 60, // Per second(s)
      blockDuration: 60, // Block for 1 minute
    });

    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  async detectState(message: string, req: any) {
    try {
      // Check rate limit
      await this.rateLimiter.consume(req.ip);
      
      // Process with SELF
      return await this.self.detectState(message);
      
    } catch (rejRes) {
      if (rejRes instanceof DoctrinalError) {
        throw rejRes; // Don't rate limit safety violations
      }
      
      if (rejRes instanceof Error) {
        throw rejRes; // Re-throw other errors
      }
      
      // Rate limit exceeded
      throw new Error('Rate limit exceeded');
    }
  }

  private handleViolation(violation: any) {
    console.error('SELF violation:', violation);
  }
}

// Express middleware
const rateLimiter = new SelfRateLimiter();

app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await rateLimiter.detectState(message, req);
    res.json(result);
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json({ error: 'Too many requests' });
    } else if (error instanceof DoctrinalError) {
      res.status(400).json({ error: 'Safety violation' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

---

## Security Implementation Examples

### 1. Key Rotation Handler

```typescript
// key-rotation.ts - Automatic key rotation
import { initializeSELF } from 'self-engine';

class KeyRotationManager {
  private currentKey: string;
  private self: any;
  private rotationTimer: NodeJS.Timeout;

  constructor() {
    this.currentKey = process.env.SELF_API_KEY!;
    this.initializeSelf();
    this.scheduleRotation();
  }

  private initializeSelf() {
    this.self = initializeSELF({
      apiKey: this.currentKey,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  private scheduleRotation() {
    // Rotate every 30 days
    const rotationInterval = 30 * 24 * 60 * 60 * 1000;
    
    this.rotationTimer = setInterval(async () => {
      await this.rotateKey();
    }, rotationInterval);
  }

  async rotateKey() {
    try {
      // Get new key from key management service
      const newKey = await this.getNewKey();
      
      // Update environment variable
      process.env.SELF_API_KEY = newKey;
      
      // Re-initialize SELF with new key
      this.currentKey = newKey;
      this.initializeSelf();
      
      console.log('Key rotated successfully');
      
    } catch (error) {
      console.error('Key rotation failed:', error);
      // Don't stop the service, continue with old key
    }
  }

  private async getNewKey(): Promise<string> {
    // Implementation to get new key from key management service
    // This could be from a database, key management service, etc.
    return 'new-api-key-from-service';
  }

  async detectState(message: string) {
    return await this.self.detectState(message);
  }

  private handleViolation(violation: any) {
    console.error('SELF violation:', violation);
  }
}

// Usage
const keyManager = new KeyRotationManager();

app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await keyManager.detectState(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Secure Key Storage

```typescript
// secure-storage.ts - Secure key storage implementation
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeSELF } from 'self-engine';

class SecureKeyManager {
  private secretClient: SecretManagerServiceClient;
  private keyCache = new Map<string, { key: string; expiresAt: Date }>();

  constructor() {
    this.secretClient = new SecretManagerServiceClient();
  }

  async getApiKey(tenantId: string): Promise<string> {
    const cacheKey = `api-key-${tenantId}`;
    const cached = this.keyCache.get(cacheKey);

    // Check cache first
    if (cached && cached.expiresAt > new Date()) {
      return cached.key;
    }

    // Fetch from secret manager
    const key = await this.fetchFromSecretManager(tenantId);
    
    // Cache for 1 hour
    this.keyCache.set(cacheKey, {
      key,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    return key;
  }

  private async fetchFromSecretManager(tenantId: string): Promise<string> {
    const name = `projects/my-project/secrets/self-api-key-${tenantId}/versions/latest`;
    
    const [version] = await this.secretClient.accessSecretVersion({
      name: name,
    });

    const payload = version.payload?.data?.toString() || '';
    return payload;
  }

  async initializeSelfForTenant(tenantId: string) {
    const apiKey = await this.getApiKey(tenantId);
    
    return initializeSELF({
      apiKey,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: (violation) => this.handleViolation(tenantId, violation)
    });
  }

  private handleViolation(tenantId: string, violation: any) {
    console.error(`Tenant ${tenantId} - SELF violation:`, violation);
  }
}

// Usage with tenant isolation
const keyManager = new SecureKeyManager();

app.post('/api/:tenantId/process', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { message } = req.body;
    
    const self = await keyManager.initializeSelfForTenant(tenantId);
    const result = await self.detectState(message);
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Compliance Integration Examples

### 1. Audit Trail Implementation

```typescript
// audit-trail.ts - Comprehensive audit trail
import { initializeSELF } from 'self-engine';

interface AuditEntry {
  timestamp: Date;
  tenantId: string;
  userId: string;
  apiKey: string;
  input: string;
  output: any;
  compliance: {
    watermarkPresent: boolean;
    complianceTokenValid: boolean;
    doctrineVersionMatch: boolean;
  };
  violations: string[];
}

class AuditTrailManager {
  private auditLog: AuditEntry[] = [];
  private self: any;

  constructor() {
    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  async detectStateWithAudit(message: string, context: {
    tenantId: string;
    userId: string;
  }): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.self.detectState(message);
      
      // Create audit entry
      const auditEntry: AuditEntry = {
        timestamp: new Date(),
        tenantId: context.tenantId,
        userId: context.userId,
        apiKey: process.env.SELF_API_KEY!,
        input: message,
        output: result,
        compliance: {
          watermarkPresent: !!result.selfMeta,
          complianceTokenValid: this.validateComplianceToken(result.selfMeta?.complianceToken),
          doctrineVersionMatch: result.selfMeta?.doctrineVersion === process.env.SELF_DOCTRINE_VERSION
        },
        violations: []
      };

      // Log audit entry
      await this.logAuditEntry(auditEntry);
      
      return result;
      
    } catch (error) {
      const auditEntry: AuditEntry = {
        timestamp: new Date(),
        tenantId: context.tenantId,
        userId: context.userId,
        apiKey: process.env.SELF_API_KEY!,
        input: message,
        output: null,
        compliance: {
          watermarkPresent: false,
          complianceTokenValid: false,
          doctrineVersionMatch: false
        },
        violations: [error instanceof DoctrinalError ? error.message : 'Unknown error']
      };

      await this.logAuditEntry(auditEntry);
      throw error;
    }
  }

  private validateComplianceToken(token: string): boolean {
    const tokens = process.env.SELF_COMPLIANCE_TOKENS?.split(',') || [];
    return tokens.includes(token);
  }

  private async logAuditEntry(entry: AuditEntry) {
    // Store in database
    await this.storeAuditEntry(entry);
    
    // Send to audit service
    await this.sendToAuditService(entry);
    
    // Log to monitoring
    console.log('Audit entry created:', {
      tenantId: entry.tenantId,
      userId: entry.userId,
      timestamp: entry.timestamp,
      compliance: entry.compliance
    });
  }

  private async storeAuditEntry(entry: AuditEntry) {
    // Implementation to store in database
    this.auditLog.push(entry);
  }

  private async sendToAuditService(entry: AuditEntry) {
    // Implementation to send to external audit service
    console.log('Sending audit entry to service:', entry.tenantId);
  }

  private handleViolation(violation: any) {
    console.error('SELF violation:', violation);
  }
}

// Usage
const auditManager = new AuditTrailManager();

app.post('/api/process', async (req, res) => {
  try {
    const { message, tenantId, userId } = req.body;
    const result = await auditManager.detectStateWithAudit(message, {
      tenantId,
      userId
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Compliance Validation Middleware

```typescript
// compliance-middleware.ts - Express middleware for compliance
import { Request, Response, NextFunction } from 'express';

interface ComplianceContext {
  watermarkRequired: boolean;
  complianceTokens: string[];
  doctrineVersion: string;
}

function complianceMiddleware(context: ComplianceContext) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store compliance context in request
    req.complianceContext = context;
    
    // Override res.json to validate compliance
    const originalJson = res.json;
    res.json = function(body: any) {
      if (context.watermarkRequired) {
        const isValid = validateCompliance(body, context);
        if (!isValid) {
          console.error('Compliance validation failed:', body);
          return res.status(400).json({
            error: 'Compliance validation failed',
            details: 'Missing or invalid compliance watermark'
          });
        }
      }
      
      return originalJson.call(this, body);
    }.bind(res);
    
    next();
  };
}

function validateCompliance(output: any, context: ComplianceContext): boolean {
  // Check watermark presence
  if (!output.selfMeta) {
    return false;
  }

  // Check compliance token
  if (!context.complianceTokens.includes(output.selfMeta.complianceToken)) {
    return false;
  }

  // Check doctrine version
  if (output.selfMeta.doctrineVersion !== context.doctrineVersion) {
    return false;
  }

  return true;
}

// Usage
const app = express();

// Apply compliance middleware
app.use(complianceMiddleware({
  watermarkRequired: true,
  complianceTokens: process.env.SELF_COMPLIANCE_TOKENS?.split(',') || [],
  doctrineVersion: process.env.SELF_DOCTRINE_VERSION!
}));

app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Your processing logic here
    const result = {
      response: 'Processed message',
      selfMeta: {
        complianceToken: process.env.SELF_COMPLIANCE_TOKENS?.split(',')[0],
        doctrineVersion: process.env.SELF_DOCTRINE_VERSION,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Error Handling Patterns

### 1. Comprehensive Error Handler

```typescript
// error-handler.ts - Comprehensive error handling
import { initializeSELF } from 'self-engine';

class ComprehensiveErrorHandler {
  private self: any;

  constructor() {
    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  async detectStateWithErrorHandling(message: string, context: any) {
    try {
      // Input validation
      this.validateInput(message);
      
      // Rate limiting check
      await this.checkRateLimit(context.userId);
      
      // Process with SELF
      const result = await this.self.detectState(message);
      
      // Output validation
      this.validateOutput(result);
      
      return result;
      
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  private validateInput(message: string) {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid input: message must be a non-empty string');
    }
    
    if (message.length > 10000) {
      throw new Error('Input too long: maximum 10000 characters allowed');
    }
  }

  private async checkRateLimit(userId: string) {
    // Implementation of rate limiting
    const currentRequests = await this.getCurrentRequests(userId);
    if (currentRequests > 100) {
      throw new Error('Rate limit exceeded');
    }
  }

  private validateOutput(result: any) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid output from SELF');
    }
    
    if (!result.state || typeof result.confidence !== 'number') {
      throw new Error('Incomplete output from SELF');
    }
  }

  private async handleError(error: any, context: any) {
    const errorInfo = {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      context: {
        userId: context.userId,
        timestamp: new Date().toISOString(),
        inputLength: context.input?.length || 0
      }
    };

    // Log error
    await this.logError(errorInfo);

    // Handle different error types
    if (error instanceof DoctrinalError) {
      return {
        error: 'Safety violation detected',
        details: error.message,
        code: 'DOCTRINAL_ERROR',
        timestamp: new Date().toISOString()
      };
    }

    if (error.message.includes('Rate limit')) {
      return {
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60
      };
    }

    // Generic error
    return {
      error: 'Internal server error',
      details: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    };
  }

  private async logError(errorInfo: any) {
    // Log to error tracking service
    console.error('Error occurred:', errorInfo);
    
    // Send to monitoring service
    await this.sendToMonitoring(errorInfo);
  }

  private async sendToMonitoring(errorInfo: any) {
    // Implementation to send to monitoring service
    console.log('Sending error to monitoring:', errorInfo.type);
  }

  private async getCurrentRequests(userId: string): Promise<number> {
    // Implementation to get current request count
    return 10; // Mock implementation
  }

  private handleViolation(violation: any) {
    console.error('SELF violation:', violation);
  }
}

// Usage
const errorHandler = new ComprehensiveErrorHandler();

app.post('/api/process', async (req, res) => {
  try {
    const { message, userId } = req.body;
    const result = await errorHandler.detectStateWithErrorHandling(message, {
      userId,
      input: message
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
});
```

---

## Monitoring and Observability

### 1. Metrics Collection

```typescript
// metrics.ts - Metrics collection for SELF usage
import { initializeSELF } from 'self-engine';

class MetricsCollector {
  private metrics = {
    requests: 0,
    violations: 0,
    errors: 0,
    responseTime: [],
    compliance: {
      watermarkPresent: 0,
      complianceTokenValid: 0,
      doctrineVersionMatch: 0
    }
  };

  private self: any;

  constructor() {
    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  async detectStateWithMetrics(message: string, context: any) {
    const startTime = Date.now();
    this.metrics.requests++;

    try {
      const result = await this.self.detectState(message);
      const responseTime = Date.now() - startTime;
      
      // Record metrics
      this.metrics.responseTime.push(responseTime);
      this.recordComplianceMetrics(result);
      
      return result;
      
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  private recordComplianceMetrics(result: any) {
    if (result.selfMeta) {
      this.metrics.compliance.watermarkPresent++;
      
      if (this.validateComplianceToken(result.selfMeta.complianceToken)) {
        this.metrics.compliance.complianceTokenValid++;
      }
      
      if (result.selfMeta.doctrineVersion === process.env.SELF_DOCTRINE_VERSION) {
        this.metrics.compliance.doctrineVersionMatch++;
      }
    }
  }

  private validateComplianceToken(token: string): boolean {
    const tokens = process.env.SELF_COMPLIANCE_TOKENS?.split(',') || [];
    return tokens.includes(token);
  }

  private handleViolation(violation: any) {
    this.metrics.violations++;
    console.error('SELF violation:', violation);
  }

  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;

    return {
      requests: this.metrics.requests,
      violations: this.metrics.violations,
      errors: this.metrics.errors,
      avgResponseTime,
      compliance: {
        watermarkPresent: this.metrics.compliance.watermarkPresent,
        complianceTokenValid: this.metrics.compliance.complianceTokenValid,
        doctrineVersionMatch: this.metrics.compliance.doctrineVersionMatch,
        complianceRate: this.calculateComplianceRate()
      }
    };
  }

  private calculateComplianceRate(): number {
    const total = this.metrics.requests;
    const compliant = Math.min(
      this.metrics.compliance.watermarkPresent,
      this.metrics.compliance.complianceTokenValid,
      this.metrics.compliance.doctrineVersionMatch
    );
    
    return total > 0 ? (compliant / total) * 100 : 0;
  }
}

// Metrics endpoint
const metricsCollector = new MetricsCollector();

app.get('/api/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  res.json(metrics);
});

// Usage
app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await metricsCollector.detectStateWithMetrics(message, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Health Check Implementation

```typescript
// health-check.ts - Health check for SELF integration
import { initializeSELF } from 'self-engine';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    selfConnection: boolean;
    apiKeyValid: boolean;
    doctrineVersion: boolean;
    complianceTokens: boolean;
    rateLimit: boolean;
  };
  metrics: {
    uptime: number;
    requests: number;
    violations: number;
    errors: number;
  };
  timestamp: Date;
}

class HealthChecker {
  private self: any;
  private startTime = Date.now();

  constructor() {
    this.self = initializeSELF({
      apiKey: process.env.SELF_API_KEY!,
      environment: process.env.SELF_ENVIRONMENT!,
      onViolation: this.handleViolation.bind(this)
    });
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      selfConnection: await this.checkSelfConnection(),
      apiKeyValid: this.checkApiKey(),
      doctrineVersion: this.checkDoctrineVersion(),
      complianceTokens: this.checkComplianceTokens(),
      rateLimit: await this.checkRateLimit()
    };

    const status = this.calculateHealthStatus(checks);
    const metrics = await this.getMetrics();

    return {
      status,
      checks,
      metrics,
      timestamp: new Date()
    };
  }

  private async checkSelfConnection(): Promise<boolean> {
    try {
      await this.self.detectState('health check');
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkApiKey(): boolean {
    return !!process.env.SELF_API_KEY && process.env.SELF_API_KEY.length > 0;
  }

  private checkDoctrineVersion(): boolean {
    return !!process.env.SELF_DOCTRINE_VERSION;
  }

  private checkComplianceTokens(): boolean {
    const tokens = process.env.SELF_COMPLIANCE_TOKENS;
    return !!tokens && tokens.split(',').length > 0;
  }

  private async checkRateLimit(): Promise<boolean> {
    try {
      // Make a test request to check rate limiting
      await this.self.detectState('rate limit check');
      return true;
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        return false;
      }
      return true; // Other errors don't indicate rate limiting
    }
  }

  private calculateHealthStatus(checks: any): 'healthy' | 'unhealthy' | 'degraded' {
    const failedChecks = Object.values(checks).filter(check => !check).length;
    
    if (failedChecks === 0) return 'healthy';
    if (failedChecks <= 1) return 'degraded';
    return 'unhealthy';
  }

  private async getMetrics(): Promise<any> {
    return {
      uptime: Date.now() - this.startTime,
      requests: 0, // Implementation to get request count
      violations: 0, // Implementation to get violation count
      errors: 0 // Implementation to get error count
    };
  }

  private handleViolation(violation: any) {
    console.error('SELF violation:', violation);
  }
}

// Health check endpoint
const healthChecker = new HealthChecker();

app.get('/api/health', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});
```

---

## Implementation Checklist

### Basic Integration
- [ ] Set up environment variables
- [ ] Initialize SELF with proper configuration
- [ ] Implement basic error handling
- [ ] Add violation handlers

### Advanced Patterns
- [ ] Implement multi-tenant support if needed
- [ ] Add circuit breaker for resilience
- [ ] Implement rate limiting
- [ ] Set up key rotation

### Security
- [ ] Use secure key storage
- [ ] Implement key rotation
- [ ] Add access controls
- [ ] Set up monitoring

### Compliance
- [ ] Implement audit trails
- [ ] Add compliance validation
- [ ] Set up watermarking
- [ ] Configure violation reporting

### Monitoring
- [ ] Add metrics collection
- [ ] Implement health checks
- [ ] Set up alerting
- [ ] Configure logging

---

## Conclusion

These examples provide practical patterns for integrating SELF™ API keys into various application architectures. Each example demonstrates best practices for security, compliance, and error handling while maintaining the safety guarantees that make SELF™ externally safe.

**Key principles to remember:**
- Always validate inputs and outputs
- Implement proper error handling and logging
- Use secure key storage and rotation
- Maintain comprehensive audit trails
- Monitor usage and compliance
- Handle violations appropriately

For additional examples or specific use cases, refer to the technical documentation or contact the SELF support team.
