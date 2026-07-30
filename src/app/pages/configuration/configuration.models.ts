export interface VoltageThresholds{healthyKv:number;warningKv:number;criticalKv:number;lowBatteryPercent:number;}
export interface GeneralConfiguration {
  systemName: string;
  organizationName: string;
  systemCode: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12_HOUR' | '24_HOUR';
  language: string;
  voltageUnit: string;
  distanceUnit: string;
  coordinateFormat: string;
  expectedReportingIntervalMinutes: number;
  lateArrivalGraceMinutes: number;
  offlineTimeoutMinutes: number;
  staleDataMinutes: number;
  defaultHistoryPeriod: string;
  pageSize: number;
  maintenanceMode: boolean;
  allowLoginDuringMaintenance: boolean;
  readOnlyMode: boolean;
  maintenanceMessage: string;
}
export interface AlertRuleSettings {
  lowVoltageEnabled: boolean;
  criticalVoltageEnabled: boolean;
  wireBreakEnabled: boolean;
  gatewayOfflineEnabled: boolean;
  lowBatteryEnabled: boolean;
  criticalBatteryEnabled: boolean;
  criticalBatteryPercent: number;
  solarFailureEnabled: boolean;
  voltageFluctuationEnabled: boolean;
  fluctuationCount: number;
  fluctuationWindowMinutes: number;
  abnormalReadingsRequired: number;
  healthyReadingsRequired: number;
  cooldownMinutes: number;
  autoResolve: boolean;
  inAppEnabled: boolean;
  websocketEnabled: boolean;
  smsEnabled: boolean;
  escalationEnabled: boolean;
  acknowledgementTimeoutMinutes: number;
  maintenanceAcceptanceTimeoutMinutes: number;
  notifySuperAdmins: boolean;
  notifyRegionalAdmins: boolean;
  notifyFieldAdmins: boolean;
  notifyMaintenance: boolean;
}
export interface NotificationSettings {
  inAppEnabled: boolean;
  websocketEnabled: boolean;
  smsEnabled: boolean;
  criticalAlertsEnabled: boolean;
  warningAlertsEnabled: boolean;
  maintenanceUpdatesEnabled: boolean;
  systemUpdatesEnabled: boolean;
}
export interface DataRetentionSettings {
  rawTelemetryDays: number;
  hourlySummaryDays: number;
  dailySummaryDays: number;
  alertIncidentDays: number;
  notificationDays: number;
  auditLogDays: number;
  systemLogDays: number;
  generatedReportDays: number;
  archiveBeforeDeletion: boolean;
  automaticCleanupEnabled: boolean;
  cleanupSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  cleanupTime: string;
}
export interface SecurityPolicySettings {
  minimumPasswordLength: number;
  passwordHistoryCount: number;
  temporaryPasswordExpiryHours: number;
  forceChangeAfterReset: boolean;
  failedLoginAttempts: number;
  failedAttemptWindowMinutes: number;
  accountLockMinutes: number;
  requireMfaForSuperAdmins: boolean;
  requireMfaForOtherAdmins: boolean;
  inactiveAccountDays: number;
  notifyOnAccountLockout: boolean;
  notifyOnPasswordChange: boolean;
  notifyOnNewDeviceLogin: boolean;
  notifyOnScopeChange: boolean;
}
export interface SessionManagementSettings {
  maximumSessionHours: number;
  idleTimeoutMinutes: number;
  rememberMeDays: number;
  logoutWarningMinutes: number;
  maximumConcurrentSessions: number;
  newLoginBehaviour: 'REVOKE_OLDEST' | 'REJECT_NEW';
  requireReauthentication: boolean;
  reauthenticationValidityMinutes: number;
  revokeOnPasswordChange: boolean;
  revokeOnPasswordReset: boolean;
  revokeOnRoleOrScopeChange: boolean;
  revokeOnAccountDeactivation: boolean;
  revokeOnSuspiciousLogin: boolean;
}
export interface ActiveSessionRecord {
  id: string;
  userId: number;
  userName: string;
  role: string;
  device: string;
  browser: string;
  ipAddress: string;
  approximateLocation: string;
  signedInAt: string;
  lastActivityAt: string;
  expiresAt: string;
  current: boolean;
  suspicious: boolean;
}
export interface SessionOverview {
  totalActiveSessions: number;
  activeUsers: number;
  administratorSessions: number;
  expiringSoon: number;
  suspiciousSessions: number;
  sessions: ActiveSessionRecord[];
}
export type ConfigurationSection='general'|'voltage'|'alerts'|'notifications'|'retention'|'security'|'sessions'|'map'|'health';
