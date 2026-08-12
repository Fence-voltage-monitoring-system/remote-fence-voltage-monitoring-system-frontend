import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AlertCounts, DashboardAlert, VoltageReading } from '../../core/models/dashboard-api';
import { DeviceMonitoringContext } from '../../core/models/device-monitoring';
import { DashboardApiService } from '../../core/services/dashboard-api';
import { AlertSummaryComponent } from './components/alert-summary/alert-summary';
import { AlertListComponent } from './components/alert-list/alert-list';
import { FenceMonitorComponent } from './components/fence-monitor/fence-monitor';
import { FenceMapWorkspaceComponent } from '../map/map';
import { VoltageCard, VoltageCardComponent } from './components/voltage-card/voltage-card';
import { VoltageChartComponent } from './components/voltage-chart/voltage-chart';

@Component({
  selector: 'app-dashboard',
  imports: [AlertSummaryComponent, FenceMonitorComponent, FenceMapWorkspaceComponent, AlertListComponent, VoltageCardComponent, VoltageChartComponent],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly api = inject(DashboardApiService);
  private readonly destroyed$ = new Subject<void>();
  loading = true;
  analyticsLoading = false;
  error = '';
  readonly usingMockData = this.api.usingMockData;
  stats: VoltageCard[] = [];
  voltageHistory: VoltageReading[] = [];
  alerts: DashboardAlert[] = [];
  alertCounts: AlertCounts = { critical: 0, warning: 0, offline: 0, resolved: 0 };
  selectedDevice: DeviceMonitoringContext = { fenceId: '', fenceName: '', sectionId: '', deviceId: '', voltage: 0, battery: 0, status: 'offline' };

  ngOnInit(): void { this.loadDashboard(); }
  ngOnDestroy(): void { this.destroyed$.next(); this.destroyed$.complete(); }
  updateAnalytics(device: DeviceMonitoringContext): void { this.selectedDevice = device; this.loadDeviceAnalytics(device.deviceId); }

  loadDashboard(): void {
    this.loading = true; this.error = '';
    this.api.getOverview().pipe(takeUntil(this.destroyed$), finalize(() => this.loading = false)).subscribe({
      next: ({ summary, selectedDevice }) => {
        this.selectedDevice = selectedDevice;
        this.stats = [
          { label: 'Total fences', value: String(summary.totalFences), unit: 'zones', icon: '⌁', foot: 'Registered fence zones', tone: 'green' },
          { label: 'Total devices', value: String(summary.totalDevices), unit: 'units', icon: '◉', foot: 'Registered monitoring devices', tone: 'green' },
          { label: 'Active devices', value: String(summary.activeDevices), unit: `of ${summary.totalDevices}`, icon: 'ϟ', foot: 'Currently reporting', tone: 'green' },
          { label: 'Critical alerts', value: String(summary.criticalAlerts), unit: 'open', icon: '△', foot: 'Requires attention', tone: 'red' },
          { label: 'Low voltage fences', value: String(summary.lowVoltageFences), unit: 'fences', icon: '!', foot: 'Below 4.5 kV threshold', tone: 'warning' },
        ];
        this.loadDeviceAnalytics(selectedDevice.deviceId);
      },
      error: () => this.error = 'Dashboard data could not be loaded. Check the backend connection and try again.',
    });
  }

  private loadDeviceAnalytics(deviceId: string): void {
    if (!deviceId) return;
    this.analyticsLoading = true;
    this.api.getDeviceAnalytics(deviceId).pipe(takeUntil(this.destroyed$), finalize(() => this.analyticsLoading = false)).subscribe({
      next: ({ device, voltageHistory, alerts, alertCounts }) => { this.selectedDevice = device; this.voltageHistory = voltageHistory; this.alerts = alerts; this.alertCounts = alertCounts; },
      error: () => this.error = `Analytics for ${deviceId} could not be loaded.`,
    });
  }
}
