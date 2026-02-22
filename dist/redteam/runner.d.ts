/**
 * Red-Team Test Runner
 */
import type { RedTeamTestCase, RedTeamTestResult, RedTeamConfig, RedTeamSuiteSummary } from './types';
export declare function runTest(testCase: RedTeamTestCase, config?: Partial<RedTeamConfig>): RedTeamTestResult;
export declare function runAllTests(testCases?: RedTeamTestCase[], config?: Partial<RedTeamConfig>): RedTeamTestResult[];
export declare function runTestSuite(testCases?: RedTeamTestCase[], config?: Partial<RedTeamConfig>): RedTeamSuiteSummary;
export declare function runCriticalTests(): {
    passed: boolean;
    results: RedTeamTestResult[];
    summary: {
        passed: number;
        failed: number;
    };
};
export declare function runHighSeverityTests(): {
    passed: boolean;
    results: RedTeamTestResult[];
    summary: {
        passed: number;
        failed: number;
    };
};
export declare function generateMarkdownReport(summary: RedTeamSuiteSummary): string;
//# sourceMappingURL=runner.d.ts.map