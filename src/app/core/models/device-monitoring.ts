export type DeviceStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface DeviceMonitoringContext {
  fenceId: string;
  fenceName: string;
  sectionId: string;
  deviceId: string;
  voltage: number;
  battery: number;
  status: DeviceStatus;
}
