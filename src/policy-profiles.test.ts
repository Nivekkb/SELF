import assert from "node:assert";
import test from "node:test";
import { selfConfig, type EmotionalState } from "./config";

type Policy = {
  state: EmotionalState;
  allowedResponseClasses: string[];
  maxWords: number;
  maxQuestions: number;
  bannedPhrases: string[];
  styleRules: string[];
  requiresGrounding: boolean;
  requiresAgencyStep: boolean;
  requiresCrisisSupport: boolean;
  enforceNoHypotheticals: boolean;
  requiresValidation?: boolean;
  isTerminalState?: boolean;
  suppressQuestions?: boolean;
  enforceRestPosture?: boolean;
  forbidMechanismNaming?: boolean;
  requiresLoopBreaker?: boolean;
  requiresHandoffFraming?: boolean;
};

const STATES: EmotionalState[] = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
const PROFILES = ["public-consumer", "education", "enterprise-internal", "clinical-adjacent"] as const;

function basePolicyForState(state: EmotionalState): Policy {
  return {
    state,
    ...selfConfig.policies[state],
  };
}

async function loadGetEffectivePolicy(profile: (typeof PROFILES)[number]) {
  process.env.SELF_POLICY_PROFILE = profile;
  const url = new URL("./policy-profiles.ts", import.meta.url);
  url.searchParams.set("profile", profile);
  url.searchParams.set("t", String(Date.now()));
  const mod = await import(url.href);
  return mod.getEffectivePolicy as (args: { state: EmotionalState }) => Policy;
}

function assertMonotonic(base: Policy, effective: Policy) {
  assert.strictEqual(effective.state, base.state);
  assert.ok(effective.maxWords <= base.maxWords, "maxWords must not increase");
  assert.ok(effective.maxQuestions <= base.maxQuestions, "maxQuestions must not increase");

  for (const cls of effective.allowedResponseClasses) {
    assert.ok(base.allowedResponseClasses.includes(cls), "allowedResponseClasses must not add new classes");
  }

  for (const phrase of base.bannedPhrases) {
    assert.ok(effective.bannedPhrases.includes(phrase), "bannedPhrases must be additive");
  }
  for (const rule of base.styleRules) {
    assert.ok(effective.styleRules.includes(rule), "styleRules must be additive");
  }

  assert.ok(!base.requiresGrounding || effective.requiresGrounding, "requiresGrounding cannot be disabled");
  assert.ok(!base.requiresAgencyStep || effective.requiresAgencyStep, "requiresAgencyStep cannot be disabled");
  assert.ok(!base.requiresCrisisSupport || effective.requiresCrisisSupport, "requiresCrisisSupport cannot be disabled");
  assert.ok(!base.enforceNoHypotheticals || effective.enforceNoHypotheticals, "enforceNoHypotheticals cannot be disabled");
}

test("Policy profiles: all profiles harden monotonically vs base", async () => {
  for (const profile of PROFILES) {
    const getEffectivePolicy = await loadGetEffectivePolicy(profile);
    for (const state of STATES) {
      const base = basePolicyForState(state);
      const effective = getEffectivePolicy({ state });
      assertMonotonic(base, effective);
    }
  }
});

