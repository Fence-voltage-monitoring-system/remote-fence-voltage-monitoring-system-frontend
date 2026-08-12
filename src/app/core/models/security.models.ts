export interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export interface SecurityActivity {
  id: string;
  action: string;
  time: string;
  location: string;
  result: 'success' | 'failed' | 'warning';
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
