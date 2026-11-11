import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { SystemIdentityService } from '../../../../core/services/system-identity.service';
import { AnalysisMetric } from '../../historical-analysis.models';

export interface VoltageTrendItem {
  time: string;
  value: string;
  voltage: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-voltage-trend-chart',
  standalone: true,
  templateUrl: './voltage-trend-chart.html',
  styleUrl: './voltage-trend-chart.css'
})
export class VoltageTrendChart implements OnChanges {
  readonly identity = inject(SystemIdentityService);
  @Input() subtitle = '24-hour voltage readings · All active sections';
  @Input() trendData: Array<{ time: string; value: string; voltage: number; x?: number; y?: number }> = [];
  @Input() summaryMetrics: AnalysisMetric[] = [];

  points: VoltageTrendItem[] = [];
  trendPath = '';
  areaPath = '';
  latestPoint: VoltageTrendItem | null = null;

  currentVoltage = '—';
  avgVoltage = '—';
  peakVoltage = '—';
  lowestVoltage = '—';
  statusText = 'Stable';
  statusClass = 'healthy';

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateChart();
  }

  private calculateChart(): void {
    const avgMetric = this.summaryMetrics.find(m => m.label.toLowerCase().includes('avg'));
    const minMetric = this.summaryMetrics.find(m => m.label.toLowerCase().includes('min'));
    const maxMetric = this.summaryMetrics.find(m => m.label.toLowerCase().includes('max'));

    if (avgMetric) this.avgVoltage = avgMetric.value;
    if (minMetric) this.lowestVoltage = minMetric.value;
    if (maxMetric) this.peakVoltage = maxMetric.value;

    if (!this.trendData || this.trendData.length === 0) {
      this.points = [];
      this.trendPath = '';
      this.areaPath = '';
      this.latestPoint = null;
      this.currentVoltage = this.avgVoltage !== '—' ? this.avgVoltage : '—';
      return;
    }

    const n = this.trendData.length;
    const startX = 55;
    const endX = 1145;
    const startY = 195; // 0 kV
    const maxY = 25;    // 8 kV
    const heightSpan = startY - maxY; // 170

    this.points = this.trendData.map((d, index) => {
      const x = n > 1 ? Math.round(startX + (index * (endX - startX)) / (n - 1)) : 600;
      const clampedV = Math.max(0, Math.min(8, d.voltage));
      const y = Math.round(startY - (clampedV / 8) * heightSpan);
      return {
        x,
        y,
        time: d.time,
        value: d.value || `${d.voltage.toFixed(1)} kV`,
        voltage: d.voltage
      };
    });

    this.latestPoint = this.points[this.points.length - 1];
    this.currentVoltage = `${this.latestPoint.voltage.toFixed(1)}`;

    const warnKv = Number(this.identity.warningKv()) || 5.0;
    const critKv = Number(this.identity.criticalKv()) || 3.0;
    if (this.latestPoint.voltage < critKv) {
      this.statusText = 'Critical';
      this.statusClass = 'critical';
    } else if (this.latestPoint.voltage < warnKv) {
      this.statusText = 'Warning';
      this.statusClass = 'warning';
    } else {
      this.statusText = 'Stable';
      this.statusClass = 'stable';
    }

    if (this.points.length === 1) {
      const p = this.points[0];
      this.trendPath = `M ${startX} ${p.y} L ${endX} ${p.y}`;
      this.areaPath = `M ${startX} ${p.y} L ${endX} ${p.y} L ${endX} ${startY} L ${startX} ${startY} Z`;
    } else {
      let pathD = `M ${this.points[0].x} ${this.points[0].y}`;
      for (let i = 1; i < this.points.length; i++) {
        const prev = this.points[i - 1];
        const curr = this.points[i];
        const cp1x = Math.round(prev.x + (curr.x - prev.x) / 2);
        const cp2x = cp1x;
        pathD += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      this.trendPath = pathD;
      const first = this.points[0];
      const last = this.points[this.points.length - 1];
      this.areaPath = `${pathD} L ${last.x} ${startY} L ${first.x} ${startY} Z`;
    }
  }
}
