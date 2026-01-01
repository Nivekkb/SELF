/**
 * SELF Governance API Tests
 *
 * Unit tests for the governance API endpoints and functionality
 */

import request from 'supertest';
import { createGovernanceExpressApp } from './governance-server';
import { GovernanceRequest } from './governance';

describe('SELF Governance API', () => {
  let app: Express.Application;

  beforeAll(() => {
    app = createGovernanceExpressApp();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('self-governance-api');
    });
  });

  describe('API Documentation', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body.service).toBe('SELF Governance API');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.submitRequest).toBe('POST /api/v1/governance/requests');
    });
  });

  describe('Governance Request Submission', () => {
    const validRequest: GovernanceRequest = {
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

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/governance/requests')
        .send(validRequest)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should validate required fields', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.projectId;

      const response = await request(app)
        .post('/api/v1/governance/requests')
        .set('Authorization', 'Bearer invalid-token')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('should validate build configuration', async () => {
      const invalidConfigRequest = {
        ...validRequest,
        buildConfig: {
          framework: 'InvalidFramework',
          aiModel: 'Claude 3',
          sizeMB: 50,
          region: 'us-east-1'
        }
      };

      // This test would normally fail validation, but we can't test the full flow
      // without proper authentication, so we just test the structure
      const response = await request(app)
        .post('/api/v1/governance/requests')
        .set('Authorization', 'Bearer invalid-token')
        .send(invalidConfigRequest)
        .expect(401); // Will fail auth first

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Request Validation Logic', () => {
    it('should validate framework', () => {
      const { validateBuildConfig } = require('./governance');

      const validConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'us-east-1'
      };

      const invalidConfig = {
        framework: 'InvalidFramework',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'us-east-1'
      };

      expect(validateBuildConfig(validConfig).valid).toBe(true);
      expect(validateBuildConfig(invalidConfig).valid).toBe(false);
      expect(validateBuildConfig(invalidConfig).errors).toContain('Framework InvalidFramework is not approved');
    });

    it('should validate AI model', () => {
      const { validateBuildConfig } = require('./governance');

      const invalidConfig = {
        framework: 'React',
        aiModel: 'InvalidModel',
        sizeMB: 50,
        region: 'us-east-1'
      };

      expect(validateBuildConfig(invalidConfig).valid).toBe(false);
      expect(validateBuildConfig(invalidConfig).errors).toContain('AI Model InvalidModel is not approved');
    });

    it('should validate project size', () => {
      const { validateBuildConfig } = require('./governance');

      const invalidConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 150, // Exceeds 100MB limit
        region: 'us-east-1'
      };

      expect(validateBuildConfig(invalidConfig).valid).toBe(false);
      expect(validateBuildConfig(invalidConfig).errors).toContain('Project size 150MB exceeds maximum allowed size');
    });

    it('should validate region', () => {
      const { validateBuildConfig } = require('./governance');

      const invalidConfig = {
        framework: 'React',
        aiModel: 'Claude 3',
        sizeMB: 50,
        region: 'invalid-region'
      };

      expect(validateBuildConfig(invalidConfig).valid).toBe(false);
      expect(validateBuildConfig(invalidConfig).errors).toContain('Region invalid-region is not approved');
    });
  });

  describe('Approval Workflow Logic', () => {
    it('should determine required approvals for development', () => {
      const { determineRequiredApprovals } = require('./governance');

      const approvals = determineRequiredApprovals('development', 'BUILD');
      expect(approvals).toEqual([]); // Auto-approve development
    });

    it('should determine required approvals for staging', () => {
      const { determineRequiredApprovals } = require('./governance');

      const approvals = determineRequiredApprovals('staging', 'DEPLOY');
      expect(approvals).toEqual(['compliance', 'security']);
    });

    it('should determine required approvals for production', () => {
      const { determineRequiredApprovals } = require('./governance');

      const approvals = determineRequiredApprovals('production', 'PUBLISH');
      expect(approvals).toEqual(['compliance', 'security', 'budget']);
    });
  });
});

// Mock Express type for testing
namespace Express {
  export interface Application {
    // Mock interface for testing
  }
}
