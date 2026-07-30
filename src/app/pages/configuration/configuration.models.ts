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
  escalationDelayMinutes: number;
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
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  markAsReadOnOpen: boolean;
  retentionDays: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  allowCriticalDuringQuietHours: boolean;
  digestEnabled: boolean;
  digestIntervalMinutes: number;
  groupSimilarNotifications: boolean;
  groupingWindowMinutes: number;
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
export type ConfigurationSection='general'|'voltage'|'alerts'|'notifications'|'retention'|'security'|'sessions'|'map'|'health';
