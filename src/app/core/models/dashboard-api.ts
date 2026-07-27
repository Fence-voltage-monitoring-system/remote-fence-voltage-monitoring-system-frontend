import { DeviceMonitoringContext, DeviceStatus } from './device-monitoring';

export interface DashboardSummary { totalFences: number; totalDevices: number; activeDevices: number; criticalAlerts: number; lowVoltageFences: number; }
export interface DashboardOverviewResponse { summary: DashboardSummary; selectedDevice: DeviceMonitoringContext; }
export interface VoltageReading { recordedAt: string; voltage: number; }
export interface DashboardAlert { id: string; title: string; reference: string; occurredAt: string; status: DeviceStatus; }
export interface AlertCounts { critical: number; warning: number; offline: number; resolved: number; }
export interface DeviceAnalyticsResponse { device: DeviceMonitoringContext; voltageHistory: VoltageReading[]; alerts: DashboardAlert[]; alertCounts: AlertCounts; }
