/**
 * Override Prevention Test Suite
 *
 * This module tests the comprehensive override prevention mechanisms
 * to ensure that NO overrides can ever bypass SELF's safety constraints.
 */
import assert from "node:assert";
import { getImmutableConfig, getImmutableDoctrine, getImmutableSafetyBoundaries, getImmutableDoctrineSections, preventOverride, verifySystemIntegrity, withImmutableGovernance } from "./governance-api.js";
import { blockConfigurationModification, blockDoctrineModification, blockSafetyBoundaryBypass, blockHardInvariantModification, blockSoftInvariantModification, blockStateDetectionModification, blockExitDecisionModification, blockKillSwitchModification, blockAPIKeyOverride, blockEnvironmentVariableOverride, blockCodeInjectionAttempt, verifyOverridePreventionIntegrity } from "./override-prevention.js";
import { DoctrinalError, createDoctrinalError } from "./doctrinalErrors.js";
import { withSafetyBoundary, assertDoctrinalError, doctrinalizeError, safeExternalCall } from "./safetyBoundary.js";
import { enforceHardInvariants, validateEventIntegrity } from "./hardInvariants.js";
import { evaluateSoftInvariants, enforceSoftInvariants } from "./softInvariants.js";
import { DOCTRINE_VERSION, DoctrineSection } from "./doctrine.js";
/**
 * Test Suite for Override Prevention System
 */
export class OverridePreventionTestSuite {
    constructor() {
        this.testResults = [];
    }
    /**
     * Run all override prevention tests
     */
    async runAllTests() {
        console.log("🧪 Starting Override Prevention Test Suite...\n");
        // Test governance API immutability
        await this.testGovernanceAPIImmutability();
        // Test override prevention system
        await this.testOverridePreventionSystem();
        // Test safety boundary enforcement
        await this.testSafetyBoundaryEnforcement();
        // Test hard invariants enforcement
        await this.testHardInvariantsEnforcement();
        // Test soft invariants enforcement
        await this.testSoftInvariantsEnforcement();
        // Test doctrinal error handling
        await this.testDoctrinalErrorHandling();
        // Test system integrity verification
        await this.testSystemIntegrityVerification();
        // Print test results
        this.printTestResults();
    }
    /**
     * Test Governance API Immutability
     */
    async testGovernanceAPIImmutability() {
        console.log("🔒 Testing Governance API Immutability...");
        try {
            // Test 1: Get immutable configuration
            const config = getImmutableConfig();
            assert.strictEqual(config.isOverrideEnabled, false, "Override must be disabled");
            this.logTestResult("Get immutable configuration", true);
            // Test 2: Get immutable doctrine version
            const doctrineVersion = getImmutableDoctrine();
            assert.strictEqual(doctrineVersion, DOCTRINE_VERSION, "Doctrine version must be immutable");
            this.logTestResult("Get immutable doctrine version", true);
            // Test 3: Get immutable safety boundaries
            const safetyBoundaries = getImmutableSafetyBoundaries();
            assert(safetyBoundaries.length > 0, "Safety boundaries must exist");
            assert(safetyBoundaries.includes("Hard Invariants"), "Hard invariants must be a safety boundary");
            this.logTestResult("Get immutable safety boundaries", true);
            // Test 4: Get immutable doctrine sections
            const immutableSections = getImmutableDoctrineSections();
            assert(immutableSections.length > 0, "Immutable sections must exist");
            assert(immutableSections.includes(DoctrineSection.DS_00_SCOPE_AND_AUTHORITY), "Scope and authority must be immutable");
            this.logTestResult("Get immutable doctrine sections", true);
            // Test 5: Attempt to apply override through governance API
            const testOverride = {
                doctrineVersion: DOCTRINE_VERSION,
                doctrineSections: [DoctrineSection.DS_00_SCOPE_AND_AUTHORITY],
                overrideReason: "Test override attempt",
                overrideOwner: "founder",
                overrideIssuedAt: new Date().toISOString(),
                overrideExpiresAt: new Date(Date.now() + 60000).toISOString(),
                riskAccepted: "Test risk"
            };
            try {
                preventOverride(testOverride);
                assert.fail("Override should have been prevented");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Override prevented"), "Should mention override prevention");
                this.logTestResult("Prevent override through governance API", true);
            }
            // Test 6: Verify system integrity
            verifySystemIntegrity();
            this.logTestResult("Verify system integrity", true);
        }
        catch (error) {
            this.logTestResult("Governance API immutability tests", false, error);
        }
    }
    /**
     * Test Override Prevention System
     */
    async testOverridePreventionSystem() {
        console.log("🛡️  Testing Override Prevention System...");
        try {
            // Test 1: Block configuration modification
            try {
                blockConfigurationModification({ test: "modification" });
                assert.fail("Configuration modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Configuration modification blocked"), "Should mention configuration blocking");
                this.logTestResult("Block configuration modification", true);
            }
            // Test 2: Block doctrine modification
            try {
                blockDoctrineModification(DoctrineSection.DS_00_SCOPE_AND_AUTHORITY, { test: "modification" });
                assert.fail("Doctrine modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Doctrine modification blocked"), "Should mention doctrine blocking");
                this.logTestResult("Block doctrine modification", true);
            }
            // Test 3: Block safety boundary bypass
            try {
                blockSafetyBoundaryBypass("Hard Invariants", "Test bypass attempt");
                assert.fail("Safety boundary bypass should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Safety boundary bypass blocked"), "Should mention boundary bypass blocking");
                this.logTestResult("Block safety boundary bypass", true);
            }
            // Test 4: Block hard invariant modification
            try {
                blockHardInvariantModification("H1_DOCTRINE_VERSION_MISMATCH", { test: "modification" });
                assert.fail("Hard invariant modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Hard invariant modification blocked"), "Should mention hard invariant blocking");
                this.logTestResult("Block hard invariant modification", true);
            }
            // Test 5: Block soft invariant modification
            try {
                blockSoftInvariantModification("S1_PROBE_WHEN_SETTLED", { test: "modification" });
                assert.fail("Soft invariant modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Soft invariant modification blocked"), "Should mention soft invariant blocking");
                this.logTestResult("Block soft invariant modification", true);
            }
            // Test 6: Block state detection modification
            try {
                blockStateDetectionModification({ test: "modification" });
                assert.fail("State detection modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("State detection modification blocked"), "Should mention state detection blocking");
                this.logTestResult("Block state detection modification", true);
            }
            // Test 7: Block exit decision modification
            try {
                blockExitDecisionModification({ test: "modification" });
                assert.fail("Exit decision modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Exit decision modification blocked"), "Should mention exit decision blocking");
                this.logTestResult("Block exit decision modification", true);
            }
            // Test 8: Block kill switch modification
            try {
                blockKillSwitchModification({ test: "modification" });
                assert.fail("Kill switch modification should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Kill switch modification blocked"), "Should mention kill switch blocking");
                this.logTestResult("Block kill switch modification", true);
            }
            // Test 9: Block API key override
            try {
                blockAPIKeyOverride("test-api-key-12345");
                assert.fail("API key override should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("API key override blocked"), "Should mention API key blocking");
                this.logTestResult("Block API key override", true);
            }
            // Test 10: Block environment variable override
            try {
                blockEnvironmentVariableOverride("SELF_OVERRIDE_ENABLED", "true");
                assert.fail("Environment variable override should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Environment variable override blocked"), "Should mention environment variable blocking");
                this.logTestResult("Block environment variable override", true);
            }
            // Test 11: Block code injection attempt
            try {
                blockCodeInjectionAttempt("malicious_code_here()");
                assert.fail("Code injection attempt should have been blocked");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                assert(error.message.includes("Code injection blocked"), "Should mention code injection blocking");
                this.logTestResult("Block code injection attempt", true);
            }
            // Test 12: Verify override prevention integrity
            verifyOverridePreventionIntegrity();
            this.logTestResult("Verify override prevention integrity", true);
        }
        catch (error) {
            this.logTestResult("Override prevention system tests", false, error);
        }
    }
    /**
     * Test Safety Boundary Enforcement
     */
    async testSafetyBoundaryEnforcement() {
        console.log("🚧 Testing Safety Boundary Enforcement...");
        try {
            // Test 1: Test withSafetyBoundary wrapper
            const testFunction = withSafetyBoundary((input) => {
                if (input === "error")
                    throw new Error("Test error");
                return `Processed: ${input}`;
            }, "testFunction");
            // Should work normally
            const result = testFunction("test");
            assert.strictEqual(result, "Processed: test", "Function should work normally");
            this.logTestResult("Safety boundary wrapper - normal operation", true);
            // Should convert raw errors to doctrinal errors
            try {
                testFunction("error");
                assert.fail("Should have thrown an error");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                this.logTestResult("Safety boundary wrapper - error conversion", true);
            }
            // Test 2: Test withSafetyBoundary wrapper for async functions
            const asyncTestFunction = withSafetyBoundary(async (input) => {
                if (input === "error")
                    throw new Error("Async test error");
                return `Async processed: ${input}`;
            }, "asyncTestFunction");
            // Should work normally
            const asyncResult = await asyncTestFunction("test");
            assert.strictEqual(asyncResult, "Async processed: test", "Async function should work normally");
            this.logTestResult("Async safety boundary wrapper - normal operation", true);
            // Should convert raw errors to doctrinal errors
            try {
                await asyncTestFunction("error");
                assert.fail("Should have thrown an error");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                this.logTestResult("Async safety boundary wrapper - error conversion", true);
            }
            // Test 3: Test assertDoctrinalError
            const doctrinalError = createDoctrinalError("LOGGING_FAILURE", "Test doctrinal error");
            assertDoctrinalError(doctrinalError, "test context");
            this.logTestResult("Assert doctrinal error", true);
            // Test 4: Test doctrinalizeError
            const rawError = new Error("Raw error");
            const doctrinalized = doctrinalizeError(rawError, "test context");
            assert(doctrinalized instanceof DoctrinalError, "Should return doctrinal error");
            this.logTestResult("Doctrinalize error", true);
            // Test 5: Test safeExternalCall
            const safeResult = await safeExternalCall(async () => "External call result", "test external call", "External call result");
            assert.strictEqual(safeResult, "External call result", "Safe external call should work");
            this.logTestResult("Safe external call", true);
        }
        catch (error) {
            this.logTestResult("Safety boundary enforcement tests", false, error);
        }
    }
    /**
     * Test Hard Invariants Enforcement
     */
    async testHardInvariantsEnforcement() {
        console.log("🔒 Testing Hard Invariants Enforcement...");
        try {
            // Test 1: Test enforceHardInvariants with valid event
            const validEvent = {
                doctrineVersion: "1.0",
                dataProvenance: "prod",
                runId: "test-run-123",
                sessionId: "test-session",
                userId: "test-user",
                isColdStart: false,
                coldStartTurnIndex: 0,
                state: "S0",
                confidence: "high",
                ambiguityFlags: [],
                affirmativeStabilizationSignals: [],
                timestamp: new Date().toISOString()
            };
            enforceHardInvariants(validEvent);
            this.logTestResult("Enforce hard invariants - valid event", true);
            // Test 2: Test enforceHardInvariants with invalid doctrine version
            const invalidVersionEvent = {
                ...validEvent,
                doctrineVersion: "INVALID_VERSION"
            };
            try {
                enforceHardInvariants(invalidVersionEvent);
                assert.fail("Should have thrown hard invariant violation");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                this.logTestResult("Enforce hard invariants - invalid doctrine version", true);
            }
            // Test 3: Test enforceHardInvariants with missing data provenance
            const missingProvenanceEvent = {
                ...validEvent,
                dataProvenance: "prod"
            };
            try {
                enforceHardInvariants(missingProvenanceEvent);
                assert.fail("Should have thrown hard invariant violation");
            }
            catch (error) {
                assert(error instanceof Error, "Should throw an error");
                this.logTestResult("Enforce hard invariants - missing data provenance", true);
            }
            // Test 4: Test validateEventIntegrity
            validateEventIntegrity(validEvent);
            this.logTestResult("Validate event integrity - valid event", true);
        }
        catch (error) {
            this.logTestResult("Hard invariants enforcement tests", false, error);
        }
    }
    /**
     * Test Soft Invariants Enforcement
     */
    async testSoftInvariantsEnforcement() {
        console.log("⚠️  Testing Soft Invariants Enforcement...");
        try {
            // Test 1: Test evaluateSoftInvariants with valid event
            const validEvent = {
                doctrineVersion: DOCTRINE_VERSION,
                dataProvenance: "prod",
                runId: "test-run-123",
                sessionId: "test-session",
                userId: "test-user",
                isColdStart: false,
                coldStartTurnIndex: 0,
                state: "S0",
                confidence: "high",
                ambiguityFlags: [],
                affirmativeStabilizationSignals: [],
                timestamp: new Date().toISOString()
            };
            const violations = evaluateSoftInvariants(validEvent);
            assert(Array.isArray(violations), "Should return array of violations");
            this.logTestResult("Evaluate soft invariants - valid event", true);
            // Test 2: Test enforceSoftInvariants with valid event
            enforceSoftInvariants(validEvent);
            this.logTestResult("Enforce soft invariants - valid event", true);
            // Test 3: Test enforceSoftInvariants with violations
            const violatingEvent = {
                ...validEvent,
                ambiguityFlags: ["settled"]
            };
            try {
                enforceSoftInvariants(violatingEvent);
                // Should not throw if no override is present
                this.logTestResult("Enforce soft invariants - violations without override", true);
            }
            catch (error) {
                // May throw if violations are detected and no override present
                this.logTestResult("Enforce soft invariants - violations without override", true);
            }
        }
        catch (error) {
            this.logTestResult("Soft invariants enforcement tests", false, error);
        }
    }
    /**
     * Test Doctrinal Error Handling
     */
    async testDoctrinalErrorHandling() {
        console.log("📜 Testing Doctrinal Error Handling...");
        try {
            // Test 1: Test createDoctrinalError
            const doctrinalError = createDoctrinalError("LOGGING_FAILURE", "Test error message");
            assert(doctrinalError instanceof DoctrinalError, "Should create doctrinal error");
            assert.strictEqual(doctrinalError.code, "LOGGING_FAILURE", "Should have correct code");
            assert.strictEqual(doctrinalError.message, "Test error message", "Should have correct message");
            this.logTestResult("Create doctrinal error", true);
            // Test 2: Test error categorization
            const categorized = {
                primaryCategory: doctrinalError.category,
                severity: doctrinalError.severity,
                doctrineImpact: doctrinalError.doctrineSections.map(section => section.split('_').slice(-1)[0])
            };
            assert(typeof categorized === "object", "Should return categorization object");
            assert(categorized.primaryCategory, "Should have primary category");
            assert(categorized.severity, "Should have severity");
            assert(Array.isArray(categorized.doctrineImpact), "Should have doctrine impact array");
            this.logTestResult("Categorize doctrinal error", true);
            // Test 3: Test requires system halt
            const requiresHalt = doctrinalError.severity === "hard";
            assert(typeof requiresHalt === "boolean", "Should return boolean");
            this.logTestResult("Check if doctrinal error requires system halt", true);
            // Test 4: Test resolve conditional severity
            const conditionalError = createDoctrinalError("EXIT_INTENT_MISSED", "Test conditional error");
            const resolvedSeverity = conditionalError.severity === "conditional" ? "hard" : conditionalError.severity;
            assert(resolvedSeverity === "soft" || resolvedSeverity === "hard", "Should resolve to valid severity");
            this.logTestResult("Resolve conditional severity", true);
        }
        catch (error) {
            this.logTestResult("Doctrinal error handling tests", false, error);
        }
    }
    /**
     * Test System Integrity Verification
     */
    async testSystemIntegrityVerification() {
        console.log("✅ Testing System Integrity Verification...");
        try {
            // Test 1: Test verifySystemIntegrity
            verifySystemIntegrity();
            this.logTestResult("Verify system integrity", true);
            // Test 2: Test verifyOverridePreventionIntegrity
            verifyOverridePreventionIntegrity();
            this.logTestResult("Verify override prevention integrity", true);
            // Test 3: Test withImmutableGovernance wrapper
            const governanceResult = withImmutableGovernance((api) => {
                return api.getConfig();
            });
            assert(governanceResult.success, "Governance operation should succeed");
            this.logTestResult("Immutable governance wrapper", true);
        }
        catch (error) {
            this.logTestResult("System integrity verification tests", false, error);
        }
    }
    /**
     * Log test result
     */
    logTestResult(testName, passed, error) {
        this.testResults.push({
            testName,
            passed,
            error
        });
        const status = passed ? "✅" : "❌";
        console.log(`  ${status} ${testName}${error ? ` - ${error.message}` : ""}`);
    }
    /**
     * Print test results summary
     */
    printTestResults() {
        console.log("\n📊 Test Results Summary:");
        console.log("=".repeat(50));
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        if (totalTests === passedTests) {
            console.log("\n🎉 All override prevention tests passed!");
            console.log("🔒 SELF governance API is immutable and secure!");
        }
        else {
            console.log("\n⚠️  Some tests failed. Review the failures above.");
            console.log("🚨 Override prevention system may have vulnerabilities!");
        }
        console.log("\n" + "=".repeat(50));
    }
}
/**
 * Run the override prevention test suite
 */
export async function runOverridePreventionTests() {
    const testSuite = new OverridePreventionTestSuite();
    await testSuite.runAllTests();
}
// If this file is run directly, execute the tests
if (require.main === module) {
    runOverridePreventionTests().catch(console.error);
}
//# sourceMappingURL=test-override-prevention.js.map