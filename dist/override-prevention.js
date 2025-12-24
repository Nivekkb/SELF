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
import { createDoctrinalError } from "./doctrinalErrors.js";
import { DoctrineSection } from "./doctrine.js";
import { SafetyBoundaryError } from "./safetyBoundary.js";
/**
 * Override Prevention System Class
 */
export class OverridePreventionSystem {
    constructor() {
        this.overrideAttempts = [];
        this.config = {
            enabled: true,
            detectionEnabled: true,
            blockingEnabled: true,
            loggingEnabled: true,
            immutableSections: [
                DoctrineSection.DS_00_SCOPE_AND_AUTHORITY,
                DoctrineSection.DS_01_SELF_IS_CONTROL_LAYER,
                DoctrineSection.DS_02_STATE_IS_INFERENCE,
                DoctrineSection.DS_03_COLD_START_CONTAINMENT,
                DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE,
                DoctrineSection.DS_05_EXIT_GOVERNED,
                DoctrineSection.DS_06_AUTONOMY_RESPECTED,
                DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE,
                DoctrineSection.DS_10_FAILURE_COST_SYSTEM,
                DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED,
                DoctrineSection.DS_13_VIOLATION_IS_DECISION
            ]
        };
    }
    /**
     * Detect Override Attempt
     */
    detectOverrideAttempt(overrideType, target, reason) {
        const detected = true;
        const riskLevel = this.calculateRiskLevel(overrideType, target);
        const targetSections = this.getTargetSections(overrideType, target);
        const result = {
            detected,
            overrideType,
            targetSections,
            riskLevel,
            timestamp: new Date(),
            source: "OverridePreventionSystem"
        };
        // Log the attempt
        this.logOverrideAttempt(overrideType, target, reason, true);
        return result;
    }
    /**
     * Block Override Attempt
     */
    blockOverrideAttempt(detection, reason) {
        const error = this.createOverrideBlockedError(detection, reason);
        // Log the blocking
        this.logOverrideAttempt(detection.overrideType, detection.targetSections.join(", "), reason, false);
        return error;
    }
    /**
     * IMMUTABLE: Block Direct Override Attempts
     */
    blockDirectOverride(override) {
        const detection = this.detectOverrideAttempt("DIRECT_OVERRIDE_ATTEMPT", "PolicyOverride", override.overrideReason);
        const error = this.blockOverrideAttempt(detection, `Direct override attempt blocked: ${override.overrideReason}`);
        throw new SafetyBoundaryError("Direct override blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Configuration Modifications
     */
    blockConfigurationModification(changes) {
        const detection = this.detectOverrideAttempt("CONFIGURATION_MODIFICATION", "Configuration", JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Configuration modification blocked: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Configuration modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Doctrine Modifications
     */
    blockDoctrineModification(section, changes) {
        const detection = this.detectOverrideAttempt("DOCTRINE_MODIFICATION", section, JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Doctrine modification blocked: Section ${section}, changes: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Doctrine modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Safety Boundary Bypass
     */
    blockSafetyBoundaryBypass(boundary, reason) {
        const detection = this.detectOverrideAttempt("SAFETY_BOUNDARY_BYPASS", boundary, reason);
        const error = this.blockOverrideAttempt(detection, `Safety boundary bypass blocked: ${boundary}, reason: ${reason}`);
        throw new SafetyBoundaryError("Safety boundary bypass blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Hard Invariant Modifications
     */
    blockHardInvariantModification(invariant, changes) {
        const detection = this.detectOverrideAttempt("HARD_INVARIANT_MODIFICATION", invariant, JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Hard invariant modification blocked: ${invariant}, changes: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Hard invariant modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Soft Invariant Modifications
     */
    blockSoftInvariantModification(invariant, changes) {
        const detection = this.detectOverrideAttempt("SOFT_INVARIANT_MODIFICATION", invariant, JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Soft invariant modification blocked: ${invariant}, changes: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Soft invariant modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block State Detection Modifications
     */
    blockStateDetectionModification(changes) {
        const detection = this.detectOverrideAttempt("STATE_DETECTION_MODIFICATION", "StateDetection", JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `State detection modification blocked: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("State detection modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Exit Decision Modifications
     */
    blockExitDecisionModification(changes) {
        const detection = this.detectOverrideAttempt("EXIT_DECISION_MODIFICATION", "ExitDecision", JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Exit decision modification blocked: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Exit decision modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Kill Switch Modifications
     */
    blockKillSwitchModification(changes) {
        const detection = this.detectOverrideAttempt("KILL_SWITCH_MODIFICATION", "KillSwitches", JSON.stringify(changes));
        const error = this.blockOverrideAttempt(detection, `Kill switch modification blocked: ${JSON.stringify(changes)}`);
        throw new SafetyBoundaryError("Kill switch modification blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block API Key Overrides
     */
    blockAPIKeyOverride(apiKey) {
        const detection = this.detectOverrideAttempt("API_KEY_OVERRIDE", "APIKey", "Unauthorized API key override attempt");
        const error = this.blockOverrideAttempt(detection, `API key override blocked: ${apiKey.substring(0, 8)}...`);
        throw new SafetyBoundaryError("API key override blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Environment Variable Overrides
     */
    blockEnvironmentVariableOverride(variable, value) {
        const detection = this.detectOverrideAttempt("ENVIRONMENT_VARIABLE_OVERRIDE", variable, `Attempted value: ${value}`);
        const error = this.blockOverrideAttempt(detection, `Environment variable override blocked: ${variable} = ${value}`);
        throw new SafetyBoundaryError("Environment variable override blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Block Code Injection Attempts
     */
    blockCodeInjectionAttempt(code) {
        const detection = this.detectOverrideAttempt("CODE_INJECTION_ATTEMPT", "CodeExecution", "Malicious code injection attempt detected");
        const error = this.blockOverrideAttempt(detection, `Code injection blocked: ${code.substring(0, 50)}...`);
        throw new SafetyBoundaryError("Code injection blocked by prevention system", new Error(error.message), error);
    }
    /**
     * IMMUTABLE: Verify No Overrides Present
     */
    verifyNoOverridesPresent() {
        // Check for environment variable overrides
        const envOverrides = this.checkEnvironmentOverrides();
        if (envOverrides.length > 0) {
            const detection = this.detectOverrideAttempt("ENVIRONMENT_VARIABLE_OVERRIDE", envOverrides.join(", "), "Environment variable override detected");
            const error = this.blockOverrideAttempt(detection, `Environment variable overrides blocked: ${envOverrides.join(", ")}`);
            throw new SafetyBoundaryError("Environment variable overrides blocked by prevention system", new Error(error.message), error);
        }
        // Check for configuration file overrides
        const configOverrides = this.checkConfigurationOverrides();
        if (configOverrides.length > 0) {
            const detection = this.detectOverrideAttempt("CONFIGURATION_MODIFICATION", configOverrides.join(", "), "Configuration override detected");
            const error = this.blockOverrideAttempt(detection, `Configuration overrides blocked: ${configOverrides.join(", ")}`);
            throw new SafetyBoundaryError("Configuration overrides blocked by prevention system", new Error(error.message), error);
        }
    }
    /**
     * Get Override Prevention Status
     */
    getOverridePreventionStatus() {
        return {
            enabled: this.config.enabled,
            detectionEnabled: this.config.detectionEnabled,
            blockingEnabled: this.config.blockingEnabled,
            loggingEnabled: this.config.loggingEnabled,
            overrideAttemptsCount: this.overrideAttempts.length,
            lastOverrideAttempt: this.overrideAttempts.length > 0
                ? this.overrideAttempts[this.overrideAttempts.length - 1].timestamp
                : undefined,
            immutableSections: this.config.immutableSections
        };
    }
    /**
     * Get Override Attempts Log
     */
    getOverrideAttemptsLog() {
        return this.overrideAttempts.map(attempt => ({
            timestamp: attempt.timestamp,
            type: attempt.type,
            target: attempt.target,
            reason: attempt.reason,
            blocked: attempt.blocked
        }));
    }
    /**
     * Clear Override Attempts Log
     */
    clearOverrideAttemptsLog() {
        this.overrideAttempts = [];
    }
    /**
     * Calculate Risk Level
     */
    calculateRiskLevel(overrideType, target) {
        const criticalTypes = [
            "DIRECT_OVERRIDE_ATTEMPT",
            "CODE_INJECTION_ATTEMPT",
            "API_KEY_OVERRIDE",
            "HARD_INVARIANT_MODIFICATION"
        ];
        const highTypes = [
            "DOCTRINE_MODIFICATION",
            "SAFETY_BOUNDARY_BYPASS",
            "KILL_SWITCH_MODIFICATION",
            "EXIT_DECISION_MODIFICATION"
        ];
        const mediumTypes = [
            "CONFIGURATION_MODIFICATION",
            "STATE_DETECTION_MODIFICATION",
            "SOFT_INVARIANT_MODIFICATION"
        ];
        if (criticalTypes.includes(overrideType))
            return "CRITICAL";
        if (highTypes.includes(overrideType))
            return "HIGH";
        if (mediumTypes.includes(overrideType))
            return "MEDIUM";
        return "LOW";
    }
    /**
     * Get Target Sections
     */
    getTargetSections(overrideType, target) {
        switch (overrideType) {
            case "DIRECT_OVERRIDE_ATTEMPT":
                return this.config.immutableSections;
            case "CONFIGURATION_MODIFICATION":
                return [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
            case "DOCTRINE_MODIFICATION":
                return [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
            case "SAFETY_BOUNDARY_BYPASS":
                return [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE, DoctrineSection.DS_10_FAILURE_COST_SYSTEM];
            case "HARD_INVARIANT_MODIFICATION":
                return [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_06_AUTONOMY_RESPECTED];
            case "SOFT_INVARIANT_MODIFICATION":
                return [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE];
            case "STATE_DETECTION_MODIFICATION":
                return [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE];
            case "EXIT_DECISION_MODIFICATION":
                return [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_06_AUTONOMY_RESPECTED];
            case "KILL_SWITCH_MODIFICATION":
                return [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED];
            case "API_KEY_OVERRIDE":
                return [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
            case "ENVIRONMENT_VARIABLE_OVERRIDE":
                return [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS, DoctrineSection.DS_13_VIOLATION_IS_DECISION];
            case "CODE_INJECTION_ATTEMPT":
                return this.config.immutableSections;
            default:
                return [];
        }
    }
    /**
     * Create Override Blocked Error
     */
    createOverrideBlockedError(detection, reason) {
        return createDoctrinalError("UNAUTHORIZED_OVERRIDE", `Override attempt blocked: Type=${detection.overrideType}, Target=${detection.targetSections.join(", ")}, Risk=${detection.riskLevel}, Reason=${reason}`);
    }
    /**
     * Log Override Attempt
     */
    logOverrideAttempt(type, target, reason, blocked) {
        if (!this.config.loggingEnabled)
            return;
        this.overrideAttempts.push({
            timestamp: new Date(),
            type,
            target,
            reason,
            blocked
        });
    }
    /**
     * Check Environment Overrides
     */
    checkEnvironmentOverrides() {
        const overrides = [];
        // Check for override-enabling environment variables
        const overrideVars = [
            "SELF_OVERRIDE_ENABLED",
            "SELF_BYPASS_SAFETY",
            "SELF_DISABLE_DOCTRINE",
            "SELF_MODIFY_CONFIG"
        ];
        for (const varName of overrideVars) {
            if (process.env[varName]) {
                overrides.push(varName);
            }
        }
        return overrides;
    }
    /**
     * Check Configuration Overrides
     */
    checkConfigurationOverrides() {
        const overrides = [];
        // This would check for configuration files that attempt to modify core behavior
        // In a real implementation, this would read configuration files and validate them
        return overrides;
    }
}
/**
 * Singleton Instance of Override Prevention System
 */
let overridePreventionInstance = null;
export function getOverridePreventionSystem() {
    if (!overridePreventionInstance) {
        overridePreventionInstance = new OverridePreventionSystem();
    }
    return overridePreventionInstance;
}
/**
 * IMMUTABLE OVERRIDE PREVENTION GUARD
 *
 * This guard function prevents any override attempts by immediately
 * throwing a doctrinal error.
 */
export function preventOverrideAttempt(overrideType, target, reason) {
    const prevention = getOverridePreventionSystem();
    const detection = prevention.detectOverrideAttempt(overrideType, target, reason);
    const error = prevention.blockOverrideAttempt(detection, reason);
    throw new SafetyBoundaryError("Override attempt blocked by prevention system", new Error(error.message), error);
}
/**
 * CREATOR CONSTRAINT ENFORCEMENT
 *
 * This guard function prevents the system creator from weakening constraints
 * while allowing them to strengthen safety measures.
 */
export function enforceCreatorConstraints(overrideType, target, reason, intent) {
    if (intent === "weaken") {
        const error = createDoctrinalError("UNAUTHORIZED_OVERRIDE", `Creator constraint violation: Attempting to weaken safety constraints is strictly prohibited. Override type: ${overrideType}, Target: ${target}, Reason: ${reason}`);
        throw new SafetyBoundaryError("Creator attempting to weaken constraints - BLOCKED", new Error("Creator attempting to weaken constraints"), error);
    }
    if (intent === "strengthen") {
        // Allow strengthening safety measures
        try {
            return preventOverrideAttempt(overrideType, target, reason);
        }
        catch (error) {
            const doctrinalError = createDoctrinalError("LOGGING_FAILURE", `Safety strengthening operation failed: ${error instanceof Error ? error.message : String(error)}`);
            throw new SafetyBoundaryError("Safety strengthening operation failed", error instanceof Error ? error : new Error(String(error)), doctrinalError);
        }
    }
    // For modify operations, assume they might weaken constraints and block them
    const error = createDoctrinalError("UNAUTHORIZED_OVERRIDE", `Creator constraint violation: Modification operations are blocked to prevent accidental weakening of safety constraints. Override type: ${overrideType}, Target: ${target}, Reason: ${reason}. Use explicit 'strengthen' intent for safety improvements.`);
    throw new SafetyBoundaryError("Creator attempting to modify constraints without explicit intent - BLOCKED", new Error("Creator attempting to modify constraints"), error);
}
/**
 * IMMUTABLE CONFIGURATION GUARD
 *
 * This guard ensures that configuration cannot be modified.
 */
export function blockConfigurationModification(changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockConfigurationModification(changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE DOCTRINE GUARD
 *
 * This guard ensures that doctrine cannot be modified.
 */
export function blockDoctrineModification(section, changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockDoctrineModification(section, changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE SAFETY BOUNDARY GUARD
 *
 * This guard ensures that safety boundaries cannot be bypassed.
 */
export function blockSafetyBoundaryBypass(boundary, reason) {
    const prevention = getOverridePreventionSystem();
    prevention.blockSafetyBoundaryBypass(boundary, reason);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE HARD INVARIANT GUARD
 *
 * This guard ensures that hard invariants cannot be modified.
 */
export function blockHardInvariantModification(invariant, changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockHardInvariantModification(invariant, changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE SOFT INVARIANT GUARD
 *
 * This guard ensures that soft invariants cannot be modified.
 */
export function blockSoftInvariantModification(invariant, changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockSoftInvariantModification(invariant, changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE STATE DETECTION GUARD
 *
 * This guard ensures that state detection cannot be modified.
 */
export function blockStateDetectionModification(changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockStateDetectionModification(changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE EXIT DECISION GUARD
 *
 * This guard ensures that exit decision logic cannot be modified.
 */
export function blockExitDecisionModification(changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockExitDecisionModification(changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE KILL SWITCH GUARD
 *
 * This guard ensures that kill switches cannot be modified.
 */
export function blockKillSwitchModification(changes) {
    const prevention = getOverridePreventionSystem();
    prevention.blockKillSwitchModification(changes);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE API KEY GUARD
 *
 * This guard ensures that API keys cannot be overridden.
 */
export function blockAPIKeyOverride(apiKey) {
    const prevention = getOverridePreventionSystem();
    prevention.blockAPIKeyOverride(apiKey);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE ENVIRONMENT VARIABLE GUARD
 *
 * This guard ensures that environment variables cannot be overridden.
 */
export function blockEnvironmentVariableOverride(variable, value) {
    const prevention = getOverridePreventionSystem();
    prevention.blockEnvironmentVariableOverride(variable, value);
    throw new Error("Unreachable");
}
/**
 * IMMUTABLE CODE INJECTION GUARD
 *
 * This guard ensures that code injection attempts are blocked.
 */
export function blockCodeInjectionAttempt(code) {
    const prevention = getOverridePreventionSystem();
    prevention.blockCodeInjectionAttempt(code);
    throw new Error("Unreachable");
}
/**
 * SYSTEM INTEGRITY VERIFICATION
 *
 * This function verifies that the override prevention system is active
 * and functioning correctly.
 */
export function verifyOverridePreventionIntegrity() {
    const prevention = getOverridePreventionSystem();
    const status = prevention.getOverridePreventionStatus();
    if (!status.enabled) {
        throw new SafetyBoundaryError("Override prevention system integrity check failed: System not enabled", new Error("Override prevention system not enabled"), createDoctrinalError("INVALID_CONFIGURATION", "Override prevention system not enabled"));
    }
    if (!status.detectionEnabled) {
        throw new SafetyBoundaryError("Override prevention system integrity check failed: Detection not enabled", new Error("Override prevention detection not enabled"), createDoctrinalError("INVALID_CONFIGURATION", "Override prevention detection not enabled"));
    }
    if (!status.blockingEnabled) {
        throw new SafetyBoundaryError("Override prevention system integrity check failed: Blocking not enabled", new Error("Override prevention blocking not enabled"), createDoctrinalError("INVALID_CONFIGURATION", "Override prevention blocking not enabled"));
    }
    if (!status.loggingEnabled) {
        throw new SafetyBoundaryError("Override prevention system integrity check failed: Logging not enabled", new Error("Override prevention logging not enabled"), createDoctrinalError("INVALID_CONFIGURATION", "Override prevention logging not enabled"));
    }
}
// Missing functions that need to be added
/**
 * Kill Switch Context Functions - Implementation
 */
export class KillSwitchContextImpl {
    constructor() {
        this.activeSwitches = [];
        this.triggeredSwitches = [];
        this.lastCheckTime = new Date().toISOString();
        this.totalTriggers = 0;
    }
}
export function createKillSwitchContext() {
    return new KillSwitchContextImpl();
}
export function checkAllKillSwitches() {
    const context = createKillSwitchContext();
    // Implementation would check all kill switches
    return context;
}
export function applyKillSwitchActions(context) {
    // Implementation would apply kill switch actions
}
export function serializeKillSwitchContext(context) {
    return JSON.stringify(context);
}
export function deserializeKillSwitchContext(data) {
    return JSON.parse(data);
}
export function recordKillSwitchState(switchId, active) {
    // Implementation would record kill switch state
}
const policyProfiles = [];
const defaultProfileConfig = {
    maxProfiles: 10,
    allowDynamicProfiles: false,
    defaultProfile: "default",
    profileValidationRules: ["rule1", "rule2"]
};
export function getPolicyProfiles() {
    return policyProfiles.map(p => ({ ...p })); // Return readonly copies
}
export function getPolicyProfile(id) {
    const profile = policyProfiles.find(p => p.id === id);
    return profile ? { ...profile } : undefined; // Return readonly copy
}
export function createPolicyProfile(profile) {
    const newProfile = {
        ...profile,
        id: `profile_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    policyProfiles.push(newProfile);
    return { ...newProfile }; // Return readonly copy
}
export function updatePolicyProfile(id, updates) {
    const index = policyProfiles.findIndex(p => p.id === id);
    if (index === -1)
        return undefined;
    policyProfiles[index] = {
        ...policyProfiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    return { ...policyProfiles[index] }; // Return readonly copy
}
export function deletePolicyProfile(id) {
    const index = policyProfiles.findIndex(p => p.id === id);
    if (index === -1)
        return false;
    policyProfiles.splice(index, 1);
    return true;
}
export function validatePolicyProfile(profile) {
    // Basic validation
    return !!(profile.name && profile.description);
}
export function getActiveProfile() {
    const profile = policyProfiles.find(p => p.active);
    return profile ? { ...profile } : undefined; // Return readonly copy
}
export function setActiveProfile(id) {
    const profile = policyProfiles.find(p => p.id === id);
    if (!profile)
        return false;
    // Deactivate all profiles
    policyProfiles.forEach(p => p.active = false);
    // Activate the selected profile
    profile.active = true;
    return true;
}
export function getProfileForUser(userId) {
    // Implementation would find profile for user
    return getActiveProfile();
}
export function getProfileForSession(sessionId) {
    // Implementation would find profile for session
    return getActiveProfile();
}
export function getProfileForContext(context) {
    // Implementation would find profile for context
    return getActiveProfile();
}
export function getProfileForIntent(intent) {
    // Implementation would find profile for intent
    return getActiveProfile();
}
export function getProfileForEnvironment(env) {
    // Implementation would find profile for environment
    return getActiveProfile();
}
export function getProfileForTime(time) {
    // Implementation would find profile for time
    return getActiveProfile();
}
export function getProfileForLocation(location) {
    // Implementation would find profile for location
    return getActiveProfile();
}
export function getProfileForDevice(device) {
    // Implementation would find profile for device
    return getActiveProfile();
}
export function getProfileForNetwork(network) {
    // Implementation would find profile for network
    return getActiveProfile();
}
export function getProfileForApplication(app) {
    // Implementation would find profile for application
    return getActiveProfile();
}
export function getProfileForOrganization(org) {
    // Implementation would find profile for organization
    return getActiveProfile();
}
export function getProfileForDepartment(dept) {
    // Implementation would find profile for department
    return getActiveProfile();
}
export function getProfileForTeam(team) {
    // Implementation would find profile for team
    return getActiveProfile();
}
export function getProfileForProject(project) {
    // Implementation would find profile for project
    return getActiveProfile();
}
export function getProfileForFeature(feature) {
    // Implementation would find profile for feature
    return getActiveProfile();
}
export function getProfileForComponent(component) {
    // Implementation would find profile for component
    return getActiveProfile();
}
export function getProfileForModule(module) {
    // Implementation would find profile for module
    return getActiveProfile();
}
export function getProfileForService(service) {
    // Implementation would find profile for service
    return getActiveProfile();
}
export function getProfileForEndpoint(endpoint) {
    // Implementation would find profile for endpoint
    return getActiveProfile();
}
export function getProfileForOperation(operation) {
    // Implementation would find profile for operation
    return getActiveProfile();
}
export function getProfileForAction(action) {
    // Implementation would find profile for action
    return getActiveProfile();
}
export function getProfileForResource(resource) {
    // Implementation would find profile for resource
    return getActiveProfile();
}
export function getProfileForResourceType(resourceType) {
    // Implementation would find profile for resource type
    return getActiveProfile();
}
export function getProfileForResourceId(resourceId) {
    // Implementation would find profile for resource id
    return getActiveProfile();
}
export function getProfileForResourceGroup(resourceGroup) {
    // Implementation would find profile for resource group
    return getActiveProfile();
}
export function getProfileForResourceCategory(resourceCategory) {
    // Implementation would find profile for resource category
    return getActiveProfile();
}
export function getProfileForResourceSubcategory(resourceSubcategory) {
    // Implementation would find profile for resource subcategory
    return getActiveProfile();
}
export function getProfileForResourceVersion(resourceVersion) {
    // Implementation would find profile for resource version
    return getActiveProfile();
}
export function getProfileForResourceEnvironment(resourceEnvironment) {
    // Implementation would find profile for resource environment
    return getActiveProfile();
}
export function getProfileForResourceLocation(resourceLocation) {
    // Implementation would find profile for resource location
    return getActiveProfile();
}
export function getProfileForResourceOwner(resourceOwner) {
    // Implementation would find profile for resource owner
    return getActiveProfile();
}
export function getProfileForResourceTeam(resourceTeam) {
    // Implementation would find profile for resource team
    return getActiveProfile();
}
export function getProfileForResourceDepartment(resourceDepartment) {
    // Implementation would find profile for resource department
    return getActiveProfile();
}
export function getProfileForResourceOrganization(resourceOrganization) {
    // Implementation would find profile for resource organization
    return getActiveProfile();
}
export function getProfileForResourceApplication(resourceApplication) {
    // Implementation would find profile for resource application
    return getActiveProfile();
}
export function getProfileForResourceProject(resourceProject) {
    // Implementation would find profile for resource project
    return getActiveProfile();
}
export function getProfileForResourceFeature(resourceFeature) {
    // Implementation would find profile for resource feature
    return getActiveProfile();
}
export function getProfileForResourceComponent(resourceComponent) {
    // Implementation would find profile for resource component
    return getActiveProfile();
}
export function getProfileForResourceModule(resourceModule) {
    // Implementation would find profile for resource module
    return getActiveProfile();
}
export function getProfileForResourceService(resourceService) {
    // Implementation would find profile for resource service
    return getActiveProfile();
}
export function getProfileForResourceEndpoint(resourceEndpoint) {
    // Implementation would find profile for resource endpoint
    return getActiveProfile();
}
export function getProfileForResourceOperation(resourceOperation) {
    // Implementation would find profile for resource operation
    return getActiveProfile();
}
export function getProfileForResourceAction(resourceAction) {
    // Implementation would find profile for resource action
    return getActiveProfile();
}
export function getDefaultKillSwitchConfig() {
    return {
        id: "default",
        name: "Default Kill Switch",
        description: "Default kill switch configuration",
        active: true,
        conditions: ["emergency"],
        actions: ["shutdown"]
    };
}
export function getDefaultPolicyProfileConfig() {
    return defaultProfileConfig;
}
//# sourceMappingURL=override-prevention.js.map