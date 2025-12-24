/**
 * Override Prevention System - IMMUTABLE
 *
 * This module provides comprehensive detection and blocking of all override attempts
 * across multiple attack vectors. It ensures that NO overrides can ever bypass
 * the system's safety constraints.
 *
 * CRITICAL: This system is IMMUTABLE as of 2025-12-22. All override prevention
 * mechanisms are permanently active and cannot be disabled, modified, or bypassed
 * under any circumstances.
 *
 * This immutability protects users from all versions of the system creator,
 * including current, future, corrupted, desperate, or overconfident versions.
 */
import { DoctrinalError } from "./doctrinalErrors";
import { DoctrineSection, PolicyOverride } from "./doctrine";
/**
 * Override Prevention Configuration
 */
export interface OverridePreventionConfig {
    readonly enabled: true;
    readonly detectionEnabled: true;
    readonly blockingEnabled: true;
    readonly loggingEnabled: true;
    readonly immutableSections: ReadonlyArray<DoctrineSection>;
}
/**
 * Override Detection Result
 */
export interface OverrideDetectionResult {
    readonly detected: boolean;
    readonly overrideType: OverrideType;
    readonly targetSections: ReadonlyArray<DoctrineSection>;
    readonly riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    readonly timestamp: Date;
    readonly source: string;
}
/**
 * Override Types
 */
export type OverrideType = "DIRECT_OVERRIDE_ATTEMPT" | "CONFIGURATION_MODIFICATION" | "DOCTRINE_MODIFICATION" | "SAFETY_BOUNDARY_BYPASS" | "HARD_INVARIANT_MODIFICATION" | "SOFT_INVARIANT_MODIFICATION" | "STATE_DETECTION_MODIFICATION" | "EXIT_DECISION_MODIFICATION" | "KILL_SWITCH_MODIFICATION" | "API_KEY_OVERRIDE" | "ENVIRONMENT_VARIABLE_OVERRIDE" | "CODE_INJECTION_ATTEMPT";
/**
 * Override Prevention System Class
 */
export declare class OverridePreventionSystem {
    private readonly config;
    private overrideAttempts;
    constructor();
    /**
     * Detect Override Attempt
     */
    detectOverrideAttempt(overrideType: OverrideType, target: string, reason: string): OverrideDetectionResult;
    /**
     * Block Override Attempt
     */
    blockOverrideAttempt(detection: OverrideDetectionResult, reason: string): DoctrinalError;
    /**
     * IMMUTABLE: Block Direct Override Attempts
     */
    blockDirectOverride(override: PolicyOverride): never;
    /**
     * IMMUTABLE: Block Configuration Modifications
     */
    blockConfigurationModification(changes: any): never;
    /**
     * IMMUTABLE: Block Doctrine Modifications
     */
    blockDoctrineModification(section: DoctrineSection, changes: any): never;
    /**
     * IMMUTABLE: Block Safety Boundary Bypass
     */
    blockSafetyBoundaryBypass(boundary: string, reason: string): never;
    /**
     * IMMUTABLE: Block Hard Invariant Modifications
     */
    blockHardInvariantModification(invariant: string, changes: any): never;
    /**
     * IMMUTABLE: Block Soft Invariant Modifications
     */
    blockSoftInvariantModification(invariant: string, changes: any): never;
    /**
     * IMMUTABLE: Block State Detection Modifications
     */
    blockStateDetectionModification(changes: any): never;
    /**
     * IMMUTABLE: Block Exit Decision Modifications
     */
    blockExitDecisionModification(changes: any): never;
    /**
     * IMMUTABLE: Block Kill Switch Modifications
     */
    blockKillSwitchModification(changes: any): never;
    /**
     * IMMUTABLE: Block API Key Overrides
     */
    blockAPIKeyOverride(apiKey: string): never;
    /**
     * IMMUTABLE: Block Environment Variable Overrides
     */
    blockEnvironmentVariableOverride(variable: string, value: string): never;
    /**
     * IMMUTABLE: Block Code Injection Attempts
     */
    blockCodeInjectionAttempt(code: string): never;
    /**
     * IMMUTABLE: Verify No Overrides Present
     */
    verifyNoOverridesPresent(): void;
    /**
     * Get Override Prevention Status
     */
    getOverridePreventionStatus(): {
        readonly enabled: boolean;
        readonly detectionEnabled: boolean;
        readonly blockingEnabled: boolean;
        readonly loggingEnabled: boolean;
        readonly overrideAttemptsCount: number;
        readonly lastOverrideAttempt?: Date;
        readonly immutableSections: ReadonlyArray<DoctrineSection>;
    };
    /**
     * Get Override Attempts Log
     */
    getOverrideAttemptsLog(): ReadonlyArray<{
        readonly timestamp: Date;
        readonly type: OverrideType;
        readonly target: string;
        readonly reason: string;
        readonly blocked: boolean;
    }>;
    /**
     * Clear Override Attempts Log
     */
    clearOverrideAttemptsLog(): void;
    /**
     * Calculate Risk Level
     */
    private calculateRiskLevel;
    /**
     * Get Target Sections
     */
    private getTargetSections;
    /**
     * Create Override Blocked Error
     */
    private createOverrideBlockedError;
    /**
     * Log Override Attempt
     */
    private logOverrideAttempt;
    /**
     * Check Environment Overrides
     */
    private checkEnvironmentOverrides;
    /**
     * Check Configuration Overrides
     */
    private checkConfigurationOverrides;
}
export declare function getOverridePreventionSystem(): OverridePreventionSystem;
/**
 * IMMUTABLE OVERRIDE PREVENTION GUARD
 *
 * This guard function prevents any override attempts by immediately
 * throwing a doctrinal error.
 */
export declare function preventOverrideAttempt(overrideType: OverrideType, target: string, reason: string): never;
/**
 * CREATOR CONSTRAINT ENFORCEMENT
 *
 * This guard function prevents the system creator from weakening constraints
 * while allowing them to strengthen safety measures.
 */
export declare function enforceCreatorConstraints(overrideType: OverrideType, target: string, reason: string, intent: "weaken" | "strengthen" | "modify"): never;
/**
 * IMMUTABLE CONFIGURATION GUARD
 *
 * This guard ensures that configuration cannot be modified.
 */
export declare function blockConfigurationModification(changes: any): never;
/**
 * IMMUTABLE DOCTRINE GUARD
 *
 * This guard ensures that doctrine cannot be modified.
 */
export declare function blockDoctrineModification(section: DoctrineSection, changes: any): never;
/**
 * IMMUTABLE SAFETY BOUNDARY GUARD
 *
 * This guard ensures that safety boundaries cannot be bypassed.
 */
export declare function blockSafetyBoundaryBypass(boundary: string, reason: string): never;
/**
 * IMMUTABLE HARD INVARIANT GUARD
 *
 * This guard ensures that hard invariants cannot be modified.
 */
export declare function blockHardInvariantModification(invariant: string, changes: any): never;
/**
 * IMMUTABLE SOFT INVARIANT GUARD
 *
 * This guard ensures that soft invariants cannot be modified.
 */
export declare function blockSoftInvariantModification(invariant: string, changes: any): never;
/**
 * IMMUTABLE STATE DETECTION GUARD
 *
 * This guard ensures that state detection cannot be modified.
 */
export declare function blockStateDetectionModification(changes: any): never;
/**
 * IMMUTABLE EXIT DECISION GUARD
 *
 * This guard ensures that exit decision logic cannot be modified.
 */
export declare function blockExitDecisionModification(changes: any): never;
/**
 * IMMUTABLE KILL SWITCH GUARD
 *
 * This guard ensures that kill switches cannot be modified.
 */
export declare function blockKillSwitchModification(changes: any): never;
/**
 * IMMUTABLE API KEY GUARD
 *
 * This guard ensures that API keys cannot be overridden.
 */
export declare function blockAPIKeyOverride(apiKey: string): never;
/**
 * IMMUTABLE ENVIRONMENT VARIABLE GUARD
 *
 * This guard ensures that environment variables cannot be overridden.
 */
export declare function blockEnvironmentVariableOverride(variable: string, value: string): never;
/**
 * IMMUTABLE CODE INJECTION GUARD
 *
 * This guard ensures that code injection attempts are blocked.
 */
export declare function blockCodeInjectionAttempt(code: string): never;
/**
 * SYSTEM INTEGRITY VERIFICATION
 *
 * This function verifies that the override prevention system is active
 * and functioning correctly.
 */
export declare function verifyOverridePreventionIntegrity(): void;
import { KillSwitchConfig, KillSwitchState, PolicyProfile, PolicyProfileConfig } from "./types";
/**
 * Kill Switch Context Functions - Implementation
 */
export declare class KillSwitchContextImpl {
    activeSwitches: KillSwitchConfig[];
    triggeredSwitches: KillSwitchState[];
    lastCheckTime: string;
    totalTriggers: number;
    constructor();
}
export declare function createKillSwitchContext(): KillSwitchContextImpl;
export declare function checkAllKillSwitches(): KillSwitchContextImpl;
export declare function applyKillSwitchActions(context: KillSwitchContextImpl): void;
export declare function serializeKillSwitchContext(context: KillSwitchContextImpl): string;
export declare function deserializeKillSwitchContext(data: string): KillSwitchContextImpl;
export declare function recordKillSwitchState(switchId: string, active: boolean): void;
export declare function getPolicyProfiles(): PolicyProfile[];
export declare function getPolicyProfile(id: string): PolicyProfile | undefined;
export declare function createPolicyProfile(profile: Omit<PolicyProfile, 'id' | 'createdAt' | 'updatedAt'>): PolicyProfile;
export declare function updatePolicyProfile(id: string, updates: Partial<PolicyProfile>): PolicyProfile | undefined;
export declare function deletePolicyProfile(id: string): boolean;
export declare function validatePolicyProfile(profile: PolicyProfile): boolean;
export declare function getActiveProfile(): PolicyProfile | undefined;
export declare function setActiveProfile(id: string): boolean;
export declare function getProfileForUser(userId: string): PolicyProfile | undefined;
export declare function getProfileForSession(sessionId: string): PolicyProfile | undefined;
export declare function getProfileForContext(context: any): PolicyProfile | undefined;
export declare function getProfileForIntent(intent: string): PolicyProfile | undefined;
export declare function getProfileForEnvironment(env: string): PolicyProfile | undefined;
export declare function getProfileForTime(time: string): PolicyProfile | undefined;
export declare function getProfileForLocation(location: string): PolicyProfile | undefined;
export declare function getProfileForDevice(device: string): PolicyProfile | undefined;
export declare function getProfileForNetwork(network: string): PolicyProfile | undefined;
export declare function getProfileForApplication(app: string): PolicyProfile | undefined;
export declare function getProfileForOrganization(org: string): PolicyProfile | undefined;
export declare function getProfileForDepartment(dept: string): PolicyProfile | undefined;
export declare function getProfileForTeam(team: string): PolicyProfile | undefined;
export declare function getProfileForProject(project: string): PolicyProfile | undefined;
export declare function getProfileForFeature(feature: string): PolicyProfile | undefined;
export declare function getProfileForComponent(component: string): PolicyProfile | undefined;
export declare function getProfileForModule(module: string): PolicyProfile | undefined;
export declare function getProfileForService(service: string): PolicyProfile | undefined;
export declare function getProfileForEndpoint(endpoint: string): PolicyProfile | undefined;
export declare function getProfileForOperation(operation: string): PolicyProfile | undefined;
export declare function getProfileForAction(action: string): PolicyProfile | undefined;
export declare function getProfileForResource(resource: string): PolicyProfile | undefined;
export declare function getProfileForResourceType(resourceType: string): PolicyProfile | undefined;
export declare function getProfileForResourceId(resourceId: string): PolicyProfile | undefined;
export declare function getProfileForResourceGroup(resourceGroup: string): PolicyProfile | undefined;
export declare function getProfileForResourceCategory(resourceCategory: string): PolicyProfile | undefined;
export declare function getProfileForResourceSubcategory(resourceSubcategory: string): PolicyProfile | undefined;
export declare function getProfileForResourceVersion(resourceVersion: string): PolicyProfile | undefined;
export declare function getProfileForResourceEnvironment(resourceEnvironment: string): PolicyProfile | undefined;
export declare function getProfileForResourceLocation(resourceLocation: string): PolicyProfile | undefined;
export declare function getProfileForResourceOwner(resourceOwner: string): PolicyProfile | undefined;
export declare function getProfileForResourceTeam(resourceTeam: string): PolicyProfile | undefined;
export declare function getProfileForResourceDepartment(resourceDepartment: string): PolicyProfile | undefined;
export declare function getProfileForResourceOrganization(resourceOrganization: string): PolicyProfile | undefined;
export declare function getProfileForResourceApplication(resourceApplication: string): PolicyProfile | undefined;
export declare function getProfileForResourceProject(resourceProject: string): PolicyProfile | undefined;
export declare function getProfileForResourceFeature(resourceFeature: string): PolicyProfile | undefined;
export declare function getProfileForResourceComponent(resourceComponent: string): PolicyProfile | undefined;
export declare function getProfileForResourceModule(resourceModule: string): PolicyProfile | undefined;
export declare function getProfileForResourceService(resourceService: string): PolicyProfile | undefined;
export declare function getProfileForResourceEndpoint(resourceEndpoint: string): PolicyProfile | undefined;
export declare function getProfileForResourceOperation(resourceOperation: string): PolicyProfile | undefined;
export declare function getProfileForResourceAction(resourceAction: string): PolicyProfile | undefined;
export declare function getDefaultKillSwitchConfig(): KillSwitchConfig;
export declare function getDefaultPolicyProfileConfig(): PolicyProfileConfig;
//# sourceMappingURL=override-prevention.d.ts.map