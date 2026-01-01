/**
 * SELF Governance API - Enterprise Builder Integration
 *
 * This module provides endpoints for enterprise builders to integrate
 * SELF Governance with their build systems, including toggle configuration
 * and governance status checking.
 */

import { Router, Request, Response } from 'express';
import { getGovernanceConfigManager } from './governance-config';
import { GovernanceRequest } from './governance';

// Builder Integration Configuration Interface
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

// Create builder integration router
export function createBuilderIntegrationRouter(): Router {
  const router = Router();
  const configManager = getGovernanceConfigManager();

  /**
   * GET /api/v1/builder/integration-config
   * Get integration configuration for enterprise builder
   */
  router.get('/integration-config', async (req: Request, res: Response) => {
    try {
      // Extract enterprise subdomain from query or headers
      const enterpriseSubdomain = req.query.enterpriseSubdomain as string ||
                                 req.headers['x-enterprise-subdomain'] as string ||
                                 'enterprise.serenixdigital.com';

      // Get builder integration configuration
      const builderConfig = configManager.createBuilderIntegrationConfig(enterpriseSubdomain);

      // Create full integration response
      const integrationConfig: BuilderIntegrationConfig = {
        ...builderConfig,
        enterpriseSubdomain,
        apiEndpoints: {
          governanceConfig: '/api/v1/builder/governance-config',
          updateConfig: '/api/v1/builder/governance-config',
          checkGovernanceStatus: '/api/v1/builder/governance-status',
          submitRequest: '/api/v1/governance/requests'
        }
      };

      return res.status(200).json(integrationConfig);
    } catch (error) {
      console.error('Builder integration config error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/v1/builder/governance-config
   * Get current governance configuration for enterprise
   */
  router.get('/governance-config', async (req: Request, res: Response) => {
    try {
      // Extract enterprise subdomain
      const enterpriseSubdomain = req.query.enterpriseSubdomain as string ||
                                 req.headers['x-enterprise-subdomain'] as string ||
                                 'enterprise.serenixdigital.com';

      // Get current configuration
      const config = configManager.getConfig(enterpriseSubdomain);

      return res.status(200).json({
        success: true,
        enterpriseSubdomain,
        config
      });
    } catch (error) {
      console.error('Get governance config error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/v1/builder/governance-config
   * Update governance configuration for enterprise
   */
  router.post('/governance-config', async (req: Request, res: Response) => {
    try {
      // Extract enterprise subdomain
      const enterpriseSubdomain = req.query.enterpriseSubdomain as string ||
                                 req.headers['x-enterprise-subdomain'] as string ||
                                 'enterprise.serenixdigital.com';

      // Validate request body
      const configUpdate = req.body;
      if (!configUpdate || Object.keys(configUpdate).length === 0) {
        return res.status(400).json({
          error: 'Invalid request body',
          code: 'VALIDATION_FAILED',
          details: 'Configuration update data is required'
        });
      }

      // Update configuration
      const updatedConfig = configManager.updateConfig(configUpdate, enterpriseSubdomain);

      return res.status(200).json({
        success: true,
        enterpriseSubdomain,
        config: updatedConfig,
        message: 'Governance configuration updated successfully'
      });
    } catch (error) {
      console.error('Update governance config error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/v1/builder/governance-status
   * Check if governance is required for a specific build request
   */
  router.post('/governance-status', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const requestData: Partial<GovernanceRequest> = req.body;
      if (!requestData || !requestData.requestType || !requestData.enterpriseSubdomain) {
        return res.status(400).json({
          error: 'Invalid request body',
          code: 'VALIDATION_FAILED',
          details: 'requestType and enterpriseSubdomain are required'
        });
      }

      // Create a minimal request object for governance check
      const minimalRequest: GovernanceRequest = {
        projectId: requestData.projectId || 'unknown',
        userId: requestData.userId || 'unknown',
        requestType: requestData.requestType,
        environment: requestData.environment || 'development',
        buildConfig: requestData.buildConfig || {
          framework: 'React',
          aiModel: 'Claude 3',
          sizeMB: 10,
          region: 'us-east-1'
        },
        requestedBy: requestData.requestedBy || {
          userId: 'unknown',
          email: 'unknown@example.com',
          role: 'developer'
        },
        enterpriseSubdomain: requestData.enterpriseSubdomain
      };

      // Check if governance is enabled for this request
      const isGovernanceEnabled = configManager.isGovernanceEnabled(minimalRequest);

      // Get feature-specific status
      const featureStatus = {
        complianceChecks: configManager.isFeatureEnabled('complianceChecks', minimalRequest.enterpriseSubdomain),
        securityScans: configManager.isFeatureEnabled('securityScans', minimalRequest.enterpriseSubdomain),
        budgetApproval: configManager.isFeatureEnabled('budgetApproval', minimalRequest.enterpriseSubdomain),
        auditLogging: configManager.isFeatureEnabled('auditLogging', minimalRequest.enterpriseSubdomain)
      };

      return res.status(200).json({
        success: true,
        governanceRequired: isGovernanceEnabled,
        requestType: minimalRequest.requestType,
        environment: minimalRequest.environment,
        featureStatus,
        message: isGovernanceEnabled
          ? 'Governance is required for this request'
          : 'Governance is not required for this request'
      });
    } catch (error) {
      console.error('Governance status check error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/v1/builder/health
   * Health check for builder integration
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'self-governance-builder-integration',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        integrationConfig: 'GET /api/v1/builder/integration-config',
        governanceConfig: 'GET /api/v1/builder/governance-config',
        updateConfig: 'POST /api/v1/builder/governance-config',
        governanceStatus: 'POST /api/v1/builder/governance-status'
      }
    });
  });

  return router;
}

// Export the router
export const builderIntegrationRouter = createBuilderIntegrationRouter();

// Export types
export type {
  BuilderIntegrationConfig
};
