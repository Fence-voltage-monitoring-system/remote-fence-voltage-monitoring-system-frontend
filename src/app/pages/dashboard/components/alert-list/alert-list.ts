import { Component, Input } from '@angular/core';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';

interface DeviceAlert { title: string; reference: string; time: string; tone: string; }

@Component({ selector: 'app-alert-list', standalone: true, templateUrl: './alert-list.html', styleUrl: './alert-list.css' })
export class AlertListComponent {
  @Input({ required: true }) device!: DeviceMonitoringContext;

  get alerts(): DeviceAlert[] {
    const reference = `${this.device.sectionId} · ${this.device.deviceId}`;
    const primary = this.device.status === 'offline' ? 'Device Offline' : this.device.status === 'critical' ? 'Voltage Drop' : this.device.status === 'warning' ? 'Voltage Warning' : 'Reading Restored';
    return [
      { title: primary, reference, time: '4m ago', tone: this.device.status },
      { title: this.device.battery < 50 ? 'Low Battery' : 'Battery Normal', reference, time: '22m ago', tone: this.device.battery < 50 ? 'warning' : 'healthy' },
      { title: 'Signal Check', reference, time: '34m ago', tone: this.device.status === 'offline' ? 'offline' : 'healthy' },
      { title: 'Telemetry Received', reference, time: '51m ago', tone: 'healthy' },
    ];
  }

  get criticalCount(): number {
    return this.alerts.filter((alert) => alert.tone === 'critical').length;
  }
}
