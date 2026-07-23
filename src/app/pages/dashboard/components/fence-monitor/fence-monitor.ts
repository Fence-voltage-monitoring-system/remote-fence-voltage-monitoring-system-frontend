import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { DeviceMonitoringContext, FenceUpdateSchedule } from '../../../../core/models/device-monitoring';

type FenceState = 'healthy' | 'warning' | 'critical' | 'offline';
interface Fence { id: string; name: string; district: string; zone: string; gateway: string; latitude: number; longitude: number; sectionCount: number; updateIntervalMinutes: number; }
interface ScheduleState { lastUpdatedAt: number; nextUpdateAt: number; cycle: number; }
interface Section {
  id: string; voltage: string; state: FenceState; battery: number; voltageDrop: string;
  solarCharging: number; signalStrength: number; gateway: string;
  latitude: string; longitude: string; updated: string;
}

@Component({ selector: 'app-fence-monitor', standalone: true, templateUrl: './fence-monitor.html', styleUrl: './fence-monitor.css' })
export class FenceMonitorComponent implements OnDestroy {
  @ViewChild('scroller') scroller!: ElementRef<HTMLElement>;
  @Output() readonly deviceChange = new EventEmitter<DeviceMonitoringContext>();
  @Output() readonly scheduleChange = new EventEmitter<FenceUpdateSchedule>();
  @Input() showFenceSelector = true;
  @Input() showSectionTable = false;
  @Input() statusFilter: FenceState | 'all' = 'all';
  @Input() set fenceId(value: string) {
    if (value && value !== this.selectedFence.id) this.selectFence(value);
  }

  readonly fences: Fence[] = [
    { id: 'monaragala', name: 'Monaragala Elephant Protection Fence', district: 'Monaragala', zone: 'Zone A', gateway: 'MNR', latitude: 6.8681, longitude: 81.3342, sectionCount: 24, updateIntervalMinutes: 15 },
    { id: 'wilpattu', name: 'Wilpattu North Buffer Fence', district: 'Puttalam', zone: 'Zone B', gateway: 'WLP', latitude: 8.4580, longitude: 80.0280, sectionCount: 18, updateIntervalMinutes: 10 },
    { id: 'mihintale', name: 'Mihintale Wildlife Buffer Fence', district: 'Anuradhapura', zone: 'Zone C', gateway: 'MHT', latitude: 8.3500, longitude: 80.5050, sectionCount: 12, updateIntervalMinutes: 30 },
    { id: 'gal-oya', name: 'Gal Oya East Protection Fence', district: 'Ampara', zone: 'Zone D', gateway: 'GOY', latitude: 7.2920, longitude: 81.6250, sectionCount: 20, updateIntervalMinutes: 5 },
    { id: 'lunugamvehera', name: 'Lunugamvehera Park Fence', district: 'Hambantota', zone: 'Zone E', gateway: 'LNV', latitude: 6.3410, longitude: 81.1510, sectionCount: 16, updateIntervalMinutes: 20 },
  ];

  private readonly schedules = new Map(this.fences.map((fence, index) => {
    const now = Date.now();
    const lastUpdatedAt = now - (index + 1) * 45_000;
    return [fence.id, { lastUpdatedAt, nextUpdateAt: lastUpdatedAt + fence.updateIntervalMinutes * 60_000, cycle: 0 } satisfies ScheduleState];
  }));
  private readonly scheduleTimer = setInterval(() => this.updateSchedule(), 1000);
  lastUpdatedLabel = 'just now';
  nextUpdateLabel = '15:00';

  selectedFence = this.fences[0];
  sections = this.buildSections(this.selectedFence);
  selected: Section = this.sections[4];

  get filteredSections(): Section[] {
    return this.statusFilter === 'all' ? this.sections : this.sections.filter((section) => section.state === this.statusFilter);
  }

  selectFence(fenceId: string): void {
    this.selectedFence = this.fences.find((fence) => fence.id === fenceId) ?? this.fences[0];
    this.sections = this.buildSections(this.selectedFence);
    this.selected = this.sections[0];
    this.scroller?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
    this.emitDevice();
  }

  selectSection(section: Section): void {
    this.selected = section;
    this.emitDevice();
    this.updateSchedule();
  }

  deviceId(section: Section): string {
    const fenceNumber = String(this.fences.indexOf(this.selectedFence) + 1).padStart(2, '0');
    return `DEV-EFE-${fenceNumber}${section.id.slice(-3)}`;
  }

  scroll(amount: number): void {
    this.scroller.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }

  private buildSections(fence: Fence): Section[] {
    return Array.from({ length: fence.sectionCount }, (_, index) => {
      const states: FenceState[] = ['healthy', 'healthy', 'warning', 'critical', 'healthy', 'offline', 'healthy', 'warning'];
      const volts = ['6.2', '5.8', '4.1', '0.0', '5.9', '—', '5.4', '4.8'];
      const batteries = [96, 88, 42, 74, 91, 0, 86, 53];
      const solar = [98, 92, 61, 80, 95, 0, 90, 68];
      const signal = [-61, -65, -77, -72, -68, -120, -64, -75];
      const slot = (index + this.fences.indexOf(fence)) % 8;
      return {
        id: `SEC-${String(index + 1).padStart(3, '0')}`,
        voltage: volts[slot], state: states[slot], battery: batteries[slot],
        voltageDrop: states[slot] === 'critical' ? '5.9' : states[slot] === 'warning' ? '1.8' : '0.2',
        solarCharging: solar[slot], signalStrength: signal[slot],
        gateway: `GTW-${fence.gateway}-${String(Math.floor(index / 8) + 1).padStart(2, '0')}`,
        latitude: `${(fence.latitude + index * 0.001).toFixed(4)}° N`,
        longitude: `${(fence.longitude + index * 0.001).toFixed(4)}° E`,
        updated: states[slot] === 'offline' ? '22m ago' : `${8 + index}s ago`,
      };
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.scheduleTimer);
  }

  private refreshTelemetry(cycle: number): void {
    const selectedId = this.selected.id;
    this.sections = this.sections.map((section, index) => {
      if (section.state === 'offline') return { ...section, updated: 'just now' };
      const adjustment = ((cycle + index) % 3 - 1) * 0.1;
      const currentVoltage = Number.parseFloat(section.voltage) || 0;
      return {
        ...section,
        voltage: Math.max(0, currentVoltage + adjustment).toFixed(1),
        battery: Math.max(0, Math.min(100, section.battery - (index % 2))),
        updated: 'just now',
      };
    });
    this.selected = this.sections.find((section) => section.id === selectedId) ?? this.sections[0];
    this.emitDevice();
  }

  private updateSchedule(): void {
    const schedule = this.schedules.get(this.selectedFence.id);
    if (!schedule) return;
    const now = Date.now();
    if (now >= schedule.nextUpdateAt) {
      schedule.lastUpdatedAt = now;
      schedule.nextUpdateAt = now + this.selectedFence.updateIntervalMinutes * 60_000;
      schedule.cycle++;
      this.refreshTelemetry(schedule.cycle);
    }
    this.lastUpdatedLabel = this.relativeTime(now - schedule.lastUpdatedAt);
    this.nextUpdateLabel = this.countdown(schedule.nextUpdateAt - now);
    this.scheduleChange.emit({
      fenceId: this.selectedFence.id,
      fenceName: this.selectedFence.name,
      lastUpdatedLabel: this.lastUpdatedLabel,
      nextUpdateLabel: this.nextUpdateLabel,
      intervalMinutes: this.selectedFence.updateIntervalMinutes,
    });
  }

  private relativeTime(elapsedMs: number): string {
    const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  private countdown(remainingMs: number): string {
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  private emitDevice(): void {
    this.deviceChange.emit({
      fenceId: this.selectedFence.id,
      fenceName: this.selectedFence.name,
      sectionId: this.selected.id,
      deviceId: `${this.selected.gateway}-${this.selected.id.slice(-3)}`,
      voltage: Number.parseFloat(this.selected.voltage) || 0,
      battery: this.selected.battery,
      status: this.selected.state,
    });
  }
}
