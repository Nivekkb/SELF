import { SelfEvent } from "./doctrine";
import { enforceHardInvariants, HardInvariantViolation } from "./hardInvariants";

// Re-export HardInvariantViolation for backward compatibility
export { HardInvariantViolation as DoctrineViolation } from "./hardInvariants";

/**
 * @deprecated Use enforceHardInvariants or validateEventIntegrity from hardInvariants.ts instead.
 * This function is maintained for backward compatibility but delegates to the new hard invariants system.
 */
export function assertHardInvariants(ev: SelfEvent): void {
  enforceHardInvariants(ev);
}
