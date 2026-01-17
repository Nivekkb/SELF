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
export type { StateDetectionResult, AbusePreventionContext, SelfHistoryMessage } from '../types';
export type { GovernanceRequest, GovernanceResponse as GovernanceApiResponse, GovernanceStatusResponse, GovernanceError } from './v1/governance';
export type { GovernanceConfig } from './v1/governance-config';
export type { BuilderIntegrationConfig } from './v1/builder-integration';
export type { EmotionalState, PolicyOverride, DoctrineSection } from '../doctrine';
export { SelfGovernanceAPI } from '../governance-api';
export { getGovernanceAPI, withImmutableGovernance, enforceCreatorConstraints, getImmutableConfig, getImmutableDoctrine, getImmutableSafetyBoundaries, getImmutableDoctrineSections, preventOverride, verifySystemIntegrity } from '../governance-api';
export { createDoctrinalError, SECURITY_ERRORS, BEHAVIORAL_ERRORS, SAFETY_ERRORS, COMPLIANCE_ERRORS } from '../doctrinalErrors';
export { DOCTRINE_VERSION } from '../doctrine';
/**
 * API Version Information
 */
export declare const API_VERSION = "1.0.0";
export declare const API_BUILD_DATE: string;
/**
 * API Metadata
 */
export declare const API_METADATA: {
    version: string;
    buildDate: string;
    doctrineVersion: string;
    immutableSince: string;
    safetyConstraints: string;
    overridePolicy: string;
    creatorConstraints: string;
};
/**
 * API Health Check
 */
export declare function checkAPIHealth(): {
    healthy: boolean;
    version: string;
    doctrineVersion: string;
    immutableSince: string;
    safetyConstraints: string;
    overridePolicy: string;
    creatorConstraints: string;
    timestamp: string;
};
/**
 * API Initialization
 */
export declare function initializeAPI(): void;
//# sourceMappingURL=index.d.ts.map