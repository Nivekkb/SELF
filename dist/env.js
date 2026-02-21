/**
 * SELF Environment Variable Validation Module
 *
 * Provides type-safe environment variable access with validation.
 * Uses a custom lightweight implementation (can be replaced with znv/envalid if preferred).
 */
/**
 * Schema definition for SELF environment variables
 */
const ENV_SCHEMA = {
    // Logging
    SELF_LOG_ENABLED: {
        required: false,
        default: true,
        transform: (v) => v.toLowerCase() !== 'false',
        description: 'Enable/disable SELF logging',
    },
    SELF_LOG_PATH: {
        required: false,
        default: null,
        transform: (v) => v || null,
        description: 'Path to log file',
    },
    SELF_LOG_LEVEL: {
        required: false,
        default: 'info',
        transform: (v) => v,
        validate: (v) => ['debug', 'info', 'warn', 'error', 'critical'].includes(v) || 'Invalid log level',
        description: 'Minimum log level',
    },
    SELF_LOG_DIR: {
        required: false,
        default: null,
        transform: (v) => v || null,
        description: 'Directory for log files',
    },
    // Data provenance
    SELF_DATA_PROVENANCE: {
        required: false,
        default: 'prod',
        transform: (v) => v,
        validate: (v) => ['prod', 'test', 'demo'].includes(v) || 'Invalid provenance',
        description: 'Data provenance for logging',
    },
    // Doctrine
    SELF_DOCTRINE_VERSION: {
        required: false,
        default: '1.0',
        description: 'SELF doctrine version',
    },
    // Cold start
    SELF_COLD_START_TURNS: {
        required: false,
        default: 5,
        transform: (v) => parseInt(v, 10),
        validate: (v) => (!isNaN(v) && v >= 0) || 'Must be a non-negative number',
        description: 'Number of cold start turns',
    },
    // Variant forcing
    SELF_S1_FORCE_VARIANT: {
        required: false,
        default: null,
        transform: (v) => v ? v : null,
        validate: (v) => v === null || ['control', 's1_grounding', 's1_agency', 's1_strict'].includes(v) || 'Invalid S1 variant',
        description: 'Force S1 variant for testing',
    },
    SELF_S2_FORCE_VARIANT: {
        required: false,
        default: null,
        transform: (v) => v ? v : null,
        validate: (v) => v === null || ['control', 's2_strict'].includes(v) || 'Invalid S2 variant',
        description: 'Force S2 variant for testing',
    },
    SELF_S1_STRICT_COHORT: {
        required: false,
        default: true,
        transform: (v) => v.toLowerCase() !== 'false',
        description: 'Enable S1 strict cohort',
    },
    SELF_S1_STRICT_PERCENT: {
        required: false,
        default: 50,
        transform: (v) => parseInt(v, 10),
        validate: (v) => (!isNaN(v) && v >= 0 && v <= 100) || 'Must be between 0 and 100',
        description: 'Percentage of S1 strict cohort',
    },
    SELF_S2_STRICT_COHORT: {
        required: false,
        default: true,
        transform: (v) => v.toLowerCase() !== 'false',
        description: 'Enable S2 strict cohort',
    },
    SELF_S2_STRICT_PERCENT: {
        required: false,
        default: 50,
        transform: (v) => parseInt(v, 10),
        validate: (v) => (!isNaN(v) && v >= 0 && v <= 100) || 'Must be between 0 and 100',
        description: 'Percentage of S2 strict cohort',
    },
    // Server
    SELF_SERVER_PORT: {
        required: false,
        default: 3000,
        transform: (v) => parseInt(v, 10),
        validate: (v) => (!isNaN(v) && v > 0 && v < 65536) || 'Invalid port number',
        description: 'Server port',
    },
    SELF_SERVER_HOST: {
        required: false,
        default: 'localhost',
        description: 'Server host',
    },
    SELF_API_KEY: {
        required: false,
        default: null,
        transform: (v) => v || null,
        sensitive: true,
        description: 'API key for authentication',
    },
    // Feature flags
    SELF_ENABLE_RESEARCH_MODE: {
        required: false,
        default: false,
        transform: (v) => v.toLowerCase() === 'true',
        description: 'Enable research mode features',
    },
    SELF_ENABLE_METRICS_GATE: {
        required: false,
        default: true,
        transform: (v) => v.toLowerCase() !== 'false',
        description: 'Enable metrics gate',
    },
    // Environment
    NODE_ENV: {
        required: false,
        default: 'development',
        transform: (v) => v,
        validate: (v) => ['development', 'production', 'test'].includes(v) || 'Invalid NODE_ENV',
        description: 'Node environment',
    },
};
/**
 * Validation error
 */
export class EnvValidationError extends Error {
    constructor(errors) {
        super(`Environment validation failed: ${errors.map(e => `${e.key}: ${e.message}`).join(', ')}`);
        this.errors = errors;
        this.name = 'EnvValidationError';
    }
}
/**
 * Parse and validate environment variables
 */
function parseEnvValue(key, schema, rawValue) {
    const value = rawValue ?? process.env[key];
    // Check required
    if (value === undefined || value === '') {
        if (schema.required) {
            throw new EnvValidationError([{ key, message: 'Required but not provided' }]);
        }
        return schema.default;
    }
    // Transform
    let parsed;
    if (schema.transform) {
        try {
            parsed = schema.transform(value);
        }
        catch (error) {
            throw new EnvValidationError([
                { key, message: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
            ]);
        }
    }
    else {
        parsed = value;
    }
    // Validate
    if (schema.validate) {
        const result = schema.validate(parsed);
        if (result !== true) {
            throw new EnvValidationError([
                { key, message: typeof result === 'string' ? result : 'Validation failed' }
            ]);
        }
    }
    return parsed;
}
/**
 * Cached environment configuration
 */
let cachedEnv = null;
/**
 * Get validated environment configuration
 */
export function getEnv(forceRefresh = false) {
    if (cachedEnv && !forceRefresh) {
        return cachedEnv;
    }
    const errors = [];
    const config = {};
    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
        try {
            config[key] = parseEnvValue(key, schema, process.env[key]);
        }
        catch (error) {
            if (error instanceof EnvValidationError) {
                errors.push(...error.errors);
            }
            else {
                errors.push({ key, message: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
    }
    if (errors.length > 0) {
        throw new EnvValidationError(errors);
    }
    cachedEnv = config;
    return cachedEnv;
}
/**
 * Get a single environment variable with type safety
 */
export function getEnvValue(key) {
    const env = getEnv();
    return env[key];
}
/**
 * Check if running in production
 */
export function isProduction() {
    return getEnvValue('NODE_ENV') === 'production';
}
/**
 * Check if running in development
 */
export function isDevelopment() {
    return getEnvValue('NODE_ENV') === 'development';
}
/**
 * Check if running in test
 */
export function isTest() {
    return getEnvValue('NODE_ENV') === 'test';
}
/**
 * Reset cached environment (useful for testing)
 */
export function resetEnv() {
    cachedEnv = null;
}
/**
 * Validate environment without caching
 */
export function validateEnv() {
    try {
        getEnv(true);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof EnvValidationError) {
            return { valid: false, errors: error.errors };
        }
        return { valid: false, errors: [{ key: 'unknown', message: error instanceof Error ? error.message : 'Unknown error' }] };
    }
}
/**
 * Get environment documentation
 */
export function getEnvDocs() {
    return Object.entries(ENV_SCHEMA).map(([key, schema]) => ({
        key,
        description: schema.description || '',
        required: schema.required ?? false,
        default: schema.default,
    }));
}
/**
 * Create a type-safe environment accessor for a specific context
 */
export function createEnvAccessor(customSchema) {
    let cache = null;
    return {
        get: () => {
            if (cache)
                return cache;
            const result = {};
            for (const [key, schema] of Object.entries(customSchema)) {
                result[key] = parseEnvValue(key, schema, process.env[key]);
            }
            cache = result;
            return result;
        },
    };
}
// Export the schema for external use
export { ENV_SCHEMA };
//# sourceMappingURL=env.js.map