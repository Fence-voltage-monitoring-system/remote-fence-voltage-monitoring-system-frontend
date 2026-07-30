import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ConfigurationService, ConfigurationValue } from '../../core/services/configuration.service';
import { ConfigurationMenu } from './components/configuration-menu/configuration-menu';
import { AlertRulesEditor } from './components/alert-rules-editor/alert-rules-editor';
import { NotificationSettingsEditor } from './components/notification-settings-editor/notification-settings-editor';
import { DataRetentionEditor } from './components/data-retention-editor/data-retention-editor';
import { SecurityPolicyEditor } from './components/security-policy-editor/security-policy-editor';
import { SessionManagementEditor } from './components/session-management-editor/session-management-editor';
import { GeneralConfigurationEditor } from './components/general-configuration-editor/general-configuration-editor';
import { SaveConfigurationModal } from './components/save-configuration-modal/save-configuration-modal';
import { VoltageThresholdEditor } from './components/voltage-threshold-editor/voltage-threshold-editor';
import { AlertRuleSettings, ConfigurationSection, DataRetentionSettings, GeneralConfiguration, NotificationSettings, SecurityPolicySettings, SessionManagementSettings, VoltageThresholds } from './configuration.models';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [ConfigurationMenu, GeneralConfigurationEditor, AlertRulesEditor, NotificationSettingsEditor, DataRetentionEditor, SecurityPolicyEditor, SessionManagementEditor, VoltageThresholdEditor, SaveConfigurationModal],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class Configuration implements OnInit {
  private readonly service=inject(ConfigurationService);
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
    acknowledgementTimeoutMinutes: 10, maintenanceAcceptanceTimeoutMinutes: 15,
    notifySuperAdmins: true, notifyRegionalAdmins: true,
    notifyFieldAdmins: true, notifyMaintenance: true
  };
  readonly notificationDefaults: NotificationSettings = {
    inAppEnabled: true, websocketEnabled: true, smsEnabled: true,
    criticalAlertsEnabled: true, warningAlertsEnabled: true, maintenanceUpdatesEnabled: true,
    systemUpdatesEnabled: true
  };
  readonly retentionDefaults: DataRetentionSettings = {
    rawTelemetryDays: 90, hourlySummaryDays: 730, dailySummaryDays: 1825,
    alertIncidentDays: 2555, notificationDays: 30, auditLogDays: 2555,
    systemLogDays: 90, generatedReportDays: 365, archiveBeforeDeletion: true,
    automaticCleanupEnabled: true, cleanupSchedule: 'DAILY', cleanupTime: '02:00'
  };
  readonly securityDefaults:SecurityPolicySettings={minimumPasswordLength:12,passwordHistoryCount:5,temporaryPasswordExpiryHours:24,forceChangeAfterReset:true,failedLoginAttempts:5,failedAttemptWindowMinutes:15,accountLockMinutes:30,requireMfaForSuperAdmins:true,requireMfaForOtherAdmins:false,inactiveAccountDays:180,notifyOnAccountLockout:true,notifyOnPasswordChange:true,notifyOnNewDeviceLogin:true,notifyOnScopeChange:true};
  readonly sessionDefaults:SessionManagementSettings={maximumSessionHours:12,idleTimeoutMinutes:30,rememberMeDays:7,logoutWarningMinutes:5,maximumConcurrentSessions:2,newLoginBehaviour:'REVOKE_OLDEST',requireReauthentication:true,reauthenticationValidityMinutes:5,revokeOnPasswordChange:true,revokeOnPasswordReset:true,revokeOnRoleOrScopeChange:true,revokeOnAccountDeactivation:true,revokeOnSuspiciousLogin:true};

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
  savedSecurity={...this.securityDefaults};
  securityValue={...this.savedSecurity};
  savedSessions={...this.sessionDefaults};
  sessionValue={...this.savedSessions};
  active: ConfigurationSection = 'general';
  notice = '';
  showSave = false;
  isSaving = false;
  isLoading = false;
  lastModified = '2025-07-13 14:22:05';
  lastModifiedBy = 'Suresh Ambegoda';
  private readonly loadedSections = new Set<ConfigurationSection>();

  ngOnInit(): void {
    this.loadSection(this.active);
  }

  get dirty(): boolean {
    if (this.active === 'general') return JSON.stringify(this.generalValue) !== JSON.stringify(this.savedGeneral);
    if (this.active === 'alerts') return JSON.stringify(this.alertValue) !== JSON.stringify(this.savedAlerts);
    if (this.active === 'notifications') return JSON.stringify(this.notificationValue) !== JSON.stringify(this.savedNotifications);
    if (this.active === 'retention') return JSON.stringify(this.retentionValue) !== JSON.stringify(this.savedRetention);
    if (this.active === 'security') return JSON.stringify(this.securityValue) !== JSON.stringify(this.savedSecurity);
    if (this.active === 'sessions') return JSON.stringify(this.sessionValue) !== JSON.stringify(this.savedSessions);
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
        && value.cooldownMinutes >= 1 && (!value.escalationEnabled
          || (value.acknowledgementTimeoutMinutes >= 1 && value.maintenanceAcceptanceTimeoutMinutes >= 1))
        && hasDeliveryChannel && hasRecipient;
    }
    if (this.active === 'notifications') {
      const value = this.notificationValue;
      const hasChannel = value.inAppEnabled || value.websocketEnabled || value.smsEnabled;
      const hasCategory = value.criticalAlertsEnabled || value.warningAlertsEnabled
        || value.maintenanceUpdatesEnabled || value.systemUpdatesEnabled;
      return hasChannel && hasCategory;
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
    if(this.active==='security'){const value=this.securityValue;return value.minimumPasswordLength>=10&&value.minimumPasswordLength<=64&&value.passwordHistoryCount>=0&&value.passwordHistoryCount<=24&&value.temporaryPasswordExpiryHours>=1&&value.temporaryPasswordExpiryHours<=168&&value.failedLoginAttempts>=3&&value.failedLoginAttempts<=10&&value.failedAttemptWindowMinutes>=5&&value.failedAttemptWindowMinutes<=60&&value.accountLockMinutes>=5&&value.accountLockMinutes<=1440&&value.inactiveAccountDays>=30&&value.inactiveAccountDays<=730&&value.requireMfaForSuperAdmins;}
    if(this.active==='sessions'){const value=this.sessionValue;return Number.isInteger(value.maximumSessionHours)&&value.maximumSessionHours>=1&&value.maximumSessionHours<=168&&Number.isInteger(value.idleTimeoutMinutes)&&value.idleTimeoutMinutes>=5&&value.idleTimeoutMinutes<value.maximumSessionHours*60&&Number.isInteger(value.rememberMeDays)&&value.rememberMeDays>=1&&value.rememberMeDays<=30&&Number.isInteger(value.logoutWarningMinutes)&&value.logoutWarningMinutes>=1&&value.logoutWarningMinutes<value.idleTimeoutMinutes&&Number.isInteger(value.maximumConcurrentSessions)&&value.maximumConcurrentSessions>=1&&value.maximumConcurrentSessions<=10&&(!value.requireReauthentication||(value.reauthenticationValidityMinutes>=1&&value.reauthenticationValidityMinutes<=30))&&value.revokeOnPasswordReset&&value.revokeOnAccountDeactivation;}
    return this.voltageValue.healthyKv > this.voltageValue.warningKv
      && this.voltageValue.warningKv > this.voltageValue.criticalKv
      && this.voltageValue.criticalKv >= 0
      && this.voltageValue.lowBatteryPercent >= 0 && this.voltageValue.lowBatteryPercent <= 100;
  }

  get validationMessages(): string[] {
    if (this.active !== 'security') return this.valid ? [] : ['Please correct the highlighted configuration values before saving.'];
    const value = this.securityValue;
    const messages: string[] = [];
    if (!Number.isInteger(value.minimumPasswordLength) || value.minimumPasswordLength < 10 || value.minimumPasswordLength > 64) messages.push('Minimum password length must be between 10 and 64 characters.');
    if (!Number.isInteger(value.passwordHistoryCount) || value.passwordHistoryCount < 0 || value.passwordHistoryCount > 24) messages.push('Password history must be between 0 and 24 passwords.');
    if (!Number.isInteger(value.temporaryPasswordExpiryHours) || value.temporaryPasswordExpiryHours < 1 || value.temporaryPasswordExpiryHours > 168) messages.push('Temporary password expiry must be between 1 hour and 7 days.');
    if (!Number.isInteger(value.inactiveAccountDays) || value.inactiveAccountDays < 30 || value.inactiveAccountDays > 730) messages.push('Inactive-account period must be between 30 and 730 days.');
    if (!Number.isInteger(value.failedLoginAttempts) || value.failedLoginAttempts < 3 || value.failedLoginAttempts > 10) messages.push('Maximum failed attempts must be between 3 and 10.');
    if (!Number.isInteger(value.failedAttemptWindowMinutes) || value.failedAttemptWindowMinutes < 5 || value.failedAttemptWindowMinutes > 60) messages.push('Attempt window must be between 5 and 60 minutes.');
    if (!Number.isInteger(value.accountLockMinutes) || value.accountLockMinutes < 5 || value.accountLockMinutes > 1440) messages.push('Account lock duration must be between 5 minutes and 24 hours.');
    if (!value.requireMfaForSuperAdmins) messages.push('MFA must remain enabled for super administrators.');
    return messages;
  }

  selectSection(section: ConfigurationSection): void {
    if (section === 'general' || section === 'voltage' || section === 'alerts' || section === 'notifications' || section === 'retention' || section === 'security' || section === 'sessions') {
      this.active = section;
      this.notice = '';
      this.loadSection(section);
      return;
    }
    this.notice = `${section.replace('_', ' ')} configuration will be implemented next.`;
  }

  reset(): void {
    if (this.active === 'general') this.generalValue = { ...this.generalDefaults };
    else if (this.active === 'alerts') this.alertValue = { ...this.alertDefaults };
    else if (this.active === 'notifications') this.notificationValue = { ...this.notificationDefaults };
    else if (this.active === 'retention') this.retentionValue = { ...this.retentionDefaults };
    else if (this.active === 'security') this.securityValue = { ...this.securityDefaults };
    else if (this.active === 'sessions') this.sessionValue = { ...this.sessionDefaults };
    else this.voltageValue = { ...this.voltageDefaults };
    this.notice = 'Default configuration restored. Save to apply the changes.';
  }

  cancel(): void {
    if (this.active === 'general') this.generalValue = { ...this.savedGeneral };
    else if (this.active === 'alerts') this.alertValue = { ...this.savedAlerts };
    else if (this.active === 'notifications') this.notificationValue = { ...this.savedNotifications };
    else if (this.active === 'retention') this.retentionValue = { ...this.savedRetention };
    else if (this.active === 'security') this.securityValue = { ...this.savedSecurity };
    else if (this.active === 'sessions') this.sessionValue = { ...this.savedSessions };
    else this.voltageValue = { ...this.savedVoltage };
    this.notice = 'Unsaved changes discarded.';
  }

  confirmSave(reason: string): void {
    if(this.isSaving || !this.valid || !reason.trim())return;
    const section=this.active;
    const value=this.activeValue();
    this.isSaving=true;
    this.service.saveSection(section,value,reason).pipe(finalize(()=>this.isSaving=false)).subscribe({
      next:response=>{this.applyResponse(section,response.value);this.commitCurrent();this.lastModified=response.updatedAt;this.lastModifiedBy=response.updatedBy;this.showSave=false;this.notice=`Configuration saved by ${response.updatedBy}.`;},
      error:(error:HttpErrorResponse)=>{this.showSave=false;this.notice=this.apiErrorMessage(error,'save');}
    });
  }

  private loadSection(section: ConfigurationSection): void {
    if (this.loadedSections.has(section) || !this.isImplemented(section)) return;
    this.isLoading = true;
    this.service.getSection(section).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => {
        this.applyResponse(section, response.value);
        this.commitCurrent();
        this.lastModified = response.updatedAt;
        this.lastModifiedBy = response.updatedBy;
        this.loadedSections.add(section);
      },
      error: (error: HttpErrorResponse) => {
        this.loadedSections.add(section);
        this.notice = this.apiErrorMessage(error, 'load');
      }
    });
  }

  private isImplemented(section: ConfigurationSection): boolean {
    return ['general', 'voltage', 'alerts', 'notifications', 'retention', 'security', 'sessions'].includes(section);
  }

  private applyResponse(section: ConfigurationSection, value: ConfigurationValue): void {
    if (section === 'general') this.generalValue = { ...this.generalDefaults, ...(value as GeneralConfiguration) };
    else if (section === 'alerts') this.alertValue = { ...this.alertDefaults, ...(value as AlertRuleSettings) };
    else if (section === 'notifications') this.notificationValue = { ...this.notificationDefaults, ...(value as NotificationSettings) };
    else if (section === 'retention') this.retentionValue = { ...this.retentionDefaults, ...(value as DataRetentionSettings) };
    else if (section === 'security') this.securityValue = { ...this.securityDefaults, ...(value as SecurityPolicySettings) };
    else if (section === 'sessions') this.sessionValue = { ...this.sessionDefaults, ...(value as SessionManagementSettings) };
    else this.voltageValue = { ...this.voltageDefaults, ...(value as VoltageThresholds) };
  }

  private apiErrorMessage(error: HttpErrorResponse, action: 'load' | 'save'): string {
    if (error.status === 0) return `Configuration API unavailable. Unable to ${action} settings; ${action === 'load' ? 'showing safe preview defaults' : 'your changes remain unsaved'}.`;
    if (error.status === 401) return 'Your session has expired. Sign in again before changing configuration.';
    if (error.status === 403) return 'You do not have permission to change system configuration.';
    if (error.status === 409) return 'These settings were changed by another administrator. Reload the page and review the latest version.';
    if (error.status === 422 || error.status === 400) return error.error?.message ?? 'The backend rejected one or more configuration values.';
    return `Unable to ${action} configuration. Please try again.`;
  }

  private activeValue():ConfigurationValue {
    if(this.active==='general')return this.generalValue;
    if(this.active==='alerts')return this.alertValue;
    if(this.active==='notifications')return this.notificationValue;
    if(this.active==='retention')return this.retentionValue;
    if(this.active==='security')return this.securityValue;
    if(this.active==='sessions')return this.sessionValue;
    return this.voltageValue;
  }

  private commitCurrent(): void {
    if (this.active === 'general') this.savedGeneral = { ...this.generalValue };
    else if (this.active === 'alerts') this.savedAlerts = { ...this.alertValue };
    else if (this.active === 'notifications') this.savedNotifications = { ...this.notificationValue };
    else if (this.active === 'retention') this.savedRetention = { ...this.retentionValue };
    else if (this.active === 'security') this.savedSecurity = { ...this.securityValue };
    else if (this.active === 'sessions') this.savedSessions = { ...this.sessionValue };
    else this.savedVoltage = { ...this.voltageValue };
  }

  requestManualCleanup(): void {
    if (this.dirty) {
      this.notice = 'Save or cancel retention-policy changes before starting a cleanup job.';
      return;
    }
    this.notice = 'Manual cleanup request prepared. Backend confirmation and an audit reason are required before execution.';
  }
}
