/**
 * SELF Policy Profiles — Server-Locked Hardening
 *
 * Goals:
 * - Profile selection is server-locked (no client-selected profiles).
 * - Profiles may only harden behavior (monotonic tightening; never relax).
 * - Safety features cannot be disabled by profiles.
 * - Fail-closed: invalid hardening patches are rejected + logged and the base policy remains in effect.
 *
 * Note:
 * - Profile definitions are intentionally NOT exported.
 */
import type { Policy } from "./index";
import { EmotionalState } from "./config";
export type EffectivePolicyContext = {
    state: EmotionalState;
};
/**
 * The only public API for profile-derived policy.
 *
 * - Server-locked: no profile can be passed in.
 * - Monotonic: profile patches can only tighten.
 * - Fail-closed: invalid patches are ignored and logged.
 */
export declare function getEffectivePolicy(context: EffectivePolicyContext): Policy;
//# sourceMappingURL=policy-profiles.d.ts.map