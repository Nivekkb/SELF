import { enforceHardInvariants } from "./hardInvariants.js";
// Re-export HardInvariantViolation for backward compatibility
export { HardInvariantViolation as DoctrineViolation } from "./hardInvariants.js";
/**
 * @deprecated Use enforceHardInvariants or validateEventIntegrity from hardInvariants.ts instead.
 * This function is maintained for backward compatibility but delegates to the new hard invariants system.
 */
export function assertHardInvariants(ev) {
    enforceHardInvariants(ev);
}
//# sourceMappingURL=doctrineCompliance.js.map