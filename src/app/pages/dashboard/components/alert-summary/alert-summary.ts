import { Component, Input } from '@angular/core';
import { AlertCounts } from '../../../../core/models/dashboard-api';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';

@Component({ selector: 'app-alert-summary', standalone: true, templateUrl: './alert-summary.html', styleUrl: './alert-summary.css' })
export class AlertSummaryComponent {
  @Input({ required: true }) device!: DeviceMonitoringContext;
  @Input() counts: AlertCounts = { critical: 0, warning: 0, offline: 0, resolved: 0 };
  get rows(): string[][] {
    return [
      ['Critical', String(this.counts.critical), 'red'],
      ['Warning', String(this.counts.warning), 'amber'],
      ['Offline', String(this.counts.offline), 'gray'],
      ['Resolved', String(this.counts.resolved), 'green'],
    ];
  }
}
