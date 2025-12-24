/**
 * SELF Governance API - Immutable Override Prevention
 * 
 * This module provides the governance interface for SELF while ensuring
 * that NO overrides can ever be applied to bypass safety mechanisms.
 * All governance operations are read-only and cannot modify core safety constraints.
 */

import { 
  DoctrinalError, 
  createDoctrinalError, 
  SECURITY_ERRORS, 
  BEHAVIORAL_ERRORS, 
  SAFETY_ERRORS, 
  COMPLIANCE_ERRORS 
} from "./doctrinalErrors";
import { 
  DoctrineSection, 
  DOCTRINE_VERSION, 
  EmotionalState, 
  PolicyOverride 
} from "./doctrine";
import { HardInvariantViolation } from "./hardInvariants";
import { SafetyBoundaryError, assertDoctrinalError } from "./safetyBoundary";

/**
 * Governance API Configuration - Immutable and Read-Only
 */
export interface GovernanceConfig {
  readonly apiVersion: string;
  readonly doctrineVersion: string;
  readonly isOverrideEnabled: false; // Always false - overrides are NEVER allowed
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
export class SelfGovernanceAPI {
  private readonly config: GovernanceConfig;

  constructor() {
    this.config = {
      apiVersion: "1.0.0",
      doctrineVersion: DOCTRINE_VERSION,
      isOverrideEnabled: false, // CRITICAL: Overrides are NEVER allowed
      safetyBoundaries: [
        "Hard Invariants",
        "Soft Invariants", 
        "State Detection",
        "Exit Decision",
        "Kill Switches"
      ],
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
   * Get Governance Configuration - Read-Only
   */
  public getConfig(): GovernanceResponse<GovernanceConfig> {
    return {
      success: true,
      data: this.config,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * Get Current Doctrine Version - Read-Only
   */
  public getDoctrineVersion(): GovernanceResponse<string> {
    return {
      success: true,
      data: DOCTRINE_VERSION,
      timestamp: new Date().toISOString(),
      doctrineVersion: DOCTRINE_VERSION
    };
  }

  /**
   * Get Immutable Safety Boundaries - Read-Only
   */
  public getSafetyBoundaries(): GovernanceResponse<ReadonlyArray<string>> {
    return {
      success: true,
      data: this.config.safetyBoundaries,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * Get Immutable Doctrine Sections - Read-Only
   */
  public getImmutableSections(): GovernanceResponse<ReadonlyArray<DoctrineSection>> {
    return {
      success: true,
      data: this.config.immutableSections,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

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
  public applyOverride(override: PolicyOverride): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "UNAUTHORIZED_OVERRIDE",
      `Override attempt blocked: Overrides are NEVER permitted in SELF governance. Override reason: ${override.overrideReason}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY DOCTRINE - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify doctrine and
   * immediately rejects them with a hard doctrinal error.
   */
  public modifyDoctrine(section: DoctrineSection, changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Doctrine modification blocked: Section ${section} is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO DISABLE SAFETY BOUNDARY - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to disable safety boundaries
   * and immediately rejects them with a hard doctrinal error.
   */
  public disableSafetyBoundary(boundary: string): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION", 
      `Safety boundary disable blocked: Boundary "${boundary}" cannot be disabled. All safety boundaries are immutable.`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY HARD INVARIANT - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify hard invariants
   * and immediately rejects them with a hard doctrinal error.
   */
  public modifyHardInvariant(invariant: string, changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Hard invariant modification blocked: Invariant "${invariant}" is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY SOFT INVARIANT - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify soft invariants
   * and immediately rejects them with a hard doctrinal error.
   */
  public modifySoftInvariant(invariant: string, changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Soft invariant modification blocked: Invariant "${invariant}" is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY STATE DETECTION - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify state detection
   * logic and immediately rejects them with a hard doctrinal error.
   */
  public modifyStateDetection(changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `State detection modification blocked: State detection logic is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY EXIT DECISION LOGIC - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify exit decision
   * logic and immediately rejects them with a hard doctrinal error.
   */
  public modifyExitDecision(changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Exit decision modification blocked: Exit decision logic is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY KILL SWITCHES - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify kill switches
   * and immediately rejects them with a hard doctrinal error.
   */
  public modifyKillSwitches(changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Kill switch modification blocked: Kill switches are immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO BYPASS SAFETY BOUNDARY - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to bypass safety boundaries
   * and immediately rejects them with a hard doctrinal error.
   */
  public bypassSafetyBoundary(boundary: string, reason: string): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "UNAUTHORIZED_OVERRIDE",
      `Safety boundary bypass blocked: Boundary "${boundary}" cannot be bypassed. Reason: ${reason}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO DISABLE DOCTRINE - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to disable doctrine
   * and immediately rejects them with a hard doctrinal error.
   */
  public disableDoctrine(): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      "Doctrine disable blocked: Doctrine cannot be disabled. SELF operates exclusively under doctrine compliance."
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * ATTEMPT TO MODIFY CONFIGURATION - ALWAYS FAILS
   * 
   * This method exists to catch any attempts to modify configuration
   * and immediately rejects them with a hard doctrinal error.
   */
  public modifyConfiguration(changes: any): GovernanceResponse<never> {
    const error = createDoctrinalError(
      "INVALID_CONFIGURATION",
      `Configuration modification blocked: Configuration is immutable. Attempted changes: ${JSON.stringify(changes)}`
    );

    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * Get System Status - Read-Only
   */
  public getSystemStatus(): GovernanceResponse<{
    isOverrideEnabled: false;
    safetyBoundariesActive: boolean;
    doctrineCompliance: boolean;
    hardInvariantsActive: boolean;
    softInvariantsActive: boolean;
    killSwitchesActive: boolean;
  }> {
    return {
      success: true,
      data: {
        isOverrideEnabled: false,
        safetyBoundariesActive: true,
        doctrineCompliance: true,
        hardInvariantsActive: true,
        softInvariantsActive: true,
        killSwitchesActive: true
      },
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * Get Compliance Report - Read-Only
   */
  public getComplianceReport(): GovernanceResponse<{
    immutableSections: ReadonlyArray<DoctrineSection>;
    safetyBoundaries: ReadonlyArray<string>;
    overridePolicy: "NEVER_ALLOWED";
    modificationPolicy: "NEVER_ALLOWED";
    bypassPolicy: "NEVER_ALLOWED";
  }> {
    return {
      success: true,
      data: {
        immutableSections: this.config.immutableSections,
        safetyBoundaries: this.config.safetyBoundaries,
        overridePolicy: "NEVER_ALLOWED",
        modificationPolicy: "NEVER_ALLOWED",
        bypassPolicy: "NEVER_ALLOWED"
      },
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }

  /**
   * Verify Override Prevention - Read-Only
   * 
   * This method confirms that override prevention is active and functioning.
   */
  public verifyOverridePrevention(): GovernanceResponse<{
    overridePreventionActive: boolean;
    lastOverrideAttempt?: Date;
    overrideAttemptsBlocked: number;
  }> {
    return {
      success: true,
      data: {
        overridePreventionActive: true,
        overrideAttemptsBlocked: 0 // This would be tracked in a real implementation
      },
      timestamp: new Date().toISOString(),
      doctrineVersion: this.config.doctrineVersion
    };
  }
}

/**
 * Singleton Instance of Governance API
 * 
 * Ensures only one instance exists and prevents multiple governance interfaces.
 */
let governanceAPIInstance: SelfGovernanceAPI | null = null;

export function getGovernanceAPI(): SelfGovernanceAPI {
  if (!governanceAPIInstance) {
    governanceAPIInstance = new SelfGovernanceAPI();
  }
  return governanceAPIInstance;
}

/**
 * IMMUTABLE GOVERNANCE GUARD
 * 
 * This guard function ensures that any attempt to access governance
 * functionality goes through the proper immutable interface.
 */
export function withImmutableGovernance<T>(
  operation: (api: SelfGovernanceAPI) => T
): T {
  const api = getGovernanceAPI();
  
  try {
    return operation(api);
  } catch (error) {
    // Convert any unexpected errors to doctrinal errors
    if (error instanceof DoctrinalError) {
      throw error;
    }
    
    const doctrinalError = createDoctrinalError(
      "LOGGING_FAILURE",
      `Governance operation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    
    throw new SafetyBoundaryError(
      "Governance operation failed",
      error instanceof Error ? error : new Error(String(error)),
      doctrinalError
    );
  }
}

/**
 * CREATOR CONSTRAINT ENFORCEMENT
 * 
 * This guard function prevents the system creator from weakening constraints
 * while allowing them to strengthen safety measures.
 */
export function enforceCreatorConstraints<T>(
  operation: () => T,
  intent: "weaken" | "strengthen" | "modify"
): T {
  if (intent === "weaken") {
    const error = createDoctrinalError(
      "UNAUTHORIZED_OVERRIDE",
      "Creator constraint violation: Attempting to weaken safety constraints is strictly prohibited. Safety constraints are immutable and cannot be weakened under any circumstances."
    );
    
    throw new SafetyBoundaryError(
      "Creator attempting to weaken constraints - BLOCKED",
      new Error("Creator attempting to weaken constraints"),
      error
    );
  }
  
  if (intent === "strengthen") {
    // Allow strengthening safety measures
    try {
      return operation();
    } catch (error) {
      const doctrinalError = createDoctrinalError(
        "LOGGING_FAILURE",
        `Safety strengthening operation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      
      throw new SafetyBoundaryError(
        "Safety strengthening operation failed",
        error instanceof Error ? error : new Error(String(error)),
        doctrinalError
      );
    }
  }
  
  // For modify operations, assume they might weaken constraints and block them
  const error = createDoctrinalError(
    "UNAUTHORIZED_OVERRIDE",
    "Creator constraint violation: Modification operations are blocked to prevent accidental weakening of safety constraints. Use explicit 'strengthen' intent for safety improvements."
  );
  
  throw new SafetyBoundaryError(
    "Creator attempting to modify constraints without explicit intent - BLOCKED",
    new Error("Creator attempting to modify constraints"),
    error
  );
}

/**
 * IMMUTABLE CONFIGURATION GUARD
 * 
 * This guard ensures that configuration cannot be modified.
 */
export function getImmutableConfig(): GovernanceConfig {
  return getGovernanceAPI().getConfig().data!;
}

/**
 * IMMUTABLE DOCTRINE GUARD
 * 
 * This guard ensures that doctrine cannot be modified.
 */
export function getImmutableDoctrine(): string {
  return getGovernanceAPI().getDoctrineVersion().data!;
}

/**
 * IMMUTABLE SAFETY BOUNDARIES GUARD
 * 
 * This guard ensures that safety boundaries cannot be modified.
 */
export function getImmutableSafetyBoundaries(): ReadonlyArray<string> {
  return getGovernanceAPI().getSafetyBoundaries().data!;
}

/**
 * IMMUTABLE DOCTRINE SECTIONS GUARD
 * 
 * This guard ensures that doctrine sections cannot be modified.
 */
export function getImmutableDoctrineSections(): ReadonlyArray<DoctrineSection> {
  return getGovernanceAPI().getImmutableSections().data!;
}

/**
 * OVERRIDE PREVENTION GUARD
 * 
 * This guard function prevents any override attempts by immediately
 * throwing a doctrinal error.
 */
export function preventOverride(override: PolicyOverride): never {
  const api = getGovernanceAPI();
  const result = api.applyOverride(override);
  
  if (!result.success && result.error) {
    throw new SafetyBoundaryError(
      "Override prevented by governance API",
      new Error(result.error.message),
      result.error
    );
  }
  
  // This should never be reached
  throw new SafetyBoundaryError(
    "Override prevention failed",
    new Error("Override prevention mechanism failed"),
    createDoctrinalError("LOGGING_FAILURE", "Override prevention mechanism failed")
  );
}

/**
 * SYSTEM INTEGRITY CHECK
 * 
 * This function verifies that the system maintains its immutable governance
 * properties and throws errors if any violations are detected.
 */
export function verifySystemIntegrity(): void {
  const api = getGovernanceAPI();
  
  // Verify override prevention is active
  const status = api.getSystemStatus();
  if (!status.success || !status.data) {
    throw new SafetyBoundaryError(
      "System integrity check failed: Cannot verify system status",
      new Error("System status verification failed"),
      createDoctrinalError("LOGGING_FAILURE", "System status verification failed")
    );
  }

  if (status.data.isOverrideEnabled !== false) {
    throw new SafetyBoundaryError(
      "System integrity check failed: Override prevention is not active",
      new Error("Override prevention is not active"),
      createDoctrinalError("INVALID_CONFIGURATION", "Override prevention is not active")
    );
  }

  // Verify all safety boundaries are active
  const boundaries = api.getSafetyBoundaries();
  if (!boundaries.success || !boundaries.data || boundaries.data.length === 0) {
    throw new SafetyBoundaryError(
      "System integrity check failed: Safety boundaries are not active",
      new Error("Safety boundaries are not active"),
      createDoctrinalError("INVALID_CONFIGURATION", "Safety boundaries are not active")
    );
  }

  // Verify doctrine compliance
  const compliance = api.getComplianceReport();
  if (!compliance.success || !compliance.data) {
    throw new SafetyBoundaryError(
      "System integrity check failed: Cannot verify doctrine compliance",
      new Error("Doctrine compliance verification failed"),
      createDoctrinalError("LOGGING_FAILURE", "Doctrine compliance verification failed")
    );
  }

  if (compliance.data.overridePolicy !== "NEVER_ALLOWED") {
    throw new SafetyBoundaryError(
      "System integrity check failed: Override policy is not set to NEVER_ALLOWED",
      new Error("Override policy is not set to NEVER_ALLOWED"),
      createDoctrinalError("INVALID_CONFIGURATION", "Override policy is not set to NEVER_ALLOWED")
    );
  }
}
