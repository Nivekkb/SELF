import { DoctrinalError, createDoctrinalError, COMPLIANCE_ERRORS } from "./doctrinalErrors";

/**
 * Safety Boundary Protection
 *
 * Bans raw errors from crossing the safety boundary.
 * All errors must be doctrinal (tied to doctrine sections).
 */

export class SafetyBoundaryError extends Error {
  constructor(
    message: string,
    public originalError: Error,
    public doctrinalContext?: DoctrinalError
  ) {
    super(`Safety Boundary Violation: ${message}`);
    this.name = "SafetyBoundaryError";
  }
}

/**
 * Wraps a function to ensure all errors crossing the boundary are doctrinal
 */
export function withSafetyBoundary<T extends any[], R>(
  fn: (...args: T) => R,
  context: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof SafetyBoundaryError) {
        // Already properly wrapped
        throw error;
      }

      if (isDoctrinalError(error)) {
        // Already doctrinal, wrap for context
        throw new SafetyBoundaryError(
          `Doctrinal error in ${context}: ${error.message}`,
          error,
          error
        );
      }

      // Raw error - convert to doctrinal error
      const doctrinalError = createDoctrinalError(
        "LOGGING_FAILURE",
        `Raw error crossed safety boundary in ${context}: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new SafetyBoundaryError(
        `Raw error converted to doctrinal in ${context}: ${doctrinalError.message}`,
        error instanceof Error ? error : new Error(String(error)),
        doctrinalError
      );
    }
  };
}

/**
 * Wraps an async function to ensure all errors crossing the boundary are doctrinal
 */
export function withAsyncSafetyBoundary<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof SafetyBoundaryError) {
        // Already properly wrapped
        throw error;
      }

      if (isDoctrinalError(error)) {
        // Already doctrinal, wrap for context
        throw new SafetyBoundaryError(
          `Doctrinal error in ${context}: ${error.message}`,
          error,
          error
        );
      }

      // Raw error - convert to doctrinal error
      const doctrinalError = createDoctrinalError(
        "LOGGING_FAILURE",
        `Raw error crossed safety boundary in ${context}: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new SafetyBoundaryError(
        `Raw error converted to doctrinal in ${context}: ${doctrinalError.message}`,
        error instanceof Error ? error : new Error(String(error)),
        doctrinalError
      );
    }
  };
}

/**
 * Type guard to check if an error is already doctrinal
 */
function isDoctrinalError(error: any): error is DoctrinalError {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'doctrineSections' in error &&
    'severity' in error &&
    'category' in error
  );
}

/**
 * Safety boundary assertion - throws if error is not doctrinal
 */
export function assertDoctrinalError(error: any, context: string): asserts error is DoctrinalError {
  if (!isDoctrinalError(error)) {
    const doctrinalError = createDoctrinalError(
      "LOGGING_FAILURE",
      `Non-doctrinal error in ${context}: ${error instanceof Error ? error.message : String(error)}`
    );

    throw new SafetyBoundaryError(
      `Error failed doctrinal assertion in ${context}`,
      error instanceof Error ? error : new Error(String(error)),
      doctrinalError
    );
  }
}

/**
 * Converts any error to a doctrinal error with appropriate classification
 */
export function doctrinalizeError(error: any, context: string): DoctrinalError {
  if (isDoctrinalError(error)) {
    return error;
  }

  // Classify the error based on context and content
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Security-related errors
  if (lowerMessage.includes('api key') || lowerMessage.includes('auth') || lowerMessage.includes('token')) {
    return createDoctrinalError(
      "UNAUTHORIZED_OVERRIDE",
      `Security error in ${context}: ${errorMessage}`
    );
  }

  // Configuration errors
  if (lowerMessage.includes('config') || lowerMessage.includes('environment') || lowerMessage.includes('missing')) {
    return createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Configuration error in ${context}: ${errorMessage}`
    );
  }

  // Data/log integrity errors
  if (lowerMessage.includes('log') || lowerMessage.includes('data') || lowerMessage.includes('integrity')) {
    return createDoctrinalError(
      "LOGGING_FAILURE",
      `Data integrity error in ${context}: ${errorMessage}`
    );
  }

  // Default to logging failure for unknown errors
  return createDoctrinalError(
    "LOGGING_FAILURE",
    `Unclassified error in ${context}: ${errorMessage}`
  );
}

/**
 * Safety boundary for external API calls
 * Ensures all external interactions are properly error-handled
 */
export async function safeExternalCall<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const doctrinalError = doctrinalizeError(error, `external call ${context}`);

    if (fallback !== undefined) {
      // Log the error but return fallback
      console.error(`[SELF Safety Boundary] External call failed in ${context}:`, doctrinalError);
      return fallback;
    }

    throw new SafetyBoundaryError(
      `External call failed in ${context}`,
      error instanceof Error ? error : new Error(String(error)),
      doctrinalError
    );
  }
}

/**
 * Safety boundary for SELF engine core functions
 * All core SELF operations must be wrapped with this boundary
 */
export function selfEngineBoundary<T extends any[], R>(
  fn: (...args: T) => R,
  operationName: string
): (...args: T) => R {
  return withSafetyBoundary(fn, `SELF engine ${operationName}`);
}

/**
 * Safety boundary for SELF engine async operations
 */
export function selfEngineAsyncBoundary<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
): (...args: T) => Promise<R> {
  return withAsyncSafetyBoundary(fn, `SELF engine ${operationName}`);
}
