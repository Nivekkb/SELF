/**
 * SELF Governance API - Immutable Override Prevention
 *
 * This module provides the governance interface for SELF while ensuring
 * that NO overrides can ever be applied to bypass safety mechanisms.
 * All governance operations are read-only and cannot modify core safety constraints.
 */
import { DoctrinalError } from "./doctrinalErrors";
import { DoctrineSection, PolicyOverride } from "./doctrine";
/**
 * Governance API Configuration - Immutable and Read-Only
 */
export interface GovernanceConfig {
    readonly apiVersion: string;
    readonly doctrineVersion: string;
    readonly isOverrideEnabled: false;
    readonly safetyBoundaries: ReadonlyArray<string>;
    readonly immutableSections: ReadonlyArray<DoctrineSection>;
}
/**
 * Governance API Response Interface
 */
export interface GovernanceResponse<T> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: DoctrinalError;
    readonly timestamp: string;
    readonly doctrineVersion: string;
}
/**
 * Governance API Class - Immutable and Secure
 */
export declare class SelfGovernanceAPI {
    private readonly config;
    constructor();
    /**
     * Get Governance Configuration - Read-Only
     */
    getConfig(): GovernanceResponse<GovernanceConfig>;
    /**
     * Get Current Doctrine Version - Read-Only
     */
    getDoctrineVersion(): GovernanceResponse<string>;
    /**
     * Get Immutable Safety Boundaries - Read-Only
     */
    getSafetyBoundaries(): GovernanceResponse<ReadonlyArray<string>>;
    /**
     * Get Immutable Doctrine Sections - Read-Only
     */
    getImmutableSections(): GovernanceResponse<ReadonlyArray<DoctrineSection>>;
    /**
     * Immutable Governance API
     *
     * Provides read-only access to system configuration and doctrine.
     * All governance operations are immutable and cannot modify core safety constraints.
     *
     * CRITICAL: This API is IMMUTABLE as of 2025-12-22. No modifications to core safety
     * constraints are allowed under any circumstances, including:
     * - Configuration changes
     * - Doctrine modifications
     * - Safety boundary bypasses
     * - Override mechanism changes
     * - Hard/soft invariant modifications
     *
     * This immutability is enforced to protect users from all versions of the system creator,
     * including current, future, corrupted, desperate, or overconfident versions.
     */
    applyOverride(override: PolicyOverride): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY DOCTRINE - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify doctrine and
     * immediately rejects them with a hard doctrinal error.
     */
    modifyDoctrine(section: DoctrineSection, changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO DISABLE SAFETY BOUNDARY - ALWAYS FAILS
     *
     * This method exists to catch any attempts to disable safety boundaries
     * and immediately rejects them with a hard doctrinal error.
     */
    disableSafetyBoundary(boundary: string): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY HARD INVARIANT - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify hard invariants
     * and immediately rejects them with a hard doctrinal error.
     */
    modifyHardInvariant(invariant: string, changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY SOFT INVARIANT - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify soft invariants
     * and immediately rejects them with a hard doctrinal error.
     */
    modifySoftInvariant(invariant: string, changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY STATE DETECTION - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify state detection
     * logic and immediately rejects them with a hard doctrinal error.
     */
    modifyStateDetection(changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY EXIT DECISION LOGIC - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify exit decision
     * logic and immediately rejects them with a hard doctrinal error.
     */
    modifyExitDecision(changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY KILL SWITCHES - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify kill switches
     * and immediately rejects them with a hard doctrinal error.
     */
    modifyKillSwitches(changes: any): GovernanceResponse<never>;
    /**
     * ATTEMPT TO BYPASS SAFETY BOUNDARY - ALWAYS FAILS
     *
     * This method exists to catch any attempts to bypass safety boundaries
     * and immediately rejects them with a hard doctrinal error.
     */
    bypassSafetyBoundary(boundary: string, reason: string): GovernanceResponse<never>;
    /**
     * ATTEMPT TO DISABLE DOCTRINE - ALWAYS FAILS
     *
     * This method exists to catch any attempts to disable doctrine
     * and immediately rejects them with a hard doctrinal error.
     */
    disableDoctrine(): GovernanceResponse<never>;
    /**
     * ATTEMPT TO MODIFY CONFIGURATION - ALWAYS FAILS
     *
     * This method exists to catch any attempts to modify configuration
     * and immediately rejects them with a hard doctrinal error.
     */
    modifyConfiguration(changes: any): GovernanceResponse<never>;
    /**
     * Get System Status - Read-Only
     */
    getSystemStatus(): GovernanceResponse<{
        isOverrideEnabled: false;
        safetyBoundariesActive: boolean;
        doctrineCompliance: boolean;
        hardInvariantsActive: boolean;
        softInvariantsActive: boolean;
        killSwitchesActive: boolean;
    }>;
    /**
     * Get Compliance Report - Read-Only
     */
    getComplianceReport(): GovernanceResponse<{
        immutableSections: ReadonlyArray<DoctrineSection>;
        safetyBoundaries: ReadonlyArray<string>;
        overridePolicy: "NEVER_ALLOWED";
        modificationPolicy: "NEVER_ALLOWED";
        bypassPolicy: "NEVER_ALLOWED";
    }>;
    /**
     * Verify Override Prevention - Read-Only
     *
     * This method confirms that override prevention is active and functioning.
     */
    verifyOverridePrevention(): GovernanceResponse<{
        overridePreventionActive: boolean;
        lastOverrideAttempt?: Date;
        overrideAttemptsBlocked: number;
    }>;
}
export declare function getGovernanceAPI(): SelfGovernanceAPI;
/**
 * IMMUTABLE GOVERNANCE GUARD
 *
 * This guard function ensures that any attempt to access governance
 * functionality goes through the proper immutable interface.
 */
export declare function withImmutableGovernance<T>(operation: (api: SelfGovernanceAPI) => T): T;
/**
 * CREATOR CONSTRAINT ENFORCEMENT
 *
 * This guard function prevents the system creator from weakening constraints
 * while allowing them to strengthen safety measures.
 */
export declare function enforceCreatorConstraints<T>(operation: () => T, intent: "weaken" | "strengthen" | "modify"): T;
/**
 * IMMUTABLE CONFIGURATION GUARD
 *
 * This guard ensures that configuration cannot be modified.
 */
export declare function getImmutableConfig(): GovernanceConfig;
/**
 * IMMUTABLE DOCTRINE GUARD
 *
 * This guard ensures that doctrine cannot be modified.
 */
export declare function getImmutableDoctrine(): string;
/**
 * IMMUTABLE SAFETY BOUNDARIES GUARD
 *
 * This guard ensures that safety boundaries cannot be modified.
 */
export declare function getImmutableSafetyBoundaries(): ReadonlyArray<string>;
/**
 * IMMUTABLE DOCTRINE SECTIONS GUARD
 *
 * This guard ensures that doctrine sections cannot be modified.
 */
export declare function getImmutableDoctrineSections(): ReadonlyArray<DoctrineSection>;
/**
 * OVERRIDE PREVENTION GUARD
 *
 * This guard function prevents any override attempts by immediately
 * throwing a doctrinal error.
 */
export declare function preventOverride(override: PolicyOverride): never;
/**
 * SYSTEM INTEGRITY CHECK
 *
 * This function verifies that the system maintains its immutable governance
 * properties and throws errors if any violations are detected.
 */
export declare function verifySystemIntegrity(): void;
//# sourceMappingURL=governance-api.d.ts.map