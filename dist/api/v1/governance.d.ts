/**
 * SELF Governance API - Enterprise Governance Requests
 *
 * This module provides the governance API endpoints for handling enterprise
 * build/deploy/publish requests with proper approval workflows.
 */
import { Router } from 'express';
interface GovernanceRequest {
    requestId?: string;
    projectId: string;
    userId: string;
    requestType: 'BUILD' | 'DEPLOY' | 'PUBLISH';
    environment: 'development' | 'staging' | 'production';
    buildConfig: {
        framework: string;
        aiModel: string;
        sizeMB: number;
        region: string;
    };
    requestedBy: {
        userId: string;
        email: string;
        role: 'admin' | 'developer' | 'reviewer' | 'auditor' | 'viewer';
    };
    enterpriseSubdomain: string;
}
interface GovernanceResponse {
    id: string;
    status: 'PENDING_APPROVAL' | 'UNDER_REVIEW' | 'COMPLIANCE_CHECK' | 'SECURITY_SCAN' | 'BUDGET_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    createdAt: string;
    updatedAt: string;
    approvalWorkflow: {
        currentStep: string;
        requiredApprovals: string[];
        receivedApprovals: string[];
        rejectionReasons?: string[];
    };
    complianceCheck: {
        status: 'PENDING' | 'PASSED' | 'FAILED';
        results?: {
            policyViolations?: string[];
            complianceScore?: number;
        };
    };
    securityScan: {
        status: 'PENDING' | 'PASSED' | 'FAILED';
        results?: {
            vulnerabilities?: string[];
            severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        };
    };
    budgetApproval: {
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        estimatedCost: number;
        approvedBy?: string;
    };
}
interface GovernanceStatusResponse extends GovernanceResponse {
    auditLog: {
        timestamp: string;
        action: string;
        performedBy: string;
    }[];
}
interface GovernanceError {
    error: string;
    code: 'VALIDATION_FAILED' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'SERVER_ERROR';
    details?: {
        field?: string;
        message?: string;
    }[];
}
declare function validateBuildConfig(buildConfig: GovernanceRequest['buildConfig']): {
    valid: boolean;
    errors?: string[];
};
declare function validateUserPermissions(userRole: string, requestType: GovernanceRequest['requestType']): boolean;
declare function determineRequiredApprovals(environment: GovernanceRequest['environment'], requestType: GovernanceRequest['requestType']): string[];
export declare function createGovernanceRouter(): Router;
export type { GovernanceRequest, GovernanceResponse, GovernanceStatusResponse, GovernanceError };
export { validateBuildConfig, determineRequiredApprovals, validateUserPermissions };
export declare const governanceRouter: Router;
//# sourceMappingURL=governance.d.ts.map