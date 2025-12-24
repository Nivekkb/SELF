import { DoctrinalError } from "./doctrinalErrors";
/**
 * Safety Boundary Protection - IMMUTABLE
 *
 * Bans raw errors from crossing the safety boundary.
 * All errors must be doctrinal (tied to doctrine sections).
 *
 * CRITICAL: This system is IMMUTABLE as of 2025-12-22. All safety boundary
 * mechanisms are permanently active and cannot be disabled, modified, or
 * bypassed under any circumstances.
 *
 * This immutability protects users from all versions of the system creator,
 * including current, future, corrupted, desperate, or overconfident versions.
 */
export declare class SafetyBoundaryError extends Error {
    originalError: Error;
    doctrinalContext?: DoctrinalError | undefined;
    constructor(message: string, originalError: Error, doctrinalContext?: DoctrinalError | undefined);
}
/**
 * Wraps a function to ensure all errors crossing the boundary are doctrinal
 */
export declare function withSafetyBoundary<T extends any[], R>(fn: (...args: T) => R, context: string): (...args: T) => R;
/**
 * Wraps an async function to ensure all errors crossing the boundary are doctrinal
 */
export declare function withAsyncSafetyBoundary<T extends any[], R>(fn: (...args: T) => Promise<R>, context: string): (...args: T) => Promise<R>;
/**
 * Safety boundary assertion - throws if error is not doctrinal
 */
export declare function assertDoctrinalError(error: any, context: string): asserts error is DoctrinalError;
/**
 * Converts any error to a doctrinal error with appropriate classification
 */
export declare function doctrinalizeError(error: any, context: string): DoctrinalError;
/**
 * Safety boundary for external API calls
 * Ensures all external interactions are properly error-handled
 */
export declare function safeExternalCall<T>(operation: () => Promise<T>, context: string, fallback?: T): Promise<T>;
/**
 * Safety boundary for SELF engine core functions
 * All core SELF operations must be wrapped with this boundary
 */
export declare function selfEngineBoundary<T extends any[], R>(fn: (...args: T) => R, operationName: string): (...args: T) => R;
/**
 * Safety boundary for SELF engine async operations
 */
export declare function selfEngineAsyncBoundary<T extends any[], R>(fn: (...args: T) => Promise<R>, operationName: string): (...args: T) => Promise<R>;
//# sourceMappingURL=safetyBoundary.d.ts.map