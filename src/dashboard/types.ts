/**
 * Dashboard Types
 */

import type { EmotionalState } from '../config';

export interface DashboardConfig {
  enabled: boolean;
  wsPort: number;
  wsPath: string;
  metricsRefreshIntervalMs: number;
  historyRetentionMs: number;
  maxEventsStored: number;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  enabled: true,
  wsPort: 8080,
  wsPath: '/dashboard',
  metricsRefreshIntervalMs: 5000,
  historyRetentionMs: 3600000,
  maxEventsStored: 10000
};

export interface DashboardMetrics {
  totalSessions: number;
  activeSessions: number;
  stateDistribution: Record<EmotionalState, number>;
  totalTriggers: number;
  topTriggers: Array<{ trigger: string; count: number }>;
  averageSessionLength: number;
  crisisInterventions: number;
  violations: number;
  uptimeMs: number;
  lastUpdated: string;
}

export interface StateTransitionEvent {
  sessionId: string;
  userId: string;
  fromState: EmotionalState;
  toState: EmotionalState;
  trigger: string;
  confidence: 'low' | 'medium' | 'high';
  scores: Record<string, number>;
  timestamp: string;
}

export interface DoctrineViolationEvent {
  sessionId: string;
  userId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, unknown>;
  timestamp: string;
}

export interface AlertEvent {
  type: 'crisis' | 'violation' | 'anomaly' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardWSMessage {
  type: 'state_transition' | 'doctrine_violation' | 'metrics_update' | 'alert';
  timestamp: string;
  data: unknown;
}

export interface DashboardEventStore {
  stateTransitions: StateTransitionEvent[];
  violations: DoctrineViolationEvent[];
  alerts: AlertEvent[];
  sessionData: Map<string, SessionData>;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  currentState: EmotionalState;
  startedAt: string;
  lastActivity: string;
  transitionCount: number;
  triggerHistory: string[];
}