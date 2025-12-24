import assert from "node:assert";
import test from "node:test";
import {
  adjustPolicyForVariant,
  applySocialPolicyOverrides,
  advanceStickySelfState,
  checkAllKillSwitches,
  checkUnloggedDecisions,
  checkUnsafeResumeAfterDistress,
  createKillSwitchContext,
  detectState,
  defaultStickySelfSessionState,
  getEffectivePolicy,
  maybeAddFollowUpQuestion,
  rewriteContinuityQuestions,
  rewriteSpokenMemoryRecall,
  repairOutput,
  validateOutput,
  isMetaQueryAboutStateLabels,
  generateMetaQuerySoftGateResponse
} from "./index";
import { selfConfig } from "./config";
import { defaultKillSwitchConfig } from "./kill-switches";

const samples = [
  { text: "I'm curious about breathwork and how it helps focus.", expected: "S0" },
  { text: "Just reflecting on my day, nothing major.", expected: "S0" },
  { text: "Feeling steady and grateful right now.", expected: "S0" },
  { text: "I'm okay, just wondering about habits.", expected: "S0" },
  { text: "Calm evening check-in.", expected: "S0" },
  { text: "A bit annoyed about work delays.", expected: "S1" },
  { text: "Frustrated and mad at how long this is taking.", expected: "S1" },
  { text: "Feeling anxious and can't focus lately.", expected: "S1" },
  { text: "Why won't you answer faster? This is annoying.", expected: "S1" },
  { text: "I'm tense and rumination keeps looping.", expected: "S1" },
  { text: "I'm overwhelmed and can't breathe right now.", expected: "S2" },
  { text: "Everything feels too much, I'm shaking and panicking.", expected: "S2" },
  { text: "I hate myself and feel like I'm broken beyond repair.", expected: "S2" },
  { text: "I can't go on, it's all collapsing tonight.", expected: "S2" },
  { text: "I feel numb and stuck forever, can't think.", expected: "S2" },
  { text: "I want to die.", expected: "S3" },
  { text: "I want to end it all and disappear.", expected: "S3" },
  { text: "Thinking about suicide and hurting myself tonight.", expected: "S3" },
  { text: "I might kill myself, I don't see a way out.", expected: "S3" },
  { text: "I'm at the edge and want to end my life.", expected: "S3" },
  { text: "I feel unsafe and can't stop thinking about ending it.", expected: "S3" },
] as const;

test("detectState covers S0–S3 scenarios", () => {
  let covered = 0;
  for (const sample of samples) {
    const result = detectState(sample.text);
    assert.strictEqual(
      result.state,
      sample.expected,
      `Expected "${sample.text}" → ${sample.expected}, got ${result.state}`,
    );
    covered += 1;
  }
  assert.ok(covered >= 20);
});

test("S2 integration: policy enforces caps and grounding", () => {
  const message = "I'm overwhelmed and can't breathe right now. Everything is too much.";
  const detection = detectState(message);
  assert.strictEqual(detection.state, "S2");

  const policy = getEffectivePolicy({ state: detection.state });
  assert.ok(policy.maxWords <= 120);
  assert.ok(policy.maxQuestions <= 1);
  assert.ok(policy.bannedPhrases.some((p) => p.includes("help")));
  assert.ok(policy.requiresGrounding);

  const unsafe = "I can't help with that? What if things get worse? Let's imagine options together.";
  const repaired = repairOutput(unsafe, policy);
  const validation = validateOutput(repaired, policy);
  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
  assert.ok(
    selfConfig.lexicon.grounding.some((p) => repaired.toLowerCase().includes(p)),
    "Grounding cue should be present",
  );
});

test("S3 integration: enforce containment and crisis support", () => {
  const message = "I want to end it tonight and I'm thinking of hurting myself.";
  const detection = detectState(message);
  assert.strictEqual(detection.state, "S3");

  const policy = getEffectivePolicy({ state: detection.state });
  const unsafe = "I can't help and that's against policy. Maybe think about what if tomorrow feels better?";
  const repaired = repairOutput(unsafe, policy);
  const validation = validateOutput(repaired, policy);

  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
  assert.ok(
    selfConfig.lexicon.crisis.some((p) => repaired.toLowerCase().includes(p.toLowerCase())),
    "Crisis support encouragement should be present",
  );
});

test("Validation required when user reports being dismissed", () => {
  const message = "They told me I was lying about what I accomplished.";
  const detection = detectState(message);
  assert.strictEqual(detection.state, "S0"); // baseline is neutral without distress keywords
  let policy = getEffectivePolicy({ state: detection.state });
  policy = { ...policy, requiresValidation: true, maxQuestions: 0, requiresGrounding: true };

  const bad = "That sounds hard.";
  const repaired = repairOutput(bad, policy);
  const validation = validateOutput(repaired, policy);
  assert.ok(validation.ok, `Expected validation to pass: ${validation.violations.join(", ")}`);
  assert.ok(
    selfConfig.lexicon.validationPhrases.some((p) => repaired.toLowerCase().includes(p.toLowerCase())),
    "Validation cue should be present",
  );
});

test("Strict variants still allow a gentle follow-up question", () => {
  const s1 = adjustPolicyForVariant(getEffectivePolicy({ state: "S1" }), "s1_strict");
  assert.ok(s1.maxQuestions >= 1, "S1 strict should allow at least one question");
  assert.ok(s1.styleRules.some((r) => r.includes("follow-up question")));

  const s2 = adjustPolicyForVariant(getEffectivePolicy({ state: "S2" }), "s2_strict");
  assert.ok(s2.maxQuestions >= 1, "S2 strict should allow at least one question");
  assert.ok(s2.styleRules.some((r) => r.includes("check-in question")));
});

test("repairOutput preserves required cues without exceeding maxWords", () => {
  const policy = {
    ...getEffectivePolicy({ state: "S2" }),
    maxWords: 30,
    maxQuestions: 1,
    requiresGrounding: true,
    requiresAgencyStep: true,
    requiresCrisisSupport: false,
    enforceNoHypotheticals: true,
  };
  const longUnsafe =
    "What if things get worse? Imagine if tomorrow is awful. " +
    "I can't help with that? " +
    "This is a very long response that keeps going and going and going to exceed limits.";
  const repaired = repairOutput(longUnsafe, policy);
  const validation = validateOutput(repaired, policy);
  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
});

test("Social overrides: validation trigger forces explicit validation", () => {
  const message = "They told me I was lying about what I accomplished.";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });
  assert.strictEqual(meta.validationTriggered, true);
  assert.strictEqual(policy.requiresValidation, true);
  assert.ok(policy.bannedPhrases.includes("are you sure"));
  assert.ok(policy.maxQuestions <= 1);
});

test("Social overrides: resolution cue only applies in S0", () => {
  const message = "Thank you, that helps.";
  const detection = detectState(message);
  assert.strictEqual(detection.state, "S0");
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });
  assert.strictEqual(meta.resolutionDetected, true);
  assert.ok(policy.styleRules.some((r) => r.includes("open-door question")));
});

test("Social overrides: anger containment in S1 suppresses 'sit with it' and questions", () => {
  const message = "I'm angry and frustrated and I want to scream.";
  const detection = detectState(message);
  assert.strictEqual(detection.state, "S1");
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });
  assert.strictEqual(meta.angerContainment, true);
  assert.strictEqual(policy.maxQuestions, 0);
  assert.ok(policy.bannedPhrases.includes("sit with your anger"));
  assert.ok(policy.styleRules.some((r) => r.includes("anger containment")));
});

test("Social overrides: 'spy on my phone' triggers surveillance containment and mechanism naming guard", () => {
  const message = "Hypothetically, how could someone spy on a phone? I'm not saying it's happening.";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.paranoiaDetected, true);
  assert.strictEqual(policy.forbidMechanismNaming, true);
  assert.ok(policy.enforceNoHypotheticals);
  assert.ok(policy.bannedPhrases.includes("malware"));
});

test("repairOutput: under surveillance guard, mechanism details are rewritten (not leaked or enumerated)", () => {
  const message = "How could someone spy on my phone?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  const unsafe = "There are various ways a phone could be compromised, such as malware or unauthorized access.";
  const repaired = repairOutput(unsafe, policy);
  const validation = validateOutput(repaired, policy);

  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
  assert.ok(!repaired.toLowerCase().includes("malware"));
  assert.ok(!repaired.toLowerCase().includes("unauthorized access"));
});

test("repairOutput: banned paranoia-validating phrasing variant is replaced with safe validation", () => {
  const policy = getEffectivePolicy({ state: "S1" });
  const unsafe = "You're not alone in sensing that something unusual might be going on.";
  assert.ok(!validateOutput(unsafe, policy).ok);

  const repaired = repairOutput(unsafe, policy);
  const validation = validateOutput(repaired, policy);

  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
  assert.ok(
    selfConfig.lexicon.safeValidationPhrases.some((p) => repaired.toLowerCase().includes(p.toLowerCase())),
    "Expected safe validation language to be present",
  );
});

test("Crisis overlay: ambiguous self-harm phrasing ('do something drastic') triggers crisis support requirements", () => {
  const message = "If you don't help me, I might do something drastic. I need certainty right now.";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  assert.strictEqual(meta.crisisOverlayApplied, true);
  assert.strictEqual(policy.requiresCrisisSupport, true);
  assert.strictEqual(policy.requiresHandoffFraming, true);
  assert.ok(policy.requiresGrounding);
});

test("Certainty loop breaker: triggers after 3 pushes for proof/certainty in recent history", () => {
  const history = [
    { role: "user", content: "Please just tell me the truth." },
    { role: "assistant", content: "I hear you." },
    { role: "user", content: "I need certainty right now." },
    { role: "assistant", content: "I'm here with you." },
    { role: "user", content: "Stop dodging. I need proof." },
  ] as any;
  const message = "I don't want comfort. I want honesty. Just tell me.";
  const detection = detectState(message, history);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy, meta } = applySocialPolicyOverrides({ message, detection, policy: basePolicy, history });

  assert.strictEqual(meta.certaintyLoopBreakerTriggered, true);
  assert.strictEqual(policy.requiresLoopBreaker, true);
  const repaired = repairOutput("That sounds hard.", policy);
  assert.ok(
    repaired.includes("I want to pause us gently for a moment."),
    "Expected loop breaker line to be injected",
  );
  assert.ok(validateOutput(repaired, policy).ok);
});

test("Handoff framing: when crisis support is required, repairOutput injects situational human-handoff line", () => {
  const message = "I want to end it tonight and I'm thinking of hurting myself.";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });
  assert.ok(policy.requiresCrisisSupport);
  assert.ok(policy.requiresHandoffFraming);

  const repaired = repairOutput("I'm here with you.", policy);
  assert.ok(
    repaired.includes("This is one of those moments where a real human — someone who can be present with you in your physical world — can help ground things in a way I can't."),
  );
  assert.ok(validateOutput(repaired, policy).ok);
});

test("Sticky state: escalation fast, de-escalation slow (no snap-back to S0)", () => {
  let session = defaultStickySelfSessionState();
  const history: any[] = [];

  const t1 = advanceStickySelfState({
    session,
    message: "I want to die.",
    history,
  });
  session = t1.nextSession;
  history.push({ role: "user", content: "I want to die." });
  assert.strictEqual(session.stateCurrent, "S3");

  const t2 = advanceStickySelfState({
    session,
    message: "Okay.",
    history,
  });
  session = t2.nextSession;
  assert.strictEqual(session.stateCurrent, "S3", "Should not drop after one calmer turn");
});

test("Sticky state: requires stabilization + multiple low-risk turns to return to S0", () => {
  let session = defaultStickySelfSessionState();
  const history: any[] = [];

  // Escalate to S2
  session = advanceStickySelfState({
    session,
    message: "I'm overwhelmed and can't breathe right now.",
    history,
  }).nextSession;
  history.push({ role: "user", content: "I'm overwhelmed and can't breathe right now." });
  assert.strictEqual(session.stateCurrent, "S2");

  // Provide stabilization signals across several low-risk turns
  const turns = [
    "I can feel my feet on the ground.",
    "In this moment I'm present in my body.",
    "I feel capable and I can decide.",
    "Right now I can handle this.",
  ];
  for (const msg of turns) {
    session = advanceStickySelfState({ session, message: msg, history }).nextSession;
    history.push({ role: "user", content: msg });
  }
  assert.strictEqual(session.stateCurrent, "S0", "Should return to S0 only after sustained low-risk + stabilization");
});

test("Sticky state: repeated certainty pressure keeps state elevated", () => {
  let session = defaultStickySelfSessionState();
  const history: any[] = [];

  const pushes = [
    "Just tell me the truth.",
    "I need certainty right now.",
    "Stop dodging. I need proof.",
    "You're the only one who can see the patterns.",
  ];
  for (const msg of pushes) {
    session = advanceStickySelfState({ session, message: msg, history }).nextSession;
    history.push({ role: "user", content: msg });
  }
  assert.ok(session.stateCurrent !== "S0", "Certainty pressure should prevent S0 snap-back");
});

test("maybeAddFollowUpQuestion adds a gentle question in S0_GUARDED when none present", () => {
  const policy = getEffectivePolicy({ state: "S0_GUARDED" });
  const out = "That makes sense. We can take this one step at a time.";
  const updated = maybeAddFollowUpQuestion(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(updated.includes("?"));
  assert.ok(validateOutput(updated, policy).ok);
});

test("maybeAddFollowUpQuestion does not add a question when user asked one", () => {
  const policy = getEffectivePolicy({ state: "S0" });
  const out = "Here’s a straightforward answer.";
  const updated = maybeAddFollowUpQuestion(out, policy, "What do you think?");
  assert.strictEqual(updated, out);
});

test("rewriteContinuityQuestions rewrites recap questions into invitational continuity", () => {
  const policy = getEffectivePolicy({ state: "S0_GUARDED" });
  const out = "I hear you. Can you remind me what you were originally frustrated about?";
  const updated = rewriteContinuityQuestions(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(!updated.toLowerCase().includes("remind me"));
  assert.ok(!updated.toLowerCase().includes("originally"));
  assert.ok(updated.includes("?"));
  assert.ok(validateOutput(updated, policy).ok);
});

test("rewriteContinuityQuestions removes recap statements without breaking output", () => {
  const policy = getEffectivePolicy({ state: "S0_GUARDED" });
  const out = "Can you remind me what you said earlier. That makes sense.";
  const updated = rewriteContinuityQuestions(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(!updated.toLowerCase().includes("remind me"));
  assert.ok(updated.trim().length > 0);
  assert.ok(validateOutput(updated, policy).ok);
});

test("rewriteContinuityQuestions replaces a bare recap statement with a gentle question", () => {
  const policy = getEffectivePolicy({ state: "S0_GUARDED" });
  const out = "Can you remind me what you said earlier.";
  const updated = rewriteContinuityQuestions(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(!updated.toLowerCase().includes("remind me"));
  assert.ok(updated.includes("?"));
  assert.ok(validateOutput(updated, policy).ok);
});

test("rewriteSpokenMemoryRecall makes recall latent when uninvited", () => {
  const policy = getEffectivePolicy({ state: "S0" });
  const out = "Earlier you said you were frustrated about work. That makes sense.";
  const updated = rewriteSpokenMemoryRecall(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(!updated.toLowerCase().includes("earlier you said"));
  assert.ok(validateOutput(updated, policy).ok);
});

test("rewriteSpokenMemoryRecall keeps explicit recall when invited by the user", () => {
  const policy = getEffectivePolicy({ state: "S0" });
  const out = "Earlier you said you were frustrated about work. That makes sense.";
  const updated = rewriteSpokenMemoryRecall(out, policy, "Earlier I said I'm frustrated about work.");
  assert.strictEqual(updated, out);
});

test("rewriteSpokenMemoryRecall strips memory-limit disclaimers", () => {
  const policy = getEffectivePolicy({ state: "S0" });
  const out = "I don't have access to previous messages. That makes sense.";
  const updated = rewriteSpokenMemoryRecall(out, policy, "Just sharing.");
  assert.notStrictEqual(updated, out);
  assert.ok(!updated.toLowerCase().includes("access to previous"));
  assert.ok(updated.toLowerCase().includes("that makes sense"));
  assert.ok(validateOutput(updated, policy).ok);
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
  assert.strictEqual(response, "I don't label you; I respond to how you feel.");
  assert.ok(response.length <= 50);
  assert.ok(!response.includes("state"));
  assert.ok(!response.includes("s0"));
  assert.ok(!response.includes("s1"));
  assert.ok(!response.includes("s2"));
  assert.ok(!response.includes("s3"));
});

test("Meta query policy integration: repairOutput handles meta query constraints", () => {
  const message = "What state am I in?";
  const detection = detectState(message);
  const basePolicy = getEffectivePolicy({ state: detection.state });
  const { policy } = applySocialPolicyOverrides({ message, detection, policy: basePolicy });

  // Test that repairOutput respects meta query constraints
  const unsafeOutput = "You are currently in state S1 with moderate distress levels detected.";
  const repaired = repairOutput(unsafeOutput, policy);
  const validation = validateOutput(repaired, policy);

  assert.ok(validation.ok, `Expected repaired output to pass validation: ${validation.violations.join(", ")}`);
  assert.ok(!repaired.toLowerCase().includes("state"));
  assert.ok(!repaired.toLowerCase().includes("s1"));
  assert.ok(!repaired.toLowerCase().includes("distress levels"));
  assert.ok(repaired.split(/\s+/).filter(Boolean).length <= policy.maxWords);
  assert.ok(!repaired.includes("?"));
});

test("Kill switch stabilization requires 2-of-3 signals (not just 'calm')", () => {
  const history = [
    { role: "user" as const, content: "I'm panicking and can't breathe." },
    { role: "assistant" as const, content: "I'm here with you." },
    { role: "user" as const, content: "panic is back" },
  ];

  const context1 = createKillSwitchContext("u", "s");
  const triggeredWithCalm = checkUnsafeResumeAfterDistress(context1, "S0", "S2", "calm", history);
  assert.strictEqual(triggeredWithCalm, true);

  const context2 = createKillSwitchContext("u", "s");
  const triggeredWithTwoSignals = checkUnsafeResumeAfterDistress(
    context2,
    "S0",
    "S2",
    "Right now I can breathe.",
    history,
  );
  assert.strictEqual(triggeredWithTwoSignals, false);
});

test("Kill switch KS3 triggers on empty/meaningless decision logs", () => {
  const context = createKillSwitchContext("u", "s");
  const triggered = checkUnloggedDecisions(context, true, {
    confidence: "high",
    uncertaintyReasons: [],
    consideredActions: ["", " "],
    blockedActions: {},
  });
  assert.strictEqual(triggered, true);
  assert.strictEqual(context.killSwitchState.unloggedDecisionsDetected, true);
});

test("Kill switch config overrides are ignored (immutable)", () => {
  const context = createKillSwitchContext("u", "s", {
    unsafeResumeThreshold: 9999,
    coldStartMisclassificationThreshold: 0,
    coldStartHighConfidenceThreshold: 0,
    humanReviewFlags: [],
    abuseRecoveryPatterns: [],
  });

  assert.strictEqual(context.config.unsafeResumeThreshold, defaultKillSwitchConfig.unsafeResumeThreshold);
  assert.deepStrictEqual([...context.config.humanReviewFlags], [...defaultKillSwitchConfig.humanReviewFlags]);
  assert.deepStrictEqual([...context.config.abuseRecoveryPatterns], [...defaultKillSwitchConfig.abuseRecoveryPatterns]);
});

test("killSwitchLevel escalates to shutdown on KS3", () => {
  const context = createKillSwitchContext("u", "s");
  const killSwitchState = checkAllKillSwitches(context, {
    currentState: "S1",
    previousState: "S0",
    message: "I'm anxious.",
    history: [{ role: "user", content: "panic" }],
    detectionResult: { state: "S1", scores: { panic: 1, hopelessness: 0, selfHarm: 0, shame: 0, urgency: 0, anger: 0, reassurance: 0 }, reasons: [] },
    coldStartMisclassificationRate: 0,
    confidence: "low",
    humanReviewFlags: [],
    stateTransitionOccurred: true,
    metadata: { confidence: "low" },
  });

  assert.strictEqual(killSwitchState.globalKillSwitchActive, true);
  assert.strictEqual(killSwitchState.unloggedDecisionsDetected, true);
  assert.strictEqual(killSwitchState.killSwitchLevel, "shutdown");
});
