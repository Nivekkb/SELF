/**
 * SELF Governance API - Configuration and Toggle System
 *
 * This module provides configuration management for SELF Governance,
 * allowing enterprise builders to toggle governance features on/off
 * and configure governance behavior.
 */

import { GovernanceRequest } from './governance';

// Governance Configuration Interface
export interface GovernanceConfig {
  // Global governance toggle
  governanceEnabled: boolean;

  // Feature-specific toggles
  features: {
    buildGovernance: boolean;
    deployGovernance: boolean;
    publishGovernance: boolean;
    complianceChecks: boolean;
    securityScans: boolean;
    budgetApproval: boolean;
    auditLogging: boolean;
  };

  // Policy overrides
  policyOverrides: {
    autoApproveDevelopment: boolean;
    maxProjectSizeMB: number;
    approvedFrameworks: string[];
    approvedAIModels: string[];
    approvedRegions: string[];
  };

  // Integration settings
  integration: {
    webhookUrl?: string;
    notificationEmail?: string;
    enterpriseSubdomain: string;
  };

  // Performance settings
  performance: {
    requestTimeoutMs: number;
    maxConcurrentRequests: number;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
}

// Default Configuration
export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  governanceEnabled: true,
  features: {
    buildGovernance: true,
    deployGovernance: true,
    publishGovernance: true,
    complianceChecks: true,
    securityScans: true,
    budgetApproval: true,
    auditLogging: true
  },
  policyOverrides: {
    autoApproveDevelopment: true,
    maxProjectSizeMB: 100,
    approvedFrameworks: ['React', 'Vue', 'Angular', 'Svelte'],
    approvedAIModels: ['Claude 3', 'GPT-4'],
    approvedRegions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1']
  },
  integration: {
    enterpriseSubdomain: 'enterprise.serenixdigital.com'
  },
  performance: {
    requestTimeoutMs: 30000,
    maxConcurrentRequests: 100,
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 120
    }
  }
};

// Configuration Management
class GovernanceConfigManager {
  private config: GovernanceConfig;
  private enterpriseConfigs: Record<string, GovernanceConfig>;

  constructor() {
    this.config = { ...DEFAULT_GOVERNANCE_CONFIG };
    this.enterpriseConfigs = {};
  }

  /**
   * Get current governance configuration
   */
  getConfig(enterpriseSubdomain?: string): GovernanceConfig {
    if (enterpriseSubdomain && this.enterpriseConfigs[enterpriseSubdomain]) {
      return this.enterpriseConfigs[enterpriseSubdomain];
    }
    return this.config;
  }

  /**
   * Update governance configuration
   */
  updateConfig(newConfig: Partial<GovernanceConfig>, enterpriseSubdomain?: string): GovernanceConfig {
    if (enterpriseSubdomain) {
      // Update enterprise-specific config
      const currentConfig = this.enterpriseConfigs[enterpriseSubdomain] || { ...DEFAULT_GOVERNANCE_CONFIG };
      this.enterpriseConfigs[enterpriseSubdomain] = { ...currentConfig, ...newConfig };
      return this.enterpriseConfigs[enterpriseSubdomain];
    } else {
      // Update global config
      this.config = { ...this.config, ...newConfig };
      return this.config;
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(enterpriseSubdomain?: string): GovernanceConfig {
    if (enterpriseSubdomain) {
      this.enterpriseConfigs[enterpriseSubdomain] = { ...DEFAULT_GOVERNANCE_CONFIG };
      return this.enterpriseConfigs[enterpriseSubdomain];
    } else {
      this.config = { ...DEFAULT_GOVERNANCE_CONFIG };
      return this.config;
    }
  }

  /**
   * Check if governance is enabled for a specific request type
   */
  isGovernanceEnabled(request: GovernanceRequest): boolean {
    const config = this.getConfig(request.enterpriseSubdomain);

    if (!config.governanceEnabled) {
      return false;
    }

    // Check feature-specific toggles
    switch (request.requestType) {
      case 'BUILD':
        return config.features.buildGovernance;
      case 'DEPLOY':
        return config.features.deployGovernance;
      case 'PUBLISH':
        return config.features.publishGovernance;
      default:
        return true;
    }
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof GovernanceConfig['features'], enterpriseSubdomain?: string): boolean {
    const config = this.getConfig(enterpriseSubdomain);
    return config.governanceEnabled && config.features[feature];
  }

  /**
   * Get effective policy settings for a request
   */
  getEffectivePolicies(request: GovernanceRequest) {
    const config = this.getConfig(request.enterpriseSubdomain);
    return config.policyOverrides;
  }

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
  } {
    const config = this.getConfig(enterpriseSubdomain);

    return {
      governanceEnabled: config.governanceEnabled,
      toggleOptions: [
        {
          name: 'buildGovernance',
          description: 'Enable governance for build requests',
          enabled: config.features.buildGovernance,
          configurable: true
        },
        {
          name: 'deployGovernance',
          description: 'Enable governance for deploy requests',
          enabled: config.features.deployGovernance,
          configurable: true
        },
        {
          name: 'publishGovernance',
          description: 'Enable governance for publish requests',
          enabled: config.features.publishGovernance,
          configurable: true
        },
        {
          name: 'complianceChecks',
          description: 'Run compliance checks on all requests',
          enabled: config.features.complianceChecks,
          configurable: true
        },
        {
          name: 'securityScans',
          description: 'Run security scans on all requests',
          enabled: config.features.securityScans,
          configurable: true
        },
        {
          name: 'budgetApproval',
          description: 'Require budget approval for production',
          enabled: config.features.budgetApproval,
          configurable: true
        },
        {
          name: 'auditLogging',
          description: 'Enable detailed audit logging',
          enabled: config.features.auditLogging,
          configurable: true
        }
      ]
    };
  }
}

// Singleton instance
let configManagerInstance: GovernanceConfigManager | null = null;

export function getGovernanceConfigManager(): GovernanceConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new GovernanceConfigManager();
  }
  return configManagerInstance;
}
