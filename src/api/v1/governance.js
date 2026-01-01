"use strict";
/**
 * SELF Governance API - Enterprise Governance Requests
 *
 * This module provides the governance API endpoints for handling enterprise
 * build/deploy/publish requests with proper approval workflows.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.governanceRouter = void 0;
exports.createGovernanceRouter = createGovernanceRouter;
exports.validateBuildConfig = validateBuildConfig;
exports.determineRequiredApprovals = determineRequiredApprovals;
exports.validateUserPermissions = validateUserPermissions;
var express_1 = require("express");
var uuid_1 = require("uuid");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var jwks_rsa_1 = __importDefault(require("jwks-rsa"));
// Enterprise Policies Configuration
var ENTERPRISE_POLICIES = {
    MAX_PROJECT_SIZE_MB: 100,
    APPROVED_FRAMEWORKS: ['React', 'Vue', 'Angular', 'Svelte'],
    APPROVED_AI_MODELS: ['Claude 3', 'GPT-4'],
    APPROVED_REGIONS: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1'],
    AUTO_APPROVE_DEVELOPMENT: true,
    REQUIRED_APPROVALS: {
        staging: ['compliance', 'security'],
        production: ['compliance', 'security', 'budget']
    }
};
// In-memory storage for governance requests (in production, use a database)
var governanceRequests = {};
var governanceAuditLogs = {};
// JWT Authentication with Cognito
var COGNITO_JWKS_URL = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_JdadgZFmv/.well-known/jwks.json';
var jwksClientInstance;
function initializeJwksClient() {
    if (!jwksClientInstance) {
        jwksClientInstance = (0, jwks_rsa_1.default)({
            jwksUri: COGNITO_JWKS_URL,
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10
        });
    }
    return jwksClientInstance;
}
function authenticateRequest(req) {
    return __awaiter(this, void 0, void 0, function () {
        var authHeader, token, client_1, getKey_1, decoded, userId, email, role, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    authHeader = req.headers.authorization;
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        throw new Error('Authorization header missing or invalid');
                    }
                    token = authHeader.split(' ')[1];
                    if (!token) {
                        throw new Error('Bearer token missing');
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    client_1 = initializeJwksClient();
                    getKey_1 = function (header, callback) {
                        client_1.getSigningKey(header.kid, function (err, key) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                var signingKey = key === null || key === void 0 ? void 0 : key.getPublicKey();
                                callback(null, signingKey);
                            }
                        });
                    };
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            jsonwebtoken_1.default.verify(token, getKey_1, {
                                algorithms: ['RS256']
                            }, function (err, decoded) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(decoded);
                                }
                            });
                        })];
                case 2:
                    decoded = _b.sent();
                    userId = decoded.sub || '';
                    email = decoded.email || '';
                    role = ((_a = decoded['cognito:groups']) === null || _a === void 0 ? void 0 : _a[0]) || 'viewer';
                    if (!userId || !email) {
                        throw new Error('Invalid user information in token');
                    }
                    return [2 /*return*/, { userId: userId, email: email, role: role }];
                case 3:
                    error_1 = _b.sent();
                    console.error('Authentication error:', error_1);
                    throw new Error('Unauthorized');
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Validation functions
function validateBuildConfig(buildConfig) {
    var errors = [];
    // Validate framework
    if (!ENTERPRISE_POLICIES.APPROVED_FRAMEWORKS.includes(buildConfig.framework)) {
        errors.push("Framework ".concat(buildConfig.framework, " is not approved. Allowed: ").concat(ENTERPRISE_POLICIES.APPROVED_FRAMEWORKS.join(', ')));
    }
    // Validate AI model
    if (!ENTERPRISE_POLICIES.APPROVED_AI_MODELS.includes(buildConfig.aiModel)) {
        errors.push("AI Model ".concat(buildConfig.aiModel, " is not approved. Allowed: ").concat(ENTERPRISE_POLICIES.APPROVED_AI_MODELS.join(', ')));
    }
    // Validate size
    if (buildConfig.sizeMB > ENTERPRISE_POLICIES.MAX_PROJECT_SIZE_MB) {
        errors.push("Project size ".concat(buildConfig.sizeMB, "MB exceeds maximum allowed size of ").concat(ENTERPRISE_POLICIES.MAX_PROJECT_SIZE_MB, "MB"));
    }
    // Validate region
    if (!ENTERPRISE_POLICIES.APPROVED_REGIONS.includes(buildConfig.region)) {
        errors.push("Region ".concat(buildConfig.region, " is not approved. Allowed: ").concat(ENTERPRISE_POLICIES.APPROVED_REGIONS.join(', ')));
    }
    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}
function validateUserPermissions(userRole, requestType) {
    // Only admins and developers can submit requests
    return ['admin', 'developer'].includes(userRole);
}
// Approval workflow functions
function determineRequiredApprovals(environment, requestType) {
    if (environment === 'development' && ENTERPRISE_POLICIES.AUTO_APPROVE_DEVELOPMENT) {
        return []; // Auto-approve development
    }
    if (requestType === 'BUILD') {
        return ['compliance', 'security'];
    }
    else if (requestType === 'DEPLOY' || requestType === 'PUBLISH') {
        if (environment === 'production') {
            return ['compliance', 'security', 'budget'];
        }
        else {
            return ['compliance', 'security'];
        }
    }
    return ['compliance', 'security'];
}
function createGovernanceResponse(request, requestId) {
    var requiredApprovals = determineRequiredApprovals(request.environment, request.requestType);
    var now = new Date().toISOString();
    // Auto-approve development if configured
    var initialStatus = request.environment === 'development' && ENTERPRISE_POLICIES.AUTO_APPROVE_DEVELOPMENT
        ? 'APPROVED'
        : 'PENDING_APPROVAL';
    var response = {
        id: requestId,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
        approvalWorkflow: {
            currentStep: initialStatus === 'APPROVED' ? 'COMPLETED' : 'PENDING_APPROVAL',
            requiredApprovals: requiredApprovals,
            receivedApprovals: initialStatus === 'APPROVED' ? requiredApprovals : []
        },
        complianceCheck: {
            status: initialStatus === 'APPROVED' ? 'PASSED' : 'PENDING'
        },
        securityScan: {
            status: initialStatus === 'APPROVED' ? 'PASSED' : 'PENDING'
        },
        budgetApproval: {
            status: initialStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
            estimatedCost: request.environment === 'production' ? 1000 : request.environment === 'staging' ? 500 : 100
        }
    };
    return response;
}
// Mock compliance and security scans (in production, integrate with real services)
function runComplianceScan(request) {
    return __awaiter(this, void 0, void 0, function () {
        var validation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate compliance check
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 1:
                    // Simulate compliance check
                    _a.sent();
                    validation = validateBuildConfig(request.buildConfig);
                    if (validation.valid) {
                        return [2 /*return*/, {
                                status: 'PASSED',
                                results: {
                                    complianceScore: 100
                                }
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                status: 'FAILED',
                                results: {
                                    policyViolations: validation.errors,
                                    complianceScore: 50
                                }
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function runSecurityScan(request) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate security scan
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 150); })];
                case 1:
                    // Simulate security scan
                    _a.sent();
                    // Mock security scan - always pass for now
                    return [2 /*return*/, {
                            status: 'PASSED',
                            results: {
                                vulnerabilities: [],
                                severity: 'LOW'
                            }
                        }];
            }
        });
    });
}
function runBudgetApproval(request) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate budget approval
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                case 1:
                    // Simulate budget approval
                    _a.sent();
                    // Auto-approve for non-production, require approval for production
                    if (request.environment === 'production') {
                        return [2 /*return*/, {
                                status: 'PENDING',
                                estimatedCost: 1000,
                                approvedBy: undefined
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                status: 'APPROVED',
                                estimatedCost: request.environment === 'staging' ? 500 : 100,
                                approvedBy: 'auto-approved'
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Main governance request handler
function handleGovernanceRequest(request) {
    return __awaiter(this, void 0, void 0, function () {
        var requestId, now, configValidation, errorResponse, response, complianceCheck, securityScan, budgetApproval;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    requestId = request.requestId || (0, uuid_1.v4)();
                    now = new Date().toISOString();
                    configValidation = validateBuildConfig(request.buildConfig);
                    if (!configValidation.valid) {
                        errorResponse = {
                            id: requestId,
                            status: 'REJECTED',
                            createdAt: now,
                            updatedAt: now,
                            approvalWorkflow: {
                                currentStep: 'VALIDATION_FAILED',
                                requiredApprovals: [],
                                receivedApprovals: [],
                                rejectionReasons: configValidation.errors
                            },
                            complianceCheck: {
                                status: 'FAILED',
                                results: {
                                    policyViolations: configValidation.errors,
                                    complianceScore: 0
                                }
                            },
                            securityScan: {
                                status: 'PENDING'
                            },
                            budgetApproval: {
                                status: 'PENDING',
                                estimatedCost: 0
                            }
                        };
                        governanceRequests[requestId] = errorResponse;
                        return [2 /*return*/, errorResponse];
                    }
                    response = createGovernanceResponse(request, requestId);
                    governanceRequests[requestId] = response;
                    // Start audit log
                    governanceAuditLogs[requestId] = [{
                            timestamp: now,
                            action: 'REQUEST_CREATED',
                            performedBy: request.requestedBy.userId
                        }];
                    if (!(response.status !== 'APPROVED')) return [3 /*break*/, 5];
                    return [4 /*yield*/, runComplianceScan(request)];
                case 1:
                    complianceCheck = _b.sent();
                    response.complianceCheck = complianceCheck;
                    response.status = 'COMPLIANCE_CHECK';
                    response.updatedAt = new Date().toISOString();
                    // Add compliance check to audit log
                    governanceAuditLogs[requestId].push({
                        timestamp: new Date().toISOString(),
                        action: 'COMPLIANCE_CHECK_COMPLETED',
                        performedBy: 'system'
                    });
                    if (complianceCheck.status === 'FAILED') {
                        response.status = 'REJECTED';
                        response.approvalWorkflow.currentStep = 'COMPLIANCE_CHECK_FAILED';
                        response.approvalWorkflow.rejectionReasons = (_a = complianceCheck.results) === null || _a === void 0 ? void 0 : _a.policyViolations;
                        governanceRequests[requestId] = response;
                        return [2 /*return*/, response];
                    }
                    return [4 /*yield*/, runSecurityScan(request)];
                case 2:
                    securityScan = _b.sent();
                    response.securityScan = securityScan;
                    response.status = 'SECURITY_SCAN';
                    response.updatedAt = new Date().toISOString();
                    // Add security scan to audit log
                    governanceAuditLogs[requestId].push({
                        timestamp: new Date().toISOString(),
                        action: 'SECURITY_SCAN_COMPLETED',
                        performedBy: 'system'
                    });
                    if (securityScan.status === 'FAILED') {
                        response.status = 'REJECTED';
                        response.approvalWorkflow.currentStep = 'SECURITY_SCAN_FAILED';
                        governanceRequests[requestId] = response;
                        return [2 /*return*/, response];
                    }
                    if (!response.approvalWorkflow.requiredApprovals.includes('budget')) return [3 /*break*/, 4];
                    return [4 /*yield*/, runBudgetApproval(request)];
                case 3:
                    budgetApproval = _b.sent();
                    response.budgetApproval = budgetApproval;
                    response.status = 'BUDGET_REVIEW';
                    response.updatedAt = new Date().toISOString();
                    // Add budget review to audit log
                    governanceAuditLogs[requestId].push({
                        timestamp: new Date().toISOString(),
                        action: 'BUDGET_REVIEW_COMPLETED',
                        performedBy: 'system'
                    });
                    if (budgetApproval.status === 'REJECTED') {
                        response.status = 'REJECTED';
                        response.approvalWorkflow.currentStep = 'BUDGET_REVIEW_FAILED';
                        governanceRequests[requestId] = response;
                        return [2 /*return*/, response];
                    }
                    _b.label = 4;
                case 4:
                    // All checks passed, approve the request
                    response.status = 'APPROVED';
                    response.approvalWorkflow.currentStep = 'COMPLETED';
                    response.approvalWorkflow.receivedApprovals = response.approvalWorkflow.requiredApprovals;
                    response.updatedAt = new Date().toISOString();
                    // Add approval to audit log
                    governanceAuditLogs[requestId].push({
                        timestamp: new Date().toISOString(),
                        action: 'REQUEST_APPROVED',
                        performedBy: 'system'
                    });
                    _b.label = 5;
                case 5:
                    governanceRequests[requestId] = response;
                    return [2 /*return*/, response];
            }
        });
    });
}
// Create Express router for governance API
function createGovernanceRouter() {
    var _this = this;
    var router = (0, express_1.Router)();
    // POST /api/v1/governance/requests - Submit governance request
    router.post('/requests', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var authResult, requestData_1, error, requiredFields, missingFields, error, error, error, response, error_2, errorResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, authenticateRequest(req)];
                case 1:
                    authResult = _a.sent();
                    requestData_1 = req.body;
                    if (!requestData_1) {
                        error = {
                            error: 'Invalid request body',
                            code: 'VALIDATION_FAILED',
                            details: [{ message: 'Request body is required' }]
                        };
                        return [2 /*return*/, res.status(400).json(error)];
                    }
                    requiredFields = ['projectId', 'userId', 'requestType', 'environment', 'buildConfig', 'requestedBy', 'enterpriseSubdomain'];
                    missingFields = requiredFields.filter(function (field) { return !requestData_1[field]; });
                    if (missingFields.length > 0) {
                        error = {
                            error: 'Missing required fields',
                            code: 'VALIDATION_FAILED',
                            details: missingFields.map(function (field) { return ({ field: field, message: "Field ".concat(field, " is required") }); })
                        };
                        return [2 /*return*/, res.status(400).json(error)];
                    }
                    // Validate user permissions
                    if (!validateUserPermissions(authResult.role, requestData_1.requestType)) {
                        error = {
                            error: 'Unauthorized',
                            code: 'UNAUTHORIZED',
                            details: [{ message: "User role ".concat(authResult.role, " is not authorized for ").concat(requestData_1.requestType, " requests") }]
                        };
                        return [2 /*return*/, res.status(403).json(error)];
                    }
                    // Ensure userId matches authenticated user
                    if (requestData_1.userId !== authResult.userId) {
                        error = {
                            error: 'Unauthorized',
                            code: 'UNAUTHORIZED',
                            details: [{ message: 'userId must match authenticated user' }]
                        };
                        return [2 /*return*/, res.status(403).json(error)];
                    }
                    return [4 /*yield*/, handleGovernanceRequest(requestData_1)];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, res.status(201).json(response)];
                case 3:
                    error_2 = _a.sent();
                    console.error('Governance request error:', error_2);
                    errorResponse = {
                        error: error_2 instanceof Error ? error_2.message : 'Internal server error',
                        code: 'SERVER_ERROR'
                    };
                    return [2 /*return*/, res.status(500).json(errorResponse)];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // GET /api/v1/governance/requests/{id} - Check request status
    router.get('/requests/:id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var requestId, request, error, auditLog, statusResponse, error_3, errorResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Authenticate the request
                    return [4 /*yield*/, authenticateRequest(req)];
                case 1:
                    // Authenticate the request
                    _a.sent();
                    requestId = req.params.id;
                    request = governanceRequests[requestId];
                    if (!request) {
                        error = {
                            error: 'Request not found',
                            code: 'NOT_FOUND'
                        };
                        return [2 /*return*/, res.status(404).json(error)];
                    }
                    auditLog = governanceAuditLogs[requestId] || [];
                    statusResponse = __assign(__assign({}, request), { auditLog: auditLog });
                    return [2 /*return*/, res.status(200).json(statusResponse)];
                case 2:
                    error_3 = _a.sent();
                    console.error('Governance status check error:', error_3);
                    errorResponse = {
                        error: error_3 instanceof Error ? error_3.message : 'Internal server error',
                        code: 'SERVER_ERROR'
                    };
                    return [2 /*return*/, res.status(500).json(errorResponse)];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // GET /api/v1/governance/requests - List user's requests
    router.get('/requests', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var authResult, userRequests, error_4, errorResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, authenticateRequest(req)];
                case 1:
                    authResult = _a.sent();
                    userRequests = Object.values(governanceRequests)
                        .filter(function (request) { var _a; return request.id && ((_a = governanceRequests[request.id]) === null || _a === void 0 ? void 0 : _a.approvalWorkflow); })
                        .map(function (request) {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        return ({
                            id: request.id,
                            status: request.status,
                            createdAt: request.createdAt,
                            updatedAt: request.updatedAt,
                            requestType: ((_b = (_a = governanceRequests[request.id]) === null || _a === void 0 ? void 0 : _a.approvalWorkflow) === null || _b === void 0 ? void 0 : _b.currentStep.includes('BUILD')) ? 'BUILD' :
                                ((_d = (_c = governanceRequests[request.id]) === null || _c === void 0 ? void 0 : _c.approvalWorkflow) === null || _d === void 0 ? void 0 : _d.currentStep.includes('DEPLOY')) ? 'DEPLOY' : 'PUBLISH',
                            environment: ((_f = (_e = governanceRequests[request.id]) === null || _e === void 0 ? void 0 : _e.budgetApproval) === null || _f === void 0 ? void 0 : _f.estimatedCost) === 1000 ? 'production' :
                                ((_h = (_g = governanceRequests[request.id]) === null || _g === void 0 ? void 0 : _g.budgetApproval) === null || _h === void 0 ? void 0 : _h.estimatedCost) === 500 ? 'staging' : 'development'
                        });
                    });
                    return [2 /*return*/, res.status(200).json(userRequests)];
                case 2:
                    error_4 = _a.sent();
                    console.error('Governance list requests error:', error_4);
                    errorResponse = {
                        error: error_4 instanceof Error ? error_4.message : 'Internal server error',
                        code: 'SERVER_ERROR'
                    };
                    return [2 /*return*/, res.status(500).json(errorResponse)];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    return router;
}
// Export the router
exports.governanceRouter = createGovernanceRouter();
