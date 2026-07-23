import { Component } from '@angular/core';
import { FenceSummary } from './components/fence-summary/fence-summary';
import { FenceTable } from './components/fence-table/fence-table';
import { FenceToolbar } from './components/fence-toolbar/fence-toolbar';
import { FenceRegistrationDrawer, FenceRegistrationValue } from './components/fence-registration-drawer/fence-registration-drawer';
import { FenceFilters, FenceRecord, FenceSummaryData } from './fence-management.models';

@Component({ selector: 'app-fence-management', standalone: true, imports: [FenceSummary, FenceToolbar, FenceTable, FenceRegistrationDrawer], templateUrl: './fence-management.html', styleUrl: './fence-management.css' })
export class FenceManagement {
  readonly fences: FenceRecord[] = [
    { id:1, code:'EPF-MNR-A', name:'Monaragala Zone A', province:'Uva', district:'Monaragala', lengthKm:48.6, sections:12, gateway:'GTW-MNR-01', averageVoltageKv:5.4, health:'WARNING', lastUpdated:'12s ago' },
    { id:2, code:'EPF-ANR-B', name:'Anuradhapura Zone B', province:'North Central', district:'Anuradhapura', lengthKm:62.4, sections:16, gateway:'GTW-ANR-02', averageVoltageKv:5.9, health:'HEALTHY', lastUpdated:'8s ago' },
    { id:3, code:'EPF-PLN-C', name:'Polonnaruwa Corridor C', province:'North Central', district:'Polonnaruwa', lengthKm:35.2, sections:9, gateway:'GTW-PLN-03', averageVoltageKv:4.1, health:'CRITICAL', lastUpdated:'4m ago' },
    { id:4, code:'EPF-AMP-D', name:'Ampara Zone D', province:'Eastern', district:'Ampara', lengthKm:54.8, sections:14, gateway:'GTW-AMP-04', averageVoltageKv:null, health:'OFFLINE', lastUpdated:'1h ago' },
    { id:5, code:'EPF-HMB-E', name:'Hambantota Southern E', province:'Southern', district:'Hambantota', lengthKm:71.3, sections:18, gateway:'GTW-HMB-05', averageVoltageKv:5.8, health:'HEALTHY', lastUpdated:'15s ago' }
  ];
  filters: FenceFilters = { search:'', province:'', district:'', gateway:'', health:'' };
  notice = '';
  isRegistrationOpen = false;
  get provinces(): string[] { return [...new Set(this.fences.map(f => f.province))]; }
  get districts(): string[] { return [...new Set(this.fences.filter(f => !this.filters.province || f.province === this.filters.province).map(f => f.district))]; }
  get gateways(): string[] { return [...new Set(this.fences.map(f => f.gateway))]; }
  get summary(): FenceSummaryData { return { total:this.fences.length, operational:this.fences.filter(f => f.health === 'HEALTHY').length, warning:this.fences.filter(f => f.health === 'WARNING').length, critical:this.fences.filter(f => f.health === 'CRITICAL').length, monitoredLengthKm:this.fences.reduce((sum, f) => sum + f.lengthKm, 0) }; }
  get filteredFences(): FenceRecord[] { const q=this.filters.search.trim().toLowerCase(); return this.fences.filter(f => (!q || `${f.code} ${f.name} ${f.province} ${f.district} ${f.gateway}`.toLowerCase().includes(q)) && (!this.filters.province || f.province===this.filters.province) && (!this.filters.district || f.district===this.filters.district) && (!this.filters.gateway || f.gateway===this.filters.gateway) && (!this.filters.health || f.health===this.filters.health)); }
  openRegistration(): void { this.isRegistrationOpen = true; }
  closeRegistration(): void { this.isRegistrationOpen = false; }
  saveDraft(fence: FenceRegistrationValue): void { this.notice = `Draft saved for ${fence.name}.`; this.closeRegistration(); }
  registerFence(fence: FenceRegistrationValue): void { this.notice = `${fence.name} was submitted for registration.`; this.closeRegistration(); }
  selectFence(fence: FenceRecord): void { this.notice = `${fence.name} selected.`; }
}
