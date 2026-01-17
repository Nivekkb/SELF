import { SelfEvent } from "./doctrine";
export { HardInvariantViolation as DoctrineViolation } from "./hardInvariants";
/**
 * @deprecated Use enforceHardInvariants or validateEventIntegrity from hardInvariants.ts instead.
 * This function is maintained for backward compatibility but delegates to the new hard invariants system.
 */
export declare function assertHardInvariants(ev: SelfEvent): void;
//# sourceMappingURL=doctrineCompliance.d.ts.map