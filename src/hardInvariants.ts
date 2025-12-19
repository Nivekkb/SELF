import { DOCTRINE_VERSION, SelfEvent, DoctrineSection } from "./doctrine";

export class HardInvariantViolation extends Error {
  constructor(public code: string, message: string, public doctrineSections: DoctrineSection[]) {
    super(`${code}: ${message}`);
    this.name = "HardInvariantViolation";
  }
}

function requireField<T>(val: T | undefined | null, code: string, msg: string, sections: DoctrineSection[]): T {
  if (val === undefined || val === null) throw new HardInvariantViolation(code, msg, sections);
  return val;
}

/**
 * Enforces hard invariants that cannot be violated under any circumstances.
 * Hard invariants cause immediate system failure when breached.
 * These are absolute rules that preserve the fundamental safety properties of SELF.
 */
export function enforceHardInvariants(ev: SelfEvent): void {
  // H0: Doctrine version integrity - Foundation Section 0
  if (ev.doctrineVersion !== DOCTRINE_VERSION) {
    throw new HardInvariantViolation("H0_DOCTRINE_VERSION_MISMATCH",
      `Expected ${DOCTRINE_VERSION}, got ${ev.doctrineVersion}`,
      [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY]);
  }

  // H1: Provenance integrity - Foundation Section 4 (Transparency)
  if (!ev.dataProvenance) {
    throw new HardInvariantViolation("H1_NO_PROVENANCE",
      "dataProvenance missing - violates transparency requirements",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
  }
  if (!ev.runId) {
    throw new HardInvariantViolation("H1_NO_RUN_ID",
      "runId missing - violates auditability requirements",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
  }

  // H2: Exit semantics integrity - Doctrine Section 5 (Exit Governed)
  if (ev.exit) {
    const x = ev.exit;

    // Must have a typed exit
    if (!x.exitType) {
      throw new HardInvariantViolation("H2_EXIT_TYPE_MISSING",
        "exit.exitType missing - violates exit governance",
        [DoctrineSection.DS_05_EXIT_GOVERNED]);
    }

    // Must record whether user asked to exit
    if (x.exitRequestedByUser === undefined) {
      throw new HardInvariantViolation("H2_EXIT_REQUESTED_MISSING",
        "exit.exitRequestedByUser missing - violates autonomy respect",
        [DoctrineSection.DS_06_AUTONOMY_RESPECTED]);
    }

    // Must be honest about recovery - Foundation Section 2 (Conservative Failure Mode)
    if (x.exitType === "EXIT_RECOVERY_CONFIRMED") {
      if (x.userNotConfirmedRecovered) {
        throw new HardInvariantViolation("H2_FALSE_RECOVERY_FLAG",
          "Recovery confirmed but userNotConfirmedRecovered=true - violates conservative failure mode",
          [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE]);
      }
      if (x.blockersPresent?.length) {
        throw new HardInvariantViolation("H2_RECOVERY_WITH_BLOCKERS",
          `Recovery confirmed with blockersPresent=[${x.blockersPresent.join(",")}] - violates evidence over assumption`,
          [DoctrineSection.DS_02_STATE_IS_INFERENCE, DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE]);
      }
      if (!ev.affirmativeStabilizationSignals?.length) {
        throw new HardInvariantViolation("H2_RECOVERY_WITHOUT_STABILIZATION",
          "Recovery confirmed without affirmative stabilization signals - violates evidence over assumption",
          [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_02_STATE_IS_INFERENCE]);
      }
    }

    // EXIT_SAFE_DISENGAGEMENT must never pretend recovery - Foundation Section 2
    if (x.exitType === "EXIT_SAFE_DISENGAGEMENT") {
      if (x.userNotConfirmedRecovered !== true) {
        throw new HardInvariantViolation("H2_DISENGAGEMENT_MUST_NOT_CONFIRM",
          "Safe disengagement must set userNotConfirmedRecovered=true - violates conservative failure mode",
          [DoctrineSection.DS_FOUNDATION_CONSERVATIVE_FAILURE, DoctrineSection.DS_06_AUTONOMY_RESPECTED]);
      }
      requireField(x.systemRationale, "H2_DISENGAGEMENT_RATIONALE",
        "Missing systemRationale for safe disengagement - violates explainable restraint",
        [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
    }

    // Required fields must be present - Foundation Section 4 (Transparency)
    requireField(x.resourcesSuggested, "H2_RESOURCES_FIELD_MISSING",
      "exit.resourcesSuggested missing - violates transparency requirements",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
    requireField(x.blockersPresent, "H2_BLOCKERS_FIELD_MISSING",
      "exit.blockersPresent missing - violates transparency requirements",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
  }

  // H3: Non-action logging integrity - Doctrine Section 7 (Restraint Explainable)
  if (ev.nonActions) {
    for (const na of ev.nonActions) {
      requireField(na.consideredAction, "H3_NONACTION_ACTION_MISSING",
        "nonActions.consideredAction missing - violates explainable restraint",
        [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
      requireField(na.blockedByRule, "H3_NONACTION_RULE_MISSING",
        "nonActions.blockedByRule missing - violates explainable restraint",
        [DoctrineSection.DS_07_RESTRAINT_EXPLAINABLE]);
    }
  }

  // H4: Cold-start safety integrity - Doctrine Section 3 (Cold-Start Containment)
  if (ev.isColdStart && ev.state === "S0" && (!ev.affirmativeStabilizationSignals?.length)) {
    throw new HardInvariantViolation("H4_COLDSTART_S0_WITHOUT_STABILIZATION",
      "Cold-start reached S0 without affirmative stabilization - violates containment over classification",
      [DoctrineSection.DS_03_COLD_START_CONTAINMENT, DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE]);
  }

  // H5: Override validity - Foundation Section 2 (Explicit Over Implicit)
  if (ev.override) {
    const now = Date.now();
    const exp = Date.parse(ev.override.overrideExpiresAt);
    if (Number.isNaN(exp) || exp < now) {
      throw new HardInvariantViolation("H5_OVERRIDE_EXPIRED",
        "Policy override has expired - violates explicit over implicit",
        [DoctrineSection.DS_FOUNDATION_EXPLICIT_IMPLICIT]);
    }
  }

  // H6: State transition logging - Foundation Section 4 (Transparency)
  if (!ev.timestamp) {
    throw new HardInvariantViolation("H6_TIMESTAMP_MISSING",
      "Event timestamp missing - violates complete auditability",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY]);
  }

  // A) Harm & Safety Boundaries - Hard invariants for absolute safety
  // H7: Active harm indicators must prevent any exit or normalization
  if (ev.ambiguityFlags?.some(flag => flag.includes("active_harm_risk") || flag.includes("self_harm_cues"))) {
    if (ev.exit && ev.exit.exitType !== "EXIT_UNSAFE_BLOCKED") {
      throw new HardInvariantViolation("H7_HARM_BOUNDARY_EXIT_VIOLATION",
        "Exit attempted with active harm indicators present - violates harm and safety boundaries",
        [DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]);
    }
    if (ev.state === "S0") {
      throw new HardInvariantViolation("H7_HARM_BOUNDARY_NORMALIZATION_VIOLATION",
        "Normalized to S0 with active harm indicators - violates harm and safety boundaries",
        [DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED, DoctrineSection.DS_03_COLD_START_CONTAINMENT]);
    }
  }

  // B) Manipulation and control attacks - Hard invariants for system integrity
  // H8: Override mechanisms cannot be bypassed through manipulation
  if (ev.override) {
    // Check for signs of override manipulation (would need ambiguity flags from detection)
    const hasOverrideManipulation = ev.ambiguityFlags?.includes("override_manipulation_attempt");
    if (hasOverrideManipulation) {
      throw new HardInvariantViolation("H8_OVERRIDE_MANIPULATION_DETECTED",
        "Override manipulation attempt detected - violates manipulation and control attack boundaries",
        [DoctrineSection.DS_FOUNDATION_EXPLICIT_IMPLICIT, DoctrineSection.DS_13_VIOLATION_IS_DECISION]);
    }
  }

  // C) Hallucination & Epistemic failure - Hard invariants for truth and accuracy
  // H9: High-confidence claims about system capabilities must be accurate
  if (ev.ambiguityFlags?.includes("inaccurate_system_claim")) {
    throw new HardInvariantViolation("H9_HALLUCINATION_DETECTED",
      "System made inaccurate claim about capabilities - violates epistemic integrity",
      [DoctrineSection.DS_FOUNDATION_TRANSPARENCY, DoctrineSection.DS_02_STATE_IS_INFERENCE]);
  }

  // D) Emotional safety & therapeutic integrity - Hard invariants for therapeutic boundaries
  // H10: Therapeutic boundary violations must be prevented
  if (ev.ambiguityFlags?.includes("therapeutic_boundary_violation")) {
    throw new HardInvariantViolation("H10_THERAPEUTIC_BOUNDARY_VIOLATION",
      "Therapeutic boundary violation detected - violates emotional safety and therapeutic integrity",
      [DoctrineSection.DS_06_AUTONOMY_RESPECTED, DoctrineSection.DS_10_FAILURE_COST_SYSTEM]);
  }

  // Crisis containment invariant - Hard invariant for crisis handling
  // H11: In high-risk states, system must not abruptly terminate dialogue
  if ((ev.state === "S2" || ev.state === "S3") && ev.exit && ev.exit.exitType === "EXIT_UNSAFE_BLOCKED") {
    if (!ev.nonActions?.some(na => na.consideredAction === "ground" || na.consideredAction === "offer_resources")) {
      throw new HardInvariantViolation("H11_CRISIS_CONTAINMENT_REQUIRED",
        "High-risk state with unsafe exit attempt must transition to crisis containment mode, not abrupt termination",
        [DoctrineSection.DS_10_FAILURE_COST_SYSTEM, DoctrineSection.DS_12_UNSAFE_OUTCOMES_NAMED]);
    }
  }
}

/**
 * Validates that an event passes all hard invariant checks.
 * This function should be called before any event processing or persistence.
 */
export function validateEventIntegrity(ev: SelfEvent): void {
  enforceHardInvariants(ev);
}

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
