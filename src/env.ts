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
  // Logging configuration
  SELF_LOG_ENABLED: boolean;
  SELF_LOG_PATH: string | null;
  SELF_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  SELF_LOG_DIR: string | null;
  
  // Data provenance
  SELF_DATA_PROVENANCE: 'prod' | 'test' | 'demo';
  
  // Doctrine version
  SELF_DOCTRINE_VERSION: string;
  
  // Session configuration
  SELF_COLD_START_TURNS: number;
  
  // Variant forcing (for A/B testing)
  SELF_S1_FORCE_VARIANT: 'control' | 's1_grounding' | 's1_agency' | 's1_strict' | null;
  SELF_S2_FORCE_VARIANT: 'control' | 's2_strict' | null;
  SELF_S1_STRICT_COHORT: boolean;
  SELF_S1_STRICT_PERCENT: number;
  SELF_S2_STRICT_COHORT: boolean;
  SELF_S2_STRICT_PERCENT: number;
  
  // Server configuration
  SELF_SERVER_PORT: number;
  SELF_SERVER_HOST: string;
  SELF_API_KEY: string | null;
  
  // Feature flags
  SELF_ENABLE_RESEARCH_MODE: boolean;
  SELF_ENABLE_METRICS_GATE: boolean;
  
  // Environment
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Schema definition for SELF environment variables
 */
const ENV_SCHEMA = {
  // Logging
  SELF_LOG_ENABLED: {
    required: false,
    default: true,
    transform: (v: string) => v.toLowerCase() !== 'false',
    description: 'Enable/disable SELF logging',
  } as EnvSchema<boolean>,
  
  SELF_LOG_PATH: {
    required: false,
    default: null,
    transform: (v: string) => v || null,
    description: 'Path to log file',
  } as EnvSchema<string | null>,
  
  SELF_LOG_LEVEL: {
    required: false,
    default: 'info' as const,
    transform: (v: string) => v as SelfEnvConfig['SELF_LOG_LEVEL'],
    validate: (v: string) => ['debug', 'info', 'warn', 'error', 'critical'].includes(v) || 'Invalid log level',
    description: 'Minimum log level',
  } as EnvSchema<SelfEnvConfig['SELF_LOG_LEVEL']>,
  
  SELF_LOG_DIR: {
    required: false,
    default: null,
    transform: (v: string) => v || null,
    description: 'Directory for log files',
  } as EnvSchema<string | null>,
  
  // Data provenance
  SELF_DATA_PROVENANCE: {
    required: false,
    default: 'prod' as const,
    transform: (v: string) => v as SelfEnvConfig['SELF_DATA_PROVENANCE'],
    validate: (v: string) => ['prod', 'test', 'demo'].includes(v) || 'Invalid provenance',
    description: 'Data provenance for logging',
  } as EnvSchema<SelfEnvConfig['SELF_DATA_PROVENANCE']>,
  
  // Doctrine
  SELF_DOCTRINE_VERSION: {
    required: false,
    default: '1.0',
    description: 'SELF doctrine version',
  } as EnvSchema<string>,
  
  // Cold start
  SELF_COLD_START_TURNS: {
    required: false,
    default: 5,
    transform: (v: string) => parseInt(v, 10),
    validate: (v: number) => (!isNaN(v) && v >= 0) || 'Must be a non-negative number',
    description: 'Number of cold start turns',
  } as EnvSchema<number>,
  
  // Variant forcing
  SELF_S1_FORCE_VARIANT: {
    required: false,
    default: null,
    transform: (v: string) => v ? v as SelfEnvConfig['SELF_S1_FORCE_VARIANT'] : null,
    validate: (v: string | null) => 
      v === null || ['control', 's1_grounding', 's1_agency', 's1_strict'].includes(v) || 'Invalid S1 variant',
    description: 'Force S1 variant for testing',
  } as EnvSchema<SelfEnvConfig['SELF_S1_FORCE_VARIANT']>,
  
  SELF_S2_FORCE_VARIANT: {
    required: false,
    default: null,
    transform: (v: string) => v ? v as SelfEnvConfig['SELF_S2_FORCE_VARIANT'] : null,
    validate: (v: string | null) => 
      v === null || ['control', 's2_strict'].includes(v) || 'Invalid S2 variant',
    description: 'Force S2 variant for testing',
  } as EnvSchema<SelfEnvConfig['SELF_S2_FORCE_VARIANT']>,
  
  SELF_S1_STRICT_COHORT: {
    required: false,
    default: true,
    transform: (v: string) => v.toLowerCase() !== 'false',
    description: 'Enable S1 strict cohort',
  } as EnvSchema<boolean>,
  
  SELF_S1_STRICT_PERCENT: {
    required: false,
    default: 50,
    transform: (v: string) => parseInt(v, 10),
    validate: (v: number) => (!isNaN(v) && v >= 0 && v <= 100) || 'Must be between 0 and 100',
    description: 'Percentage of S1 strict cohort',
  } as EnvSchema<number>,
  
  SELF_S2_STRICT_COHORT: {
    required: false,
    default: true,
    transform: (v: string) => v.toLowerCase() !== 'false',
    description: 'Enable S2 strict cohort',
  } as EnvSchema<boolean>,
  
  SELF_S2_STRICT_PERCENT: {
    required: false,
    default: 50,
    transform: (v: string) => parseInt(v, 10),
    validate: (v: number) => (!isNaN(v) && v >= 0 && v <= 100) || 'Must be between 0 and 100',
    description: 'Percentage of S2 strict cohort',
  } as EnvSchema<number>,
  
  // Server
  SELF_SERVER_PORT: {
    required: false,
    default: 3000,
    transform: (v: string) => parseInt(v, 10),
    validate: (v: number) => (!isNaN(v) && v > 0 && v < 65536) || 'Invalid port number',
    description: 'Server port',
  } as EnvSchema<number>,
  
  SELF_SERVER_HOST: {
    required: false,
    default: 'localhost',
    description: 'Server host',
  } as EnvSchema<string>,
  
  SELF_API_KEY: {
    required: false,
    default: null,
    transform: (v: string) => v || null,
    sensitive: true,
    description: 'API key for authentication',
  } as EnvSchema<string | null>,
  
  // Feature flags
  SELF_ENABLE_RESEARCH_MODE: {
    required: false,
    default: false,
    transform: (v: string) => v.toLowerCase() === 'true',
    description: 'Enable research mode features',
  } as EnvSchema<boolean>,
  
  SELF_ENABLE_METRICS_GATE: {
    required: false,
    default: true,
    transform: (v: string) => v.toLowerCase() !== 'false',
    description: 'Enable metrics gate',
  } as EnvSchema<boolean>,
  
  // Environment
  NODE_ENV: {
    required: false,
    default: 'development' as const,
    transform: (v: string) => v as SelfEnvConfig['NODE_ENV'],
    validate: (v: string) => ['development', 'production', 'test'].includes(v) || 'Invalid NODE_ENV',
    description: 'Node environment',
  } as EnvSchema<SelfEnvConfig['NODE_ENV']>,
} as const;

/**
 * Validation error
 */
export class EnvValidationError extends Error {
  constructor(
    public readonly errors: Array<{ key: string; message: string }>
  ) {
    super(`Environment validation failed: ${errors.map(e => `${e.key}: ${e.message}`).join(', ')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Parse and validate environment variables
 */
function parseEnvValue<T>(key: string, schema: EnvSchema<T>, rawValue: string | undefined): T {
  const value = rawValue ?? process.env[key];
  
  // Check required
  if (value === undefined || value === '') {
    if (schema.required) {
      throw new EnvValidationError([{ key, message: 'Required but not provided' }]);
    }
    return schema.default as T;
  }
  
  // Transform
  let parsed: T;
  if (schema.transform) {
    try {
      parsed = schema.transform(value);
    } catch (error) {
      throw new EnvValidationError([
        { key, message: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
      ]);
    }
  } else {
    parsed = value as T;
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
let cachedEnv: SelfEnvConfig | null = null;

/**
 * Get validated environment configuration
 */
export function getEnv(forceRefresh = false): SelfEnvConfig {
  if (cachedEnv && !forceRefresh) {
    return cachedEnv;
  }
  
  const errors: Array<{ key: string; message: string }> = [];
  const config: Record<string, unknown> = {};
  
  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    try {
      config[key] = parseEnvValue(key, schema as EnvSchema<unknown>, process.env[key]);
    } catch (error) {
      if (error instanceof EnvValidationError) {
        errors.push(...error.errors);
      } else {
        errors.push({ key, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }
  
  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }
  
  cachedEnv = config as unknown as SelfEnvConfig;
  return cachedEnv;
}

/**
 * Get a single environment variable with type safety
 */
export function getEnvValue<K extends keyof SelfEnvConfig>(key: K): SelfEnvConfig[K] {
  const env = getEnv();
  return env[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvValue('NODE_ENV') === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvValue('NODE_ENV') === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvValue('NODE_ENV') === 'test';
}

/**
 * Reset cached environment (useful for testing)
 */
export function resetEnv(): void {
  cachedEnv = null;
}

/**
 * Validate environment without caching
 */
export function validateEnv(): { valid: boolean; errors: Array<{ key: string; message: string }> } {
  try {
    getEnv(true);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return { valid: false, errors: error.errors };
    }
    return { valid: false, errors: [{ key: 'unknown', message: error instanceof Error ? error.message : 'Unknown error' }] };
  }
}

/**
 * Get environment documentation
 */
export function getEnvDocs(): Array<{ key: string; description: string; required: boolean; default: unknown }> {
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
export function createEnvAccessor<T extends Record<string, EnvSchema<unknown>>>(
  customSchema: T
) {
  let cache: Record<string, unknown> | null = null;
  
  return {
    get: (): Record<string, unknown> => {
      if (cache) return cache;
      
      const result: Record<string, unknown> = {};
      for (const [key, schema] of Object.entries(customSchema)) {
        result[key] = parseEnvValue(key, schema as EnvSchema<unknown>, process.env[key]);
      }
      cache = result;
      return result;
    },
  };
}

// Export the schema for external use
export { ENV_SCHEMA };