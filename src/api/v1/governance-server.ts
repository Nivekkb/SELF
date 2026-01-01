/**
 * SELF Governance API Server
 *
 * This module creates an Express server for the governance API
 * and integrates it with the main SELF HTTP server.
 */

import express from 'express';
import bodyParser from 'body-parser';
import { createGovernanceRouter } from './governance';
import { createBuilderIntegrationRouter } from './builder-integration';
import { getGovernanceConfigManager } from './governance-config';
import { Server } from 'node:http';

export function createGovernanceExpressApp() {
  const app = express();

  // Middleware
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'self-governance-api',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // API version prefix
  const apiRouter = express.Router();
  app.use('/api/v1', apiRouter);

  // Mount governance router
  const governanceRouter = createGovernanceRouter();
  apiRouter.use('/governance', governanceRouter);

  // Mount builder integration router
  const builderIntegrationRouter = createBuilderIntegrationRouter();
  apiRouter.use('/builder', builderIntegrationRouter);

  // API documentation endpoint
  apiRouter.get('/', (req, res) => {
    res.json({
      service: 'SELF Governance API',
      version: '1.0.0',
      endpoints: {
        // Governance endpoints
        submitRequest: 'POST /api/v1/governance/requests',
        getRequestStatus: 'GET /api/v1/governance/requests/{id}',
        listRequests: 'GET /api/v1/governance/requests',

        // Builder integration endpoints
        integrationConfig: 'GET /api/v1/builder/integration-config',
        governanceConfig: 'GET /api/v1/builder/governance-config',
        updateConfig: 'POST /api/v1/builder/governance-config',
        governanceStatus: 'POST /api/v1/builder/governance-status',
        builderHealth: 'GET /api/v1/builder/health',

        // Common endpoints
        health: 'GET /health'
      },
      documentation: 'See SELF Governance API documentation for detailed usage'
    });
  });

  return app;
}

export function integrateGovernanceApiWithHttpServer(server: Server, governanceApp: express.Express) {
  // Store the governance app on the server object for later use
  (server as any).__governanceApp = governanceApp;

  // Override the server's request listener to handle both original and governance routes
  const originalRequestListener = server.listeners('request')[0];

  server.removeAllListeners('request');

  server.on('request', (req, res) => {
    // Check if this is a governance API request
    const url = req.url || '';
    if (url.startsWith('/api/v1/governance') || url.startsWith('/health')) {
      // Handle with Express governance app
      governanceApp(req, res);
    } else {
      // Handle with original SELF HTTP server
      originalRequestListener(req, res);
    }
  });
}

export function startStandaloneGovernanceServer(port: number = 3001) {
  const app = createGovernanceExpressApp();
  const server = app.listen(port, () => {
    console.log(`SELF Governance API server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`API docs: http://localhost:${port}/api/v1`);
  });

  return server;
}

// Export types from governance module for convenience
export type {
  GovernanceRequest,
  GovernanceResponse,
  GovernanceStatusResponse,
  GovernanceError
} from './governance';
