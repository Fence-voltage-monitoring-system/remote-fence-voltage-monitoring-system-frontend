import { Component, inject, OnInit } from '@angular/core';
import { ManagementAccessService } from '../../core/services/management-access.service';
import { FenceSummary } from './components/fence-summary/fence-summary';
import { FenceTable } from './components/fence-table/fence-table';
import { FenceToolbar } from './components/fence-toolbar/fence-toolbar';
import { FenceRegistrationDrawer, FenceRegistrationValue } from './components/fence-registration-drawer/fence-registration-drawer';
import {
  FenceCreatePayload,
  FenceFilters,
  FenceRecord,
  FenceSummaryData,
  FenceUpdatePayload,
  MaintenanceUserOption,
  SRI_LANKA_PROVINCES,
} from './fence-management.models';
import { FenceEditDrawer, FenceEditValue } from './components/fence-edit-drawer/fence-edit-drawer';
import { FenceService } from '../../core/services/fence.service';

@Component({
  selector: 'app-fence-management',
  standalone: true,
  imports: [FenceSummary, FenceToolbar, FenceTable, FenceRegistrationDrawer, FenceEditDrawer],
  templateUrl: './fence-management.html',
  styleUrl: './fence-management.css',
})
export class FenceManagement implements OnInit {
  readonly access = inject(ManagementAccessService);
  private readonly fenceService = inject(FenceService);

  maintenanceUsers: MaintenanceUserOption[] = [];
  fences: FenceRecord[] = [];
  isLoading = false;

  filters: FenceFilters = {
    search: '',
    province: this.access.lockedProvince,
    district: this.access.lockedDistrict,
    gateway: '',
    health: '',
  };
  notice = '';
  isRegistrationOpen = false;
  selectedFence: FenceRecord | null = null;

  ngOnInit(): void {
    this.loadFences();
  }

  loadFences(): void {
    this.isLoading = true;
    this.fenceService.getFences().subscribe({
      next: (data) => {
        this.fences = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notice = 'Failed to load fences from the backend service.';
      },
    });
  }

  loadMaintenanceUsers(provinceId?: number, districtId?: number, fenceId?: number): void {
    if (!provinceId && !districtId && !fenceId) {
      this.maintenanceUsers = [];
      return;
    }
    this.fenceService.getMaintenanceCandidates(provinceId, districtId, fenceId).subscribe({
      next: (candidates) => {
        this.maintenanceUsers = candidates || [];
      },
      error: () => {
        this.maintenanceUsers = [];
      },
    });
  }

  get accessibleFences(): FenceRecord[] {
    return this.fences.filter((f) => this.access.canView(f.province, f.district));
  }

  get provinces(): string[] {
    const list = [...new Set(this.fences.map((f) => f.province).filter((p): p is string => Boolean(p)))];
    return this.access.provinces(list.length ? list : SRI_LANKA_PROVINCES.map((p) => p.name));
  }

  get districts(): string[] {
    const all = [
      ...new Set(
        this.accessibleFences
          .filter((f) => !this.filters.province || f.province === this.filters.province)
          .map((f) => f.district)
          .filter((d): d is string => Boolean(d))
      ),
    ];
    return this.access.districts(this.filters.province, all);
  }

  get gateways(): string[] {
    const list = [...new Set(this.accessibleFences.map((f) => f.gateway).filter((g): g is string => Boolean(g)))];
    return list.length ? list : ['GTW-MNR-01', 'GTW-COL-01'];
  }

  get summary(): FenceSummaryData {
    const fences = this.accessibleFences;
    return {
      total: fences.length,
      operational: fences.filter((f) => f.health === 'HEALTHY').length,
      warning: fences.filter((f) => f.health === 'WARNING').length,
      critical: fences.filter((f) => f.health === 'CRITICAL').length,
      monitoredLengthKm: fences.reduce((sum, f) => sum + (f.lengthKm || 0), 0),
    };
  }

  get filteredFences(): FenceRecord[] {
    const q = this.filters.search.trim().toLowerCase();
    return this.accessibleFences.filter(
      (f) =>
        (!q || `${f.code} ${f.name} ${f.province} ${f.district} ${f.gateway}`.toLowerCase().includes(q)) &&
        (!this.filters.province || f.province === this.filters.province) &&
        (!this.filters.district || f.district === this.filters.district) &&
        (!this.filters.gateway || f.gateway === this.filters.gateway) &&
        (!this.filters.health || f.health === this.filters.health)
    );
  }

  openRegistration(): void {
    this.isRegistrationOpen = true;
    this.loadMaintenanceUsers(3, 9); // default to Western / Colombo IDs
  }

  closeRegistration(): void {
    this.isRegistrationOpen = false;
  }

  saveDraft(fence: FenceRegistrationValue): void {
    this.closeRegistration();
    const payload: FenceCreatePayload = {
      code: fence.code,
      name: fence.name,
      provinceId: fence.provinceId,
      districtId: fence.districtId,
      lengthKm: fence.lengthKm,
      health: 'OFFLINE',
    };
    this.fenceService.saveDraft(payload).subscribe({
      next: () => (this.notice = `Draft saved for ${fence.name}.`),
      error: () => (this.notice = `Fence draft API unavailable. ${fence.name} draft retained in preview only.`),
    });
  }

  registerFence(fence: FenceRegistrationValue): void {
    this.closeRegistration();
    this.isLoading = true;
    const payload: FenceCreatePayload = {
      code: fence.code,
      name: fence.name,
      provinceId: fence.provinceId,
      districtId: fence.districtId,
      lengthKm: fence.lengthKm,
      health: 'OFFLINE',
    };

    this.fenceService.createFence(payload).subscribe({
      next: (created) => {
        if (fence.primaryMaintenanceUserId || (fence.backupMaintenanceUserIds && fence.backupMaintenanceUserIds.length > 0)) {
          this.fenceService
            .updateMaintenanceTeam(created.id, {
              primaryMaintenanceUserId: fence.primaryMaintenanceUserId,
              backupMaintenanceUserIds: fence.backupMaintenanceUserIds,
            })
            .subscribe({
              next: (withTeam) => {
                this.fences = [withTeam, ...this.fences];
                this.notice = `${fence.name} was successfully registered with maintenance team.`;
                this.isLoading = false;
              },
              error: () => {
                this.fences = [created, ...this.fences];
                this.notice = `${fence.name} was registered, but team assignment could not be saved.`;
                this.isLoading = false;
              },
            });
        } else {
          this.fences = [created, ...this.fences];
          this.notice = `${fence.name} was successfully registered!`;
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || err?.message || 'Failed to register fence';
        this.notice = `Error: ${msg}`;
      },
    });
  }

  selectFence(fence: FenceRecord): void {
    this.selectedFence = fence;
    if (fence.provinceId || fence.districtId || fence.id) {
      this.loadMaintenanceUsers(fence.provinceId, fence.districtId, fence.id);
    }
  }

  closeEdit(): void {
    this.selectedFence = null;
  }

  saveFence(fence: FenceEditValue): void {
    this.closeEdit();
    this.isLoading = true;
    const payload: FenceUpdatePayload = {
      code: fence.code,
      name: fence.name,
      provinceId: fence.provinceId,
      districtId: fence.districtId,
      lengthKm: fence.lengthKm,
      health: fence.health,
    };

    this.fenceService.updateFence(fence.id, payload).subscribe({
      next: (updated) => {
        if (fence.primaryMaintenanceUserId || (fence.backupMaintenanceUserIds && fence.backupMaintenanceUserIds.length > 0)) {
          this.fenceService
            .updateMaintenanceTeam(fence.id, {
              primaryMaintenanceUserId: fence.primaryMaintenanceUserId,
              backupMaintenanceUserIds: fence.backupMaintenanceUserIds,
            })
            .subscribe({
              next: (withTeam) => {
                this.applyFenceUpdate(withTeam);
                this.notice = `${fence.name} and maintenance team were saved.`;
                this.isLoading = false;
              },
              error: () => {
                this.applyFenceUpdate(updated);
                this.notice = `${fence.name} details were saved, but team assignment failed.`;
                this.isLoading = false;
              },
            });
        } else {
          this.applyFenceUpdate(updated);
          this.notice = `${fence.name} was saved successfully.`;
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || err?.message || 'Failed to update fence';
        this.notice = `Error: ${msg}`;
      },
    });
  }

  deleteFence(fence: FenceRecord): void {
    this.closeEdit();
    this.isLoading = true;
    this.fenceService.deleteFence(fence.id).subscribe({
      next: () => {
        this.removeFence(fence);
        this.notice = `${fence.name} was deleted successfully.`;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || err?.message || 'Cannot delete fence';
        this.notice = `Failed to delete fence: ${msg}`;
      },
    });
  }

  private applyFenceUpdate(fence: Partial<FenceRecord> & { id: number }): void {
    const existingIndex = this.fences.findIndex((item) => item.id === fence.id);
    if (existingIndex >= 0) {
      this.fences[existingIndex] = { ...this.fences[existingIndex], ...fence };
      this.fences = [...this.fences];
    }
  }

  private removeFence(fence: FenceRecord): void {
    const index = this.fences.findIndex((item) => item.id === fence.id);
    if (index >= 0) {
      this.fences.splice(index, 1);
      this.fences = [...this.fences];
    }
  }
}

