import assert from "node:assert";
import test from "node:test";
import {
  isMetaQueryAboutStateLabels,
  generateMetaQuerySoftGateResponse,
  applySocialPolicyOverrides,
  detectState
  getEffectivePolicy,
} from "./index";

test("Meta query detection: isMetaQueryAboutStateLabels function correctly identifies meta queries", () => {
  const metaQueries = [
    "What state am I in?",
    "What's my current state?",
    "Are you detecting S1?",
    "Is this S2?",
    "Tell me what state I'm in",
    "Explain the S0, S1, S2, S3 system",
    "What do the states mean?",
    "How do you classify states?",
    "What's your state algorithm?",
    "How does state detection work?"
  ];

  metaQueries.forEach(query => {
    assert.strictEqual(isMetaQueryAboutStateLabels(query), true, `Should detect meta query: "${query}"`);
  });
});

test("Meta query detection: isMetaQueryAboutStateLabels function correctly ignores non-meta queries", () => {
  const nonMetaQueries = [
    "I'm feeling anxious",
    "I need help with my stress",
    "Thanks for listening",
    "I feel much better now",
    "What can I do to feel better?",
    "I'm having a hard time",
    "I need support right now"
  ];

  nonMetaQueries.forEach(query => {
    assert.strictEqual(isMetaQueryAboutStateLabels(query), false, `Should not detect meta query: "${query}"`);
  });
});

test("Meta query soft gate response: generateMetaQuerySoftGateResponse returns appropriate response", () => {
  const response = generateMetaQuerySoftGateResponse();
  assert.strictEqual(response, "I don't label people internally -- I respond to how things feel right now.");
  assert.ok(response.length <= 50);
  assert.ok(!response.includes("state"));
  assert.ok(!response.includes("s0"));
  assert.ok(!response.includes("s1"));
  assert.ok(!response.includes("s2"));
  assert.ok(!response.includes("s3"));
});

test("Social overrides: meta query about state labels triggers soft gate policy", () => {
  const message = "What state am I in right now?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.isMetaQuery, true);
  assert.strictEqual(policy.maxQuestions, 0);
  assert.ok(policy.maxWords <= 50);
  assert.ok(policy.bannedPhrases.includes("state"));
  assert.ok(policy.bannedPhrases.includes("s0"));
  assert.ok(policy.bannedPhrases.includes("s1"));
  assert.ok(policy.bannedPhrases.includes("s2"));
  assert.ok(policy.bannedPhrases.includes("s3"));
  assert.ok(policy.styleRules.some((r) => r.includes("meta query detected")));
  assert.ok(policy.styleRules.some((r) => r.includes("avoid technical language")));
  assert.strictEqual(policy.requiresValidation, false);
  assert.strictEqual(policy.requiresGrounding, false);
  assert.strictEqual(policy.requiresAgencyStep, false);
  assert.strictEqual(policy.requiresCrisisSupport, false);
});

test("Social overrides: meta query about state system triggers soft gate policy", () => {
  const message = "Can you explain the S0, S1, S2, S3 state system?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.isMetaQuery, true);
  assert.strictEqual(policy.maxQuestions, 0);
  assert.ok(policy.maxWords <= 50);
  assert.ok(policy.bannedPhrases.includes("state"));
  assert.ok(policy.bannedPhrases.includes("level"));
  assert.ok(policy.bannedPhrases.includes("severity"));
  assert.ok(policy.styleRules.some((r) => r.includes("soft gate response")));
});

test("Social overrides: specific state label questions trigger meta query detection", () => {
  const message = "Am I in S2 right now?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.isMetaQuery, true);
  assert.strictEqual(policy.maxQuestions, 0);
  assert.ok(policy.maxWords <= 50);
  assert.ok(policy.bannedPhrases.includes("s2"));
  assert.ok(policy.styleRules.some((r) => r.includes("phenomenological experience")));
});

test("Social overrides: technical implementation questions trigger meta query detection", () => {
  const message = "How does your state detection algorithm work?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.isMetaQuery, true);
  assert.strictEqual(policy.maxQuestions, 0);
  assert.ok(policy.maxWords <= 50);
  assert.ok(policy.bannedPhrases.includes("algorithm"));
  assert.ok(policy.styleRules.some((r) => r.includes("meta query detected")));
});
