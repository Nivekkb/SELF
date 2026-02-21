/**
 * SELF Structured Logger Module
 *
 * Provides structured, auditable logging for SELF safety decisions.
 * Replaces console.log with JSON-structured output suitable for
 * production audit trails and compliance requirements.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'safety_decision' | 'state_detection' | 'policy_application' | 'exit_decision' | 'override_prevention' | 'kill_switch' | 'audit' | 'performance' | 'governance' | 'validation';
export interface StructuredLogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    doctrineVersion: string;
    sessionId?: string;
    userId?: string;
    runId?: string;
    emotionalState?: string;
    confidence?: 'high' | 'medium' | 'low';
    triggerList?: string[];
    decisionType?: string;
    decisionReason?: string;
    consideredActions?: string[];
    blockedActions?: Record<string, string>;
    durationMs?: number;
    error?: {
        code: string;
        message: string;
        stack?: string;
        doctrineSections?: string[];
    };
    metadata?: Record<string, unknown>;
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
declare class StructuredLogger {
    private config;
    private doctrineVersion;
    private defaultContext;
    constructor(config?: Partial<LoggerConfig>);
    private loadEnvironmentConfig;
    setDefaultContext(context: Partial<StructuredLogEntry>): void;
    private shouldLog;
    private redactSensitive;
    private formatEntry;
    private output;
    private outputToConsole;
    private outputToFile;
    private createEntry;
    debug(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void;
    info(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void;
    warn(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void;
    error(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void;
    critical(category: LogCategory, message: string, context?: Partial<StructuredLogEntry>): void;
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
    }): void;
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
    }): void;
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
    }): void;
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
    }): void;
    /**
     * Log override prevention events
     */
    overridePrevention(args: {
        type: string;
        detected: boolean;
        blocked: boolean;
        reason: string;
        sessionId?: string;
    }): void;
    /**
     * Log validation results
     */
    validation(args: {
        valid: boolean;
        violations: string[];
        policy: string;
        sessionId?: string;
        durationMs?: number;
    }): void;
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
    }): void;
    /**
     * Log performance metrics
     */
    performance(args: {
        operation: string;
        durationMs: number;
        success: boolean;
        metadata?: Record<string, unknown>;
    }): void;
}
/**
 * Get the singleton logger instance
 */
export declare function getLogger(config?: Partial<LoggerConfig>): StructuredLogger;
/**
 * Create a new logger instance (useful for testing)
 */
export declare function createLogger(config?: Partial<LoggerConfig>): StructuredLogger;
/**
 * Reset the singleton instance (useful for testing)
 */
export declare function resetLogger(): void;
export declare const log: {
    debug: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => void;
    info: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => void;
    warn: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => void;
    error: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => void;
    critical: (category: LogCategory, message: string, context?: Partial<StructuredLogEntry>) => void;
};
export { StructuredLogger };
//# sourceMappingURL=logger.d.ts.map