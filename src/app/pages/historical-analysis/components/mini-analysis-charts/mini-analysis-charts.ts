import { Component, Input } from '@angular/core';
import { HistoricalAnalysisData } from '../../../../core/services/reports.service';

@Component({
  selector: 'app-mini-analysis-charts',
  standalone: true,
  templateUrl: './mini-analysis-charts.html',
  styleUrl: './mini-analysis-charts.css'
})
export class MiniAnalysisCharts {
  @Input() data: HistoricalAnalysisData | null = null;

  get batteryPercent(): number {
    return this.data?.powerHealth?.currentBatteryPercent ?? 85;
  }

  get batteryChange(): string {
    const ch = this.data?.powerHealth?.periodChangePercent;
    if (ch == null) return '0% this period';
    return `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}% this period`;
  }

  get batteryD(): string {
    const curve = this.data?.powerHealth?.batteryCurve;
    if (!curve || curve.length === 0) return 'M5 50 L395 50';
    const n = curve.length;
    let d = `M 5 ${Math.round(100 - (curve[0] / 100) * 80)}`;
    for (let i = 1; i < n; i++) {
      const x = Math.round(5 + (i * 390) / (n - 1));
      const y = Math.round(100 - (curve[i] / 100) * 80);
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  get batteryDotY(): number {
    const curve = this.data?.powerHealth?.batteryCurve;
    const lastVal = (curve && curve.length > 0) ? curve[curve.length - 1] : this.batteryPercent;
    return Math.round(100 - (lastVal / 100) * 80);
  }

  get totalVoltageDrops(): number {
    return this.data?.voltageEvents?.totalVoltageDrops ?? 0;
  }

  get dropD(): string {
    if (this.totalVoltageDrops === 0) {
      return 'M 5 80 L 395 80';
    }
    return 'M 5 35 Q 35 10 60 35 T 110 20 T 160 27 T 220 46 T 280 60 T 340 65 T 395 61';
  }

  get dropFillD(): string {
    if (this.totalVoltageDrops === 0) {
      return 'M 5 80 L 395 80 L 395 92 L 5 92 Z';
    }
    return 'M 5 35 Q 35 10 60 35 T 110 20 T 160 27 T 220 46 T 280 60 T 340 65 T 395 61 L 395 92 L 5 92 Z';
  }

  get significantEvents(): number {
    return this.data?.voltageEvents?.significantEvents ?? 0;
  }

  get totalAlerts(): number {
    return this.data?.alertFrequency?.totalAlerts ?? 0;
  }

  get peakHour(): string {
    return this.data?.alertFrequency?.peakHourLabel ?? '12:00';
  }

  get histogram(): number[] {
    return this.data?.alertFrequency?.hourlyHistogram && this.data.alertFrequency.hourlyHistogram.length > 0
      ? this.data.alertFrequency.hourlyHistogram
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  get maxHistogram(): number {
    return Math.max(1, ...this.histogram);
  }

  getBarHeight(value: number): number {
    if (value <= 0) return 6;
    return Math.min(100, Math.round((value / this.maxHistogram) * 85 + 10));
  }

  get peakIndex(): number {
    const hist = this.histogram;
    let maxVal = -1;
    let maxIdx = -1;
    for (let i = 0; i < hist.length; i++) {
      if (hist[i] > maxVal) {
        maxVal = hist[i];
        maxIdx = i;
      }
    }
    return maxVal > 0 ? maxIdx : -1;
  }
}
