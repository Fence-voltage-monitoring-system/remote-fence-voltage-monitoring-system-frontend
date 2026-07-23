import { Component } from '@angular/core';
import { DeviceMonitoringContext } from '../../core/models/device-monitoring';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { AlertSummaryComponent } from './components/alert-summary/alert-summary';
import { AlertListComponent } from './components/alert-list/alert-list';
import { FenceMonitorComponent } from './components/fence-monitor/fence-monitor';
import { FenceMapComponent } from './components/fence-map/fence-map';
import { VoltageCard, VoltageCardComponent } from './components/voltage-card/voltage-card';
import { VoltageChartComponent } from './components/voltage-chart/voltage-chart';

@Component({
  selector: 'app-dashboard',
  imports: [
    HeaderComponent,
    SidebarComponent,
    AlertSummaryComponent,
    FenceMonitorComponent,
    FenceMapComponent,
    AlertListComponent,
    VoltageCardComponent,
    VoltageChartComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  selectedDevice: DeviceMonitoringContext = {
    fenceId: 'monaragala', fenceName: 'Monaragala Elephant Protection Fence',
    sectionId: 'SEC-005', deviceId: 'GTW-MNR-01-005', voltage: 5.9, battery: 91, status: 'healthy',
  };

  updateAnalytics(device: DeviceMonitoringContext): void {
    this.selectedDevice = device;
  }

  readonly stats: VoltageCard[] = [
    { label: 'Total fences', value: '5', unit: 'zones', icon: '⌁', foot: 'All zones connected', tone: 'green' },
    { label: 'Total devices', value: '10', unit: 'units', icon: '◉', foot: '2 gateways online', tone: 'green' },
    { label: 'Active devices', value: '8', unit: 'of 10', icon: 'ϟ', foot: '+2.4% vs 24h', tone: 'green' },
    { label: 'Critical alerts', value: '2', unit: 'unack’d', icon: '△', foot: '-1% vs 24h', tone: 'red' },
    { label: 'Low voltage fences', value: '2', unit: 'fences', icon: '!', foot: 'Below 4.5 kV threshold', tone: 'warning' },
  ];
}
