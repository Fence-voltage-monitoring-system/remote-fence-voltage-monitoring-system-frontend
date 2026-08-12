export type GatewayStatus = 'online' | 'warning' | 'offline';

export interface Gateway {
  id: string;
  name: string;
  serial: string;
  imei: string;
  fences: string[];
  status: GatewayStatus;
  signal: number;
  power: number;
  devices: number;
  lastSeen: string;
  firmware: string;
  enabled: boolean;
}

export interface CreateGatewayPayload {
  name: string;
  serial: string;
  imei: string;
  fences?: string[];
  firmware?: string;
}

export interface UpdateGatewayPayload {
  name?: string;
  serial?: string;
  imei?: string;
  fences?: string[];
  firmware?: string;
  enabled?: boolean;
}
