/**
 * Dashboard WebSocket Server
 */
import { Server as HttpServer } from 'http';
import type { StateTransitionEvent, DoctrineViolationEvent, AlertEvent, DashboardConfig } from './types';
export declare class DashboardWebSocketServer {
    private wss;
    private clients;
    private store;
    private config;
    private metricsInterval;
    constructor(config?: DashboardConfig);
    attachToServer(server: HttpServer): void;
    start(port?: number): void;
    stop(): void;
    private setupHandlers;
    private sendToClient;
    private broadcast;
    private startMetricsBroadcast;
    broadcastStateTransition(event: StateTransitionEvent): void;
    broadcastDoctrineViolation(event: DoctrineViolationEvent): void;
    broadcastAlert(event: AlertEvent): void;
    getConnectedClientsCount(): number;
}
export declare function getDashboardWebSocketServer(config?: DashboardConfig): DashboardWebSocketServer;
//# sourceMappingURL=websocket-server.d.ts.map