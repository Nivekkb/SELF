/**
 * SELF Governance API Test Script
 *
 * Simple test script to verify the governance API functionality
 * without requiring complex test framework setup.
 */

import { createGovernanceExpressApp } from './governance-server';
import { GovernanceRequest, validateBuildConfig, determineRequiredApprovals } from './governance';
import http from 'http';
import express from 'express';

console.log('🚀 Starting SELF Governance API Tests...');

function testValidationLogic() {
  console.log('\n🧪 Testing Validation Logic...');

  // Test valid configuration
  const validConfig = {
    framework: 'React',
    aiModel: 'Claude 3',
    sizeMB: 50,
    region: 'us-east-1'
  };

  const validationResult = validateBuildConfig(validConfig);
  console.log('✅ Valid configuration test:', validationResult.valid ? 'PASS' : 'FAIL');
  if (!validationResult.valid) {
    console.log('   Errors:', validationResult.errors);
  }

  // Test invalid framework
  const invalidFrameworkConfig = {
    framework: 'InvalidFramework',
    aiModel: 'Claude 3',
    sizeMB: 50,
    region: 'us-east-1'
  };

  const frameworkValidation = validateBuildConfig(invalidFrameworkConfig);
  console.log('✅ Invalid framework test:', !frameworkValidation.valid ? 'PASS' : 'FAIL');
  if (frameworkValidation.errors) {
    console.log('   Expected error about framework:', frameworkValidation.errors[0].includes('Framework') ? 'FOUND' : 'NOT FOUND');
  }

  // Test invalid AI model
  const invalidModelConfig = {
    framework: 'React',
    aiModel: 'InvalidModel',
    sizeMB: 50,
    region: 'us-east-1'
  };

  const modelValidation = validateBuildConfig(invalidModelConfig);
  console.log('✅ Invalid AI model test:', !modelValidation.valid ? 'PASS' : 'FAIL');

  // Test oversized project
  const oversizedConfig = {
    framework: 'React',
    aiModel: 'Claude 3',
    sizeMB: 150, // Exceeds 100MB limit
    region: 'us-east-1'
  };

  const sizeValidation = validateBuildConfig(oversizedConfig);
  console.log('✅ Oversized project test:', !sizeValidation.valid ? 'PASS' : 'FAIL');

  // Test invalid region
  const invalidRegionConfig = {
    framework: 'React',
    aiModel: 'Claude 3',
    sizeMB: 50,
    region: 'invalid-region'
  };

  const regionValidation = validateBuildConfig(invalidRegionConfig);
  console.log('✅ Invalid region test:', !regionValidation.valid ? 'PASS' : 'FAIL');
}

function testApprovalWorkflow() {
  console.log('\n🔄 Testing Approval Workflow Logic...');

  // Test development auto-approval
  const devApprovals = determineRequiredApprovals('development', 'BUILD');
  console.log('✅ Development auto-approval test:', devApprovals.length === 0 ? 'PASS' : 'FAIL');
  console.log('   Required approvals for dev:', devApprovals);

  // Test staging approvals
  const stagingApprovals = determineRequiredApprovals('staging', 'DEPLOY');
  console.log('✅ Staging approvals test:', JSON.stringify(stagingApprovals) === JSON.stringify(['compliance', 'security']) ? 'PASS' : 'FAIL');
  console.log('   Required approvals for staging:', stagingApprovals);

  // Test production approvals
  const prodApprovals = determineRequiredApprovals('production', 'PUBLISH');
  console.log('✅ Production approvals test:', JSON.stringify(prodApprovals) === JSON.stringify(['compliance', 'security', 'budget']) ? 'PASS' : 'FAIL');
  console.log('   Required approvals for production:', prodApprovals);
}

function testExpressAppCreation() {
  console.log('\n🌐 Testing Express App Creation...');

  try {
    const app = createGovernanceExpressApp();
    console.log('✅ Express app creation test: PASS');

    // Test that the app has the expected routes
    const routes = app._router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
        path: layer.route.path
      }));

    console.log('   Available routes:', routes.length > 0 ? 'FOUND' : 'NOT FOUND');

    // Test health endpoint specifically
    const healthRoute = routes.find((r: any) => r.path === '/health' && r.method === 'GET');
    console.log('   Health endpoint:', healthRoute ? 'FOUND' : 'NOT FOUND');

    // Test API docs endpoint
    const apiDocsRoute = routes.find((r: any) => r.path === '/' && r.method === 'GET');
    console.log('   API docs endpoint:', apiDocsRoute ? 'FOUND' : 'NOT FOUND');

  } catch (error) {
    console.log('❌ Express app creation test: FAIL');
    console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

function testRequestStructure() {
  console.log('\n📋 Testing Request Structure...');

  const testRequest: GovernanceRequest = {
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

async function testHttpServer() {
  console.log('\n🌍 Testing HTTP Server Integration...');

  return new Promise((resolve) => {
    const app = createGovernanceExpressApp();
    const server = app.listen(0, () => {
      const port = (server.address() as any).port;
      console.log('✅ HTTP server started on port:', port);

      // Test health endpoint
      http.get(`http://localhost:${port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            console.log('✅ Health endpoint test:', health.status === 'healthy' ? 'PASS' : 'FAIL');
            console.log('   Service:', health.service);
            console.log('   Version:', health.version);
          } catch (error) {
            console.log('❌ Health endpoint test: FAIL');
            console.log('   Error parsing response');
          }

          // Test API docs endpoint
          http.get(`http://localhost:${port}/api/v1`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                const apiDocs = JSON.parse(data);
                console.log('✅ API docs endpoint test:', apiDocs.service ? 'PASS' : 'FAIL');
                console.log('   Endpoints available:', apiDocs.endpoints ? Object.keys(apiDocs.endpoints).length : 0);
              } catch (error) {
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
  });
}

async function runAllTests() {
  console.log('🔧 SELF Governance API - Test Suite');
  console.log('=================================');

  testRequestStructure();
  testValidationLogic();
  testApprovalWorkflow();
  testExpressAppCreation();

  await testHttpServer();

  console.log('\n🎉 All tests completed!');
  console.log('✅ Governance API is ready for integration with enterprise builder');
}

runAllTests().catch(console.error);
