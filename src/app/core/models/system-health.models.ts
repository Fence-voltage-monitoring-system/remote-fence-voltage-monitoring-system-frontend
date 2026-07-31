export type HealthState = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';

export interface CoreServiceHealth {
  id: string;
  name: string;
  state: HealthState;
  responseTimeMs: number | null;
  lastSuccessfulCheck: string;
  message: string | null;
}

export interface GatewayHealthSummary {
  total: number;
  online: number;
  offline: number;
  lateReporting: number;
  communicationSuccessPercent: number;
  latestTelemetryAt: string | null;
}

export interface UnhealthyGateway {
  id: number;
  code: string;
  fenceCode: string;
  state: 'OFFLINE' | 'LATE';
  lastCommunicationAt: string;
  nextExpectedAt: string;
  delayMinutes: number;
}

export interface BackgroundJobHealth {
  id: string;
  name: string;
  result: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'SCHEDULED';
  lastRunAt: string | null;
  nextRunAt: string | null;
  durationMs: number | null;
  retryAllowed: boolean;
}

export interface SystemHealthEvent {
  id: string;
  occurredAt: string;
  component: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  status: 'OPEN' | 'RESOLVED';
}

export interface SystemHealthSnapshot {
  overallState: HealthState;
  uptimeSeconds: number;
  activeIssues: number;
  checkedAt: string;
  services: CoreServiceHealth[];
  gatewaySummary: GatewayHealthSummary;
  unhealthyGateways: UnhealthyGateway[];
  jobs: BackgroundJobHealth[];
  events: SystemHealthEvent[];
}
