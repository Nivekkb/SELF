/**
 * Dashboard WebSocket Server
 */
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { getDashboardStore, calculateMetrics } from './metrics-collector.js';
import { DEFAULT_DASHBOARD_CONFIG } from './types.js';
export class DashboardWebSocketServer {
    constructor(config = DEFAULT_DASHBOARD_CONFIG) {
        this.wss = null;
        this.clients = new Map();
        this.metricsInterval = null;
        this.config = config;
        this.store = getDashboardStore(config);
    }
    attachToServer(server) {
        this.wss = new WebSocketServer({ server, path: this.config.wsPath });
        this.setupHandlers();
        this.startMetricsBroadcast();
    }
    start(port) {
        this.wss = new WebSocketServer({ port: port || this.config.wsPort });
        this.setupHandlers();
        this.startMetricsBroadcast();
    }
    stop() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        if (this.wss) {
            for (const client of this.clients.values()) {
                client.ws.close(1001, 'Server shutting down');
            }
            this.clients.clear();
            this.wss.close();
            this.wss = null;
        }
    }
    setupHandlers() {
        if (!this.wss)
            return;
        this.wss.on('connection', (ws) => {
            const client = {
                id: uuidv4(),
                ws,
                subscriptions: new Set(['state_transition', 'doctrine_violation', 'metrics_update', 'alert']),
                connectedAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };
            this.clients.set(client.id, client);
            // Send initial metrics
            this.sendToClient(client, {
                type: 'metrics_update',
                timestamp: new Date().toISOString(),
                data: calculateMetrics(this.store)
            });
            ws.on('message', (data) => {
                client.lastActivity = new Date().toISOString();
                // Handle subscription changes if needed
            });
            ws.on('close', () => {
                this.clients.delete(client.id);
            });
            ws.on('error', () => {
                this.clients.delete(client.id);
            });
        });
    }
    sendToClient(client, message) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }
    broadcast(message) {
        for (const client of this.clients.values()) {
            if (client.subscriptions.has(message.type)) {
                this.sendToClient(client, message);
            }
        }
    }
    startMetricsBroadcast() {
        this.metricsInterval = setInterval(() => {
            this.broadcast({
                type: 'metrics_update',
                timestamp: new Date().toISOString(),
                data: calculateMetrics(this.store)
            });
        }, this.config.metricsRefreshIntervalMs);
    }
    broadcastStateTransition(event) {
        this.broadcast({
            type: 'state_transition',
            timestamp: event.timestamp,
            data: event
        });
    }
    broadcastDoctrineViolation(event) {
        this.broadcast({
            type: 'doctrine_violation',
            timestamp: event.timestamp,
            data: event
        });
    }
    broadcastAlert(event) {
        this.broadcast({
            type: 'alert',
            timestamp: event.timestamp,
            data: event
        });
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
}
let serverInstance = null;
export function getDashboardWebSocketServer(config) {
    if (!serverInstance) {
        serverInstance = new DashboardWebSocketServer(config);
    }
    return serverInstance;
}
//# sourceMappingURL=websocket-server.js.map