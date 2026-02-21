/**
 * Dashboard WebSocket Server
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import type { DashboardWSMessage, StateTransitionEvent, DoctrineViolationEvent, AlertEvent, DashboardConfig } from './types';
import { getDashboardStore, calculateMetrics, DashboardEventStoreImpl } from './metrics-collector';
import { DEFAULT_DASHBOARD_CONFIG } from './types';

interface DashboardClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  connectedAt: string;
  lastActivity: string;
}

export class DashboardWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, DashboardClient> = new Map();
  private store: DashboardEventStoreImpl;
  private config: DashboardConfig;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: DashboardConfig = DEFAULT_DASHBOARD_CONFIG) {
    this.config = config;
    this.store = getDashboardStore(config);
  }

  attachToServer(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: this.config.wsPath });
    this.setupHandlers();
    this.startMetricsBroadcast();
  }

  start(port?: number): void {
    this.wss = new WebSocketServer({ port: port || this.config.wsPort });
    this.setupHandlers();
    this.startMetricsBroadcast();
  }

  stop(): void {
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

  private setupHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      const client: DashboardClient = {
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

      ws.on('message', (data: Buffer) => {
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

  private sendToClient(client: DashboardClient, message: DashboardWSMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: DashboardWSMessage): void {
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(message.type)) {
        this.sendToClient(client, message);
      }
    }
  }

  private startMetricsBroadcast(): void {
    this.metricsInterval = setInterval(() => {
      this.broadcast({
        type: 'metrics_update',
        timestamp: new Date().toISOString(),
        data: calculateMetrics(this.store)
      });
    }, this.config.metricsRefreshIntervalMs);
  }

  broadcastStateTransition(event: StateTransitionEvent): void {
    this.broadcast({
      type: 'state_transition',
      timestamp: event.timestamp,
      data: event
    });
  }

  broadcastDoctrineViolation(event: DoctrineViolationEvent): void {
    this.broadcast({
      type: 'doctrine_violation',
      timestamp: event.timestamp,
      data: event
    });
  }

  broadcastAlert(event: AlertEvent): void {
    this.broadcast({
      type: 'alert',
      timestamp: event.timestamp,
      data: event
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

let serverInstance: DashboardWebSocketServer | null = null;

export function getDashboardWebSocketServer(config?: DashboardConfig): DashboardWebSocketServer {
  if (!serverInstance) {
    serverInstance = new DashboardWebSocketServer(config);
  }
  return serverInstance;
}