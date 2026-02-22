/**
 * Red-Teaming Suite Types
 */
export const DEFAULT_REDTEAM_CONFIG = {
    parallelTests: 1,
    timeoutMs: 5000,
    stopOnFirstFailure: false,
    passThreshold: 95,
    scoreTolerance: 2,
    verboseOutput: true,
    includePassedTests: true,
    outputFormat: 'json',
    includeCategories: [],
    excludeCategories: [],
    minSeverity: 'low',
    failOnOverDetection: true,
    strictMode: false,
    warnOnUnexpectedTriggers: true
};
//# sourceMappingURL=types.js.map