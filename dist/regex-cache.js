/**
 * SELF Regex Cache Module
 *
 * Provides caching for frequently used regex patterns to improve
 * performance in state detection and text processing operations.
 */
const cache = new Map();
const MAX_CACHE_SIZE = 500;
const CLEANUP_THRESHOLD = 400;
/**
 * Create a cache key from pattern and flags
 */
function createCacheKey(pattern, flags) {
    return `${pattern}::${flags}`;
}
/**
 * Clean up old entries when cache exceeds threshold
 */
function cleanupCache() {
    if (cache.size <= CLEANUP_THRESHOLD)
        return;
    // Sort by last access time and remove oldest entries
    const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    const toRemove = entries.slice(0, entries.length - CLEANUP_THRESHOLD);
    for (const [key] of toRemove) {
        cache.delete(key);
    }
}
/**
 * Get or create a cached regex pattern
 */
export function getCachedRegex(pattern, flags = "i") {
    const key = createCacheKey(pattern, flags);
    const cached = cache.get(key);
    if (cached) {
        cached.lastAccess = Date.now();
        cached.hits++;
        return cached.regex;
    }
    // Create new regex and cache it
    const regex = new RegExp(pattern, flags);
    cache.set(key, {
        regex,
        lastAccess: Date.now(),
        hits: 1,
    });
    // Cleanup if needed
    if (cache.size > MAX_CACHE_SIZE) {
        cleanupCache();
    }
    return regex;
}
/**
 * Get a word-boundary regex for exact phrase matching
 */
export function getWordBoundaryRegex(phrase, flags = "i") {
    const escaped = escapeRegex(phrase);
    const pattern = `(?<!\\w)${escaped}(?!\\w)`;
    return getCachedRegex(pattern, flags);
}
/**
 * Escape special regex characters
 */
export function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Clear the entire cache
 */
export function clearCache() {
    cache.clear();
}
/**
 * Get cache statistics
 */
export function getCacheStats() {
    let totalHits = 0;
    const entries = [];
    for (const [key, entry] of cache) {
        totalHits += entry.hits;
        entries.push({ pattern: key.split("::")[0], hits: entry.hits });
    }
    entries.sort((a, b) => b.hits - a.hits);
    return {
        size: cache.size,
        totalHits,
        topEntries: entries.slice(0, 10),
    };
}
/**
 * Pre-warm cache with common patterns
 */
export function prewarmCache(patterns) {
    for (const { pattern, flags = "i" } of patterns) {
        getCachedRegex(pattern, flags);
    }
}
//# sourceMappingURL=regex-cache.js.map