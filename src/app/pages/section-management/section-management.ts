import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { ManagementAccessService } from "../../core/services/management-access.service";
import { FenceService } from "../../core/services/fence.service";
import {
  SectionService,
  SectionResponse,
} from "../../core/services/section.service";
import { SectionOverview } from "./components/section-overview/section-overview";
import { SectionToolbar } from "./components/section-toolbar/section-toolbar";
import { SectionTable } from "./components/section-table/section-table";
import { FenceOption, FenceSection } from "./section-management.models";
import {
  SectionRegistrationDrawer,
  SectionRegistrationValue,
} from "./components/section-registration-drawer/section-registration-drawer";
import {
  SectionEditModal,
  SectionEditValue,
} from "./components/section-edit-modal/section-edit-modal";
import {
  BulkSectionRow,
  SectionBulkAddModal,
} from "./components/section-bulk-add-modal/section-bulk-add-modal";
@Component({
  selector: "app-section-management",
  standalone: true,
  imports: [
    SectionOverview,
    SectionToolbar,
    SectionTable,
    SectionRegistrationDrawer,
    SectionEditModal,
    SectionBulkAddModal,
  ],
  templateUrl: "./section-management.html",
  styleUrl: "./section-management.css",
})
export class SectionManagement implements OnInit, OnDestroy {
  readonly access = inject(ManagementAccessService);
  private readonly fenceService = inject(FenceService);
  private readonly sectionService = inject(SectionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();
  private sectionsRequest?: Subscription;
  fences: FenceOption[] = [];
  sections: FenceSection[] = [];
  selectedFence: FenceOption | null = null;
  province = this.access.lockedProvince;
  district = this.access.lockedDistrict;
  search = "";
  status = "";
  notice = "";
  error = "";
  isLoading = false;
  isSaving = false;
  isRegistrationOpen = false;
  isBulkAddOpen = false;
  selectedSection: FenceSection | null = null;
  ngOnInit() {
    this.loadFences();
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.sectionsRequest?.unsubscribe();
  }
  get accessibleFences() {
    return this.fences.filter(
      (f) =>
        this.access.canView(f.province, f.district, f.code) &&
        (!this.province || f.province === this.province) &&
        (!this.district || f.district === this.district),
    );
  }
  get manageableFences() {
    return this.accessibleFences.filter(
      (f) =>
        this.access.canManage &&
        this.access.canManageScope(f.province, f.district, f.code),
    );
  }
  get canEditSelectedFence() {
    return this.manageableFences.some(fence => fence.id === this.selectedFence?.id);
  }
  get provinces() {
    return this.access.provinces([
      ...new Set(this.fences.map((f) => f.province)),
    ]);
  }
  get districts() {
    return this.access.districts(this.province, [
      ...new Set(
        this.fences
          .filter((f) => !this.province || f.province === this.province)
          .map((f) => f.district),
      ),
    ]);
  }
  get filteredSections() {
    const q = this.search.trim().toLowerCase();
    return this.sections.filter(
      (s) =>
        s.fenceCode === this.selectedFence?.code &&
        (!q || `${s.code} ${s.device ?? ""}`.toLowerCase().includes(q)) &&
        (!this.status || s.status === this.status),
    );
  }
  loadFences() {
    this.isLoading = true;
    this.error = "";
    this.subscriptions.add(
      this.fenceService.getFences().subscribe({
        next: (fences) => {
          this.fences = fences.map((f) => ({
            id: f.id,
            code: f.code,
            name: f.name,
            province: f.province,
            district: f.district,
            totalSections: f.sections,
            totalLengthKm: f.lengthKm,
            operational: 0,
            averageVoltageKv: f.averageVoltageKv,
          }));
          this.selectFence(
            this.selectedFence?.code ?? this.accessibleFences[0]?.code ?? "",
          );
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.error = this.errorMessage(error);
          this.cdr.markForCheck();
        },
      }),
    );
  }
  selectFence(code: string) {
    if (this.isSaving) return;
    this.sectionsRequest?.unsubscribe();
    this.selectedFence =
      this.accessibleFences.find((f) => f.code === code) ??
      this.accessibleFences[0] ??
      null;
    this.sections = [];
    this.selectedSection = null;
    this.error = "";
    const fence = this.selectedFence;
    if (!fence) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.sectionsRequest = this.sectionService
      .getSectionsByFence(fence.id)
      .subscribe({
        next: (rows) => {
          this.sections = rows.map((row) => this.toSection(row, fence.code));
          fence.totalSections = rows.length;
          fence.totalLengthKm = rows.reduce(
            (sum, row) => sum + Number(row.lengthKm),
            0,
          );
          fence.operational = rows.filter(
            (row) => row.status === "HEALTHY",
          ).length;
          const voltages = rows
            .filter((row) => row.voltageKv != null)
            .map((row) => Number(row.voltageKv));
          fence.averageVoltageKv = voltages.length
            ? voltages.reduce((sum, v) => sum + v, 0) / voltages.length
            : null;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.error = this.errorMessage(error);
          this.cdr.markForCheck();
        },
      });
  }
  changeProvince(value: string) {
    if (this.isSaving) return;
    this.province = value;
    this.district = "";
    this.selectFence("");
  }
  changeDistrict(value: string) {
    if (this.isSaving) return;
    this.district = value;
    this.selectFence("");
  }
  openRegistration() {
    if (!this.isLoading && !this.isSaving && this.manageableFences.length) {
      this.error = "";
      this.isRegistrationOpen = true;
    }
  }
  closeRegistration() {
    if (!this.isSaving) this.isRegistrationOpen = false;
  }
  openBulkAdd() {
    if (!this.isLoading && !this.isSaving && this.manageableFences.length) {
      this.error = "";
      this.isBulkAddOpen = true;
    }
  }
  closeBulkAdd() {
    if (!this.isSaving) this.isBulkAddOpen = false;
  }
  editSection(section: FenceSection) {
    if (
      !this.isSaving &&
      this.manageableFences.some((f) => f.code === section.fenceCode)
    ) {
      this.error = "";
      this.selectedSection = section;
    }
  }
  closeEdit() {
    if (!this.isSaving) this.selectedSection = null;
  }
  registerSection(value: SectionRegistrationValue) {
    const fence = this.manageableFences.find((f) => f.code === value.fenceCode);
    if (!fence) return;
    this.mutate(
      this.sectionService.create({ fenceId: fence.id, ...this.payload(value) }),
      fence.code,
      `${value.sectionCode} registered.`,
    );
  }
  saveSection(value: SectionEditValue) {
    if (
      !this.selectedSection ||
      value.fenceCode !== this.selectedSection.fenceCode
    )
      return;
    this.mutate(
      this.sectionService.update(value.id, this.payload(value)),
      value.fenceCode,
      `${value.sectionCode} saved.`,
    );
  }
  deleteSection(section: FenceSection) {
    this.mutate(
      this.sectionService.delete(section.id),
      section.fenceCode,
      `${section.code} deleted.`,
    );
  }
  importSections(value: { fenceCode: string; rows: BulkSectionRow[] }) {
    if (!this.manageableFences.some((f) => f.code === value.fenceCode)) return;
    this.mutate(
      this.sectionService.bulkCreate(value),
      value.fenceCode,
      `${value.rows.length} sections imported.`,
    );
  }
  private payload(value: SectionRegistrationValue | SectionEditValue) {
    return {
      code: value.sectionCode.trim(),
      startGps: `${value.startLatitude}, ${value.startLongitude}`,
      endGps: `${value.endLatitude}, ${value.endLongitude}`,
      lengthKm: value.lengthKm,
    };
  }
  private mutate<T>(
    request: Observable<T>,
    fenceCode: string,
    message: string,
  ) {
    if (this.isSaving) return;
    this.isSaving = true;
    this.error = "";
    this.notice = "";
    this.subscriptions.add(
      request.subscribe({
        next: () => {
          this.isSaving = false;
          this.isRegistrationOpen = false;
          this.isBulkAddOpen = false;
          this.selectedSection = null;
          this.notice = message;
          this.selectFence(fenceCode);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isSaving = false;
          this.error = this.errorMessage(error);
          this.cdr.markForCheck();
        },
      }),
    );
  }
  private toSection(row: SectionResponse, fenceCode: string): FenceSection {
    return {
      id: row.id,
      fenceCode,
      code: row.code,
      startGps: row.startGps ?? "",
      endGps: row.endGps ?? "",
      lengthKm: Number(row.lengthKm),
      voltageKv: row.voltageKv == null ? null : Number(row.voltageKv),
      battery: row.battery,
      status: row.status ?? "OFFLINE",
      device: null,
      maintenance: "Unavailable",
      updated: row.updatedAt
        ? new Date(row.updatedAt).toLocaleString()
        : "Unavailable",
    };
  }
  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 0)
      return "Cannot reach the server. Check the backend connection and retry.";
    return typeof error.error?.message === "string"
      ? error.error.message
      : "The request failed. Please retry.";
  }
}
