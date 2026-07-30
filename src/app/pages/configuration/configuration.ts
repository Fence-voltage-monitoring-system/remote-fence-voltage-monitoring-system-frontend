import { Component } from '@angular/core';
import { ConfigurationMenu } from './components/configuration-menu/configuration-menu';
import { AlertRulesEditor } from './components/alert-rules-editor/alert-rules-editor';
import { NotificationSettingsEditor } from './components/notification-settings-editor/notification-settings-editor';
import { DataRetentionEditor } from './components/data-retention-editor/data-retention-editor';
import { GeneralConfigurationEditor } from './components/general-configuration-editor/general-configuration-editor';
import { SaveConfigurationModal } from './components/save-configuration-modal/save-configuration-modal';
import { VoltageThresholdEditor } from './components/voltage-threshold-editor/voltage-threshold-editor';
import { AlertRuleSettings, ConfigurationSection, DataRetentionSettings, GeneralConfiguration, NotificationSettings, VoltageThresholds } from './configuration.models';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [ConfigurationMenu, GeneralConfigurationEditor, AlertRulesEditor, NotificationSettingsEditor, DataRetentionEditor, VoltageThresholdEditor, SaveConfigurationModal],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class Configuration {
  readonly voltageDefaults: VoltageThresholds = { healthyKv: 5, warningKv: 3, criticalKv: 1.5, lowBatteryPercent: 20 };
  readonly generalDefaults: GeneralConfiguration = {
    systemName: 'Remote Voltage Monitoring System', organizationName: 'Department of Wildlife Conservation', systemCode: 'REFVMS',
    supportEmail: 'support@dwc.gov.lk', supportPhone: '+94 11 288 8585', timezone: 'Asia/Colombo', dateFormat: 'YYYY-MM-DD',
    timeFormat: '24_HOUR', language: 'en', voltageUnit: 'kV', distanceUnit: 'km', coordinateFormat: 'DECIMAL_DEGREES',
    expectedReportingIntervalMinutes: 30, lateArrivalGraceMinutes: 2, offlineTimeoutMinutes: 10, staleDataMinutes: 2,
    defaultHistoryPeriod: '24h', pageSize: 20, maintenanceMode: false, allowLoginDuringMaintenance: true,
    readOnlyMode: false, maintenanceMessage: 'The monitoring system is temporarily unavailable for scheduled maintenance.'
  };
  readonly alertDefaults: AlertRuleSettings = {
    lowVoltageEnabled: true, criticalVoltageEnabled: true, wireBreakEnabled: true,
    gatewayOfflineEnabled: true, lowBatteryEnabled: true, criticalBatteryEnabled: true,
    criticalBatteryPercent: 10, solarFailureEnabled: true, voltageFluctuationEnabled: true,
    fluctuationCount: 4, fluctuationWindowMinutes: 10, abnormalReadingsRequired: 1,
    healthyReadingsRequired: 2, cooldownMinutes: 30, autoResolve: true,
    inAppEnabled: true, websocketEnabled: true, smsEnabled: true, escalationEnabled: true,
    escalationDelayMinutes: 15, notifySuperAdmins: true, notifyRegionalAdmins: true,
    notifyFieldAdmins: true, notifyMaintenance: true
  };
  readonly notificationDefaults: NotificationSettings = {
    inAppEnabled: true, websocketEnabled: true, smsEnabled: true,
    criticalAlertsEnabled: true, warningAlertsEnabled: true, maintenanceUpdatesEnabled: true,
    systemUpdatesEnabled: true, soundEnabled: true, desktopNotificationsEnabled: false,
    markAsReadOnOpen: true, retentionDays: 30, quietHoursEnabled: false,
    quietHoursStart: '22:00', quietHoursEnd: '06:00', allowCriticalDuringQuietHours: true,
    digestEnabled: false, digestIntervalMinutes: 60, groupSimilarNotifications: true,
    groupingWindowMinutes: 10
  };
  readonly retentionDefaults: DataRetentionSettings = {
    rawTelemetryDays: 90, hourlySummaryDays: 730, dailySummaryDays: 1825,
    alertIncidentDays: 2555, notificationDays: 30, auditLogDays: 2555,
    systemLogDays: 90, generatedReportDays: 365, archiveBeforeDeletion: true,
    automaticCleanupEnabled: true, cleanupSchedule: 'DAILY', cleanupTime: '02:00'
  };

  savedVoltage = { ...this.voltageDefaults };
  voltageValue = { ...this.savedVoltage };
  savedGeneral = { ...this.generalDefaults };
  generalValue = { ...this.savedGeneral };
  savedAlerts = { ...this.alertDefaults };
  alertValue = { ...this.savedAlerts };
  savedNotifications = { ...this.notificationDefaults };
  notificationValue = { ...this.savedNotifications };
  savedRetention = { ...this.retentionDefaults };
  retentionValue = { ...this.savedRetention };
  active: ConfigurationSection = 'general';
  notice = '';
  showSave = false;
  lastModified = '2025-07-13 14:22:05';

  get dirty(): boolean {
    if (this.active === 'general') return JSON.stringify(this.generalValue) !== JSON.stringify(this.savedGeneral);
    if (this.active === 'alerts') return JSON.stringify(this.alertValue) !== JSON.stringify(this.savedAlerts);
    if (this.active === 'notifications') return JSON.stringify(this.notificationValue) !== JSON.stringify(this.savedNotifications);
    if (this.active === 'retention') return JSON.stringify(this.retentionValue) !== JSON.stringify(this.savedRetention);
    return JSON.stringify(this.voltageValue) !== JSON.stringify(this.savedVoltage);
  }

  get valid(): boolean {
    if (this.active === 'general') {
      const value = this.generalValue;
      return !!value.systemName.trim() && !!value.organizationName.trim() && !!value.systemCode.trim()
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.supportEmail)
        && value.expectedReportingIntervalMinutes >= 1 && value.lateArrivalGraceMinutes >= 0
        && value.offlineTimeoutMinutes > value.lateArrivalGraceMinutes && value.staleDataMinutes >= 0
        && value.pageSize > 0;
    }
    if (this.active === 'alerts') {
      const value = this.alertValue;
      const hasDeliveryChannel = value.inAppEnabled || value.websocketEnabled || value.smsEnabled;
      const hasRecipient = value.notifySuperAdmins || value.notifyRegionalAdmins || value.notifyFieldAdmins || value.notifyMaintenance;
      return value.criticalBatteryPercent >= 0 && value.criticalBatteryPercent <= 100
        && value.fluctuationCount >= 2 && value.fluctuationWindowMinutes >= 1
        && value.abnormalReadingsRequired >= 1 && value.abnormalReadingsRequired <= 3
        && value.healthyReadingsRequired >= 1 && value.healthyReadingsRequired <= 3
        && value.cooldownMinutes >= 1 && (!value.escalationEnabled || value.escalationDelayMinutes >= 1)
        && hasDeliveryChannel && hasRecipient;
    }
    if (this.active === 'notifications') {
      const value = this.notificationValue;
      const hasChannel = value.inAppEnabled || value.websocketEnabled || value.smsEnabled;
      const hasCategory = value.criticalAlertsEnabled || value.warningAlertsEnabled
        || value.maintenanceUpdatesEnabled || value.systemUpdatesEnabled;
      return hasChannel && hasCategory && value.retentionDays >= 1 && value.retentionDays <= 365
        && (!value.quietHoursEnabled || (!!value.quietHoursStart && !!value.quietHoursEnd))
        && (!value.digestEnabled || value.digestIntervalMinutes >= 5)
        && (!value.groupSimilarNotifications || value.groupingWindowMinutes >= 1);
    }
    if (this.active === 'retention') {
      const value = this.retentionValue;
      const periods = [value.rawTelemetryDays, value.hourlySummaryDays, value.dailySummaryDays,
        value.alertIncidentDays, value.notificationDays, value.auditLogDays,
        value.systemLogDays, value.generatedReportDays];
      return periods.every(days => Number.isInteger(days) && days >= 1)
        && value.hourlySummaryDays >= value.rawTelemetryDays
        && value.dailySummaryDays >= value.hourlySummaryDays
        && (!value.automaticCleanupEnabled || !!value.cleanupTime);
    }
    return this.voltageValue.healthyKv > this.voltageValue.warningKv
      && this.voltageValue.warningKv > this.voltageValue.criticalKv
      && this.voltageValue.criticalKv >= 0
      && this.voltageValue.lowBatteryPercent >= 0 && this.voltageValue.lowBatteryPercent <= 100;
  }

  selectSection(section: ConfigurationSection): void {
    if (section === 'general' || section === 'voltage' || section === 'alerts' || section === 'notifications' || section === 'retention') {
      this.active = section;
      this.notice = '';
      return;
    }
    this.notice = `${section.replace('_', ' ')} configuration will be implemented next.`;
  }

  reset(): void {
    if (this.active === 'general') this.generalValue = { ...this.generalDefaults };
    else if (this.active === 'alerts') this.alertValue = { ...this.alertDefaults };
    else if (this.active === 'notifications') this.notificationValue = { ...this.notificationDefaults };
    else if (this.active === 'retention') this.retentionValue = { ...this.retentionDefaults };
    else this.voltageValue = { ...this.voltageDefaults };
    this.notice = 'Default configuration restored. Save to apply the changes.';
  }

  cancel(): void {
    if (this.active === 'general') this.generalValue = { ...this.savedGeneral };
    else if (this.active === 'alerts') this.alertValue = { ...this.savedAlerts };
    else if (this.active === 'notifications') this.notificationValue = { ...this.savedNotifications };
    else if (this.active === 'retention') this.retentionValue = { ...this.savedRetention };
    else this.voltageValue = { ...this.savedVoltage };
    this.notice = 'Unsaved changes discarded.';
  }

  confirmSave(reason: string): void {
    if (this.active === 'general') this.savedGeneral = { ...this.generalValue };
    else if (this.active === 'alerts') this.savedAlerts = { ...this.alertValue };
    else if (this.active === 'notifications') this.savedNotifications = { ...this.notificationValue };
    else if (this.active === 'retention') this.savedRetention = { ...this.retentionValue };
    else this.savedVoltage = { ...this.voltageValue };
    this.lastModified = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.showSave = false;
    this.notice = `Configuration saved. Reason: ${reason}`;
  }

  requestManualCleanup(): void {
    if (this.dirty) {
      this.notice = 'Save or cancel retention-policy changes before starting a cleanup job.';
      return;
    }
    this.notice = 'Manual cleanup request prepared. Backend confirmation and an audit reason are required before execution.';
  }
}
