import { Component, inject } from '@angular/core';
import { ManagementAccessService } from '../../core/services/management-access.service';
import { FenceSummary } from './components/fence-summary/fence-summary';
import { FenceTable } from './components/fence-table/fence-table';
import { FenceToolbar } from './components/fence-toolbar/fence-toolbar';
import { FenceRegistrationDrawer, FenceRegistrationValue } from './components/fence-registration-drawer/fence-registration-drawer';
import { FenceFilters, FenceRecord, FenceSummaryData, MaintenanceUserOption } from './fence-management.models';
import { FenceEditDrawer, FenceEditValue } from './components/fence-edit-drawer/fence-edit-drawer';
import { FenceService } from '../../core/services/fence.service';

@Component({ selector: 'app-fence-management', standalone: true, imports: [FenceSummary, FenceToolbar, FenceTable, FenceRegistrationDrawer, FenceEditDrawer], templateUrl: './fence-management.html', styleUrl: './fence-management.css' })
export class FenceManagement {
  readonly access = inject(ManagementAccessService);
  private readonly fenceService=inject(FenceService);
  readonly maintenanceUsers: MaintenanceUserOption[] = [
    { id: 101, name: 'Malini Rajapaksa', email: 'mrajapaksa@dwc.gov.lk', province: 'Uva', district: 'Monaragala', active: true },
    { id: 102, name: 'Ruwan Silva', email: 'rsilva@dwc.gov.lk', province: 'Uva', district: 'Monaragala', active: true },
    { id: 103, name: 'Nadeesha Kumari', email: 'nkumari@dwc.gov.lk', province: 'North Central', district: 'Anuradhapura', active: true },
    { id: 104, name: 'Saman Bandara', email: 'sbandara@dwc.gov.lk', province: 'North Central', district: 'Polonnaruwa', active: true },
    { id: 105, name: 'Chamara Jayawardena', email: 'cjayawardena@dwc.gov.lk', province: 'Eastern', district: 'Ampara', active: true },
    { id: 106, name: 'Anura Wickremasinghe', email: 'awickrema@dwc.gov.lk', province: 'Southern', district: 'Hambantota', active: true }
  ];
  readonly fences: FenceRecord[] = [
    { id:1, code:'EPF-MNR-A', name:'Monaragala Zone A', province:'Uva', district:'Monaragala', lengthKm:48.6, sections:12, gateway:'GTW-MNR-01', averageVoltageKv:5.4, health:'WARNING', lastUpdated:'12s ago', primaryMaintenanceUserId:101, backupMaintenanceUserIds:[102] },
    { id:2, code:'EPF-ANR-B', name:'Anuradhapura Zone B', province:'North Central', district:'Anuradhapura', lengthKm:62.4, sections:16, gateway:'GTW-ANR-02', averageVoltageKv:5.9, health:'HEALTHY', lastUpdated:'8s ago', primaryMaintenanceUserId:103, backupMaintenanceUserIds:[] },
    { id:3, code:'EPF-PLN-C', name:'Polonnaruwa Corridor C', province:'North Central', district:'Polonnaruwa', lengthKm:35.2, sections:9, gateway:'GTW-PLN-03', averageVoltageKv:4.1, health:'CRITICAL', lastUpdated:'4m ago', primaryMaintenanceUserId:104, backupMaintenanceUserIds:[] },
    { id:4, code:'EPF-AMP-D', name:'Ampara Zone D', province:'Eastern', district:'Ampara', lengthKm:54.8, sections:14, gateway:'GTW-AMP-04', averageVoltageKv:null, health:'OFFLINE', lastUpdated:'1h ago', primaryMaintenanceUserId:105, backupMaintenanceUserIds:[] },
    { id:5, code:'EPF-HMB-E', name:'Hambantota Southern E', province:'Southern', district:'Hambantota', lengthKm:71.3, sections:18, gateway:'GTW-HMB-05', averageVoltageKv:5.8, health:'HEALTHY', lastUpdated:'15s ago', primaryMaintenanceUserId:106, backupMaintenanceUserIds:[] }
  ];
  filters: FenceFilters = { search:'', province:this.access.lockedProvince, district:this.access.lockedDistrict, gateway:'', health:'' };
  notice = '';
  isRegistrationOpen = false;
  selectedFence: FenceRecord | null = null;
  get accessibleFences():FenceRecord[]{return this.fences.filter(f=>this.access.canView(f.province,f.district));}
  get provinces(): string[] { return this.access.provinces([...new Set(this.fences.map(f => f.province))]); }
  get districts(): string[] { const all=[...new Set(this.accessibleFences.filter(f => !this.filters.province || f.province === this.filters.province).map(f => f.district))];return this.access.districts(this.filters.province,all); }
  get gateways(): string[] { return [...new Set(this.accessibleFences.map(f => f.gateway))]; }
  get summary(): FenceSummaryData { const fences=this.accessibleFences;return { total:fences.length, operational:fences.filter(f => f.health === 'HEALTHY').length, warning:fences.filter(f => f.health === 'WARNING').length, critical:fences.filter(f => f.health === 'CRITICAL').length, monitoredLengthKm:fences.reduce((sum, f) => sum + f.lengthKm, 0) }; }
  get filteredFences(): FenceRecord[] { const q=this.filters.search.trim().toLowerCase(); return this.accessibleFences.filter(f => (!q || `${f.code} ${f.name} ${f.province} ${f.district} ${f.gateway}`.toLowerCase().includes(q)) && (!this.filters.province || f.province===this.filters.province) && (!this.filters.district || f.district===this.filters.district) && (!this.filters.gateway || f.gateway===this.filters.gateway) && (!this.filters.health || f.health===this.filters.health)); }
  openRegistration(): void { this.isRegistrationOpen = true; }
  closeRegistration(): void { this.isRegistrationOpen = false; }
  saveDraft(fence: FenceRegistrationValue): void { this.closeRegistration();this.fenceService.saveDraft(fence).subscribe({next:()=>this.notice=`Draft saved for ${fence.name}.`,error:()=>this.notice=`Fence API unavailable. ${fence.name} draft is retained in preview only.`}); }
  registerFence(fence: FenceRegistrationValue): void { this.closeRegistration();this.fenceService.register(fence).subscribe({next:created=>{this.fences.push(created);this.notice=`${fence.name} was registered with its maintenance team.`;},error:()=>this.notice=`Fence API unavailable. ${fence.name} registration was validated but not persisted.`}); }
  selectFence(fence: FenceRecord): void { this.selectedFence = fence; }
  closeEdit(): void { this.selectedFence = null; }
  saveFence(fence: FenceEditValue): void { this.closeEdit();this.fenceService.update(fence).subscribe({next:updated=>{this.applyFenceUpdate(updated);this.notice=`${fence.name} and its maintenance team were saved.`;},error:()=>{this.applyFenceUpdate(fence);this.notice=`Fence API unavailable. ${fence.name} changes are shown in local preview only.`;}}); }
  deleteFence(fence: FenceRecord): void { this.closeEdit();this.fenceService.delete(fence.id).subscribe({next:()=>{this.removeFence(fence);this.notice=`${fence.name} was deleted.`;},error:()=>this.notice=`Fence API unavailable. ${fence.name} was not deleted.`}); }
  private applyFenceUpdate(fence:Partial<FenceRecord>&{id:number}):void{const existing=this.fences.find(item=>item.id===fence.id);if(existing)Object.assign(existing,fence);}
  private removeFence(fence:FenceRecord):void{const index=this.fences.findIndex(item=>item.id===fence.id);if(index>=0)this.fences.splice(index,1);}
}
