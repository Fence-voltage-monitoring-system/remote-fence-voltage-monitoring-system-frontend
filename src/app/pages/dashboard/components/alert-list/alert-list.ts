import { Component, Input } from '@angular/core';
import { DashboardAlert } from '../../../../core/models/dashboard-api';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';

interface DeviceAlert { title: string; reference: string; time: string; tone: string; }

@Component({ selector: 'app-alert-list', standalone: true, templateUrl: './alert-list.html', styleUrl: './alert-list.css' })
export class AlertListComponent {
  @Input({ required: true }) device!: DeviceMonitoringContext;
  @Input() data: DashboardAlert[] = [];

  get alerts(): DeviceAlert[] {
    return this.data.map(alert => ({ title: alert.title, reference: alert.reference, time: this.relativeTime(alert.occurredAt), tone: alert.status }));
  }
  get criticalCount(): number { return this.alerts.filter(alert => alert.tone === 'critical').length; }
  private relativeTime(value: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }
}
