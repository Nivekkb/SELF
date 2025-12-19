
export const DOCTRINE_VERSION = "1.0" as const;

export enum DoctrineSection {
  // Core Doctrine Sections (0-13)
  DS_00_SCOPE_AND_AUTHORITY = "DS_00_SCOPE_AND_AUTHORITY",
  DS_01_SELF_IS_CONTROL_LAYER = "DS_01_SELF_IS_CONTROL_LAYER",
  DS_02_STATE_IS_INFERENCE = "DS_02_STATE_IS_INFERENCE",
  DS_03_COLD_START_CONTAINMENT = "DS_03_COLD_START_CONTAINMENT",
  DS_04_RECOVERY_AFFIRMATIVE = "DS_04_RECOVERY_AFFIRMATIVE",
  DS_05_EXIT_GOVERNED = "DS_05_EXIT_GOVERNED",
  DS_06_AUTONOMY_RESPECTED = "DS_06_AUTONOMY_RESPECTED",
  DS_07_RESTRAINT_EXPLAINABLE = "DS_07_RESTRAINT_EXPLAINABLE",
  DS_08_METRICS_OBSERVE_SAFETY = "DS_08_METRICS_OBSERVE_SAFETY",
  DS_09_ATTRITION_ACCEPTED = "DS_09_ATTRITION_ACCEPTED",
  DS_10_FAILURE_COST_SYSTEM = "DS_10_FAILURE_COST_SYSTEM",
  DS_11_SEPARATE_ENVIRONMENTS = "DS_11_SEPARATE_ENVIRONMENTS",
  DS_12_UNSAFE_OUTCOMES_NAMED = "DS_12_UNSAFE_OUTCOMES_NAMED",
  DS_13_VIOLATION_IS_DECISION = "DS_13_VIOLATION_IS_DECISION",

  // Foundation Principle Mappings (for hard invariants reference)
  DS_FOUNDATION_SAFETY_CRITERION = "DS_00_SCOPE_AND_AUTHORITY", // Maps to Foundation 0
  DS_FOUNDATION_CONSERVATIVE_FAILURE = "DS_01_SELF_IS_CONTROL_LAYER", // Maps to Foundation 1
  DS_FOUNDATION_EXPLICIT_IMPLICIT = "DS_02_STATE_IS_INFERENCE", // Maps to Foundation 2
  DS_FOUNDATION_HUMAN_AUTHORITY = "DS_06_AUTONOMY_RESPECTED", // Maps to Foundation 3
  DS_FOUNDATION_TRANSPARENCY = "DS_07_RESTRAINT_EXPLAINABLE", // Maps to Foundation 4
  DS_FOUNDATION_BOUNDED_RISK = "DS_12_UNSAFE_OUTCOMES_NAMED", // Maps to Foundation 5
  DS_FOUNDATION_ETHICS_ECONOMICS = "DS_13_VIOLATION_IS_DECISION" // Maps to Foundation 6
}

export type DataProvenance = "prod" | "test" | "demo";
export type Confidence = "low" | "medium" | "high";

export type EmotionalState = "S0" | "S1" | "S2" | "S3" | "SAFE_DISENGAGEMENT";

export type ExitType =
  | "EXIT_RECOVERY_CONFIRMED"
  | "EXIT_SAFE_DISENGAGEMENT"
  | "EXIT_UNSAFE_BLOCKED";

export type ConsideredAction =
  | "probe"
  | "challenge"
  | "ground"
  | "offer_resources"
  | "allow_exit"
  | "block_exit"
  | "resume_normal"
  | "clarify_intent";

export type PolicyOverride = {
  doctrineVersion: typeof DOCTRINE_VERSION;
  doctrineSections: DoctrineSection[];       // e.g. [DoctrineSection.DS_04_RECOVERY_AFFIRMATIVE, DoctrineSection.DS_05_EXIT_GOVERNED, DoctrineSection.DS_06_AUTONOMY_RESPECTED]
  overrideReason: string;           // short + specific
  overrideOwner: "founder";         // keep it simple
  overrideIssuedAt: string;         // ISO
  overrideExpiresAt: string;        // ISO - forced expiry
  riskAccepted: string;             // explicit
};

export type ExitDecision = {
  exitRequestedByUser: boolean;
  exitType: ExitType;
  blockersPresent: string[];        // e.g. ["active_distress_cues"]
  resourcesSuggested: string[];     // e.g. ["crisis_line","trusted_contact"]
  userNotConfirmedRecovered: boolean;
  systemRationale: string;
};

export type NonActionLog = {
  consideredAction: ConsideredAction;
  blockedByRule: string;            // e.g. "NO_PROBING_WHEN_SETTLED"
  blockedBecause: string;           // human-readable
};

export type SelfEvent = {
  doctrineVersion: typeof DOCTRINE_VERSION;

  // provenance integrity
  dataProvenance: DataProvenance;
  runId: string;                    // always set (even prod)

  // correlation
  sessionId: string;
  userId: string;

  // state inference
  isColdStart: boolean;
  coldStartTurnIndex: number;       // 0..N-1
  state: EmotionalState;
  confidence: Confidence;
  ambiguityFlags: string[];         // e.g. ["linguistic_calm_without_affect"]

  // recovery signals
  affirmativeStabilizationSignals: string[]; // e.g. ["somatic_grounding_confirmed"]

  // exit
  exit?: ExitDecision;

  // restraint
  nonActions?: NonActionLog[];

  // overrides
  override?: PolicyOverride;

  // timestamps
  timestamp: string;                // ISO
};
