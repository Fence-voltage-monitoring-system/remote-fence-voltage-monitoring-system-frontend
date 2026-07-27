import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';
import { VoltageReading } from '../../../../core/models/dashboard-api';

@Component({ selector: 'app-voltage-chart', standalone: true, templateUrl: './voltage-chart.html', styleUrl: './voltage-chart.css' })
export class VoltageChartComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) device!: DeviceMonitoringContext;
  @Input() readings: VoltageReading[] = [];
  @ViewChild('chart') canvas!: ElementRef<HTMLCanvasElement>;
  private ready = false;

  ngAfterViewInit(): void { this.ready = true; this.draw(); }
  ngOnChanges(): void { if (this.ready) requestAnimationFrame(() => this.draw()); }
  @HostListener('window:resize') onResize(): void { this.draw(); }

  private draw(): void {
    if (!this.canvas) return;
    const canvas = this.canvas.nativeElement, rect = canvas.getBoundingClientRect(), density = devicePixelRatio || 1;
    canvas.width = rect.width * density; canvas.height = rect.height * density;
    const context = canvas.getContext('2d')!; context.scale(density, density);
    const width = rect.width, height = rect.height, padding = 28;
    context.strokeStyle = '#465a43'; context.lineWidth = .6;
    for (let index = 0; index < 5; index++) { const y = 10 + index * (height - 35) / 4; context.beginPath(); context.moveTo(padding, y); context.lineTo(width - 8, y); context.stroke(); }
    const values = this.readings.length ? this.readings.map(reading => reading.voltage) : [this.device.voltage];
    context.strokeStyle = this.device.status === 'critical' ? '#ff4941' : this.device.status === 'warning' ? '#ffc01c' : this.device.status === 'offline' ? '#849083' : '#4ce276';
    context.lineWidth = 2; context.beginPath();
    values.forEach((value, index) => { const x = padding + index * (width - padding - 10) / Math.max(1, values.length - 1), displayedValue = Math.max(3, Math.min(7, value)), y = 10 + ((7 - displayedValue) / 4) * (height - 35); index ? context.lineTo(x, y) : context.moveTo(x, y); });
    context.stroke();
  }
}
