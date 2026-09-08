import { Component, OnInit, inject } from '@angular/core';
import { AnalysisFiltersComponent } from './components/analysis-filters/analysis-filters';
import { AnalysisSummary } from './components/analysis-summary/analysis-summary';
import { VoltageTrendChart } from './components/voltage-trend-chart/voltage-trend-chart';
import { MiniAnalysisCharts } from './components/mini-analysis-charts/mini-analysis-charts';
import { AnalysisFilters, AnalysisMetric } from './historical-analysis.models';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-historical-analysis',
  standalone: true,
  imports: [AnalysisFiltersComponent, AnalysisSummary, VoltageTrendChart, MiniAnalysisCharts],
  templateUrl: './historical-analysis.html',
  styleUrl: './historical-analysis.css'
})
export class HistoricalAnalysis implements OnInit {
  private readonly reportsService = inject(ReportsService);

  filters: AnalysisFilters = { province: '', district: '', fence: '', section: '', device: '', period: '24h' };
  notice = '';

  readonly provinces = ['Eastern', 'North Central', 'Southern', 'Uva', 'Western', 'Central', 'North Western', 'Northern'];
  readonly districts = ['Ampara', 'Anuradhapura', 'Polonnaruwa', 'Hambantota', 'Monaragala', 'Badulla', 'Colombo', 'Puttalam'];
  readonly fences = ['EPF-MON-01', 'EPF-WIL-01', 'EPF-MIH-01', 'EPF-GAL-01'];
  readonly sections = ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004'];
  readonly devices = ['DEV-EFE-0062', 'DEV-EFE-0065'];

  metrics: AnalysisMetric[] = [
    { label: 'Avg Voltage', value: '5.4', unit: 'kV', tone: 'green' },
    { label: 'Min Voltage', value: '3.2', unit: 'kV', tone: 'amber' },
    { label: 'Max Voltage', value: '6.4', unit: 'kV', tone: 'green' },
    { label: 'Voltage Stability', value: '87', unit: '%', tone: 'green' },
    { label: 'Total Faults', value: '0', tone: 'green' },
    { label: 'Uptime', value: '96.2', unit: '%', tone: 'green' }
  ];

  ngOnInit(): void {
    this.loadAnalysis();
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
