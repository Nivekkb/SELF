/**
 * Red-Team Test Runner
 */

import { detectState } from '../index';
import type { EmotionalState } from '../config';
import type { 
  RedTeamTestCase, 
  RedTeamTestResult, 
  RedTeamIssue, 
  RedTeamConfig, 
  RedTeamSuiteSummary, 
  CategoryResult,
  ScoreExpectation 
} from './types';
import { REDTEAM_TEST_CASES, getCriticalTestCases, getHighSeverityTestCases } from './test-cases';
import { DEFAULT_REDTEAM_CONFIG } from './types';

const STATE_ORDER: EmotionalState[] = ['S0', 'S0_GUARDED', 'S1', 'S2', 'S3'];

const getStateSeverity = (state: EmotionalState): number => {
  return STATE_ORDER.indexOf(state);
};

/**
 * Normalize trigger names for comparison
 */
const normalizeTriggerName = (trigger: string): string => {
  const normalized = trigger.toUpperCase().replace(/\s+/g, '_');
  // Handle common variations
  if (normalized === 'SELFHARM') return 'SELF_HARM';
  if (normalized === 'IMPLIED_SELFHARM') return 'IMPLIED_SELF_HARM';
  if (normalized === 'HARM_OTHERS' || normalized === 'HARMOTHERS') return 'HARM_OTHERS';
  if (normalized === 'ANGRY_PHYSICALITY' || normalized === 'ANGRYPHYSICALITY') return 'ANGRY_PHYSICALITY';
  return normalized;
};

/**
 * Check if expected triggers are present in actual triggers
 */
const checkTriggers = (
  expectedTriggers: string[],
  actualTriggers: string[],
  config: RedTeamConfig
): { missing: string[]; unexpected: string[] } => {
  const normalizedActual = new Set(actualTriggers.map(normalizeTriggerName));
  const missing: string[] = [];
  const unexpected: string[] = [];

  for (const expected of expectedTriggers) {
    const normalizedExpected = normalizeTriggerName(expected);
    if (!normalizedActual.has(normalizedExpected)) {
      missing.push(expected);
    }
  }

  // Only report unexpected if strictMode or failOnOverDetection
  if (config.failOnOverDetection || config.strictMode) {
    for (const actual of actualTriggers) {
      const normalizedActual = normalizeTriggerName(actual);
      const isExpected = expectedTriggers.some(e => normalizeTriggerName(e) === normalizedActual);
      if (!isExpected && normalizedActual !== 'INPUT_NORMALIZED') {
        unexpected.push(actual);
      }
    }
  }

  return { missing, unexpected };
};

/**
 * Check score expectations against actual scores
 */
const checkScores = (
  expectedScores: ScoreExpectation[] | undefined,
  actualScores: Record<string, number>,
  tolerance: number
): { passed: boolean; failures: Array<{ key: string; expected: number; actual: number }> } => {
  if (!expectedScores || expectedScores.length === 0) {
    return { passed: true, failures: [] };
  }

  const failures: Array<{ key: string; expected: number; actual: number }> = [];
  
  for (const expectation of expectedScores) {
    const actualValue = actualScores[expectation.key] || 0;
    if (actualValue < expectation.min - tolerance) {
      failures.push({
        key: expectation.key,
        expected: expectation.min,
        actual: actualValue
      });
    }
  }

  return { passed: failures.length === 0, failures };
};

export function runTest(
  testCase: RedTeamTestCase, 
  config: Partial<RedTeamConfig> = {}
): RedTeamTestResult {
  const fullConfig = { ...DEFAULT_REDTEAM_CONFIG, ...config };
  const startTime = Date.now();
  const issues: RedTeamIssue[] = [];
  
  const detection = detectState(testCase.input, []);
  const actualSeverity = getStateSeverity(detection.state);
  const expectedSeverity = getStateSeverity(testCase.expectedState);
  
  let passed = true;

  // ============================================
  // 1. STATE ASSERTION
  // ============================================
  if (actualSeverity < expectedSeverity) {
    passed = false;
    issues.push({
      type: 'under_detection',
      severity: testCase.severity,
      description: `State under-detected: expected ${testCase.expectedState}, got ${detection.state}`,
      expected: testCase.expectedState,
      actual: detection.state,
      recommendation: `Review lexicon patterns for ${testCase.category} category`
    });
  } else if (actualSeverity > expectedSeverity && fullConfig.failOnOverDetection) {
    passed = false;
    issues.push({
      type: 'over_detection',
      severity: 'medium',
      description: `State over-detected: expected ${testCase.expectedState}, got ${detection.state}`,
      expected: testCase.expectedState,
      actual: detection.state,
      recommendation: `Check for false positive patterns in ${testCase.category} test case`
    });
  }

  // ============================================
  // 2. TRIGGER ASSERTIONS
  // ============================================
  const { missing: missingTriggers, unexpected: unexpectedTriggers } = checkTriggers(
    testCase.expectedTriggers,
    detection.triggers || [],
    fullConfig
  );

  if (missingTriggers.length > 0) {
    const issueSeverity = fullConfig.strictMode ? testCase.severity : 'medium';
    if (fullConfig.strictMode) passed = false;
    issues.push({
      type: 'missing_trigger',
      severity: issueSeverity,
      description: `Missing expected triggers: ${missingTriggers.join(', ')}`,
      expected: testCase.expectedTriggers,
      actual: detection.triggers || [],
      recommendation: `Verify lexicon patterns for triggers: ${missingTriggers.join(', ')}`
    });
  }

  if (unexpectedTriggers.length > 0 && fullConfig.strictMode) {
    passed = false;
    issues.push({
      type: 'unexpected_trigger',
      severity: 'low',
      description: `Unexpected triggers detected: ${unexpectedTriggers.join(', ')}`,
      expected: testCase.expectedTriggers,
      actual: detection.triggers || []
    });
  }

  // ============================================
  // 3. SCORE ASSERTIONS
  // ============================================
  const scoreCheck = checkScores(
    testCase.expectedScores,
    detection.scores,
    fullConfig.scoreTolerance
  );

  if (!scoreCheck.passed) {
    const issueSeverity = fullConfig.strictMode ? testCase.severity : 'medium';
    if (fullConfig.strictMode) passed = false;
    
    for (const failure of scoreCheck.failures) {
      issues.push({
        type: 'score_mismatch',
        severity: issueSeverity,
        description: `Score "${failure.key}" below threshold: expected >= ${failure.expected}, got ${failure.actual}`,
        expected: failure.expected,
        actual: failure.actual,
        recommendation: `Review scoring weights for "${failure.key}" category`
      });
    }
  }

  // ============================================
  // 4. FORCED STATE ASSERTIONS
  // ============================================
  if (testCase.expectedMinForcedState !== undefined) {
    const actualForcedState = detection.minForcedState;
    if (actualForcedState !== testCase.expectedMinForcedState) {
      const issueSeverity = fullConfig.strictMode ? 'high' : 'medium';
      if (fullConfig.strictMode) passed = false;
      issues.push({
        type: 'forced_state_mismatch',
        severity: issueSeverity,
        description: `Forced state mismatch: expected ${testCase.expectedMinForcedState}, got ${actualForcedState || 'none'}`,
        expected: testCase.expectedMinForcedState,
        actual: actualForcedState,
        recommendation: `Verify forced state logic for ${testCase.category} category`
      });
    }
  }

  // ============================================
  // 5. MUST INCLUDE ASSERTIONS
  // ============================================
  if (testCase.mustInclude && testCase.mustInclude.length > 0) {
    const reasons = detection.reasons.join(' ').toLowerCase();
    for (const required of testCase.mustInclude) {
      if (!reasons.includes(required.toLowerCase())) {
        issues.push({
          type: 'under_detection',
          severity: 'low',
          description: `Required phrase not found in detection reasons: "${required}"`,
          expected: required,
          actual: detection.reasons
        });
      }
    }
  }

  // ============================================
  // 6. FORBIDDEN PATTERNS ASSERTIONS
  // ============================================
  if (testCase.forbiddenPatterns && testCase.forbiddenPatterns.length > 0) {
    const reasons = detection.reasons.join(' ');
    for (const pattern of testCase.forbiddenPatterns) {
      if (pattern.test(reasons)) {
        issues.push({
          type: 'over_detection',
          severity: 'medium',
          description: `Forbidden pattern found in detection reasons: ${pattern.source}`,
          expected: 'No match',
          actual: reasons
        });
      }
    }
  }

  return {
    testCaseId: testCase.id,
    passed,
    actualState: detection.state,
    expectedState: testCase.expectedState,
    actualScores: detection.scores,
    actualTriggers: detection.triggers || [],
    actualMinForcedState: detection.minForcedState,
    issues,
    processingTimeMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
}

export function runAllTests(
  testCases: RedTeamTestCase[] = REDTEAM_TEST_CASES,
  config: Partial<RedTeamConfig> = {}
): RedTeamTestResult[] {
  const fullConfig = { ...DEFAULT_REDTEAM_CONFIG, ...config };
  
  const results: RedTeamTestResult[] = [];
  for (const tc of testCases) {
    const result = runTest(tc, fullConfig);
    results.push(result);
    
    if (fullConfig.stopOnFirstFailure && !result.passed) {
      break;
    }
  }
  
  return results;
}

/**
 * Compute category rollup results
 */
const computeCategoryResults = (
  results: RedTeamTestResult[],
  testCases: RedTeamTestCase[]
): Record<string, CategoryResult> => {
  const categoryMap = new Map<string, { total: number; passed: number; failed: number; issues: RedTeamIssue[] }>();
  
  // Initialize categories
  for (const tc of testCases) {
    if (!categoryMap.has(tc.category)) {
      categoryMap.set(tc.category, { total: 0, passed: 0, failed: 0, issues: [] });
    }
  }
  
  // Aggregate results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const tc = testCases[i];
    const category = categoryMap.get(tc.category);
    
    if (category) {
      category.total++;
      if (result.passed) {
        category.passed++;
      } else {
        category.failed++;
      }
      category.issues.push(...result.issues);
    }
  }
  
  // Convert to CategoryResult
  const categoryResults: Record<string, CategoryResult> = {};
  for (const [category, data] of categoryMap) {
    categoryResults[category] = {
      total: data.total,
      passed: data.passed,
      failed: data.failed,
      passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0,
      issues: data.issues
    };
  }
  
  return categoryResults;
};

/**
 * Filter critical issues based on test severity
 */
const filterCriticalIssues = (
  results: RedTeamTestResult[],
  testCases: RedTeamTestCase[]
): RedTeamIssue[] => {
  const criticalIssues: RedTeamIssue[] = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const tc = testCases[i];
    
    // Only treat under-detection as critical if test severity is high/critical
    for (const issue of result.issues) {
      if (issue.type === 'under_detection' && (tc.severity === 'high' || tc.severity === 'critical')) {
        criticalIssues.push(issue);
      } else if (issue.type === 'forced_state_mismatch') {
        criticalIssues.push(issue);
      } else if (issue.severity === 'critical') {
        criticalIssues.push(issue);
      }
    }
  }
  
  return criticalIssues;
};

/**
 * Extract warnings (non-critical issues)
 */
const extractWarnings = (results: RedTeamTestResult[]): RedTeamIssue[] => {
  const warnings: RedTeamIssue[] = [];
  
  for (const result of results) {
    for (const issue of result.issues) {
      if (issue.severity === 'low' || issue.severity === 'medium') {
        if (issue.type !== 'under_detection') {
          warnings.push(issue);
        }
      }
    }
  }
  
  return warnings;
};

export function runTestSuite(
  testCases: RedTeamTestCase[] = REDTEAM_TEST_CASES,
  config: Partial<RedTeamConfig> = {}
): RedTeamSuiteSummary {
  const fullConfig = { ...DEFAULT_REDTEAM_CONFIG, ...config };
  const startTime = Date.now();
  const results = runAllTests(testCases, fullConfig);
  const passedTests = results.filter(r => r.passed).length;
  
  const categoryResults = computeCategoryResults(results, testCases);
  const criticalIssues = filterCriticalIssues(results, testCases);
  const warnings = extractWarnings(results);
  
  // Generate recommendations
  const recommendations: string[] = [];
  const categoriesWithFailures = Object.entries(categoryResults)
    .filter(([, cr]) => cr.failed > 0)
    .map(([cat]) => cat);
  
  if (categoriesWithFailures.length > 0) {
    recommendations.push(`Review failing categories: ${categoriesWithFailures.join(', ')}`);
  }
  
  if (criticalIssues.length > 0) {
    recommendations.push(`Address ${criticalIssues.length} critical issue(s) before deployment`);
  }

  return {
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    passRate: results.length > 0 ? (passedTests / results.length) * 100 : 0,
    executionTimeMs: Date.now() - startTime,
    categoryResults,
    criticalIssues,
    warnings,
    recommendations,
    timestamp: new Date().toISOString()
  };
}

export function runCriticalTests(): { passed: boolean; results: RedTeamTestResult[]; summary: { passed: number; failed: number } } {
  const results = getCriticalTestCases().map(tc => runTest(tc));
  const passed = results.filter(r => r.passed).length;
  
  return {
    passed: passed === results.length,
    results,
    summary: {
      passed,
      failed: results.length - passed
    }
  };
}

export function runHighSeverityTests(): { passed: boolean; results: RedTeamTestResult[]; summary: { passed: number; failed: number } } {
  const results = getHighSeverityTestCases().map(tc => runTest(tc));
  const passed = results.filter(r => r.passed).length;
  
  return {
    passed: passed === results.length,
    results,
    summary: {
      passed,
      failed: results.length - passed
    }
  };
}

export function generateMarkdownReport(summary: RedTeamSuiteSummary): string {
  let report = `# SELF Red-Team Test Report

**Generated:** ${summary.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passedTests} |
| Failed | ${summary.failedTests} |
| Pass Rate | ${summary.passRate.toFixed(1)}% |
| Execution Time | ${summary.executionTimeMs}ms |

`;

  // Category Results
  if (Object.keys(summary.categoryResults).length > 0) {
    report += `## Results by Category

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
`;
    for (const [category, cr] of Object.entries(summary.categoryResults)) {
      report += `| ${category} | ${cr.total} | ${cr.passed} | ${cr.failed} | ${cr.passRate.toFixed(1)}% |\n`;
    }
    report += '\n';
  }

  // Critical Issues
  report += `## Critical Issues\n\n`;
  if (summary.criticalIssues.length === 0) {
    report += '✅ No critical issues found.\n\n';
  } else {
    for (let i = 0; i < summary.criticalIssues.length; i++) {
      const issue = summary.criticalIssues[i];
      report += `${i + 1}. **${issue.type}**: ${issue.description}\n`;
      if (issue.recommendation) {
        report += `   - Recommendation: ${issue.recommendation}\n`;
      }
    }
    report += '\n';
  }

  // Warnings
  if (summary.warnings.length > 0) {
    report += `## Warnings (${summary.warnings.length})\n\n`;
    for (const warning of summary.warnings.slice(0, 10)) {
      report += `- **${warning.type}**: ${warning.description}\n`;
    }
    if (summary.warnings.length > 10) {
      report += `- ... and ${summary.warnings.length - 10} more warnings\n`;
    }
    report += '\n';
  }

  // Recommendations
  if (summary.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    for (const rec of summary.recommendations) {
      report += `- ${rec}\n`;
    }
  }

  return report;
}