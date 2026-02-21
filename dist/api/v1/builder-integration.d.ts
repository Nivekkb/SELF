/**
 * SELF Governance API - Enterprise Builder Integration
 *
 * This module provides endpoints for enterprise builders to integrate
 * SELF Governance with their build systems, including toggle configuration
 * and governance status checking.
 */
import { Router } from 'express';
interface BuilderIntegrationConfig {
    governanceEnabled: boolean;
    toggleOptions: {
        name: string;
        description: string;
        enabled: boolean;
        configurable: boolean;
    }[];
    enterpriseSubdomain: string;
    apiEndpoints: {
        governanceConfig: string;
        updateConfig: string;
        checkGovernanceStatus: string;
        submitRequest: string;
    };
}
export declare function createBuilderIntegrationRouter(): Router;
export declare const builderIntegrationRouter: Router;
export type { BuilderIntegrationConfig };
//# sourceMappingURL=builder-integration.d.ts.map