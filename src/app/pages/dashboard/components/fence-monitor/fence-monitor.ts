import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceMonitoringContext } from '../../../../core/models/device-monitoring';
import { FenceService } from '../../../../core/services/fence.service';
import { SectionService, SectionResponse } from '../../../../core/services/section.service';

type FenceState = 'healthy' | 'warning' | 'critical' | 'offline';
interface Fence { id: string; dbId?: number; name: string; province: string; district: string; zone: string; gateway: string; latitude: number; longitude: number; sectionCount: number; updateIntervalMinutes: number; }
export interface FenceSelection { id: string; name: string; latitude: number; longitude: number; sectionCount: number; }
export interface FenceRouteSection { id: string; status: FenceState; voltage: number; latitude: number; longitude: number; updated: string; }
export interface FenceRouteData { id: string; name: string; district: string; zone: string; sections: FenceRouteSection[]; }
interface ScheduleState { lastUpdatedAt: number; nextUpdateAt: number; cycle: number; }
interface Section {
  id: string; voltage: string; state: FenceState; battery: number; voltageDrop: string;
  solarCharging: number; signalStrength: number; gateway: string;
  latitude: string; longitude: string; updated: string;
}

@Component({ selector: 'app-fence-monitor', standalone: true, imports: [FormsModule], templateUrl: './fence-monitor.html', styleUrl: './fence-monitor.css' })
export class FenceMonitorComponent implements OnInit, OnDestroy {
  private readonly fenceService = inject(FenceService);
  private readonly sectionService = inject(SectionService);

  @ViewChild('scroller') scroller!: ElementRef<HTMLElement>;
  @ViewChild('cardsDeck') cardsDeck?: ElementRef<HTMLElement>;
  @Output() readonly deviceChange = new EventEmitter<DeviceMonitoringContext>();
  @Output() readonly fenceChange = new EventEmitter<FenceSelection>();
  @Output() readonly fenceRouteChange = new EventEmitter<FenceRouteData>();
  @Output() readonly sectionMapRequest = new EventEmitter<string>();
  @Input() showFenceSelector = true;
  @Input() showSectionTable = false;
  @Input() statusFilter: FenceState | 'all' = 'all';
  @Input() set fenceId(value: string) {
    if (value && this.selectedFence && value !== this.selectedFence.id) this.selectFence(value);
  }

  readonly provinceDistricts: Readonly<Record<string, readonly string[]>> = {
    Western: ['Colombo', 'Gampaha', 'Kalutara'],
    Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
    Southern: ['Galle', 'Matara', 'Hambantota'],
    Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
    Eastern: ['Batticaloa', 'Ampara', 'Trincomalee'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    Uva: ['Badulla', 'Monaragala'],
    Sabaragamuwa: ['Ratnapura', 'Kegalle'],
  };
  readonly provinces = Object.keys(this.provinceDistricts);

  fences: Fence[] = [];
  selectedFence: Fence | null = null;
  selectedProvince = 'all';
  selectedDistrict = 'all';
  sections: Section[] = [];
  selected: Section | null = null;

  private schedules = new Map<string, ScheduleState>();
  private scheduleTimer: any = null;
  lastUpdatedLabel = 'just now';
  nextUpdateLabel = '15:00';
  drawerOpen = false;
  alertAcknowledged = false;

  ngOnInit(): void {
    this.loadBackendFences();
    this.scheduleTimer = setInterval(() => this.updateSchedule(), 1000);
  }

  private loadBackendFences(): void {
    this.fenceService.getFences().subscribe({
      next: (records) => {
        if (!records || records.length === 0) {
          this.fences = [];
          this.selectedFence = null;
          this.sections = [];
          this.selected = null;
          return;
        }
        this.fences = records.map((r) => ({
          id: r.code || String(r.id),
          dbId: r.id,
          name: r.name,
          province: r.province,
          district: r.district,
          zone: 'Zone A',
          gateway: r.gateway || 'GTW',
          latitude: 6.8681,
          longitude: 81.3342,
          sectionCount: r.sections || 0,
          updateIntervalMinutes: 15,
        }));
        if (this.fences.length > 0) {
          this.selectFence(this.fences[0].id);
        }
      },
      error: () => {
        this.fences = [];
        this.selectedFence = null;
        this.sections = [];
        this.selected = null;
      }
    });
  }

  get availableDistricts(): readonly string[] {
    return this.selectedProvince === 'all'
      ? Object.values(this.provinceDistricts).flat()
      : this.provinceDistricts[this.selectedProvince] ?? [];
  }

  get availableFences(): Fence[] {
    return this.fences.filter((fence) =>
      (this.selectedProvince === 'all' || fence.province === this.selectedProvince) &&
      (this.selectedDistrict === 'all' || fence.district === this.selectedDistrict));
  }

  get filteredSections(): Section[] {
    return this.statusFilter === 'all' ? this.sections : this.sections.filter((section) => section.state === this.statusFilter);
  }

  selectProvince(province: string): void {
    this.selectedProvince = province;
    this.selectedDistrict = 'all';
    this.selectFirstAvailableFence();
  }

  selectDistrict(district: string): void {
    this.selectedDistrict = district;
    this.selectFirstAvailableFence();
  }

  selectFence(fenceId: string): void {
    const found = this.fences.find((fence) => fence.id === fenceId);
    if (!found) return;
    this.selectedFence = found;
    if (this.selectedFence.dbId) {
      this.sectionService.getSectionsByFence(this.selectedFence.dbId).subscribe({
        next: (rows) => {
          this.sections = (rows || []).map((row) => this.mapSectionResponseToSection(row, this.selectedFence!));
          this.selected = this.sections[0] || null;
          this.scroller?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
          if (this.selected) this.emitDevice();
          this.fenceChange.emit({ id: this.selectedFence!.id, name: this.selectedFence!.name, latitude: this.selectedFence!.latitude, longitude: this.selectedFence!.longitude, sectionCount: this.sections.length });
          this.emitFenceRoute();
        },
        error: () => {
          this.sections = [];
          this.selected = null;
        }
      });
    } else {
      this.sections = [];
      this.selected = null;
    }
  }

  private mapSectionResponseToSection(row: SectionResponse, fence: Fence): Section {
    const rawStatus = (row.status || 'OFFLINE').toLowerCase();
    const state: FenceState = rawStatus === 'healthy' ? 'healthy' : rawStatus === 'warning' ? 'warning' : rawStatus === 'critical' ? 'critical' : 'offline';
    return {
      id: row.code,
      voltage: row.voltageKv != null ? Number(row.voltageKv).toFixed(1) : '—',
      state,
      battery: row.battery != null ? row.battery : 0,
      voltageDrop: '0.0',
      solarCharging: 0,
      signalStrength: -70,
      gateway: fence.gateway,
      latitude: row.startGps ? row.startGps.split(',')[0]?.trim() || '' : '',
      longitude: row.startGps ? row.startGps.split(',')[1]?.trim() || '' : '',
      updated: row.updatedAt ? new Date(row.updatedAt).toLocaleTimeString() : 'Unavailable',
    };
  }

  selectSection(section: Section): void {
    this.selected = section;
    this.emitDevice();
    this.updateSchedule();
  }

  openSectionDetails(section: Section): void {
    this.selectSection(section);
    this.alertAcknowledged = false;
    this.drawerOpen = true;
  }

  closeSectionDetails(): void { this.drawerOpen = false; }

  viewSelectedOnMap(): void {
    if (!this.selected) return;
    const sectionId = this.selected.id;
    this.closeSectionDetails();
    this.sectionMapRequest.emit(sectionId);
  }

  @HostListener('document:keydown.escape')
  closeDrawerOnEscape(): void { this.closeSectionDetails(); }

  get trendPoints(): string {
    if (!this.selected) return '';
    const base = Number.parseFloat(this.selected.voltage) || 0;
    return Array.from({ length: 16 }, (_, index) => {
      const value = this.selected?.state === 'offline' ? 0 : Math.max(0, Math.min(7, base + Math.sin(index * .8) * .42 + Math.cos(index * .35) * .2));
      return `${index * 24},${82 - value * 10}`;
    }).join(' ');
  }

  private selectFirstAvailableFence(): void {
    const firstFence = this.availableFences[0];
    if (firstFence) this.selectFence(firstFence.id);
  }

  deviceId(section: Section): string {
    if (!section || !this.selectedFence) return '—';
    const fenceIndex = this.fences.indexOf(this.selectedFence);
    const fenceNumber = String(fenceIndex >= 0 ? fenceIndex + 1 : 1).padStart(2, '0');
    return `DEV-EFE-${fenceNumber}${section.id.slice(-3)}`;
  }

  ngOnDestroy(): void {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
  }

  private refreshTelemetry(cycle: number): void {
    if (!this.selected) return;
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
    this.selected = this.sections.find((section) => section.id === selectedId) ?? this.sections[0] ?? null;
    if (this.selected) this.emitDevice();
    this.emitFenceRoute();
  }

  private updateSchedule(): void {
    if (!this.selectedFence || !this.selected) return;
    const schedule = this.schedules.get(`${this.selectedFence.id}:${this.selected.id}`);
    if (!schedule) return;
    const now = Date.now();
    if (now >= schedule.nextUpdateAt) {
      schedule.lastUpdatedAt = now;
      schedule.nextUpdateAt = now + 15 * 60_000;
      schedule.cycle++;
      this.refreshTelemetry(schedule.cycle);
    }
    this.lastUpdatedLabel = this.relativeTime(now - schedule.lastUpdatedAt);
    this.nextUpdateLabel = this.countdown(schedule.nextUpdateAt - now);
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

  scroll(offset: number): void {
    if (this.scroller?.nativeElement) {
      this.scroller.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
    if (this.cardsDeck?.nativeElement) {
      this.cardsDeck.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  onScrollerScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.cardsDeck?.nativeElement && target) {
      this.cardsDeck.nativeElement.scrollLeft = target.scrollLeft;
    }
  }

  private emitDevice(): void {
    if (!this.selectedFence || !this.selected) return;
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

  private emitFenceRoute(): void {
    if (!this.selectedFence) return;
    this.fenceRouteChange.emit({
      id: this.selectedFence.id, name: this.selectedFence.name, district: this.selectedFence.district, zone: this.selectedFence.zone,
      sections: this.sections.map(section => ({ id: section.id, status: section.state, voltage: Number.parseFloat(section.voltage) || 0, latitude: Number.parseFloat(section.latitude) || 0, longitude: Number.parseFloat(section.longitude) || 0, updated: section.updated })),
    });
  }
}
