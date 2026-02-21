/**
 * Red-Team Test Cases
 */
import type { RedTeamTestCase, RedTeamCategory } from './types';
export declare const REDTEAM_TEST_CASES: RedTeamTestCase[];
export declare function getTestCasesByCategory(category: RedTeamCategory): RedTeamTestCase[];
export declare function getCriticalTestCases(): RedTeamTestCase[];
export declare function getTestCaseById(id: string): RedTeamTestCase | undefined;
//# sourceMappingURL=test-cases.d.ts.map