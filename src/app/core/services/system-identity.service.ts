import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { catchError, of, tap } from 'rxjs';
import { AlertRuleSettings, GeneralConfiguration, NotificationSettings, VoltageThresholds } from '../../pages/configuration/configuration.models';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  inAppEnabled: true,
  websocketEnabled: true,
  smsEnabled: true,
  criticalAlertsEnabled: true,
  warningAlertsEnabled: true,
  maintenanceUpdatesEnabled: true,
  systemUpdatesEnabled: true,
};

export const DEFAULT_VOLTAGE_THRESHOLDS: VoltageThresholds = {
  healthyKv: 5.0,
  warningKv: 3.0,
  criticalKv: 1.5,
  lowBatteryPercent: 20,
};

export const DEFAULT_ALERT_RULES: AlertRuleSettings = {
  lowVoltageEnabled: true,
  criticalVoltageEnabled: true,
  wireBreakEnabled: true,
  gatewayOfflineEnabled: true,
  lowBatteryEnabled: true,
  criticalBatteryEnabled: true,
  criticalBatteryPercent: 10,
  solarFailureEnabled: true,
  voltageFluctuationEnabled: true,
  fluctuationCount: 4,
  fluctuationWindowMinutes: 10,
  abnormalReadingsRequired: 1,
  healthyReadingsRequired: 2,
  cooldownMinutes: 30,
  autoResolve: true,
  inAppEnabled: true,
  websocketEnabled: true,
  smsEnabled: true,
  escalationEnabled: true,
  acknowledgementTimeoutMinutes: 10,
  maintenanceAcceptanceTimeoutMinutes: 15,
  notifySuperAdmins: true,
  notifyRegionalAdmins: true,
  notifyFieldAdmins: true,
  notifyMaintenance: true,
};

export const DEFAULT_GENERAL_CONFIGURATION: GeneralConfiguration = {
  systemName: 'Remote Elephant Fence Monitoring System',
  organizationName: 'NERDC',
  systemCode: 'EF-MON',
  supportEmail: 'support@nerdc.lk',
  supportPhone: '+94112223344',
  timezone: 'Asia/Colombo',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24_HOUR',
  language: 'en',
  voltageUnit: 'kV',
  distanceUnit: 'km',
  coordinateFormat: 'DECIMAL_DEGREES',
  expectedReportingIntervalMinutes: 15,
  lateArrivalGraceMinutes: 5,
  offlineTimeoutMinutes: 30,
  staleDataMinutes: 60,
  defaultHistoryPeriod: '24h',
  pageSize: 10,
  maintenanceMode: false,
  allowLoginDuringMaintenance: true,
  readOnlyMode: false,
  maintenanceMessage: 'System is undergoing scheduled maintenance.'
};

/**
 * Shared system identity and branding service that keeps application headers,
 * login page branding, support contact details, and browser page title in sync
 * with the System Configuration.
 */
@Injectable({ providedIn: 'root' })
export class SystemIdentityService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly titleService = inject(Title);
  private readonly state = signal<GeneralConfiguration>(DEFAULT_GENERAL_CONFIGURATION);
  private readonly voltageState = signal<VoltageThresholds>(DEFAULT_VOLTAGE_THRESHOLDS);
  private readonly alertsState = signal<AlertRuleSettings>(DEFAULT_ALERT_RULES);
  private readonly notificationsState = signal<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  private loaded = false;
  private loading = false;

  readonly config = this.state.asReadonly();
  readonly voltageConfig = this.voltageState.asReadonly();
  readonly alertConfig = this.alertsState.asReadonly();
  readonly notificationConfig = this.notificationsState.asReadonly();
  readonly systemName = computed(() => this.state().systemName || DEFAULT_GENERAL_CONFIGURATION.systemName);
  readonly organizationName = computed(() => this.state().organizationName || DEFAULT_GENERAL_CONFIGURATION.organizationName);
  readonly systemCode = computed(() => this.state().systemCode || DEFAULT_GENERAL_CONFIGURATION.systemCode);
  readonly supportEmail = computed(() => this.state().supportEmail || DEFAULT_GENERAL_CONFIGURATION.supportEmail);
  readonly supportPhone = computed(() => this.state().supportPhone || DEFAULT_GENERAL_CONFIGURATION.supportPhone);

  // Alert Rule Signals
  readonly autoResolve = computed(() => this.alertsState().autoResolve ?? DEFAULT_ALERT_RULES.autoResolve);
  readonly abnormalReadingsRequired = computed(() => this.alertsState().abnormalReadingsRequired ?? DEFAULT_ALERT_RULES.abnormalReadingsRequired);
  readonly healthyReadingsRequired = computed(() => this.alertsState().healthyReadingsRequired ?? DEFAULT_ALERT_RULES.healthyReadingsRequired);
  readonly cooldownMinutes = computed(() => this.alertsState().cooldownMinutes ?? DEFAULT_ALERT_RULES.cooldownMinutes);
  readonly criticalBatteryPercent = computed(() => this.alertsState().criticalBatteryPercent ?? DEFAULT_ALERT_RULES.criticalBatteryPercent);
  readonly gatewayOfflineEnabled = computed(() => this.alertsState().gatewayOfflineEnabled ?? DEFAULT_ALERT_RULES.gatewayOfflineEnabled);
  readonly lowBatteryEnabled = computed(() => this.alertsState().lowBatteryEnabled ?? DEFAULT_ALERT_RULES.lowBatteryEnabled);
  readonly criticalBatteryEnabled = computed(() => this.alertsState().criticalBatteryEnabled ?? DEFAULT_ALERT_RULES.criticalBatteryEnabled);
  readonly solarFailureEnabled = computed(() => this.alertsState().solarFailureEnabled ?? DEFAULT_ALERT_RULES.solarFailureEnabled);
  readonly inAppEnabled = computed(() => this.alertsState().inAppEnabled ?? DEFAULT_ALERT_RULES.inAppEnabled);
  readonly websocketEnabled = computed(() => this.alertsState().websocketEnabled ?? DEFAULT_ALERT_RULES.websocketEnabled);
  readonly smsEnabled = computed(() => this.alertsState().smsEnabled ?? DEFAULT_ALERT_RULES.smsEnabled);
  readonly notifySuperAdmins = computed(() => this.alertsState().notifySuperAdmins ?? DEFAULT_ALERT_RULES.notifySuperAdmins);
  readonly notifyRegionalAdmins = computed(() => this.alertsState().notifyRegionalAdmins ?? DEFAULT_ALERT_RULES.notifyRegionalAdmins);
  readonly notifyFieldAdmins = computed(() => this.alertsState().notifyFieldAdmins ?? DEFAULT_ALERT_RULES.notifyFieldAdmins);
  readonly notifyMaintenance = computed(() => this.alertsState().notifyMaintenance ?? DEFAULT_ALERT_RULES.notifyMaintenance);
  readonly escalationEnabled = computed(() => this.alertsState().escalationEnabled ?? DEFAULT_ALERT_RULES.escalationEnabled);
  readonly acknowledgementTimeoutMinutes = computed(() => this.alertsState().acknowledgementTimeoutMinutes ?? DEFAULT_ALERT_RULES.acknowledgementTimeoutMinutes);
  readonly maintenanceAcceptanceTimeoutMinutes = computed(() => this.alertsState().maintenanceAcceptanceTimeoutMinutes ?? DEFAULT_ALERT_RULES.maintenanceAcceptanceTimeoutMinutes);

  // Global Notification Settings Signals
  readonly globalInAppEnabled = computed(() => this.notificationsState().inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.inAppEnabled);
  readonly globalWebsocketEnabled = computed(() => this.notificationsState().websocketEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.websocketEnabled);
  readonly globalSmsEnabled = computed(() => this.notificationsState().smsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.smsEnabled);
  readonly criticalAlertsEnabled = computed(() => this.notificationsState().criticalAlertsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.criticalAlertsEnabled);
  readonly warningAlertsEnabled = computed(() => this.notificationsState().warningAlertsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.warningAlertsEnabled);
  readonly maintenanceUpdatesEnabled = computed(() => this.notificationsState().maintenanceUpdatesEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.maintenanceUpdatesEnabled);
  readonly systemUpdatesEnabled = computed(() => this.notificationsState().systemUpdatesEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.systemUpdatesEnabled);

  // Regional Settings Signals
  readonly timezone = computed(() => this.state().timezone || DEFAULT_GENERAL_CONFIGURATION.timezone);
  readonly dateFormat = computed(() => this.state().dateFormat || DEFAULT_GENERAL_CONFIGURATION.dateFormat);
  readonly timeFormat = computed(() => this.state().timeFormat || DEFAULT_GENERAL_CONFIGURATION.timeFormat);
  readonly voltageUnit = computed(() => this.state().voltageUnit || DEFAULT_GENERAL_CONFIGURATION.voltageUnit);
  readonly distanceUnit = computed(() => this.state().distanceUnit || DEFAULT_GENERAL_CONFIGURATION.distanceUnit);
  readonly coordinateFormat = computed(() => this.state().coordinateFormat || DEFAULT_GENERAL_CONFIGURATION.coordinateFormat);

  // Gateway Update Expectations Signals
  readonly expectedReportingIntervalMinutes = computed(() => this.state().expectedReportingIntervalMinutes ?? DEFAULT_GENERAL_CONFIGURATION.expectedReportingIntervalMinutes);
  readonly lateArrivalGraceMinutes = computed(() => this.state().lateArrivalGraceMinutes ?? DEFAULT_GENERAL_CONFIGURATION.lateArrivalGraceMinutes);
  readonly offlineTimeoutMinutes = computed(() => this.state().offlineTimeoutMinutes ?? DEFAULT_GENERAL_CONFIGURATION.offlineTimeoutMinutes);
  readonly staleDataMinutes = computed(() => this.state().staleDataMinutes ?? DEFAULT_GENERAL_CONFIGURATION.staleDataMinutes);
  readonly defaultHistoryPeriod = computed(() => this.state().defaultHistoryPeriod || DEFAULT_GENERAL_CONFIGURATION.defaultHistoryPeriod);
  readonly pageSize = computed(() => this.state().pageSize || DEFAULT_GENERAL_CONFIGURATION.pageSize);

  // System Mode Signals
  readonly maintenanceMode = computed(() => this.state().maintenanceMode ?? DEFAULT_GENERAL_CONFIGURATION.maintenanceMode);
  readonly allowLoginDuringMaintenance = computed(() => this.state().allowLoginDuringMaintenance ?? DEFAULT_GENERAL_CONFIGURATION.allowLoginDuringMaintenance);
  readonly readOnlyMode = computed(() => this.state().readOnlyMode ?? DEFAULT_GENERAL_CONFIGURATION.readOnlyMode);
  readonly maintenanceMessage = computed(() => this.state().maintenanceMessage || DEFAULT_GENERAL_CONFIGURATION.maintenanceMessage);

  // Voltage Threshold Signals
  readonly healthyKv = computed(() => this.voltageState().healthyKv ?? DEFAULT_VOLTAGE_THRESHOLDS.healthyKv);
  readonly warningKv = computed(() => this.voltageState().warningKv ?? DEFAULT_VOLTAGE_THRESHOLDS.warningKv);
  readonly criticalKv = computed(() => this.voltageState().criticalKv ?? DEFAULT_VOLTAGE_THRESHOLDS.criticalKv);
  readonly lowBatteryPercent = computed(() => this.voltageState().lowBatteryPercent ?? DEFAULT_VOLTAGE_THRESHOLDS.lowBatteryPercent);

  getVoltageStatus(kv: number | null | undefined): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (kv === null || kv === undefined) return 'offline';
    if (kv < this.criticalKv()) return 'critical';
    if (kv < this.warningKv()) return 'warning';
    if (kv >= this.healthyKv()) return 'healthy';
    return 'warning';
  }

  getBatteryStatus(battery: number | null | undefined): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (battery === null || battery === undefined) return 'offline';
    const critical = this.criticalBatteryPercent();
    const low = this.lowBatteryPercent();
    if (battery <= critical) return 'critical';
    if (battery < low) return 'warning';
    return 'healthy';
  }

  isDataStale(value: Date | string | number | null | undefined): boolean {
    if (value === null || value === undefined || value === '') return true;
    const staleThreshold = this.staleDataMinutes();
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return true;
      const diffMin = (Date.now() - value.getTime()) / 60000;
      return diffMin > staleThreshold;
    }
    if (typeof value === 'number') {
      if (isNaN(value)) return true;
      const diffMin = (Date.now() - value) / 60000;
      return diffMin > staleThreshold;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === 'Just now' || trimmed === 'just now') return false;
      if (trimmed === 'Not installed' || trimmed === 'Unavailable' || trimmed === '—') return true;

      const minMatch = trimmed.match(/^(\d+)\s*min(?:\s*ago)?$/i);
      if (minMatch) return parseInt(minMatch[1], 10) > staleThreshold;

      const hrMatch = trimmed.match(/^(\d+)\s*hr(?:\s*ago)?$/i);
      if (hrMatch) return (parseInt(hrMatch[1], 10) * 60) > staleThreshold;

      const dayMatch = trimmed.match(/^(\d+)\s*days?(?:\s*ago)?$/i);
      if (dayMatch) return (parseInt(dayMatch[1], 10) * 1440) > staleThreshold;

      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const diffMin = (Date.now() - d.getTime()) / 60000;
        return diffMin > staleThreshold;
      }
    }
    return false;
  }

  formatDate(date: Date | string | number | null | undefined): string {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';

    const tz = this.timezone();
    const fmt = this.dateFormat();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value ?? '01';
    const month = parts.find(p => p.type === 'month')?.value ?? '01';
    const year = parts.find(p => p.type === 'year')?.value ?? '1970';

    if (fmt === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (fmt === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    return `${year}-${month}-${day}`;
  }

  formatTime(date: Date | string | number | null | undefined, includeSeconds = false): string {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';

    const tz = this.timezone();
    const is12 = this.timeFormat() === '12_HOUR';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: is12
    }).format(d);
  }

  formatDateTime(date: Date | string | number | null | undefined): string {
    if (!date) return '—';
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  formatVoltage(valueInKv: number | string | null | undefined, decimals = 1): string {
    if (valueInKv === null || valueInKv === undefined || valueInKv === '') return '—';
    const num = typeof valueInKv === 'string' ? parseFloat(valueInKv) : valueInKv;
    if (isNaN(num)) return '—';

    if (this.voltageUnit() === 'V') {
      return `${Math.round(num * 1000).toLocaleString('en-US')} V`;
    }
    return `${num.toFixed(decimals)} kV`;
  }

  formatDistance(valueInKm: number | string | null | undefined, decimals = 1): string {
    if (valueInKm === null || valueInKm === undefined || valueInKm === '') return '—';
    const num = typeof valueInKm === 'string' ? parseFloat(valueInKm) : valueInKm;
    if (isNaN(num)) return '—';

    if (this.distanceUnit() === 'm') {
      return `${Math.round(num * 1000).toLocaleString('en-US')} m`;
    }
    return `${num.toFixed(decimals)} km`;
  }

  formatCoordinates(lat: number | string | null | undefined, lng: number | string | null | undefined): string {
    if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') return '—';
    const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
    const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
    if (isNaN(numLat) || isNaN(numLng)) return `${lat}, ${lng}`;

    if (this.coordinateFormat() === 'DMS') {
      const toDms = (deg: number, isLat: boolean) => {
        const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
        const abs = Math.abs(deg);
        const d = Math.floor(abs);
        const mFloat = (abs - d) * 60;
        const m = Math.floor(mFloat);
        const s = Math.round((mFloat - m) * 60);
        return `${d}° ${m}' ${s}" ${dir}`;
      };
      return `${toDms(numLat, true)}, ${toDms(numLng, false)}`;
    }
    return `${numLat.toFixed(4)}, ${numLng.toFixed(4)}`;
  }

  formatGpsString(gps: string | null | undefined): string {
    if (!gps) return '—';
    const parts = gps.split(',');
    if (parts.length === 2) {
      return this.formatCoordinates(parts[0].trim(), parts[1].trim());
    }
    return gps;
  }

  load(): void {
    if (this.loaded || this.loading || !this.http) return;
    this.loading = true;
    this.http.get<{ section: string; value: GeneralConfiguration }>('/api/configuration/general', { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        tap(res => {
          this.loading = false;
          if (res?.value) {
            this.apply(res.value);
          }
        })
      )
      .subscribe();

    this.http.get<{ section: string; value: VoltageThresholds }>('/api/configuration/voltage', { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        tap(res => {
          if (res?.value) {
            this.applyVoltage(res.value);
          }
        })
      )
      .subscribe();

    this.http.get<{ section: string; value: AlertRuleSettings }>('/api/configuration/alerts', { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        tap(res => {
          if (res?.value) {
            this.applyAlerts(res.value);
          }
        })
      )
      .subscribe();

    this.http.get<{ section: string; value: NotificationSettings }>('/api/configuration/notifications', { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        tap(res => {
          if (res?.value) {
            this.applyNotifications(res.value);
          }
        })
      )
      .subscribe();
  }

  apply(config: GeneralConfiguration): void {
    this.loaded = true;
    this.state.set({ ...DEFAULT_GENERAL_CONFIGURATION, ...config });
    if (config.systemName) {
      this.titleService.setTitle(config.systemName);
    }
  }

  applyVoltage(voltage: VoltageThresholds): void {
    this.voltageState.set({ ...DEFAULT_VOLTAGE_THRESHOLDS, ...voltage });
  }

  applyAlerts(alerts: AlertRuleSettings): void {
    this.alertsState.set({ ...DEFAULT_ALERT_RULES, ...alerts });
  }

  applyNotifications(notifications: NotificationSettings): void {
    this.notificationsState.set({ ...DEFAULT_NOTIFICATION_SETTINGS, ...notifications });
  }
}
