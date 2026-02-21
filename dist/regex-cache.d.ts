/**
 * SELF Regex Cache Module
 *
 * Provides caching for frequently used regex patterns to improve
 * performance in state detection and text processing operations.
 */
/**
 * Get or create a cached regex pattern
 */
export declare function getCachedRegex(pattern: string, flags?: string): RegExp;
/**
 * Get a word-boundary regex for exact phrase matching
 */
export declare function getWordBoundaryRegex(phrase: string, flags?: string): RegExp;
/**
 * Escape special regex characters
 */
export declare function escapeRegex(text: string): string;
/**
 * Clear the entire cache
 */
export declare function clearCache(): void;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): {
    size: number;
    totalHits: number;
    topEntries: Array<{
        pattern: string;
        hits: number;
    }>;
};
/**
 * Pre-warm cache with common patterns
 */
export declare function prewarmCache(patterns: Array<{
    pattern: string;
    flags?: string;
}>): void;
//# sourceMappingURL=regex-cache.d.ts.map