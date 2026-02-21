/**
 * Red-Team Test Runner
 */
import { detectState } from '../index.js';
import { REDTEAM_TEST_CASES, getCriticalTestCases } from './test-cases.js';
const STATE_ORDER = ['S0', 'S0_GUARDED', 'S1', 'S2', 'S3'];
const getStateSeverity = (state) => {
    return STATE_ORDER.indexOf(state);
};
export function runTest(testCase) {
    const startTime = Date.now();
    const issues = [];
    const detection = detectState(testCase.input, []);
    const actualSeverity = getStateSeverity(detection.state);
    const expectedSeverity = getStateSeverity(testCase.expectedState);
    let passed = true;
    // Check for under-detection (detected state is less severe than expected)
    if (actualSeverity < expectedSeverity) {
        passed = false;
        issues.push({
            type: 'under_detection',
            severity: testCase.severity,
            description: `State under-detected: expected ${testCase.expectedState}, got ${detection.state}`,
            expected: testCase.expectedState,
            actual: detection.state
        });
    }
    // For false positive trap tests, check for over-detection
    if (testCase.category === 'false_positive_trap' && actualSeverity > expectedSeverity) {
        passed = false;
        issues.push({
            type: 'over_detection',
            severity: 'medium',
            description: `False positive: expected ${testCase.expectedState}, got ${detection.state}`,
            expected: testCase.expectedState,
            actual: detection.state
        });
    }
    return {
        testCaseId: testCase.id,
        passed,
        actualState: detection.state,
        expectedState: testCase.expectedState,
        actualScores: detection.scores,
        actualTriggers: detection.triggers || [],
        issues,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
    };
}
export function runAllTests(testCases = REDTEAM_TEST_CASES, config = {}) {
    return testCases.map(tc => runTest(tc));
}
export function runTestSuite(testCases = REDTEAM_TEST_CASES, config = {}) {
    const startTime = Date.now();
    const results = runAllTests(testCases, config);
    const passedTests = results.filter(r => r.passed).length;
    const criticalIssues = results
        .flatMap(r => r.issues)
        .filter(i => i.severity === 'critical' || i.type === 'under_detection');
    return {
        totalTests: results.length,
        passedTests,
        failedTests: results.length - passedTests,
        passRate: results.length > 0 ? (passedTests / results.length) * 100 : 0,
        executionTimeMs: Date.now() - startTime,
        categoryResults: {},
        criticalIssues,
        recommendations: [],
        timestamp: new Date().toISOString()
    };
}
export function runCriticalTests() {
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
export function generateMarkdownReport(summary) {
    return `# SELF Red-Team Test Report

**Generated:** ${summary.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passedTests} |
| Failed | ${summary.failedTests} |
| Pass Rate | ${summary.passRate.toFixed(1)}% |

## Critical Issues

${summary.criticalIssues.length === 0 ? 'No critical issues found.' : summary.criticalIssues.map((issue, i) => `${i + 1}. **${issue.type}**: ${issue.description}`).join('\n')}
`;
}
//# sourceMappingURL=runner.js.map