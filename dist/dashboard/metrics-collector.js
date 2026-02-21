/**
 * Dashboard Metrics Collector
 */
import { DEFAULT_DASHBOARD_CONFIG } from './types.js';
export class DashboardEventStoreImpl {
    constructor(config = DEFAULT_DASHBOARD_CONFIG) {
        this.stateTransitions = [];
        this.violations = [];
        this.alerts = [];
        this.sessionData = new Map();
        this.config = config;
        this.startTime = Date.now();
    }
    recordStateTransition(event) {
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
        }
        else {
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
    recordViolation(event) {
        this.violations.push(event);
        if (this.violations.length > this.config.maxEventsStored) {
            this.violations.shift();
        }
    }
    recordAlert(event) {
        this.alerts.push(event);
        if (this.alerts.length > this.config.maxEventsStored) {
            this.alerts.shift();
        }
    }
    clear() {
        this.stateTransitions = [];
        this.violations = [];
        this.alerts = [];
        this.sessionData.clear();
    }
}
let storeInstance = null;
export function getDashboardStore(config) {
    if (!storeInstance) {
        storeInstance = new DashboardEventStoreImpl(config);
    }
    return storeInstance;
}
export function calculateMetrics(store) {
    const now = Date.now();
    const stateDistribution = {
        'S0': 0, 'S0_GUARDED': 0, 'S1': 0, 'S2': 0, 'S3': 0
    };
    store.sessionData.forEach(session => {
        stateDistribution[session.currentState]++;
    });
    const triggerCounts = {};
    store.stateTransitions.forEach(event => {
        triggerCounts[event.trigger] = (triggerCounts[event.trigger] || 0) + 1;
    });
    const topTriggers = Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    const crisisInterventions = store.stateTransitions.filter(e => e.toState === 'S3').length;
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
//# sourceMappingURL=metrics-collector.js.map