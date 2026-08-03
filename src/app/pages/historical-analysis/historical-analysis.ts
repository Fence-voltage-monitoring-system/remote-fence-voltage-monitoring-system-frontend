import { Component } from '@angular/core';
import { AnalysisFiltersComponent } from './components/analysis-filters/analysis-filters';
import { AnalysisSummary } from './components/analysis-summary/analysis-summary';
import { VoltageTrendChart } from './components/voltage-trend-chart/voltage-trend-chart';
import { MiniAnalysisCharts } from './components/mini-analysis-charts/mini-analysis-charts';
import { AnalysisFilters, AnalysisMetric, HistoricalChartData } from './historical-analysis.models';

@Component({
  selector: 'app-historical-analysis',
  standalone: true,
  imports: [AnalysisFiltersComponent, AnalysisSummary, VoltageTrendChart, MiniAnalysisCharts],
  templateUrl: './historical-analysis.html',
  styleUrl: './historical-analysis.css',
})
export class HistoricalAnalysis {
  filters: AnalysisFilters = { province: '', district: '', fence: '', section: '', device: '', period: '24h' };
  notice = '';
  readonly provinces = ['Eastern', 'North Central', 'Southern', 'Uva'];
  readonly districts = ['Ampara', 'Anuradhapura', 'Polonnaruwa', 'Hambantota', 'Monaragala', 'Badulla'];
  readonly fences = ['EPF-MNR-A', 'EPF-ANR-B', 'EPF-PLN-C', 'EPF-AMP-D', 'EPF-HMB-E'];
  readonly sections = ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004', 'SEC-005', 'SEC-006'];
  readonly devices = ['DEV-EFE-0047', 'DEV-EFE-0048', 'DEV-EFE-0049', 'DEV-EFE-0050', 'DEV-EFE-0051'];

  chartData: HistoricalChartData = this.buildDummyData(this.filters);
  metrics: AnalysisMetric[] = this.buildMetrics(this.chartData);

  updateFilters(next: AnalysisFilters): void {
    if (next.province !== this.filters.province) {
      next = { ...next, district: '', fence: '', section: '', device: '' };
    }
    this.filters = next;
    this.chartData = this.buildDummyData(next);
    this.metrics = this.buildMetrics(this.chartData);
  }

  message(text: string): void { this.notice = text; }

  private buildDummyData(filters: AnalysisFilters): HistoricalChartData {
    const count = this.pointCount(filters);
    const seed = this.hash([filters.province, filters.district, filters.fence, filters.section, filters.device, filters.period].join('|'));
    const selectedDepth = [filters.province, filters.district, filters.fence, filters.section, filters.device].filter(Boolean).length;
    const voltage: number[] = [];
    const battery: number[] = [];
    const voltageDrop: number[] = [];
    const alerts: number[] = [];

    for (let index = 0; index < count; index++) {
      const progress = index / Math.max(1, count - 1);
      const wave = Math.sin(progress * Math.PI * 2 + (seed % 7) / 5);
      const secondary = Math.sin(progress * Math.PI * 5 + (seed % 11) / 7);
      const voltageValue = 5.25 + wave * .72 + secondary * .22 + selectedDepth * .05 - ((seed + index * 13) % 9) / 35;
      const batteryValue = 88 - progress * (16 + seed % 12) + Math.sin(index * 1.4) * 3 - selectedDepth;
      const dropValue = Math.max(0, 5.8 - voltageValue + Math.max(0, secondary) * .25);
      const alertValue = ((seed + index * 17) % 11 < 3 ? 1 : 0) + (voltageValue < 4.7 ? 1 : 0);
      voltage.push(this.round(voltageValue));
      battery.push(Math.round(Math.max(12, Math.min(100, batteryValue))));
      voltageDrop.push(this.round(dropValue));
      alerts.push(alertValue);
    }

    return { voltage, battery, voltageDrop, alerts, labels: this.axisLabels(filters) };
  }

  private buildMetrics(data: HistoricalChartData): AnalysisMetric[] {
    const average = data.voltage.reduce((sum, value) => sum + value, 0) / data.voltage.length;
    const meanDifference = data.voltage.reduce((sum, value) => sum + Math.abs(value - average), 0) / data.voltage.length;
    const faults = data.alerts.reduce((sum, value) => sum + value, 0);
    const uptime = Math.max(0, 100 - faults / data.alerts.length * 5);
    return [
      { label: 'Avg Voltage', value: average.toFixed(1), unit: 'kV', tone: average >= 5 ? 'green' : 'amber' },
      { label: 'Min Voltage', value: Math.min(...data.voltage).toFixed(1), unit: 'kV', tone: 'amber' },
      { label: 'Max Voltage', value: Math.max(...data.voltage).toFixed(1), unit: 'kV', tone: 'green' },
      { label: 'Voltage Stability', value: Math.max(0, 100 - meanDifference * 18).toFixed(0), unit: '%', tone: 'green' },
      { label: 'Total Faults', value: String(faults), tone: faults ? 'red' : 'green' },
      { label: 'Uptime', value: uptime.toFixed(1), unit: '%', tone: uptime >= 95 ? 'green' : 'amber' },
    ];
  }

  private pointCount(filters: AnalysisFilters): number {
    if (filters.period === '1h') return 12;
    if (filters.period === '24h') return 24;
    if (filters.period === '7d') return 28;
    if (filters.period === '30d') return 30;
    if (filters.startDate && filters.endDate) {
      const days = Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / 86_400_000);
      return Math.max(12, Math.min(40, days + 1));
    }
    return 24;
  }

  private axisLabels(filters: AnalysisFilters): string[] {
    if (filters.period === '1h') return ['60m ago', '45m', '30m', '15m', 'Now'];
    if (filters.period === '24h') return ['00:00', '06:00', '12:00', '18:00', '24:00'];
    if (filters.period === '7d') return ['Day 1', 'Day 2', 'Day 4', 'Day 6', 'Day 7'];
    if (filters.period === '30d') return ['Day 1', 'Day 8', 'Day 15', 'Day 22', 'Day 30'];
    return ['Start', '25%', '50%', '75%', 'End'];
  }

  private hash(value: string): number {
    return [...value].reduce((result, character) => (result * 31 + character.charCodeAt(0)) >>> 0, 17);
  }

  private round(value: number): number { return Math.round(value * 100) / 100; }
}
