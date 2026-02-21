/**
 * Dashboard Metrics Collector
 */
import type { DashboardConfig, DashboardMetrics, DashboardEventStore, StateTransitionEvent, DoctrineViolationEvent, AlertEvent, SessionData } from './types';
export declare class DashboardEventStoreImpl implements DashboardEventStore {
    stateTransitions: StateTransitionEvent[];
    violations: DoctrineViolationEvent[];
    alerts: AlertEvent[];
    sessionData: Map<string, SessionData>;
    private config;
    private startTime;
    constructor(config?: DashboardConfig);
    recordStateTransition(event: StateTransitionEvent): void;
    recordViolation(event: DoctrineViolationEvent): void;
    recordAlert(event: AlertEvent): void;
    clear(): void;
}
export declare function getDashboardStore(config?: DashboardConfig): DashboardEventStoreImpl;
export declare function calculateMetrics(store: DashboardEventStore): DashboardMetrics;
//# sourceMappingURL=metrics-collector.d.ts.map