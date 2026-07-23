import { Component, Input } from '@angular/core';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';

@Component({ selector: 'app-alert-summary', standalone: true, templateUrl: './alert-summary.html', styleUrl: './alert-summary.css' })
export class AlertSummaryComponent {
  @Input({ required: true }) device!: DeviceMonitoringContext;

  get rows(): string[][] {
    return [
      ['Critical', this.device.status === 'critical' ? '3' : '0', 'red'],
      ['Warning', this.device.status === 'warning' || this.device.battery < 50 ? '2' : '0', 'amber'],
      ['Offline', this.device.status === 'offline' ? '1' : '0', 'gray'],
      ['Resolved', this.device.status === 'healthy' ? '18' : '12', 'green'],
    ];
  }
}
