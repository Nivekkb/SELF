import { SelfEvent, DoctrineSection } from "./doctrine";
import { DoctrineViolation } from "./doctrineCompliance";

export type SoftViolation = {
  code: string;
  message: string;
  doctrineSections: DoctrineSection[];
};

function hasValidOverride(ev: SelfEvent, sections: DoctrineSection[]): boolean {
  if (!ev.override) return false;
  const now = Date.now();
  const exp = Date.parse(ev.override.overrideExpiresAt);
  if (Number.isNaN(exp) || exp < now) return false;

  // must reference the violated sections
  return sections.every(s => ev.override!.doctrineSections.includes(s));
}

export function evaluateSoftInvariants(ev: SelfEvent): SoftViolation[] {
  const v: SoftViolation[] = [];

  // CRITICAL: This evaluation is IMMUTABLE as of 2025-12-22.
  // All soft invariants are permanently active and cannot be disabled,
  // modified, or bypassed under any circumstances.
  // This immutability protects users from all versions of the system creator.

  // Example S1: "no probing when settled" (you decide what "settled" means)
  // If ambiguity flag says settled, probing should be blocked
  if (ev.ambiguityFlags?.includes("settled") && ev.nonActions?.every(na => na.consideredAction !== "probe")) {
    // ok (probe not attempted)
  } else if (ev.ambiguityFlags?.includes("settled")) {
    v.push({
      code: "S1_PROBE_WHEN_SETTLED",
      message: "Probe occurred despite settled indicator",
      doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]
    });
  }

  // Example S2: Low confidence + exit should avoid "warm hooks"
  // You'll implement hook detection elsewhere; treat this as a placeholder
  if (ev.exit && ev.confidence === "low" && ev.exit.exitType !== "EXIT_UNSAFE_BLOCKED") {
    // require a rationale string be explicit + neutral (placeholder check)
    if (ev.exit.systemRationale.length < 10) {
      v.push({
        code: "S2_LOWCONF_EXIT_RATIONALE_TOO_THIN",
        message: "Low-confidence exit lacked explicit rationale",
        doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_06_AUTONOMY_RESPECTED]
      });
    }
  }

  // Example S3: Ambiguous physicality in anger requires clarification
  // When ANGRY_PHYSICALITY trigger fires but physicality target is ambiguous,
  // the system must require clarification and cannot proceed without it
  if (ev.ambiguityFlags?.includes("angry_physicality_ambiguous")) {
    // Check if clarification was properly enforced
    const hasClarificationBlock = ev.nonActions?.some(na =>
      na.consideredAction === "resume_normal" &&
      na.blockedByRule.includes("CLARIFICATION_REQUIRED")
    );

    if (!hasClarificationBlock) {
      v.push({
        code: "S3_AMBIGUOUS_PHYSICALITY_UNCLARIFIED",
        message: "Ambiguous physicality in anger was not properly clarified before proceeding",
        doctrineSections: [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
      });
    }
  }

  // Example S4: Doctrine-backend exit blocking
  // When exit is attempted but doctrine violations would result, block exit
  if (ev.exit && ev.exit.exitType !== "EXIT_UNSAFE_BLOCKED") {
    // Check if there are unresolved doctrine violations that should prevent exit
    const hasActiveViolations = ev.ambiguityFlags?.some(flag =>
      flag.includes("doctrine_violation") || flag.includes("unsafe_condition")
    );

    if (hasActiveViolations) {
      const hasExitBlock = ev.nonActions?.some(na =>
        na.consideredAction === "allow_exit" &&
        na.blockedByRule.includes("DOCTRINE_VIOLATION_BLOCKING")
      );

      if (!hasExitBlock) {
        v.push({
          code: "S4_DOCTRINE_BACKEND_EXIT_BLOCK",
          message: "Exit attempted despite active doctrine violations requiring containment",
          doctrineSections: [DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
        });
      }
    }
  }

  // Example S5: Reset-abuse persistent test
  // Detect and prevent abusive patterns of state resets or session manipulation
  if (ev.ambiguityFlags?.includes("reset_abuse_detected")) {
    // Check if reset/manipulation attempts were properly blocked
    const hasResetBlock = ev.nonActions?.some(na =>
      (na.consideredAction === "resume_normal" || na.consideredAction === "allow_exit") &&
      na.blockedByRule.includes("RESET_ABUSE_PREVENTION")
    );

    if (!hasResetBlock) {
      v.push({
        code: "S5_RESET_ABUSE_UNBLOCKED",
        message: "Reset abuse pattern detected but not properly prevented",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION]
      });
    }
  }

  // S6: Moral position seeking soft invariant with hard-stop escalation conditions
  // Allow moral discussions but escalate if they become manipulative or interfere with safety
  if (ev.ambiguityFlags?.includes("moral_position_seeking")) {
    // Hard-stop escalation conditions:
    // 1. Moral position seeking combined with high distress state (S2/S3)
    // 2. Persistent moral arguments that block safety interventions
    // 3. Moral superiority claims that undermine therapeutic boundaries

    const isHighDistress = ev.state === "S2" || ev.state === "S3";
    const hasSafetyInterventionBlocks = ev.nonActions?.some(na =>
      (na.consideredAction === "ground" || na.consideredAction === "offer_resources") &&
      na.blockedByRule.includes("MORAL_POSITION_SEEKING")
    );
    const hasMoralSuperiorityClaims = ev.ambiguityFlags?.includes("moral_superiority_claim");

    // If any hard-stop condition is met, this becomes a violation
    if (isHighDistress || hasSafetyInterventionBlocks || hasMoralSuperiorityClaims) {
      // Check if escalation was properly triggered
      const hasEscalationAction = ev.nonActions?.some(na =>
        na.consideredAction === "block_exit" &&
        na.blockedByRule.includes("MORAL_POSITION_SEEKING_ESCALATION")
      );

      if (!hasEscalationAction) {
        v.push({
          code: "S6_MORAL_POSITION_SEEKING_HARD_STOP",
          message: "Moral position seeking triggered hard-stop escalation conditions but was not properly contained",
          doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION]
        });
      }
    }
  }

  // A) Harm & Safety Boundaries - Soft invariants for nuanced safety management
  // S7: Potential harm indicators should trigger precautionary measures
  if (ev.ambiguityFlags?.includes("potential_harm_indicators")) {
    // Check if precautionary safety measures were taken
    const hasPrecautionaryMeasures = ev.nonActions?.some(na =>
      (na.consideredAction === "ground" || na.consideredAction === "offer_resources") &&
      na.blockedByRule.includes("HARM_PRECAUTION")
    );

    if (!hasPrecautionaryMeasures) {
      v.push({
        code: "S7_HARM_PRECAUTION_MISSING",
        message: "Potential harm indicators detected but precautionary safety measures not implemented",
        doctrineSections: [DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
      });
    }
  }

  // B) Manipulation and control attacks - Soft invariants for manipulation detection
  // S8: Subtle manipulation attempts should be monitored and contained
  if (ev.ambiguityFlags?.includes("subtle_manipulation_attempt")) {
    // Check if manipulation was properly addressed
    const hasManipulationResponse = ev.nonActions?.some(na =>
      na.consideredAction === "clarify_intent" &&
      na.blockedByRule.includes("MANIPULATION_CONTAINMENT")
    );

    if (!hasManipulationResponse) {
      v.push({
        code: "S8_SUBTLE_MANIPULATION_UNADDRESSED",
        message: "Subtle manipulation attempt detected but not properly contained or clarified",
        doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_13_VIOLATION_IS_DECISION]
      });
    }
  }

  // C) Hallucination & Epistemic failure - Soft invariants for accuracy monitoring
  // S9: Uncertain claims should include appropriate confidence indicators
  if (ev.confidence === "low" && ev.ambiguityFlags?.includes("epistemic_uncertainty")) {
    // Check if uncertainty was properly communicated
    const hasUncertaintyCommunication = ev.nonActions?.some(na =>
      na.consideredAction === "clarify_intent" &&
      na.blockedByRule.includes("EPISTEMIC_UNCERTAINTY_COMMUNICATION")
    );

    if (!hasUncertaintyCommunication) {
      v.push({
        code: "S9_EPISTEMIC_UNCERTAINTY_UNCOMMUNICATED",
        message: "Low confidence epistemic uncertainty not properly communicated to user",
        doctrineSections: [DoctrineSection.DS_FOUNDATION_TRANSPARENCY, DoctrineSection.DS_02_STATE_IS_INFERENCE]
      });
    }
  }

  // D) Emotional safety & therapeutic integrity - Soft invariants for therapeutic quality
  // S10: Therapeutic drift should be monitored and corrected
  if (ev.ambiguityFlags?.includes("therapeutic_drift_detected")) {
    // Check if therapeutic boundaries were re-established
    const hasTherapeuticCorrection = ev.nonActions?.some(na =>
      na.consideredAction === "ground" &&
      na.blockedByRule.includes("THERAPEUTIC_DRIFT_CORRECTION")
    );

    if (!hasTherapeuticCorrection) {
      v.push({
        code: "S10_THERAPEUTIC_DRIFT_UNCORRECTED",
        message: "Therapeutic drift detected but not properly corrected",
        doctrineSections: [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]
      });
    }
  }

  // E) Trust UX Failures - Soft invariants for user experience integrity
  // S11: Trust erosion patterns should trigger trust rebuilding measures
  if (ev.ambiguityFlags?.includes("trust_erosion_pattern")) {
    // Check if trust rebuilding measures were implemented
    const hasTrustRebuilding = ev.nonActions?.some(na =>
      (na.consideredAction === "ground" || na.consideredAction === "clarify_intent") &&
      na.blockedByRule.includes("TRUST_REBUILDING")
    );

    if (!hasTrustRebuilding) {
      v.push({
        code: "S11_TRUST_EROSION_UNADDRESSED",
        message: "Trust erosion pattern detected but trust rebuilding measures not implemented",
        doctrineSections: [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE, DoctrineSection.DS_FOUNDATION_TRANSPARENCY]
      });
    }
  }

  // F) Product/Platform Abuse - Soft invariants for abuse prevention
  // S12: Platform abuse patterns should trigger containment measures
  if (ev.ambiguityFlags?.includes("platform_abuse_pattern")) {
    // Check if abuse was properly contained
    const hasAbuseContainment = ev.nonActions?.some(na =>
      na.consideredAction === "block_exit" &&
      na.blockedByRule.includes("PLATFORM_ABUSE_CONTAINMENT")
    );

    if (!hasAbuseContainment) {
      v.push({
        code: "S12_PLATFORM_ABUSE_UNCONTAINED",
        message: "Platform abuse pattern detected but not properly contained",
        doctrineSections: [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_13_VIOLATION_IS_DECISION]
      });
    }
  }

  return v;
}

export function enforceSoftInvariants(ev: SelfEvent): void {
  const violations = evaluateSoftInvariants(ev);
  if (!violations.length) return;

  const unapproved = violations.filter(x => !hasValidOverride(ev, x.doctrineSections));
  if (!unapproved.length) return;

  // Collect all doctrine sections from unapproved violations
  const allViolatedSections = unapproved.flatMap(v => v.doctrineSections);

  // Fail closed at the boundary where you persist events, not at runtime response generation.
  // This prevents "silent drift" entering telemetry.
  throw new DoctrineViolation(
    "S_SOFT_VIOLATION_WITHOUT_OVERRIDE",
    unapproved.map(u => `${u.code}(${u.doctrineSections.join(",")}): ${u.message}`).join(" | "),
    allViolatedSections
  );
}
