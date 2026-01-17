/**
 * SELF Governance API - Configuration and Toggle System
 *
 * This module provides configuration management for SELF Governance,
 * allowing enterprise builders to toggle governance features on/off
 * and configure governance behavior.
 */
import { GovernanceRequest } from './governance';
export interface GovernanceConfig {
    governanceEnabled: boolean;
    features: {
        buildGovernance: boolean;
        deployGovernance: boolean;
        publishGovernance: boolean;
        complianceChecks: boolean;
        securityScans: boolean;
        budgetApproval: boolean;
        auditLogging: boolean;
    };
    policyOverrides: {
        autoApproveDevelopment: boolean;
        maxProjectSizeMB: number;
        approvedFrameworks: string[];
        approvedAIModels: string[];
        approvedRegions: string[];
    };
    integration: {
        webhookUrl?: string;
        notificationEmail?: string;
        enterpriseSubdomain: string;
    };
    performance: {
        requestTimeoutMs: number;
        maxConcurrentRequests: number;
        rateLimiting: {
            enabled: boolean;
            requestsPerMinute: number;
        };
    };
}
export declare const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig;
declare class GovernanceConfigManager {
    private config;
    private enterpriseConfigs;
    constructor();
    /**
     * Get current governance configuration
     */
    getConfig(enterpriseSubdomain?: string): GovernanceConfig;
    /**
     * Update governance configuration
     */
    updateConfig(newConfig: Partial<GovernanceConfig>, enterpriseSubdomain?: string): GovernanceConfig;
    /**
     * Reset configuration to defaults
     */
    resetConfig(enterpriseSubdomain?: string): GovernanceConfig;
    /**
     * Check if governance is enabled for a specific request type
     */
    isGovernanceEnabled(request: GovernanceRequest): boolean;
    /**
     * Check if a specific feature is enabled
     */
    isFeatureEnabled(feature: keyof GovernanceConfig['features'], enterpriseSubdomain?: string): boolean;
    /**
     * Get effective policy settings for a request
     */
    getEffectivePolicies(request: GovernanceRequest): {
        autoApproveDevelopment: boolean;
        maxProjectSizeMB: number;
        approvedFrameworks: string[];
        approvedAIModels: string[];
        approvedRegions: string[];
    };
    /**
     * Create a governance toggle configuration for enterprise builder integration
     */
    createBuilderIntegrationConfig(enterpriseSubdomain: string): {
        governanceEnabled: boolean;
        toggleOptions: {
            name: string;
            description: string;
            enabled: boolean;
            configurable: boolean;
        }[];
    };
}
export declare function getGovernanceConfigManager(): GovernanceConfigManager;
export {};
//# sourceMappingURL=governance-config.d.ts.map