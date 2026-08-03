import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-voltage-trend-chart',
  standalone: true,
  templateUrl: './voltage-trend-chart.html',
  styleUrl: './voltage-trend-chart.css',
})
export class VoltageTrendChart {
  @Input() subtitle = '24-hour voltage readings · All active sections';
  @Input() values: number[] = [];
  @Input() labels: string[] = [];

  get points(): string { return this.coordinates.map(point => `${point.x},${point.y}`).join(' '); }
  get areaPoints(): string { return `30,130 ${this.points} 1180,130`; }
  get coordinates(): { x: number; y: number; value: number }[] {
    return this.values.map((value, index) => ({
      x: 30 + index / Math.max(1, this.values.length - 1) * 1150,
      y: 130 - Math.max(0, Math.min(8, value)) / 8 * 110,
      value,
    }));
  }
  labelX(index: number): number { return 30 + index / Math.max(1, this.labels.length - 1) * 1150; }
}
