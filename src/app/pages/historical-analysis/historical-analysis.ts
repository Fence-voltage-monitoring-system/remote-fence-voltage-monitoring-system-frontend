import { Component, OnInit, inject } from '@angular/core';
import { AnalysisFiltersComponent } from './components/analysis-filters/analysis-filters';
import { AnalysisSummary } from './components/analysis-summary/analysis-summary';
import { VoltageTrendChart } from './components/voltage-trend-chart/voltage-trend-chart';
import { MiniAnalysisCharts } from './components/mini-analysis-charts/mini-analysis-charts';
import { AnalysisFilters, AnalysisMetric } from './historical-analysis.models';
import { ReportsService } from '../../core/services/reports.service';
import { FenceService } from '../../core/services/fence.service';
import { DeviceService } from '../../core/services/device.service';

@Component({
  selector: 'app-historical-analysis',
  standalone: true,
  imports: [AnalysisFiltersComponent, AnalysisSummary, VoltageTrendChart, MiniAnalysisCharts],
  templateUrl: './historical-analysis.html',
  styleUrl: './historical-analysis.css'
})
export class HistoricalAnalysis implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly fenceService = inject(FenceService);
  private readonly deviceService = inject(DeviceService);

  filters: AnalysisFilters = { province: '', district: '', fence: '', section: '', device: '', period: '24h' };
  notice = '';

  readonly provinces = ['Western', 'Central', 'Southern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa', 'Eastern', 'Northern'];
  readonly districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Trincomalee', 'Batticaloa', 'Ampara', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'];
  fences: string[] = [];
  sections: string[] = [];
  devices: string[] = [];

  metrics: AnalysisMetric[] = [
    { label: 'Avg Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Min Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Max Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Voltage Stability', value: '—', unit: '%', tone: 'amber' },
    { label: 'Total Faults', value: '0', tone: 'green' },
    { label: 'Uptime', value: '—', unit: '%', tone: 'amber' }
  ];

  ngOnInit(): void {
    this.loadAnalysis();
    this.loadFencesAndDevices();
  }

  loadFencesAndDevices(): void {
    this.fenceService.getFences().subscribe({
      next: (fences) => {
        this.fences = (fences || []).map((f) => f.code);
      },
      error: () => { this.fences = []; }
    });
    this.deviceService.getDevices().subscribe({
      next: (devices) => {
        this.devices = (devices || []).map((d) => d.id);
      },
      error: () => { this.devices = []; }
    });
  }

  loadAnalysis(): void {
    this.reportsService.getHistoricalAnalysis(this.filters.period, this.filters.device).subscribe({
      next: (data) => {
        if (data.summaryMetrics && data.summaryMetrics.length > 0) {
          this.metrics = data.summaryMetrics;
        }
      },
      error: (err) => console.warn('Could not load historical analysis metrics from backend:', err)
    });
  }

  updateFilters(filters: AnalysisFilters): void {
    if (filters.province !== this.filters.province) {
      filters = { ...filters, district: '', fence: '', section: '', device: '' };
    }
    this.filters = filters;
    this.loadAnalysis();
  }

  message(text: string): void {
    this.notice = text;
  }
}
