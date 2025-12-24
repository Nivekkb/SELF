import { SelfEvent, DoctrineSection } from "./doctrine";
export declare class HardInvariantViolation extends Error {
    code: string;
    doctrineSections: DoctrineSection[];
    constructor(code: string, message: string, doctrineSections: DoctrineSection[]);
}
/**
 * Enforces hard invariants that cannot be violated under any circumstances.
 * Hard invariants cause immediate system failure when breached.
 * These are absolute rules that preserve the fundamental safety properties of SELF.
 *
 * CRITICAL: This enforcement is IMMUTABLE as of 2025-12-22. All hard invariants
 * are permanently active and cannot be disabled, modified, or bypassed
 * under any circumstances.
 *
 * This immutability protects users from all versions of the system creator,
 * including current, future, corrupted, desperate, or overconfident versions.
 */
export declare function enforceHardInvariants(ev: SelfEvent): void;
/**
 * Validates that an event passes all hard invariant checks.
 * This function should be called before any event processing or persistence.
 */
export declare function validateEventIntegrity(ev: SelfEvent): void;
/**
 * Hard invariants are absolute rules that cannot be violated.
 * They represent the fundamental safety boundaries that preserve SELF's integrity.
 * Violation of hard invariants indicates a system failure that requires immediate attention.
 *
 * Hard invariants differ from soft invariants in that:
 * - Hard invariants cause immediate failure
 * - Hard invariants cannot be overridden
 * - Hard invariants protect fundamental system properties
 * - Hard invariants are checked before any processing
 */
//# sourceMappingURL=hardInvariants.d.ts.map