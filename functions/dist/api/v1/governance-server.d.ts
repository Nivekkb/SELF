/**
 * SELF Governance API Server
 *
 * This module creates an Express server for the governance API
 * and integrates it with the main SELF HTTP server.
 */
import express from 'express';
import { Server } from 'node:http';
export declare function createGovernanceExpressApp(): import("express-serve-static-core").Express;
export declare function integrateGovernanceApiWithHttpServer(server: Server, governanceApp: express.Express): void;
export declare function startStandaloneGovernanceServer(port?: number): Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export type { GovernanceRequest, GovernanceResponse, GovernanceStatusResponse, GovernanceError } from './governance';
//# sourceMappingURL=governance-server.d.ts.map