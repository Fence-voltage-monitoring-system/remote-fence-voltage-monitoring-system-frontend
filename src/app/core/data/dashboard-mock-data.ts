import { DashboardOverviewResponse, DeviceAnalyticsResponse } from '../models/dashboard-api';
import { DeviceMonitoringContext, DeviceStatus } from '../models/device-monitoring';

export const MOCK_DASHBOARD_OVERVIEW: DashboardOverviewResponse = {
  summary: { totalFences: 5, totalDevices: 90, activeDevices: 78, criticalAlerts: 2, lowVoltageFences: 2 },
  selectedDevice: {
    fenceId: 'monaragala',
    fenceName: 'Monaragala Elephant Protection Fence',
    sectionId: 'SEC-005',
    deviceId: 'GTW-MNR-01-005',
    voltage: 5.9,
    battery: 91,
    status: 'healthy',
  },
};

export function createMockDeviceAnalytics(deviceId: string): DeviceAnalyticsResponse {
  const seed = [...deviceId].reduce((total, character) => total + character.charCodeAt(0), 0);
  const statuses: DeviceStatus[] = ['healthy', 'healthy', 'warning', 'critical', 'healthy', 'offline'];
  const status = statuses[seed % statuses.length];
  const voltage = status === 'offline' ? 0 : status === 'critical' ? 0.8 : status === 'warning' ? 4.2 : 5.9;
  const device: DeviceMonitoringContext = {
    fenceId: 'monaragala', fenceName: 'Monaragala Elephant Protection Fence',
    sectionId: `SEC-${deviceId.slice(-3)}`, deviceId, voltage,
    battery: status === 'offline' ? 0 : 62 + (seed % 35), status,
  };
  const now = Date.now();
  const voltageHistory = Array.from({ length: 25 }, (_, index) => ({
    recordedAt: new Date(now - (24 - index) * 60 * 60_000).toISOString(),
    voltage: status === 'offline' ? 0 : Number(Math.max(0, voltage + Math.sin(index / 2.2) * 0.42 + Math.cos(index / 3) * 0.18).toFixed(2)),
  }));
  const reference = `${device.sectionId} · ${device.deviceId}`;
  return {
    device,
    voltageHistory,
    alerts: [
      { id: `${deviceId}-1`, title: status === 'critical' ? 'Voltage Drop' : status === 'offline' ? 'Device Offline' : 'Reading Restored', reference, occurredAt: new Date(now - 4 * 60_000).toISOString(), status },
      { id: `${deviceId}-2`, title: device.battery < 50 ? 'Low Battery' : 'Battery Normal', reference, occurredAt: new Date(now - 22 * 60_000).toISOString(), status: device.battery < 50 ? 'warning' : 'healthy' },
      { id: `${deviceId}-3`, title: 'Telemetry Received', reference, occurredAt: new Date(now - 51 * 60_000).toISOString(), status: 'healthy' },
    ],
    alertCounts: { critical: status === 'critical' ? 1 : 0, warning: status === 'warning' ? 1 : 0, offline: status === 'offline' ? 1 : 0, resolved: 18 },
  };
}
