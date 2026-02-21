/**
 * SELF Structured Logger Module
 *
 * Provides structured, auditable logging for SELF safety decisions.
 * Replaces console.log with JSON-structured output suitable for
 * production audit trails and compliance requirements.
 */
const LOG_LEVEL_PRIORITY = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
};
const DEFAULT_CONFIG = {
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
    constructor(config = {}) {
        this.defaultContext = {};
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.doctrineVersion = '1.0';
        // Load configuration from environment
        this.loadEnvironmentConfig();
    }
    loadEnvironmentConfig() {
        if (process.env.SELF_LOG_ENABLED === 'false') {
            this.config.enabled = false;
        }
        if (process.env.SELF_LOG_LEVEL) {
            const level = process.env.SELF_LOG_LEVEL;
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
            const provenance = process.env.SELF_DATA_PROVENANCE;
            if (['prod', 'test', 'demo'].includes(provenance)) {
                this.config.dataProvenance = provenance;
            }
        }
    }
    setDefaultContext(context) {
        this.defaultContext = { ...this.defaultContext, ...context };
    }
    shouldLog(level) {
        if (!this.config.enabled)
            return false;
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
    }
    redactSensitive(entry) {
        if (!this.config.redactSensitiveFields)
            return entry;
        const redacted = { ...entry };
        // Redact potential PII in messages
        if (redacted.message && typeof redacted.message === 'string') {
            // Redact email patterns
            redacted.message = redacted.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
            // Redact phone patterns
            redacted.message = redacted.message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
        }
        return redacted;
    }
    formatEntry(entry) {
        const formatted = this.config.redactSensitiveFields
            ? this.redactSensitive(entry)
            : entry;
        return JSON.stringify(formatted);
    }
    output(entry) {
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
    outputToConsole(entry, formatted) {
        // Use stderr for warn/error/critical to avoid mixing with stdout
        const stream = entry.level === 'error' || entry.level === 'critical' || entry.level === 'warn'
            ? process.stderr
            : process.stdout;
        // In development, pretty-print; in production, use JSON
        if (process.env.NODE_ENV !== 'production') {
            const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
            const colorMap = {
                debug: '\x1b[36m', // cyan
                info: '\x1b[32m', // green
                warn: '\x1b[33m', // yellow
                error: '\x1b[31m', // red
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
        }
        else {
            stream.write(formatted + '\n');
        }
    }
    outputToFile(formatted) {
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
        }
        catch {
            // Silently fall back to console on file write errors
            process.stdout.write(formatted + '\n');
        }
    }
    createEntry(level, category, message, context) {
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
    debug(category, message, context) {
        if (!this.shouldLog('debug'))
            return;
        this.output(this.createEntry('debug', category, message, context));
    }
    info(category, message, context) {
        if (!this.shouldLog('info'))
            return;
        this.output(this.createEntry('info', category, message, context));
    }
    warn(category, message, context) {
        if (!this.shouldLog('warn'))
            return;
        this.output(this.createEntry('warn', category, message, context));
    }
    error(category, message, context) {
        if (!this.shouldLog('error'))
            return;
        this.output(this.createEntry('error', category, message, context));
    }
    critical(category, message, context) {
        if (!this.shouldLog('critical'))
            return;
        this.output(this.createEntry('critical', category, message, context));
    }
    // Specialized logging methods for common SELF operations
    /**
     * Log a safety decision with full context
     */
    safetyDecision(args) {
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
    stateDetection(args) {
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
    exitDecision(args) {
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
    killSwitch(args) {
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
    overridePrevention(args) {
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
    validation(args) {
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
    audit(args) {
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
    performance(args) {
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
let loggerInstance = null;
/**
 * Get the singleton logger instance
 */
export function getLogger(config) {
    if (!loggerInstance) {
        loggerInstance = new StructuredLogger(config);
    }
    return loggerInstance;
}
/**
 * Create a new logger instance (useful for testing)
 */
export function createLogger(config) {
    return new StructuredLogger(config);
}
/**
 * Reset the singleton instance (useful for testing)
 */
export function resetLogger() {
    loggerInstance = null;
}
// Convenience functions for direct logging without getting instance
export const log = {
    debug: (category, message, context) => getLogger().debug(category, message, context),
    info: (category, message, context) => getLogger().info(category, message, context),
    warn: (category, message, context) => getLogger().warn(category, message, context),
    error: (category, message, context) => getLogger().error(category, message, context),
    critical: (category, message, context) => getLogger().critical(category, message, context),
};
// Export the class for type checking
export { StructuredLogger };
//# sourceMappingURL=logger.js.map