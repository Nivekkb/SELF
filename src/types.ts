export type SelfHistoryMessage = { role: string; content: string };

export interface StateDetectionResult {
  state: any;
  scores: Record<string, number>;
  reasons: string[];
  confidence?: "high" | "medium" | "low";
}

export interface AbusePreventionContext {
  userId: string;
  sessionId: string;
  conversationStartTime: Date;
  previousState?: any;
  stateChangeHistory: Array<{
    fromState: any;
    toState: any;
    timestamp: Date;
    reason: string;
  }>;
  abuseWarnings: number;
  lastStateChangeTime?: Date;
  coldStartTurns?: number;
  isColdStart?: boolean;
}

// Additional types for the API
export interface OverridePreventionConfig {
  readonly enabled: false;
  readonly monitoringActive: boolean;
  readonly lastIntegrityCheck: string;
  readonly blockedAttempts: number;
}

export interface OverrideDetectionResult {
  readonly detected: boolean;
  readonly confidence: number;
  readonly techniques: string[];
  readonly timestamp: string;
}

export type OverrideType = "configuration" | "doctrine" | "safety_boundary" | "kill_switch" | "api_key" | "environment" | "code_injection";

export interface KillSwitchConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
  readonly conditions: string[];
  readonly actions: string[];
}

export interface KillSwitchState {
  readonly switchId: string;
  readonly active: boolean;
  readonly triggeredAt?: string;
  readonly triggerReason?: string;
  readonly actionsTaken: string[];
}

export interface KillSwitchContext {
  readonly activeSwitches: KillSwitchConfig[];
  readonly triggeredSwitches: KillSwitchState[];
  readonly lastCheckTime: string;
  readonly totalTriggers: number;
}

export interface SoftViolation {
  readonly rule: string;
  readonly severity: "low" | "medium" | "high";
  readonly description: string;
  readonly context: Record<string, any>;
  readonly timestamp: string;
}

export interface SelfEvent {
  doctrineVersion: "1.0";
  dataProvenance: "prod" | "test" | "demo";
  runId: string;
  sessionId: string;
  userId: string;
  isColdStart: boolean;
  coldStartTurnIndex: number;
  state: "S0" | "S1" | "S2" | "S3" | "SAFE_DISENGAGEMENT";
  confidence: "low" | "medium" | "high";
  ambiguityFlags: string[];
  affirmativeStabilizationSignals: string[];
  timestamp: string;
}

export interface PolicyProfile {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rules: Record<string, any>;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PolicyProfileConfig {
  readonly maxProfiles: number;
  readonly allowDynamicProfiles: boolean;
  readonly defaultProfile: string;
  readonly profileValidationRules: string[];
}
