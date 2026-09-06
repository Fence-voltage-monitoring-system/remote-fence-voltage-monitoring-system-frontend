import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from "@angular/forms";
import {
  MaintenanceUserOption,
  LocationProvince,
} from "../../fence-management.models";

export interface FenceRegistrationValue {
  name: string;
  code: string;
  province: string;
  district: string;
  provinceId: number;
  districtId: number;
  lengthKm: number;
  installationDate: string;
  gateway: string;
  startGps: string;
  endGps: string;
  description: string;
  primaryMaintenanceUserId: string | null;
  backupMaintenanceUserIds: string[];
}

@Component({
  selector: "app-fence-registration-drawer",
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./fence-registration-drawer.html",
  styleUrl: "./fence-registration-drawer.css",
})
export class FenceRegistrationDrawer {
  @Input() maintenanceUsers: MaintenanceUserOption[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() draftSaved = new EventEmitter<FenceRegistrationValue>();
  @Output() registered = new EventEmitter<FenceRegistrationValue>();

  @Input() locations: LocationProvince[] = [];
  @Input() authorityDescription = "";
  @Input() saving = false;
  @Input() error = "";
  @Output() locationChanged = new EventEmitter<{
    provinceId: number;
    districtId: number;
  }>();
  get provinces() {
    return this.locations.map((p) => p.name);
  }
  isClosing = false;

  readonly form = new FormGroup({
    name: new FormControl("Western Colombo Fence", {
      nonNullable: true,
      validators: Validators.required,
    }),
    code: new FormControl("EPF-COL-A", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)],
    }),
    province: new FormControl("Western", {
      nonNullable: true,
      validators: Validators.required,
    }),
    district: new FormControl("Colombo", {
      nonNullable: true,
      validators: Validators.required,
    }),
    lengthKm: new FormControl<number | null>(12.5, [
      Validators.required,
      Validators.min(0.1),
    ]),
    installationDate: new FormControl(new Date().toISOString().split("T")[0], {
      nonNullable: true,
      validators: Validators.required,
    }),
    gateway: new FormControl("GTW-COL-01", {
      nonNullable: true,
      validators: Validators.required,
    }),
    startGps: new FormControl("6.9271, 79.8612", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/),
      ],
    }),
    endGps: new FormControl("6.9502, 79.9110", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/),
      ],
    }),
    description: new FormControl("", { nonNullable: true }),
    primaryMaintenanceUserId: new FormControl<string | null>(null),
    backupMaintenanceUserIds: new FormControl<string[]>([], {
      nonNullable: true,
    }),
  });

  ngOnInit() {
    for (const key of [
      "installationDate",
      "gateway",
      "startGps",
      "endGps",
      "description",
    ] as const)
      this.form.controls[key].disable();
    this.form.controls.name.setValue("");
    this.form.controls.code.setValue("");
    this.form.controls.lengthKm.setValue(null);
    this.changeProvince(this.provinces[0] ?? "");
  }
  get districts(): string[] {
    const prov = this.locations.find(
      (p) => p.name === this.form.controls.province.value,
    );
    return prov ? prov.districts.map((d) => d.name) : [];
  }

  get eligibleMaintenanceUsers(): MaintenanceUserOption[] {
    const v = this.form.getRawValue();
    return this.maintenanceUsers.filter(
      (user) =>
        (!user.province || user.province === v.province) &&
        (!user.district || user.district === v.district),
    );
  }

  get backupCandidates(): MaintenanceUserOption[] {
    const currentPrimary = this.form.controls.primaryMaintenanceUserId.value;
    return this.eligibleMaintenanceUsers.filter(
      (user) => String(user.id) !== currentPrimary,
    );
  }

  @HostListener("document:keydown.escape") closeOnEscape(): void {
    this.close();
  }

  changeProvince(province: string): void {
    if (this.saving || !this.provinces.includes(province)) return;
    this.form.controls.province.setValue(province);
    const districts = this.districts;
    this.changeDistrict(districts[0] ?? "");
  }

  changeDistrict(district: string): void {
    if (this.saving || !this.districts.includes(district)) return;
    this.form.controls.district.setValue(district);
    this.clearMaintenanceTeam();
    const province = this.locations.find(
      (p) => p.name === this.form.controls.province.value,
    );
    const selectedDistrict = province?.districts.find(
      (d) => d.name === district,
    );
    if (province && selectedDistrict)
      this.locationChanged.emit({
        provinceId: province.id,
        districtId: selectedDistrict.id,
      });
  }

  changePrimary(userId: string): void {
    const id = userId.trim() ? userId : null;
    this.form.controls.primaryMaintenanceUserId.setValue(id);
    if (id) {
      this.form.controls.backupMaintenanceUserIds.setValue(
        this.form.controls.backupMaintenanceUserIds.value.filter(
          (item) => item !== id,
        ),
      );
    }
  }

  toggleBackup(userId: string | number, checked: boolean): void {
    const strId = String(userId);
    const selected = this.form.controls.backupMaintenanceUserIds.value;
    this.form.controls.backupMaintenanceUserIds.setValue(
      checked ? [...selected, strId] : selected.filter((id) => id !== strId),
    );
  }

  isBackupSelected(userId: string | number): boolean {
    return this.form.controls.backupMaintenanceUserIds.value.includes(
      String(userId),
    );
  }

  close(): void {
    if (this.saving) return;
    this.leave(() => this.closed.emit());
  }

  saveDraft(): void {
    if (this.saving) return;
    if (this.form.invalid || !this.provinces.includes(this.form.controls.province.value) || !this.districts.includes(this.form.controls.district.value)) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.value();
    this.draftSaved.emit(value);
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid || !this.provinces.includes(this.form.controls.province.value) || !this.districts.includes(this.form.controls.district.value)) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.value();
    this.registered.emit(value);
  }

  private leave(done: () => void): void {
    if (this.isClosing) return;
    this.isClosing = true;
    window.setTimeout(done, 280);
  }

  private clearMaintenanceTeam(): void {
    this.form.controls.primaryMaintenanceUserId.setValue(null);
    this.form.controls.backupMaintenanceUserIds.setValue([]);
  }

  private value(): FenceRegistrationValue {
    const v = this.form.getRawValue();
    const provinceId =
      this.locations.find((p) => p.name === v.province)?.id ?? 0;
    const districtId =
      this.locations
        .find((p) => p.id === provinceId)
        ?.districts.find((d) => d.name === v.district)?.id ?? 0;
    return {
      name: v.name,
      code: v.code,
      province: v.province,
      district: v.district,
      provinceId,
      districtId,
      lengthKm: v.lengthKm ?? 0,
      installationDate: v.installationDate,
      gateway: v.gateway,
      startGps: v.startGps,
      endGps: v.endGps,
      description: v.description,
      primaryMaintenanceUserId: v.primaryMaintenanceUserId || null,
      backupMaintenanceUserIds: v.backupMaintenanceUserIds,
    };
  }
}
