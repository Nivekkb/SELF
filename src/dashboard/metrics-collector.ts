/**
 * Dashboard Metrics Collector
 */

import type { EmotionalState } from '../config';
import type {
  DashboardConfig,
  DashboardMetrics,
  DashboardEventStore,
  StateTransitionEvent,
  DoctrineViolationEvent,
  AlertEvent,
  SessionData
} from './types';
import { DEFAULT_DASHBOARD_CONFIG } from './types';

export class DashboardEventStoreImpl implements DashboardEventStore {
  stateTransitions: StateTransitionEvent[] = [];
  violations: DoctrineViolationEvent[] = [];
  alerts: AlertEvent[] = [];
  sessionData: Map<string, SessionData> = new Map();
  
  private config: DashboardConfig;
  private startTime: number;

  constructor(config: DashboardConfig = DEFAULT_DASHBOARD_CONFIG) {
    this.config = config;
    this.startTime = Date.now();
  }

  recordStateTransition(event: StateTransitionEvent): void {
    this.stateTransitions.push(event);
    if (this.stateTransitions.length > this.config.maxEventsStored) {
      this.stateTransitions.shift();
    }
    
    const session = this.sessionData.get(event.sessionId);
    if (session) {
      session.currentState = event.toState;
      session.lastActivity = event.timestamp;
      session.transitionCount++;
      session.triggerHistory.push(event.trigger);
    } else {
      this.sessionData.set(event.sessionId, {
        sessionId: event.sessionId,
        userId: event.userId,
        currentState: event.toState,
        startedAt: event.timestamp,
        lastActivity: event.timestamp,
        transitionCount: 1,
        triggerHistory: [event.trigger]
      });
    }
  }

  recordViolation(event: DoctrineViolationEvent): void {
    this.violations.push(event);
    if (this.violations.length > this.config.maxEventsStored) {
      this.violations.shift();
    }
  }

  recordAlert(event: AlertEvent): void {
    this.alerts.push(event);
    if (this.alerts.length > this.config.maxEventsStored) {
      this.alerts.shift();
    }
  }

  clear(): void {
    this.stateTransitions = [];
    this.violations = [];
    this.alerts = [];
    this.sessionData.clear();
  }
}

let storeInstance: DashboardEventStoreImpl | null = null;

export function getDashboardStore(config?: DashboardConfig): DashboardEventStoreImpl {
  if (!storeInstance) {
    storeInstance = new DashboardEventStoreImpl(config);
  }
  return storeInstance;
}

export function calculateMetrics(store: DashboardEventStore): DashboardMetrics {
  const now = Date.now();
  const stateDistribution: Record<EmotionalState, number> = {
    'S0': 0, 'S0_GUARDED': 0, 'S1': 0, 'S2': 0, 'S3': 0
  };

  store.sessionData.forEach(session => {
    stateDistribution[session.currentState]++;
  });

  const triggerCounts: Record<string, number> = {};
  store.stateTransitions.forEach(event => {
    triggerCounts[event.trigger] = (triggerCounts[event.trigger] || 0) + 1;
  });

  const topTriggers = Object.entries(triggerCounts)
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const crisisInterventions = store.stateTransitions.filter(
    e => e.toState === 'S3'
  ).length;

  let totalSessionLength = 0;
  store.sessionData.forEach(session => {
    const started = new Date(session.startedAt).getTime();
    const last = new Date(session.lastActivity).getTime();
    totalSessionLength += (last - started);
  });

  return {
    totalSessions: store.sessionData.size,
    activeSessions: store.sessionData.size,
    stateDistribution,
    totalTriggers: store.stateTransitions.length,
    topTriggers,
    averageSessionLength: store.sessionData.size > 0 
      ? totalSessionLength / store.sessionData.size 
      : 0,
    crisisInterventions,
    violations: store.violations.length,
    uptimeMs: now - (storeInstance?.['startTime'] || now),
    lastUpdated: new Date().toISOString()
  };
}