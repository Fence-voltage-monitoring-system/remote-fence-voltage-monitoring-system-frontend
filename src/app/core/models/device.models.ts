export type DeviceStatus = 'online' | 'warning' | 'offline';
export type DeviceType = 'Voltage Monitor';

export interface Device {
  id: string;
  name: string;
  serial: string;
  type: DeviceType;
  fence: string | null;
  section: string | null;
  status: DeviceStatus;
  voltage: number | null;
  signal: number;
  battery: number;
  lastSeen: string;
  enabled: boolean;
}

export interface CreateDevicePayload {
  name: string;
  serial: string;
  type?: DeviceType;
  fence?: string | null;
  section?: string | null;
}

export interface UpdateDevicePayload {
  name?: string;
  serial?: string;
  fence?: string | null;
  section?: string | null;
  status?: DeviceStatus;
  voltage?: number | null;
  signal?: number;
  battery?: number;
  enabled?: boolean;
}

export interface AssignDevicePayload {
  fence: string;
  section: string;
}
