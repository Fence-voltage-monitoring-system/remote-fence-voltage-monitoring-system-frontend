import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';
import { VoltageReading } from '../../../../core/models/dashboard-api';

@Component({ selector: 'app-voltage-chart', standalone: true, templateUrl: './voltage-chart.html', styleUrl: './voltage-chart.css' })
export class VoltageChartComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) device!: DeviceMonitoringContext;
  @Input() readings: VoltageReading[] = [];
  @ViewChild('chart') canvas!: ElementRef<HTMLCanvasElement>;
  private ready = false;

  get timeLabels(): string[] {
    const now = new Date();
    return [
      this.formatTime(new Date(now.getTime() - 24 * 3600 * 1000)),
      this.formatTime(new Date(now.getTime() - 18 * 3600 * 1000)),
      this.formatTime(new Date(now.getTime() - 12 * 3600 * 1000)),
      this.formatTime(new Date(now.getTime() - 6 * 3600 * 1000)),
      'Now'
    ];
  }

  private formatTime(d: Date): string {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  ngAfterViewInit(): void { this.ready = true; this.draw(); }
  ngOnChanges(): void { if (this.ready) requestAnimationFrame(() => this.draw()); }
  @HostListener('window:resize') onResize(): void { this.draw(); }

  private draw(): void {
    if (!this.canvas) return;
    const canvas = this.canvas.nativeElement, rect = canvas.getBoundingClientRect(), density = devicePixelRatio || 1;
    canvas.width = rect.width * density; canvas.height = rect.height * density;
    const context = canvas.getContext('2d')!; context.scale(density, density);
    const width = rect.width, height = rect.height, padding = 28;

    // Draw horizontal grid lines
    context.strokeStyle = '#465a43'; context.lineWidth = .6;
    for (let index = 0; index < 5; index++) {
      const y = 10 + index * (height - 35) / 4;
      context.beginPath();
      context.moveTo(padding, y);
      context.lineTo(width - 8, y);
      context.stroke();
    }

    const strokeColor = this.getStrokeColor();
    const plotWidth = width - padding - 10;
    const now = Date.now();
    const windowDurationMs = 24 * 60 * 60 * 1000;
    const windowStartMs = now - windowDurationMs;

    // Parse and filter valid readings within the 24-hour window
    const validReadings = (this.readings || [])
      .filter(r => r.voltage != null && !isNaN(r.voltage))
      .map(r => ({
        time: r.recordedAt ? new Date(r.recordedAt).getTime() : now,
        voltage: r.voltage
      }))
      .filter(r => !isNaN(r.time) && r.time >= windowStartMs - 60000 && r.time <= now + 60000)
      .sort((a, b) => a.time - b.time);

    // If no telemetry has been recorded in the past 24 hours, display clean empty state
    if (validReadings.length === 0) {
      context.fillStyle = '#698066';
      context.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('No telemetry data recorded in the last 24 hours', width / 2, (height - 25) / 2 + 10);
      return;
    }

    // Maximum gap between consecutive readings before breaking the line (30 minutes)
    const maxGapMs = 30 * 60 * 1000;

    context.strokeStyle = strokeColor;
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';

    let segmentOpen = false;
    let segmentPointCount = 0;
    let lastSegmentPoint = { x: 0, y: 0 };

    for (let i = 0; i < validReadings.length; i++) {
      const reading = validReadings[i];
      const ratio = Math.max(0, Math.min(1, (reading.time - windowStartMs) / windowDurationMs));
      const x = padding + ratio * plotWidth;
      const displayedValue = Math.max(3, Math.min(7, reading.voltage));
      const y = 10 + ((7 - displayedValue) / 4) * (height - 35);

      if (i > 0 && (reading.time - validReadings[i - 1].time > maxGapMs)) {
        if (segmentOpen) {
          context.stroke();
          if (segmentPointCount === 1) {
            context.fillStyle = strokeColor;
            context.beginPath();
            context.arc(lastSegmentPoint.x, lastSegmentPoint.y, 2.5, 0, Math.PI * 2);
            context.fill();
          }
          segmentOpen = false;
        }
      }

      if (!segmentOpen) {
        context.beginPath();
        context.moveTo(x, y);
        segmentOpen = true;
        segmentPointCount = 1;
      } else {
        context.lineTo(x, y);
        segmentPointCount++;
      }
      lastSegmentPoint = { x, y };
    }

    if (segmentOpen) {
      context.stroke();
      if (segmentPointCount === 1) {
        context.fillStyle = strokeColor;
        context.beginPath();
        context.arc(lastSegmentPoint.x, lastSegmentPoint.y, 2.5, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Draw active dot on the newest recorded reading
    const latest = validReadings[validReadings.length - 1];
    const latestRatio = Math.max(0, Math.min(1, (latest.time - windowStartMs) / windowDurationMs));
    const latestX = padding + latestRatio * plotWidth;
    const latestY = 10 + ((7 - Math.max(3, Math.min(7, latest.voltage))) / 4) * (height - 35);
    context.fillStyle = strokeColor;
    context.beginPath();
    context.arc(latestX, latestY, 3.5, 0, Math.PI * 2);
    context.fill();
  }

  private getStrokeColor(): string {
    const status = this.device?.status;
    return status === 'critical' ? '#ff4941' : status === 'warning' ? '#ffc01c' : status === 'offline' ? '#849083' : '#4ce276';
  }
}
