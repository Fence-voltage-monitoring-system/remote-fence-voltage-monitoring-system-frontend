import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { forkJoin, Observable, Subscription } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { ManagementAccessService } from "../../core/services/management-access.service";
import { FenceSummary } from "./components/fence-summary/fence-summary";
import { FenceTable } from "./components/fence-table/fence-table";
import { FenceToolbar } from "./components/fence-toolbar/fence-toolbar";
import {
  FenceRegistrationDrawer,
  FenceRegistrationValue,
} from "./components/fence-registration-drawer/fence-registration-drawer";
import {
  FenceFilters,
  FenceRecord,
  FenceSummaryData,
  MaintenanceUserOption,
  LocationProvince,
} from "./fence-management.models";
import {
  FenceEditDrawer,
  FenceEditValue,
} from "./components/fence-edit-drawer/fence-edit-drawer";
import { FenceService } from "../../core/services/fence.service";
@Component({
  selector: "app-fence-management",
  standalone: true,
  imports: [
    FenceSummary,
    FenceTable,
    FenceToolbar,
    FenceRegistrationDrawer,
    FenceEditDrawer,
  ],
  templateUrl: "./fence-management.html",
  styleUrl: "./fence-management.css",
})
export class FenceManagement implements OnInit, OnDestroy {
  readonly access = inject(ManagementAccessService);
  private readonly fenceService = inject(FenceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();
  private candidatesRequest?: Subscription;
  maintenanceUsers: MaintenanceUserOption[] = [];
  fences: FenceRecord[] = [];
  locations: LocationProvince[] = [];
  isLoading = false;
  isSaving = false;
  notice = "";
  error = "";
  isRegistrationOpen = false;
  selectedFence: FenceRecord | null = null;
  filters: FenceFilters = {
    search: "",
    province: this.access.lockedProvince,
    district: this.access.lockedDistrict,
    gateway: "",
    health: "",
  };
  ngOnInit() {
    this.loadFences();
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.candidatesRequest?.unsubscribe();
  }
  loadFences() {
    this.isLoading = true;
    this.error = "";
    this.subscriptions.add(
      forkJoin({
        fences: this.fenceService.getFences(),
        provinces: this.fenceService.getProvinces(),
        districts: this.fenceService.getDistricts(),
      }).subscribe({
        next: ({ fences, provinces, districts }) => {
          this.fences = fences;
          this.locations = provinces.map((p) => ({
            ...p,
            districts: districts
              .filter((d) => d.provinceId === p.id)
              .map((d) => ({ id: d.id, name: d.name })),
          }));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.error = this.errorMessage(error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      }),
    );
  }
  loadMaintenanceUsers(
    provinceId?: number,
    districtId?: number,
    fenceId?: number,
  ) {
    this.candidatesRequest?.unsubscribe();
    this.maintenanceUsers = [];
    if (!provinceId && !districtId && !fenceId) return;
    this.candidatesRequest = this.fenceService
      .getMaintenanceCandidates(provinceId, districtId, fenceId)
      .subscribe({
        next: (users) => {
          this.maintenanceUsers = users;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error =
            "Unable to load maintenance candidates. Try selecting the location again.";
          this.cdr.markForCheck();
        },
      });
  }
  locationChanged(value: { provinceId: number; districtId: number }) {
    this.error = "";
    this.loadMaintenanceUsers(value.provinceId, value.districtId);
  }
  get accessibleFences() {
    return this.fences.filter((f) =>
      this.access.canManage
        ? this.access.canManageScope(f.province, f.district, f.code)
        : this.access.canView(f.province, f.district, f.code),
    );
  }
  get editableLocations() {
    if (!this.access.canManage) return [];
    return this.locations
      .map((p) => ({
        ...p,
        districts: p.districts.filter((d) =>
          this.access.canManageScope(p.name, d.name),
        ),
      }))
      .filter(p => p.districts.length > 0);
  }
  get canRegisterFence() {
    return this.access.canManage && this.editableLocations.length > 0;
  }
  get authorityDescription() {
    switch (this.access.scope().role) {
      case "SUPER_ADMIN": return "You can register and edit fences in any province and district.";
      case "REGIONAL_ADMIN": return "You can register and edit fences within your assigned provinces.";
      case "FIELD_ADMIN": return "You can register and edit fences within your assigned districts.";
      default: return "Fence registration and editing require an administrator account.";
    }
  }
  get provinces() {
    return this.editableLocations.map(p => p.name);
  }
  get districts() {
    return this.editableLocations
        .filter(
          (p) => !this.filters.province || p.name === this.filters.province,
        )
        .flatMap((p) => p.districts.map((d) => d.name));
  }
  get gateways() {
    return [
      ...new Set(
        this.accessibleFences
          .map((f) => f.gateway)
          .filter((g): g is string => Boolean(g)),
      ),
    ];
  }
  get summary(): FenceSummaryData {
    const fences = this.accessibleFences;
    return {
      total: fences.length,
      operational: fences.filter((f) => f.health === "HEALTHY").length,
      warning: fences.filter((f) => f.health === "WARNING").length,
      critical: fences.filter((f) => f.health === "CRITICAL").length,
      monitoredLengthKm: fences.reduce((sum, f) => sum + f.lengthKm, 0),
    };
  }
  get filteredFences() {
    const q = this.filters.search.trim().toLowerCase();
    return this.accessibleFences.filter(
      (f) =>
        (!q ||
          `${f.code} ${f.name} ${f.province} ${f.district} ${f.gateway ?? ""}`
            .toLowerCase()
            .includes(q)) &&
        (!this.filters.province || f.province === this.filters.province) &&
        (!this.filters.district || f.district === this.filters.district) &&
        (!this.filters.gateway || f.gateway === this.filters.gateway) &&
        (!this.filters.health || f.health === this.filters.health),
    );
  }
  openRegistration() {
    if (this.isLoading || this.isSaving) return;
    if (!this.canRegisterFence) {
      this.error = this.access.canManage
        ? "No locations are assigned to your authority. Ask a Super Admin to assign your province or district."
        : "Your role does not allow fence registration.";
      return;
    }
    {
      this.error = "";
      this.maintenanceUsers = [];
      this.isRegistrationOpen = true;
    }
  }
  closeRegistration() {
    if (!this.isSaving) this.isRegistrationOpen = false;
  }
  selectFence(fence: FenceRecord) {
    if (
      this.isSaving ||
      !this.access.canManage ||
      !this.access.canManageScope(fence.province, fence.district, fence.code)
    )
      return;
    this.error = "";
    this.selectedFence = fence;
    this.loadMaintenanceUsers(fence.provinceId, fence.districtId, fence.id);
  }
  closeEdit() {
    if (!this.isSaving) this.selectedFence = null;
  }
  saveDraft(value: FenceRegistrationValue) {
    this.saveDetails(
      this.fenceService.saveDraft(this.createPayload(value)),
      value,
      true,
    );
  }
  registerFence(value: FenceRegistrationValue) {
    this.saveDetails(
      this.fenceService.createFence(this.createPayload(value)),
      value,
    );
  }
  saveFence(value: FenceEditValue) {
    this.saveDetails(
      this.fenceService.updateFence(value.id, {
        ...this.createPayload(value),
        health: value.health,
      }),
      value,
    );
  }
  private createPayload(value: FenceRegistrationValue | FenceEditValue) {
    return {
      code: value.code.trim(),
      name: value.name.trim(),
      provinceId: value.provinceId,
      districtId: value.districtId,
      lengthKm: value.lengthKm,
      health: "OFFLINE" as const,
    };
  }
  private saveDetails(
    request: Observable<FenceRecord>,
    value: FenceRegistrationValue | FenceEditValue,
    draft = false,
  ) {
    if (this.isSaving) return;
    const province = this.editableLocations.find(p => p.id === value.provinceId);
    if (!province?.districts.some(d => d.id === value.districtId)) {
      this.error = "Choose a location within your assigned authority.";
      return;
    }
    this.isSaving = true;
    this.error = "";
    this.notice = "";
    this.subscriptions.add(
      request.subscribe({
        next: (record) => {
          this.applyFenceUpdate(record);
          // Editing must also submit an empty team so existing assignments can be cleared.
          if (
            !draft &&
            ("id" in value ||
              value.primaryMaintenanceUserId ||
              value.backupMaintenanceUserIds.length)
          ) {
            this.subscriptions.add(
              this.fenceService
                .updateMaintenanceTeam(record.id, {
                  primaryMaintenanceUserId: value.primaryMaintenanceUserId,
                  backupMaintenanceUserIds: value.backupMaintenanceUserIds,
                })
                .subscribe({
                  next: (updated) => {
                    this.applyFenceUpdate(updated);
                    this.finishSave(`${value.name} saved.`);
                  },
                  error: () => {
                    this.finishSave(`${value.name} details saved.`);
                    this.error =
                      "Maintenance team was not saved. Reopen the fence to retry the team assignment.";
                    this.cdr.markForCheck();
                  },
                }),
            );
          } else
            this.finishSave(
              draft ? `Draft saved for ${value.name}.` : `${value.name} saved.`,
            );
        },
        error: (error) => {
          this.isSaving = false;
          this.error = this.errorMessage(error);
          this.cdr.markForCheck();
        },
      }),
    );
  }
  deleteFence(fence: FenceRecord) {
    if (this.isSaving) return;
    this.isSaving = true;
    this.error = "";
    this.subscriptions.add(
      this.fenceService.deleteFence(fence.id).subscribe({
        next: () => {
          this.fences = this.fences.filter((f) => f.id !== fence.id);
          this.finishSave(`${fence.name} deleted.`);
        },
        error: (error) => {
          this.isSaving = false;
          this.error = this.errorMessage(error);
          this.cdr.markForCheck();
        },
      }),
    );
  }
  private applyFenceUpdate(fence: FenceRecord) {
    this.fences = this.fences.some((f) => f.id === fence.id)
      ? this.fences.map((f) => (f.id === fence.id ? fence : f))
      : [fence, ...this.fences];
  }
  private finishSave(message: string) {
    this.isSaving = false;
    this.isRegistrationOpen = false;
    this.selectedFence = null;
    this.notice = message;
    this.cdr.markForCheck();
  }
  private errorMessage(error: HttpErrorResponse) {
    return error.status === 0
      ? "Cannot reach the backend. Check the connection and retry."
      : typeof error.error?.message === "string"
        ? error.error.message
        : "The request failed. Please retry.";
  }
}
