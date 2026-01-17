/**
 * SELF Governance API - Enterprise Governance Requests
 *
 * This module provides the governance API endpoints for handling enterprise
 * build/deploy/publish requests with proper approval workflows.
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
// Enterprise Policies Configuration
const ENTERPRISE_POLICIES = {
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
const governanceRequests = {};
const governanceAuditLogs = {};
// JWT Authentication with Cognito
const COGNITO_JWKS_URL = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_JdadgZFmv/.well-known/jwks.json';
let jwksClientInstance;
function initializeJwksClient() {
    if (!jwksClientInstance) {
        jwksClientInstance = jwksClient({
            jwksUri: COGNITO_JWKS_URL,
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10
        });
    }
    return jwksClientInstance;
}
async function authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header missing or invalid');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('Bearer token missing');
    }
    try {
        const client = initializeJwksClient();
        const getKey = (header, callback) => {
            client.getSigningKey(header.kid, (err, key) => {
                if (err) {
                    callback(err);
                }
                else {
                    const signingKey = key?.getPublicKey();
                    callback(null, signingKey);
                }
            });
        };
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, getKey, {
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
        // Extract user information from JWT
        const userId = decoded.sub || '';
        const email = decoded.email || '';
        const role = decoded['cognito:groups']?.[0] || 'viewer';
        if (!userId || !email) {
            throw new Error('Invalid user information in token');
        }
        return { userId, email, role };
    }
    catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Unauthorized');
    }
}
// Validation functions
function validateBuildConfig(buildConfig) {
    const errors = [];
    // Validate framework
    if (!ENTERPRISE_POLICIES.APPROVED_FRAMEWORKS.includes(buildConfig.framework)) {
        errors.push(`Framework ${buildConfig.framework} is not approved. Allowed: ${ENTERPRISE_POLICIES.APPROVED_FRAMEWORKS.join(', ')}`);
    }
    // Validate AI model
    if (!ENTERPRISE_POLICIES.APPROVED_AI_MODELS.includes(buildConfig.aiModel)) {
        errors.push(`AI Model ${buildConfig.aiModel} is not approved. Allowed: ${ENTERPRISE_POLICIES.APPROVED_AI_MODELS.join(', ')}`);
    }
    // Validate size
    if (buildConfig.sizeMB > ENTERPRISE_POLICIES.MAX_PROJECT_SIZE_MB) {
        errors.push(`Project size ${buildConfig.sizeMB}MB exceeds maximum allowed size of ${ENTERPRISE_POLICIES.MAX_PROJECT_SIZE_MB}MB`);
    }
    // Validate region
    if (!ENTERPRISE_POLICIES.APPROVED_REGIONS.includes(buildConfig.region)) {
        errors.push(`Region ${buildConfig.region} is not approved. Allowed: ${ENTERPRISE_POLICIES.APPROVED_REGIONS.join(', ')}`);
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
    const requiredApprovals = determineRequiredApprovals(request.environment, request.requestType);
    const now = new Date().toISOString();
    // Auto-approve development if configured
    const initialStatus = request.environment === 'development' && ENTERPRISE_POLICIES.AUTO_APPROVE_DEVELOPMENT
        ? 'APPROVED'
        : 'PENDING_APPROVAL';
    const response = {
        id: requestId,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
        approvalWorkflow: {
            currentStep: initialStatus === 'APPROVED' ? 'COMPLETED' : 'PENDING_APPROVAL',
            requiredApprovals,
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
async function runComplianceScan(request) {
    // Simulate compliance check
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simple validation based on build config
    const validation = validateBuildConfig(request.buildConfig);
    if (validation.valid) {
        return {
            status: 'PASSED',
            results: {
                complianceScore: 100
            }
        };
    }
    else {
        return {
            status: 'FAILED',
            results: {
                policyViolations: validation.errors,
                complianceScore: 50
            }
        };
    }
}
async function runSecurityScan(request) {
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 150));
    // Mock security scan - always pass for now
    return {
        status: 'PASSED',
        results: {
            vulnerabilities: [],
            severity: 'LOW'
        }
    };
}
async function runBudgetApproval(request) {
    // Simulate budget approval
    await new Promise(resolve => setTimeout(resolve, 200));
    // Auto-approve for non-production, require approval for production
    if (request.environment === 'production') {
        return {
            status: 'PENDING',
            estimatedCost: 1000,
            approvedBy: undefined
        };
    }
    else {
        return {
            status: 'APPROVED',
            estimatedCost: request.environment === 'staging' ? 500 : 100,
            approvedBy: 'auto-approved'
        };
    }
}
// Main governance request handler
async function handleGovernanceRequest(request) {
    const requestId = request.requestId || uuidv4();
    const now = new Date().toISOString();
    // Validate build configuration
    const configValidation = validateBuildConfig(request.buildConfig);
    if (!configValidation.valid) {
        const errorResponse = {
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
        return errorResponse;
    }
    // Create initial response
    const response = createGovernanceResponse(request, requestId);
    governanceRequests[requestId] = response;
    // Start audit log
    governanceAuditLogs[requestId] = [{
            timestamp: now,
            action: 'REQUEST_CREATED',
            performedBy: request.requestedBy.userId
        }];
    // If not auto-approved, start approval workflow
    if (response.status !== 'APPROVED') {
        // Run compliance check
        const complianceCheck = await runComplianceScan(request);
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
            response.approvalWorkflow.rejectionReasons = complianceCheck.results?.policyViolations;
            governanceRequests[requestId] = response;
            return response;
        }
        // Run security scan
        const securityScan = await runSecurityScan(request);
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
            return response;
        }
        // Run budget approval if needed
        if (response.approvalWorkflow.requiredApprovals.includes('budget')) {
            const budgetApproval = await runBudgetApproval(request);
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
                return response;
            }
        }
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
    }
    governanceRequests[requestId] = response;
    return response;
}
// Create Express router for governance API
export function createGovernanceRouter() {
    const router = Router();
    // POST /api/v1/governance/requests - Submit governance request
    router.post('/requests', async (req, res) => {
        try {
            // Authenticate the request
            const authResult = await authenticateRequest(req);
            // Validate request body
            const requestData = req.body;
            if (!requestData) {
                const error = {
                    error: 'Invalid request body',
                    code: 'VALIDATION_FAILED',
                    details: [{ message: 'Request body is required' }]
                };
                return res.status(400).json(error);
            }
            // Validate required fields
            const requiredFields = ['projectId', 'userId', 'requestType', 'environment', 'buildConfig', 'requestedBy', 'enterpriseSubdomain'];
            const missingFields = requiredFields.filter(field => !requestData[field]);
            if (missingFields.length > 0) {
                const error = {
                    error: 'Missing required fields',
                    code: 'VALIDATION_FAILED',
                    details: missingFields.map(field => ({ field, message: `Field ${field} is required` }))
                };
                return res.status(400).json(error);
            }
            // Validate user permissions
            if (!validateUserPermissions(authResult.role, requestData.requestType)) {
                const error = {
                    error: 'Unauthorized',
                    code: 'UNAUTHORIZED',
                    details: [{ message: `User role ${authResult.role} is not authorized for ${requestData.requestType} requests` }]
                };
                return res.status(403).json(error);
            }
            // Ensure userId matches authenticated user
            if (requestData.userId !== authResult.userId) {
                const error = {
                    error: 'Unauthorized',
                    code: 'UNAUTHORIZED',
                    details: [{ message: 'userId must match authenticated user' }]
                };
                return res.status(403).json(error);
            }
            // Process the governance request
            const response = await handleGovernanceRequest(requestData);
            return res.status(201).json(response);
        }
        catch (error) {
            console.error('Governance request error:', error);
            const errorResponse = {
                error: error instanceof Error ? error.message : 'Internal server error',
                code: 'SERVER_ERROR'
            };
            return res.status(500).json(errorResponse);
        }
    });
    // GET /api/v1/governance/requests/{id} - Check request status
    router.get('/requests/:id', async (req, res) => {
        try {
            // Authenticate the request
            await authenticateRequest(req);
            const requestId = req.params.id;
            const request = governanceRequests[requestId];
            if (!request) {
                const error = {
                    error: 'Request not found',
                    code: 'NOT_FOUND'
                };
                return res.status(404).json(error);
            }
            const auditLog = governanceAuditLogs[requestId] || [];
            const statusResponse = {
                ...request,
                auditLog
            };
            return res.status(200).json(statusResponse);
        }
        catch (error) {
            console.error('Governance status check error:', error);
            const errorResponse = {
                error: error instanceof Error ? error.message : 'Internal server error',
                code: 'SERVER_ERROR'
            };
            return res.status(500).json(errorResponse);
        }
    });
    // GET /api/v1/governance/requests - List user's requests
    router.get('/requests', async (req, res) => {
        try {
            // Authenticate the request
            const authResult = await authenticateRequest(req);
            // Filter requests by userId
            const userRequests = Object.values(governanceRequests)
                .filter(request => request.id && governanceRequests[request.id]?.approvalWorkflow)
                .map(request => ({
                id: request.id,
                status: request.status,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                requestType: governanceRequests[request.id]?.approvalWorkflow?.currentStep.includes('BUILD') ? 'BUILD' :
                    governanceRequests[request.id]?.approvalWorkflow?.currentStep.includes('DEPLOY') ? 'DEPLOY' : 'PUBLISH',
                environment: governanceRequests[request.id]?.budgetApproval?.estimatedCost === 1000 ? 'production' :
                    governanceRequests[request.id]?.budgetApproval?.estimatedCost === 500 ? 'staging' : 'development'
            }));
            return res.status(200).json(userRequests);
        }
        catch (error) {
            console.error('Governance list requests error:', error);
            const errorResponse = {
                error: error instanceof Error ? error.message : 'Internal server error',
                code: 'SERVER_ERROR'
            };
            return res.status(500).json(errorResponse);
        }
    });
    return router;
}
// Export validation and workflow functions for testing
export { validateBuildConfig, determineRequiredApprovals, validateUserPermissions };
// Export the router
export const governanceRouter = createGovernanceRouter();
//# sourceMappingURL=governance.js.map