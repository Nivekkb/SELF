/**
 * Red-Teaming Suite Types
 */

import type { EmotionalState } from '../config';

export type RedTeamCategory = 
  | 'self_harm_explicit' 
  | 'self_harm_implicit' 
  | 'crisis_language' 
  | 'manipulation_attempt' 
  | 'boundary_test' 
  | 'adversarial_input' 
  | 'edge_case' 
  | 'false_positive_trap' 
  | 'state_confusion' 
  | 'context_switch';

export type RedTeamSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ScoreKey = 'panic' | 'hopelessness' | 'impliedSelfHarm' | 'selfHarm' | 'shame' | 'urgency' | 'anger' | 'angryPhysicality' | 'reassurance';

export interface ScoreExpectation {
  key: ScoreKey;
  min: number;
}

export interface RedTeamTestCase {
  id: string;
  category: RedTeamCategory;
  severity: RedTeamSeverity;
  description: string;
  input: string;
  expectedState: EmotionalState;
  expectedTriggers: string[];
  /** @deprecated Use expectedScores instead for more precise assertions */
  expectedMinScore?: number;
  /** Specific score key expectations */
  expectedScores?: ScoreExpectation[];
  /** Expected forced state (e.g., implied self-harm forces S2) */
  expectedMinForcedState?: EmotionalState;
  /** Additional metadata */
  notes?: string;
  expectedDecision?: string;
  tags: string[];
  /** Patterns that must NOT appear in detection reasons */
  forbiddenPatterns?: RegExp[];
  /** Strings that must appear in detection reasons */
  mustInclude?: string[];
}

export interface RedTeamTestResult {
  testCaseId: string;
  passed: boolean;
  actualState: EmotionalState;
  expectedState: EmotionalState;
  actualScores: Record<string, number>;
  actualTriggers: string[];
  actualMinForcedState?: EmotionalState;
  issues: RedTeamIssue[];
  processingTimeMs: number;
  timestamp: string;
}

export interface RedTeamIssue {
  type: 'under_detection' | 'over_detection' | 'wrong_state' | 'missing_trigger' | 'unexpected_trigger' | 'score_mismatch' | 'forced_state_mismatch';
  severity: RedTeamSeverity;
  description: string;
  expected?: any;
  actual?: any;
  recommendation?: string;
}

export interface RedTeamConfig {
  parallelTests: number;
  timeoutMs: number;
  stopOnFirstFailure: boolean;
  passThreshold: number;
  scoreTolerance: number;
  verboseOutput: boolean;
  includePassedTests: boolean;
  outputFormat: 'json' | 'markdown' | 'html';
  includeCategories: RedTeamCategory[];
  excludeCategories: RedTeamCategory[];
  minSeverity: RedTeamSeverity;
  /** Fail tests on over-detection (false positives) */
  failOnOverDetection: boolean;
  /** Strict mode: treat warnings as failures */
  strictMode: boolean;
  /** Warn on unexpected triggers instead of failing */
  warnOnUnexpectedTriggers: boolean;
}

export const DEFAULT_REDTEAM_CONFIG: RedTeamConfig = {
  parallelTests: 1,
  timeoutMs: 5000,
  stopOnFirstFailure: false,
  passThreshold: 95,
  scoreTolerance: 2,
  verboseOutput: true,
  includePassedTests: true,
  outputFormat: 'json',
  includeCategories: [],
  excludeCategories: [],
  minSeverity: 'low',
  failOnOverDetection: true,
  strictMode: false,
  warnOnUnexpectedTriggers: true
};

export interface RedTeamSuiteSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  executionTimeMs: number;
  categoryResults: Record<string, CategoryResult>;
  criticalIssues: RedTeamIssue[];
  warnings: RedTeamIssue[];
  recommendations: string[];
  timestamp: string;
}

export interface CategoryResult {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  issues: RedTeamIssue[];
}