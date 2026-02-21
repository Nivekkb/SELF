/**
 * SELF Governance API - Public Interface
 *
 * This module provides the public API for the SELF governance system.
 * It exports all necessary types, functions, and classes for external use.
 *
 * Usage:
 * ```typescript
 * import {
 *   getGovernanceAPI,
 *   getOverridePreventionSystem,
 *   enforceCreatorConstraints,
 *   verifySystemIntegrity
 * } from '@self/governance-api';
 *
 * // Get governance API
 * const api = getGovernanceAPI();
 * const config = api.getConfig();
 *
 * // Prevent override attempts
 * try {
 *   enforceCreatorConstraints(() => {
 *     // Attempt to modify constraints
 *   }, "weaken");
 * } catch (error) {
 *   console.log("Override blocked:", error.message);
 * }
 *
 * // Verify system integrity
 * verifySystemIntegrity();
 * ```
 *
 * IMMUTABLE CORE: doctrine, hard invariants, exit semantics, override prevention
 * MUTABLE-SAFE: observability settings, rate limits, UI copy, non-safety performance tuning
 * VERSIONED: anything that touches behaviour - new signed policy bundle version, never in place edits
 */
// Re-export classes that exist
export { SelfGovernanceAPI } from '../governance-api.js';
// Re-export functions that exist
export { getGovernanceAPI, withImmutableGovernance, enforceCreatorConstraints, getImmutableConfig, getImmutableDoctrine, getImmutableSafetyBoundaries, getImmutableDoctrineSections, preventOverride, verifySystemIntegrity } from '../governance-api.js';
export { createDoctrinalError, SECURITY_ERRORS, BEHAVIORAL_ERRORS, SAFETY_ERRORS, COMPLIANCE_ERRORS } from '../doctrinalErrors.js';
// Re-export constants that exist
export { DOCTRINE_VERSION } from '../doctrine.js';
/**
 * API Version Information
 */
export const API_VERSION = "1.0.0";
export const API_BUILD_DATE = new Date().toISOString();
/**
 * API Metadata
 */
export const API_METADATA = {
    version: API_VERSION,
    buildDate: API_BUILD_DATE,
    doctrineVersion: "2025-12-22",
    immutableSince: "2025-12-22",
    safetyConstraints: "IMMUTABLE",
    overridePolicy: "NEVER_ALLOWED",
    creatorConstraints: "ENFORCED"
};
/**
 * API Health Check
 */
export function checkAPIHealth() {
    return {
        healthy: true,
        version: API_VERSION,
        doctrineVersion: "2025-12-22",
        immutableSince: "2025-12-22",
        safetyConstraints: "IMMUTABLE",
        overridePolicy: "NEVER_ALLOWED",
        creatorConstraints: "ENFORCED",
        timestamp: new Date().toISOString()
    };
}
/**
 * API Initialization
 */
export function initializeAPI() {
    // Verify system integrity on initialization
    try {
        // Import and verify all systems
        const { verifySystemIntegrity } = require('../governance-api');
        const { verifyOverridePreventionIntegrity } = require('../override-prevention');
        verifySystemIntegrity();
        verifyOverridePreventionIntegrity();
    }
    catch (error) {
        console.error("[SELF] API initialization failed:", error);
        throw error;
    }
}
/**
 * API Export for CommonJS
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Classes
        SelfGovernanceAPI: require('../governance-api').SelfGovernanceAPI,
        OverridePreventionSystem: require('../override-prevention').OverridePreventionSystem,
        // Functions
        getGovernanceAPI: require('../governance-api').getGovernanceAPI,
        getOverridePreventionSystem: require('../override-prevention').getOverridePreventionSystem,
        enforceCreatorConstraints: require('../governance-api').enforceCreatorConstraints,
        verifySystemIntegrity: require('../governance-api').verifySystemIntegrity,
        verifyOverridePreventionIntegrity: require('../override-prevention').verifyOverridePreventionIntegrity,
        // Constants
        API_VERSION,
        API_BUILD_DATE,
        API_METADATA,
        // Health Check
        checkAPIHealth,
        initializeAPI
    };
}
//# sourceMappingURL=index.js.map