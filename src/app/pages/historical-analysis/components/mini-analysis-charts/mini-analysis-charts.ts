import { Component, Input } from '@angular/core';

@Component({selector:'app-mini-analysis-charts',standalone:true,templateUrl:'./mini-analysis-charts.html',styleUrl:'./mini-analysis-charts.css'})
export class MiniAnalysisCharts {
  @Input() battery: number[] = [];
  @Input() voltageDrop: number[] = [];
  @Input() alerts: number[] = [];
  @Input() labels: string[] = [];

  get batteryPoints(): string { return this.linePoints(this.battery, 0, 100); }
  get batteryArea(): string { return `10,75 ${this.batteryPoints} 390,75`; }
  get dropPoints(): string { return this.linePoints(this.voltageDrop, 0, Math.max(1.5, ...this.voltageDrop)); }
  get dropArea(): string { return `10,75 ${this.dropPoints} 390,75`; }
  get alertMax(): number { return Math.max(2, ...this.alerts); }
  get dropMax(): number { return Math.max(1.5, ...this.voltageDrop); }
  alertHeight(value: number): number { return value / this.alertMax * 100; }

  private linePoints(values: number[], min: number, max: number): string {
    return values.map((value, index) => {
      const x = 10 + index / Math.max(1, values.length - 1) * 380;
      const y = 75 - (Math.max(min, Math.min(max, value)) - min) / Math.max(1, max - min) * 65;
      return `${x},${y}`;
    }).join(' ');
  }
}
