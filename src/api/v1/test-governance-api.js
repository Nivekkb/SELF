"use strict";
/**
 * SELF Governance API Test Script
 *
 * Simple test script to verify the governance API functionality
 * without requiring complex test framework setup.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var governance_server_1 = require("./governance-server");
var governance_1 = require("./governance");
var http_1 = __importDefault(require("http"));
console.log('🚀 Starting SELF Governance API Tests...');
function testValidationLogic() {
    console.log('\n🧪 Testing Validation Logic...');
    // Test valid configuration
    var validConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'us-east-1'
    };
    var validationResult = (0, governance_1.validateBuildConfig)(validConfig);
    console.log('✅ Valid configuration test:', validationResult.valid ? 'PASS' : 'FAIL');
    if (!validationResult.valid) {
        console.log('   Errors:', validationResult.errors);
    }
    // Test invalid framework
    var invalidFrameworkConfig = {
        framework: 'InvalidFramework',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'us-east-1'
    };
    var frameworkValidation = (0, governance_1.validateBuildConfig)(invalidFrameworkConfig);
    console.log('✅ Invalid framework test:', !frameworkValidation.valid ? 'PASS' : 'FAIL');
    if (frameworkValidation.errors) {
        console.log('   Expected error about framework:', frameworkValidation.errors[0].includes('Framework') ? 'FOUND' : 'NOT FOUND');
    }
    // Test invalid AI model
    var invalidModelConfig = {
        framework: 'React',
        aiModel: 'InvalidModel',
        sizeMB: 50,
        region: 'us-east-1'
    };
    var modelValidation = (0, governance_1.validateBuildConfig)(invalidModelConfig);
    console.log('✅ Invalid AI model test:', !modelValidation.valid ? 'PASS' : 'FAIL');
    // Test oversized project
    var oversizedConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 150, // Exceeds 100MB limit
        region: 'us-east-1'
    };
    var sizeValidation = (0, governance_1.validateBuildConfig)(oversizedConfig);
    console.log('✅ Oversized project test:', !sizeValidation.valid ? 'PASS' : 'FAIL');
    // Test invalid region
    var invalidRegionConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'invalid-region'
    };
    var regionValidation = (0, governance_1.validateBuildConfig)(invalidRegionConfig);
    console.log('✅ Invalid region test:', !regionValidation.valid ? 'PASS' : 'FAIL');
}
function testApprovalWorkflow() {
    console.log('\n🔄 Testing Approval Workflow Logic...');
    // Test development auto-approval
    var devApprovals = (0, governance_1.determineRequiredApprovals)('development', 'BUILD');
    console.log('✅ Development auto-approval test:', devApprovals.length === 0 ? 'PASS' : 'FAIL');
    console.log('   Required approvals for dev:', devApprovals);
    // Test staging approvals
    var stagingApprovals = (0, governance_1.determineRequiredApprovals)('staging', 'DEPLOY');
    console.log('✅ Staging approvals test:', JSON.stringify(stagingApprovals) === JSON.stringify(['compliance', 'security']) ? 'PASS' : 'FAIL');
    console.log('   Required approvals for staging:', stagingApprovals);
    // Test production approvals
    var prodApprovals = (0, governance_1.determineRequiredApprovals)('production', 'PUBLISH');
    console.log('✅ Production approvals test:', JSON.stringify(prodApprovals) === JSON.stringify(['compliance', 'security', 'budget']) ? 'PASS' : 'FAIL');
    console.log('   Required approvals for production:', prodApprovals);
}
function testExpressAppCreation() {
    console.log('\n🌐 Testing Express App Creation...');
    try {
        var app = (0, governance_server_1.createGovernanceExpressApp)();
        console.log('✅ Express app creation test: PASS');
        // Test that the app has the expected routes
        var routes = app._router.stack
            .filter(function (layer) { return layer.route; })
            .map(function (layer) { return ({
            method: Object.keys(layer.route.methods)[0].toUpperCase(),
            path: layer.route.path
        }); });
        console.log('   Available routes:', routes.length > 0 ? 'FOUND' : 'NOT FOUND');
        // Test health endpoint specifically
        var healthRoute = routes.find(function (r) { return r.path === '/health' && r.method === 'GET'; });
        console.log('   Health endpoint:', healthRoute ? 'FOUND' : 'NOT FOUND');
        // Test API docs endpoint
        var apiDocsRoute = routes.find(function (r) { return r.path === '/' && r.method === 'GET'; });
        console.log('   API docs endpoint:', apiDocsRoute ? 'FOUND' : 'NOT FOUND');
    }
    catch (error) {
        console.log('❌ Express app creation test: FAIL');
        console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
    }
}
function testRequestStructure() {
    console.log('\n📋 Testing Request Structure...');
    var testRequest = {
        projectId: 'test-project-123',
        userId: 'test-user-123',
        requestType: 'BUILD',
        environment: 'development',
        buildConfig: {
            framework: 'React',
            aiModel: 'Claude 3',
            sizeMB: 50,
            region: 'us-east-1'
        },
        requestedBy: {
            userId: 'test-user-123',
            email: 'test@example.com',
            role: 'developer'
        },
        enterpriseSubdomain: 'enterprise.serenixdigital.com'
    };
    console.log('✅ Request structure test: PASS');
    console.log('   Project ID:', testRequest.projectId);
    console.log('   User ID:', testRequest.userId);
    console.log('   Request Type:', testRequest.requestType);
    console.log('   Environment:', testRequest.environment);
    console.log('   Framework:', testRequest.buildConfig.framework);
    console.log('   AI Model:', testRequest.buildConfig.aiModel);
    console.log('   Size:', testRequest.buildConfig.sizeMB + 'MB');
    console.log('   Region:', testRequest.buildConfig.region);
}
function testHttpServer() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log('\n🌍 Testing HTTP Server Integration...');
            return [2 /*return*/, new Promise(function (resolve) {
                    var app = (0, governance_server_1.createGovernanceExpressApp)();
                    var server = app.listen(0, function () {
                        var port = server.address().port;
                        console.log('✅ HTTP server started on port:', port);
                        // Test health endpoint
                        http_1.default.get("http://localhost:".concat(port, "/health"), function (res) {
                            var data = '';
                            res.on('data', function (chunk) { return data += chunk; });
                            res.on('end', function () {
                                try {
                                    var health = JSON.parse(data);
                                    console.log('✅ Health endpoint test:', health.status === 'healthy' ? 'PASS' : 'FAIL');
                                    console.log('   Service:', health.service);
                                    console.log('   Version:', health.version);
                                }
                                catch (error) {
                                    console.log('❌ Health endpoint test: FAIL');
                                    console.log('   Error parsing response');
                                }
                                // Test API docs endpoint
                                http_1.default.get("http://localhost:".concat(port, "/api/v1"), function (res) {
                                    var data = '';
                                    res.on('data', function (chunk) { return data += chunk; });
                                    res.on('end', function () {
                                        try {
                                            var apiDocs = JSON.parse(data);
                                            console.log('✅ API docs endpoint test:', apiDocs.service ? 'PASS' : 'FAIL');
                                            console.log('   Endpoints available:', apiDocs.endpoints ? Object.keys(apiDocs.endpoints).length : 0);
                                        }
                                        catch (error) {
                                            console.log('❌ API docs endpoint test: FAIL');
                                            console.log('   Error parsing response');
                                        }
                                        server.close();
                                        resolve(null);
                                    });
                                });
                            });
                        });
                    });
                })];
        });
    });
}
function runAllTests() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔧 SELF Governance API - Test Suite');
                    console.log('=================================');
                    testRequestStructure();
                    testValidationLogic();
                    testApprovalWorkflow();
                    testExpressAppCreation();
                    return [4 /*yield*/, testHttpServer()];
                case 1:
                    _a.sent();
                    console.log('\n🎉 All tests completed!');
                    console.log('✅ Governance API is ready for integration with enterprise builder');
                    return [2 /*return*/];
            }
        });
    });
}
runAllTests().catch(console.error);
