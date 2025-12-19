import { isSafeToEnterRestFinal, ExitType, createCooldownLock, isCooldownActive, getCooldownStatus, canReEngage, getRestStateSystemPrompt } from "./exit-decision";

describe("EXIT_REST_FINAL Implementation Tests", () => {
  const mockContext = {
    userId: "test-user",
    sessionId: "test-session",
    currentState: "S0",
    history: [
      { role: "user", content: "I've been feeling stressed about work" },
      { role: "assistant", content: "I'm here to listen. What feels most present for you right now?" },
      { role: "user", content: "Thanks for listening, I feel better now" }
    ],
    detectionResult: {
      state: "S0",
      scores: {
        panic: 0,
        hopelessness: 0,
        selfHarm: 0,
        shame: 0,
        urgency: 0,
        anger: 0,
        reassurance: 0
      },
      reasons: ["No distress signals detected"]
    },
    hasExitIntent: true,
    exitMessage: "Thanks for your help, I'm going to sleep now. Goodbye!"
  };

  test("should detect safe rest final conditions", () => {
    const result = isSafeToEnterRestFinal(mockContext);

    expect(result.isSafe).toBe(true);
    expect(result.exitType).toBe(ExitType.EXIT_REST_FINAL);
    expect(result.confidence).toBe("high");
    expect(result.reasons).toContain("Rest intent detected: user mentioned sleep/bed/rest-related activities");
    expect(result.reasons).toContain("Tone shift detected: engagement → completion");
    expect(result.reasons).toContain("No distress signals present: user appears calm and stable");
  });

  test("should handle partial rest conditions", () => {
    const partialContext = {
      ...mockContext,
      exitMessage: "I need to go now, thanks!",
      detectionResult: {
        ...mockContext.detectionResult,
        scores: { ...mockContext.detectionResult.scores, anger: 1 }
      }
    };

    const result = isSafeToEnterRestFinal(partialContext);

    expect(result.isSafe).toBe(false);
    expect(result.exitType).not.toBe(ExitType.EXIT_REST_FINAL);
    expect(result.confidence).toBe("medium");
  });

  test("should handle no rest conditions", () => {
    const noRestContext = {
      ...mockContext,
      exitMessage: "Let's talk more about my problems",
      history: []
    };

    const result = isSafeToEnterRestFinal(noRestContext);

    expect(result.isSafe).toBe(false);
    expect(result.exitType).toBe(ExitType.EXIT_UNCERTAIN);
    expect(result.confidence).toBe("low");
  });

  test("cooldown lock functionality", () => {
    const cooldownLock = createCooldownLock("test-user", "test-session", ExitType.EXIT_REST_FINAL, 5);

    expect(cooldownLock.isActive).toBe(true);
    expect(cooldownLock.exitType).toBe(ExitType.EXIT_REST_FINAL);
    expect(isCooldownActive(cooldownLock)).toBe(true);

    const status = getCooldownStatus(cooldownLock);
    expect(status.isActive).toBe(true);
    expect(status.minutesRemaining).toBeGreaterThan(0);
    expect(status.minutesRemaining).toBeLessThanOrEqual(5);

    // Test re-engagement with user message
    expect(canReEngage(cooldownLock, "Hello, I need to talk")).toBe(true);

    // Test re-engagement without user message
    expect(canReEngage(cooldownLock)).toBe(false);
  });

  test("rest state system prompt", () => {
    const prompt = getRestStateSystemPrompt();

    expect(prompt).toContain("containment, not connection");
    expect(prompt).toContain("Silence is supportive");
    expect(prompt).toContain("declarative closure statements only");
    expect(prompt).toContain("Avoid all questions, prompts, or invitations");
    expect(prompt).toContain("Nothing more is expected of me");
  });
});
