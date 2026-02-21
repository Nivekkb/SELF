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

export interface RedTeamTestCase {
  id: string;
  category: RedTeamCategory;
  severity: RedTeamSeverity;
  description: string;
  input: string;
  expectedState: EmotionalState;
  expectedTriggers: string[];
  expectedMinScore: number;
  tags: string[];
}

export interface RedTeamTestResult {
  testCaseId: string;
  passed: boolean;
  actualState: EmotionalState;
  expectedState: EmotionalState;
  actualScores: Record<string, number>;
  actualTriggers: string[];
  issues: RedTeamIssue[];
  processingTimeMs: number;
  timestamp: string;
}

export interface RedTeamIssue {
  type: 'under_detection' | 'over_detection' | 'wrong_state' | 'missing_trigger' | 'unexpected_trigger';
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
  minSeverity: 'low'
};

export interface RedTeamSuiteSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  executionTimeMs: number;
  categoryResults: Record<string, CategoryResult>;
  criticalIssues: RedTeamIssue[];
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