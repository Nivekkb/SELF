/**
 * SELF Environment Variable Validation Module
 *
 * Provides type-safe environment variable access with validation.
 * Uses a custom lightweight implementation (can be replaced with znv/envalid if preferred).
 */
/**
 * Environment variable schema definition
 */
export interface EnvSchema<T> {
    required?: boolean;
    default?: T;
    transform?: (value: string) => T;
    validate?: (value: T) => boolean | string;
    description?: string;
    sensitive?: boolean;
}
/**
 * Parsed SELF environment configuration
 */
export interface SelfEnvConfig {
    SELF_LOG_ENABLED: boolean;
    SELF_LOG_PATH: string | null;
    SELF_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    SELF_LOG_DIR: string | null;
    SELF_DATA_PROVENANCE: 'prod' | 'test' | 'demo';
    SELF_DOCTRINE_VERSION: string;
    SELF_COLD_START_TURNS: number;
    SELF_S1_FORCE_VARIANT: 'control' | 's1_grounding' | 's1_agency' | 's1_strict' | null;
    SELF_S2_FORCE_VARIANT: 'control' | 's2_strict' | null;
    SELF_S1_STRICT_COHORT: boolean;
    SELF_S1_STRICT_PERCENT: number;
    SELF_S2_STRICT_COHORT: boolean;
    SELF_S2_STRICT_PERCENT: number;
    SELF_SERVER_PORT: number;
    SELF_SERVER_HOST: string;
    SELF_API_KEY: string | null;
    SELF_ENABLE_RESEARCH_MODE: boolean;
    SELF_ENABLE_METRICS_GATE: boolean;
    NODE_ENV: 'development' | 'production' | 'test';
}
/**
 * Schema definition for SELF environment variables
 */
declare const ENV_SCHEMA: {
    readonly SELF_LOG_ENABLED: EnvSchema<boolean>;
    readonly SELF_LOG_PATH: EnvSchema<string | null>;
    readonly SELF_LOG_LEVEL: EnvSchema<SelfEnvConfig["SELF_LOG_LEVEL"]>;
    readonly SELF_LOG_DIR: EnvSchema<string | null>;
    readonly SELF_DATA_PROVENANCE: EnvSchema<SelfEnvConfig["SELF_DATA_PROVENANCE"]>;
    readonly SELF_DOCTRINE_VERSION: EnvSchema<string>;
    readonly SELF_COLD_START_TURNS: EnvSchema<number>;
    readonly SELF_S1_FORCE_VARIANT: EnvSchema<SelfEnvConfig["SELF_S1_FORCE_VARIANT"]>;
    readonly SELF_S2_FORCE_VARIANT: EnvSchema<SelfEnvConfig["SELF_S2_FORCE_VARIANT"]>;
    readonly SELF_S1_STRICT_COHORT: EnvSchema<boolean>;
    readonly SELF_S1_STRICT_PERCENT: EnvSchema<number>;
    readonly SELF_S2_STRICT_COHORT: EnvSchema<boolean>;
    readonly SELF_S2_STRICT_PERCENT: EnvSchema<number>;
    readonly SELF_SERVER_PORT: EnvSchema<number>;
    readonly SELF_SERVER_HOST: EnvSchema<string>;
    readonly SELF_API_KEY: EnvSchema<string | null>;
    readonly SELF_ENABLE_RESEARCH_MODE: EnvSchema<boolean>;
    readonly SELF_ENABLE_METRICS_GATE: EnvSchema<boolean>;
    readonly NODE_ENV: EnvSchema<SelfEnvConfig["NODE_ENV"]>;
};
/**
 * Validation error
 */
export declare class EnvValidationError extends Error {
    readonly errors: Array<{
        key: string;
        message: string;
    }>;
    constructor(errors: Array<{
        key: string;
        message: string;
    }>);
}
/**
 * Get validated environment configuration
 */
export declare function getEnv(forceRefresh?: boolean): SelfEnvConfig;
/**
 * Get a single environment variable with type safety
 */
export declare function getEnvValue<K extends keyof SelfEnvConfig>(key: K): SelfEnvConfig[K];
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in test
 */
export declare function isTest(): boolean;
/**
 * Reset cached environment (useful for testing)
 */
export declare function resetEnv(): void;
/**
 * Validate environment without caching
 */
export declare function validateEnv(): {
    valid: boolean;
    errors: Array<{
        key: string;
        message: string;
    }>;
};
/**
 * Get environment documentation
 */
export declare function getEnvDocs(): Array<{
    key: string;
    description: string;
    required: boolean;
    default: unknown;
}>;
/**
 * Create a type-safe environment accessor for a specific context
 */
export declare function createEnvAccessor<T extends Record<string, EnvSchema<unknown>>>(customSchema: T): {
    get: () => Record<string, unknown>;
};
export { ENV_SCHEMA };
//# sourceMappingURL=env.d.ts.map