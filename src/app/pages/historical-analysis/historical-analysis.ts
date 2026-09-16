import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AnalysisFiltersComponent } from './components/analysis-filters/analysis-filters';
import { AnalysisSummary } from './components/analysis-summary/analysis-summary';
import { VoltageTrendChart } from './components/voltage-trend-chart/voltage-trend-chart';
import { MiniAnalysisCharts } from './components/mini-analysis-charts/mini-analysis-charts';
import { AnalysisFilters, AnalysisMetric } from './historical-analysis.models';
import { ReportsService } from '../../core/services/reports.service';
import { FenceService } from '../../core/services/fence.service';
import { DeviceService } from '../../core/services/device.service';
import { SectionService, SectionResponse } from '../../core/services/section.service';
import { FenceRecord } from '../fence-management/fence-management.models';

@Component({
  selector: 'app-historical-analysis',
  standalone: true,
  imports: [AnalysisFiltersComponent, AnalysisSummary, VoltageTrendChart, MiniAnalysisCharts],
  templateUrl: './historical-analysis.html',
  styleUrl: './historical-analysis.css'
})
export class HistoricalAnalysis implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly fenceService = inject(FenceService);
  private readonly deviceService = inject(DeviceService);
  private readonly sectionService = inject(SectionService);

  filters: AnalysisFilters = { province: '', district: '', fence: '', section: '', device: '', period: '24h' };
  notice = '';

  readonly provinceDistricts: Record<string, string[]> = {
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
  districts: string[] = Object.values(this.provinceDistricts).flat().sort();
  fences: string[] = [];
  sections: string[] = [];
  devices: string[] = [];

  private readonly cdr = inject(ChangeDetectorRef);
  private rawFences: FenceRecord[] = [];
  private rawSections: SectionResponse[] = [];
  private rawDevices: any[] = [];

  metrics: AnalysisMetric[] = [
    { label: 'Avg Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Min Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Max Voltage', value: '—', unit: 'kV', tone: 'amber' },
    { label: 'Voltage Stability', value: '—', unit: '%', tone: 'amber' },
    { label: 'Total Faults', value: '0', tone: 'green' },
    { label: 'Uptime', value: '—', unit: '%', tone: 'amber' }
  ];

  ngOnInit(): void {
    this.loadAnalysis();
    this.loadFencesAndDevices();
  }

  loadFencesAndDevices(): void {
    this.fenceService.getFences().subscribe({
      next: (fences) => {
        this.rawFences = fences || [];
        this.loadAllSectionsForFences(this.rawFences);
        this.recalculateAvailableOptions();
      },
      error: () => { this.rawFences = []; }
    });
    this.deviceService.getDevices().subscribe({
      next: (devices) => {
        this.rawDevices = devices || [];
        this.recalculateAvailableOptions();
      },
      error: () => { this.rawDevices = []; }
    });
  }

  private loadAllSectionsForFences(fences: FenceRecord[]): void {
    if (!fences || fences.length === 0) return;
    const accumulated: SectionResponse[] = [];
    let remaining = fences.length;
    fences.forEach((f) => {
      this.sectionService.getSectionsByFence(f.id).subscribe({
        next: (secs) => {
          if (secs && secs.length > 0) {
            accumulated.push(...secs);
          }
          remaining--;
          if (remaining <= 0) {
            this.rawSections = accumulated;
            this.recalculateAvailableOptions();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          remaining--;
          if (remaining <= 0) {
            this.rawSections = accumulated;
            this.recalculateAvailableOptions();
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  private recalculateAvailableOptions(): void {
    // 1. Filter Districts based on Province
    if (this.filters.province && this.provinceDistricts[this.filters.province]) {
      this.districts = [...this.provinceDistricts[this.filters.province]].sort();
    } else {
      this.districts = Object.values(this.provinceDistricts).flat().sort();
    }

    // 2. Filter Fences based on Province & District
    const filteredFences = this.rawFences.filter((f) => {
      const matchProv = !this.filters.province || f.province === this.filters.province || f.provinceName === this.filters.province;
      const matchDist = !this.filters.district || f.district === this.filters.district || f.districtName === this.filters.district;
      return matchProv && matchDist;
    });
    this.fences = filteredFences.map((f) => f.code || f.name);

    // 3. Filter Sections based on selected Fence or Province/District
    let filteredSections = this.rawSections;
    if (this.filters.fence) {
      const selectedFence = this.rawFences.find((f) => f.code === this.filters.fence || f.name === this.filters.fence || String(f.id) === this.filters.fence);
      if (selectedFence) {
        filteredSections = this.rawSections.filter((s) => s.fenceId === selectedFence.id);
      }
    } else if (this.filters.province || this.filters.district) {
      const allowedFenceIds = new Set(filteredFences.map((f) => f.id));
      filteredSections = this.rawSections.filter((s) => allowedFenceIds.has(s.fenceId));
    }
    this.sections = [...new Set(filteredSections.map((s) => s.code))].sort();

    // 4. Filter Devices based on selected Province, District, Fence & Section
    const filteredDevices = this.rawDevices.filter((d) => {
      const parentFence = this.rawFences.find((f) =>
        (d.fence && (f.name === d.fence || f.code === d.fence)) ||
        (d.fenceCode && (f.code === d.fenceCode || f.name === d.fenceCode)) ||
        (d.fenceId && f.id === d.fenceId)
      );

      if (this.filters.province) {
        if (!parentFence) return false;
        const matchProv = parentFence.province === this.filters.province || parentFence.provinceName === this.filters.province;
        if (!matchProv) return false;
      }

      if (this.filters.district) {
        if (!parentFence) return false;
        const matchDist = parentFence.district === this.filters.district || parentFence.districtName === this.filters.district;
        if (!matchDist) return false;
      }

      if (this.filters.fence) {
        if (!parentFence) return false;
        const matchFence = parentFence.code === this.filters.fence || parentFence.name === this.filters.fence || String(parentFence.id) === this.filters.fence;
        if (!matchFence) return false;
      }

      if (this.filters.section) {
        const matchSec = d.section === this.filters.section || d.sectionCode === this.filters.section;
        if (!matchSec) return false;
      }

      return true;
    });
    this.devices = [...new Set(filteredDevices.map((d) => d.serial || d.name || String(d.id)))].sort();
    this.cdr.detectChanges();
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

  updateFilters(newFilters: AnalysisFilters): void {
    if (newFilters.province !== this.filters.province) {
      newFilters = { ...newFilters, district: '', fence: '', section: '', device: '' };
    } else if (newFilters.district !== this.filters.district) {
      newFilters = { ...newFilters, fence: '', section: '', device: '' };
    } else if (newFilters.fence !== this.filters.fence) {
      newFilters = { ...newFilters, section: '', device: '' };
    } else if (newFilters.section !== this.filters.section) {
      newFilters = { ...newFilters, device: '' };
    }

    this.filters = newFilters;
    this.recalculateAvailableOptions();
    this.loadAnalysis();
  }

  message(text: string): void {
    this.notice = text;
  }
}
