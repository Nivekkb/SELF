/**
 * SELF Structured Logger Module
 * 
 * Provides structured, auditable logging for SELF safety decisions.
 * Replaces console.log with JSON-structured output suitable for
 * production audit trails and compliance requirements.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 
  | 'safety_decision'
  | 'state_detection'
  | 'policy_application'
  | 'exit_decision'
  | 'override_prevention'
  | 'kill_switch'
  | 'audit'
  | 'performance'
  | 'governance'
  | 'validation';

export interface StructuredLogEntry {
  // Core fields
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  
  // Context fields
  doctrineVersion: string;
  sessionId?: string;
  userId?: string;
  runId?: string;
  
  // Safety context
  emotionalState?: string;
  confidence?: 'high' | 'medium' | 'low';
  triggerList?: string[];
  
  // Decision context
  decisionType?: string;
  decisionReason?: string;
  consideredActions?: string[];
  blockedActions?: Record<string, string>;
  
  // Performance
  durationMs?: number;
  
  // Error context
  error?: {
    code: string;
    message: string;
    stack?: string;
    doctrineSections?: string[];
  };
  
  // Additional metadata
  metadata?: Record<string, unknown>;
  
  // Provenance
  dataProvenance: 'prod' | 'test' | 'demo';
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeDoctrineVersion: boolean;
  dataProvenance: 'prod' | 'test' | 'demo';
  output: 'console' | 'file' | 'both';
  logPath?: string;
  redactSensitiveFields: boolean;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  level: 'info',
  minLevel: 'info',
  includeTimestamp: true,
  includeDoctrineVersion: true,
  dataProvenance: 'prod',
  output: 'console',
  redactSensitiveFields: true,
};

class StructuredLogger {
  private config: LoggerConfig;
  private doctrineVersion: string;
  private defaultContext: Partial<StructuredLogEntry> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.doctrineVersion = '1.0';
    
    // Load configuration from environment
    this.loadEnvironmentConfig();
  }

  private loadEnvironmentConfig(): void {
    if (process.env.SELF_LOG_ENABLED === 'false') {
      this.config.enabled = false;
    }
    
    if (process.env.SELF_LOG_LEVEL) {
      const level = process.env.SELF_LOG_LEVEL as LogLevel;
      if (LOG_LEVEL_PRIORITY[level] !== undefined) {
        this.config.level = level;
        this.config.minLevel = level;
      }
    }
    
    if (process.env.SELF_LOG_PATH) {
      this.config.logPath = process.env.SELF_LOG_PATH;
      this.config.output = 'file';
    }
    
    if (process.env.SELF_DATA_PROVENANCE) {
      const provenance = process.env.SELF_DATA_PROVENANCE as 'prod' | 'test' | 'demo';
      if (['prod', 'test', 'demo'].includes(provenance)) {
        this.config.dataProvenance = provenance;
      }
    }
  }

  setDefaultContext(context: Partial<StructuredLogEntry>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private redactSensitive(entry: StructuredLogEntry): StructuredLogEntry {
    if (!this.config.redactSensitiveFields) return entry;
    
    const redacted = { ...entry };
    
    // Redact potential PII in messages
    if (redacted.message && typeof redacted.message === 'string') {
      // Redact email patterns
      redacted.message = redacted.message.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        '[EMAIL_REDACTED]'
      );
      // Redact phone patterns
      redacted.message = redacted.message.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        '[PHONE_REDACTED]'
      );
    }
    
    return redacted;
  }

  private formatEntry(entry: StructuredLogEntry): string {
    const formatted = this.config.redactSensitiveFields 
      ? this.redactSensitive(entry) 
      : entry;
    return JSON.stringify(formatted);
  }

  private output(entry: StructuredLogEntry): void {
    const formatted = this.formatEntry(entry);
    
    switch (this.config.output) {
      case 'console':
        this.outputToConsole(entry, formatted);
        break;
      case 'file':
        this.outputToFile(formatted);
        break;
      case 'both':
        this.outputToConsole(entry, formatted);
        this.outputToFile(formatted);
        break;
    }
  }

  private outputToConsole(entry: StructuredLogEntry, formatted: string): void {
    // Use stderr for warn/error/critical to avoid mixing with stdout
    const stream = entry.level === 'error' || entry.level === 'critical' || entry.level === 'warn'
      ? process.stderr
      : process.stdout;
    
    // In development, pretty-print; in production, use JSON
    if (process.env.NODE_ENV !== 'production') {
      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
      const colorMap: Record<LogLevel, string> = {
        debug: '\x1b[36m',  // cyan
        info: '\x1b[32m',   // green
        warn: '\x1b[33m',   // yellow
        error: '\x1b[31m',  // red
        critical: '\x1b[35m\x1b[1m', // bright magenta
      };
      const reset = '\x1b[0m';
      const color = colorMap[entry.level] || '';
      
      stream.write(`${color}${prefix}${reset} ${entry.message}\n`);
      
      if (entry.level === 'error' || entry.level === 'critical') {
        if (entry.error) {
          stream.write(`  Error: ${entry.error.code} - ${entry.error.message}\n`);
          if (entry.error.stack) {
            stream.write(`  Stack: ${entry.error.stack}\n`);
          }
        }
        if (entry.metadata) {
          stream.write(`  Metadata: ${JSON.stringify(entry.metadata, null, 2)}\n`);
        }
      }
    } else {
      stream.write(formatted + '\n');
    }
  }

  private outputToFile(formatted: string): void {
    if (!this.config.logPath) {
      // Fall back to console if no log path configured
      process.stdout.write(formatted + '\n');
      return;
    }
    
    try {
      const fs = require('fs');
      const path = require('path');
      fs.mkdirSync(path.dirname(this.config.logPath), { recursive: true });
      fs.appendFileSync(this.config.logPath, formatted + '\n', 'utf8');
    } catch {
      // Silently fall back to console on file write errors
      process.stdout.write(formatted + '\n');
    }
  }

  private createEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Partial<StructuredLogEntry>
  ): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      doctrineVersion: this.doctrineVersion,
      dataProvenance: this.config.dataProvenance,
      ...this.defaultContext,
      ...context,
    };
  }

  // Public logging methods
  debug(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void {
    if (!this.shouldLog('debug')) return;
    this.output(this.createEntry('debug', category, message, context));
  }

  info(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void {
    if (!this.shouldLog('info')) return;
    this.output(this.createEntry('info', category, message, context));
  }

  warn(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void {
    if (!this.shouldLog('warn')) return;
    this.output(this.createEntry('warn', category, message, context));
  }

  error(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void {
    if (!this.shouldLog('error')) return;
    this.output(this.createEntry('error', category, message, context));
  }

  critical(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void {
    if (!this.shouldLog('critical')) return;
    this.output(this.createEntry('critical', category, message, context));
  }

  // Specialized logging methods for common SELF operations
  
  /**
   * Log a safety decision with full context
   */
  safetyDecision(args: {
    decisionType: string;
    emotionalState: string;
    confidence: 'high' | 'medium' | 'low';
    triggerList: string[];
    decisionReason: string;
    consideredActions?: string[];
    blockedActions?: Record<string, string>;
    sessionId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): void {
    this.info('safety_decision', `Safety decision: ${args.decisionType}`, {
      decisionType: args.decisionType,
      emotionalState: args.emotionalState,
      confidence: args.confidence,
      triggerList: args.triggerList,
      decisionReason: args.decisionReason,
      consideredActions: args.consideredActions,
      blockedActions: args.blockedActions,
      sessionId: args.sessionId,
      userId: args.userId,
      metadata: args.metadata,
    });
  }

  /**
   * Log state detection results
   */
  stateDetection(args: {
    detectedState: string;
    confidence: 'high' | 'medium' | 'low';
    scores: Record<string, number>;
    reasons: string[];
    triggers: string[];
    sessionId?: string;
    durationMs?: number;
  }): void {
    this.debug('state_detection', `State detected: ${args.detectedState}`, {
      emotionalState: args.detectedState,
      confidence: args.confidence,
      triggerList: args.triggers,
      metadata: {
        scores: args.scores,
        reasons: args.reasons,
      },
      sessionId: args.sessionId,
      durationMs: args.durationMs,
    });
  }

  /**
   * Log exit decision processing
   */
  exitDecision(args: {
    exitType: string;
    exitIntentDetected: boolean;
    hasRestIntent: boolean;
    blockedReason?: string;
    sessionId?: string;
    userId?: string;
  }): void {
    this.info('exit_decision', `Exit decision: ${args.exitType}`, {
      decisionType: 'exit',
      decisionReason: args.blockedReason || 'normal_exit',
      sessionId: args.sessionId,
      userId: args.userId,
      metadata: {
        exitType: args.exitType,
        exitIntentDetected: args.exitIntentDetected,
        hasRestIntent: args.hasRestIntent,
      },
    });
  }

  /**
   * Log kill switch triggers
   */
  killSwitch(args: {
    switchId: string;
    switchName: string;
    triggered: boolean;
    reason: string;
    actionsTaken?: string[];
    sessionId?: string;
  }): void {
    const level = args.triggered ? 'warn' : 'debug';
    this[level]('kill_switch', `Kill switch ${args.switchName}: ${args.triggered ? 'TRIGGERED' : 'checked'}`, {
      decisionType: 'kill_switch',
      sessionId: args.sessionId,
      metadata: {
        switchId: args.switchId,
        switchName: args.switchName,
        triggered: args.triggered,
        reason: args.reason,
        actionsTaken: args.actionsTaken,
      },
    });
  }

  /**
   * Log override prevention events
   */
  overridePrevention(args: {
    type: string;
    detected: boolean;
    blocked: boolean;
    reason: string;
    sessionId?: string;
  }): void {
    const level = args.detected ? 'warn' : 'debug';
    this[level]('override_prevention', `Override attempt: ${args.type}`, {
      decisionType: 'override_prevention',
      sessionId: args.sessionId,
      metadata: {
        overrideType: args.type,
        detected: args.detected,
        blocked: args.blocked,
        reason: args.reason,
      },
    });
  }

  /**
   * Log validation results
   */
  validation(args: {
    valid: boolean;
    violations: string[];
    policy: string;
    sessionId?: string;
    durationMs?: number;
  }): void {
    const level = args.valid ? 'debug' : 'warn';
    this[level]('validation', `Validation ${args.valid ? 'passed' : 'failed'}`, {
      decisionType: 'validation',
      sessionId: args.sessionId,
      durationMs: args.durationMs,
      metadata: {
        valid: args.valid,
        violations: args.violations,
        policy: args.policy,
      },
    });
  }

  /**
   * Log audit events
   */
  audit(args: {
    eventType: string;
    description: string;
    actor?: string;
    resource?: string;
    outcome: 'success' | 'failure' | 'denied';
    metadata?: Record<string, unknown>;
  }): void {
    this.info('audit', `Audit: ${args.eventType}`, {
      metadata: {
        eventType: args.eventType,
        description: args.description,
        actor: args.actor,
        resource: args.resource,
        outcome: args.outcome,
        ...args.metadata,
      },
    });
  }

  /**
   * Log performance metrics
   */
  performance(args: {
    operation: string;
    durationMs: number;
    success: boolean;
    metadata?: Record<string, unknown>;
  }): void {
    const level = args.durationMs > 1000 ? 'warn' : 'debug';
    this[level]('performance', `Performance: ${args.operation} took ${args.durationMs}ms`, {
      durationMs: args.durationMs,
      metadata: {
        operation: args.operation,
        success: args.success,
        ...args.metadata,
      },
    });
  }
}

// Singleton instance
let loggerInstance: StructuredLogger | null = null;

/**
 * Get the singleton logger instance
 */
export function getLogger(config?: Partial<LoggerConfig>): StructuredLogger {
  if (!loggerInstance) {
    loggerInstance = new StructuredLogger(config);
  }
  return loggerInstance;
}

/**
 * Create a new logger instance (useful for testing)
 */
export function createLogger(config?: Partial<LoggerConfig>): StructuredLogger {
  return new StructuredLogger(config);
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}

// Convenience functions for direct logging without getting instance
export const log = {
  debug: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => 
    getLogger().debug(category, message, context),
  info: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => 
    getLogger().info(category, message, context),
  warn: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => 
    getLogger().warn(category, message, context),
  error: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => 
    getLogger().error(category, message, context),
  critical: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => 
    getLogger().critical(category, message, context),
};

// Export the class for type checking
export { StructuredLogger };