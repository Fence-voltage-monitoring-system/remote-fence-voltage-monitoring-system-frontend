import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FenceHealth,
  FenceRecord,
  findDistrictId,
  findProvinceId,
  MaintenanceUserOption,
  SRI_LANKA_PROVINCES,
} from '../../fence-management.models';

export interface FenceEditValue {
  id: number;
  name: string;
  code: string;
  province: string;
  district: string;
  provinceId: number;
  districtId: number;
  lengthKm: number;
  health: FenceHealth;
  installationDate: string;
  gateway: string;
  startGps: string;
  endGps: string;
  description: string;
  primaryMaintenanceUserId: string | null;
  backupMaintenanceUserIds: string[];
}

@Component({
  selector: 'app-fence-edit-drawer',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './fence-edit-drawer.html',
  styleUrls: ['./fence-edit-drawer.css', './fence-edit-modal.css'],
})
export class FenceEditDrawer implements OnInit {
  @Input({ required: true }) fence!: FenceRecord;
  @Input() maintenanceUsers: MaintenanceUserOption[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<FenceEditValue>();
  @Output() deleted = new EventEmitter<FenceRecord>();

  isClosing = false;
  isDeleteConfirming = false;
  readonly provinces = SRI_LANKA_PROVINCES.map(p => p.name);
  readonly gateways = ['GTW-MNR-01', 'GTW-ANR-02', 'GTW-PLN-03', 'GTW-AMP-04', 'GTW-HMB-05', 'GTW-COL-01'];
  readonly coordinatePattern = /-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)] }),
    province: new FormControl('', { nonNullable: true, validators: Validators.required }),
    district: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lengthKm: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
    health: new FormControl<FenceHealth>('HEALTHY', { nonNullable: true }),
    installationDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    gateway: new FormControl('', { nonNullable: true, validators: Validators.required }),
    startGps: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(this.coordinatePattern)] }),
    endGps: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(this.coordinatePattern)] }),
    description: new FormControl('', { nonNullable: true }),
    primaryMaintenanceUserId: new FormControl<string | null>(null),
    backupMaintenanceUserIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  get districts(): string[] {
    const prov = SRI_LANKA_PROVINCES.find(p => p.name === this.form.controls.province.value);
    return prov ? prov.districts.map(d => d.name) : [];
  }

  get eligibleMaintenanceUsers(): MaintenanceUserOption[] {
    const v = this.form.getRawValue();
    return this.maintenanceUsers.filter(
      user => (!user.province || user.province === v.province) && (!user.district || user.district === v.district)
    );
  }

  get backupCandidates(): MaintenanceUserOption[] {
    const currentPrimary = this.form.controls.primaryMaintenanceUserId.value;
    return this.eligibleMaintenanceUsers.filter(user => String(user.id) !== currentPrimary);
  }

  ngOnInit(): void {
    this.form.reset({
      name: this.fence.name,
      code: this.fence.code,
      province: this.fence.province,
      district: this.fence.district,
      lengthKm: this.fence.lengthKm,
      health: this.fence.health,
      installationDate: '2024-01-15',
      gateway: this.fence.gateway || 'GTW-COL-01',
      startGps: '6.9271, 79.8612',
      endGps: '6.9502, 79.9110',
      description: '',
      primaryMaintenanceUserId: this.fence.primaryMaintenanceUserId ? String(this.fence.primaryMaintenanceUserId) : null,
      backupMaintenanceUserIds: (this.fence.backupMaintenanceUserIds || []).map(id => String(id)),
    });
  }

  changeProvince(province: string): void {
    this.form.controls.province.setValue(province);
    const districts = this.districts;
    this.changeDistrict(districts[0] ?? '');
  }

  changeDistrict(district: string): void {
    this.form.controls.district.setValue(district);
    this.clearMaintenanceTeam();
  }

  changePrimary(userId: string): void {
    const id = userId.trim() ? userId : null;
    this.form.controls.primaryMaintenanceUserId.setValue(id);
    if (id) {
      this.form.controls.backupMaintenanceUserIds.setValue(
        this.form.controls.backupMaintenanceUserIds.value.filter(item => item !== id)
      );
    }
  }

  toggleBackup(userId: string | number, checked: boolean): void {
    const strId = String(userId);
    const selected = this.form.controls.backupMaintenanceUserIds.value;
    this.form.controls.backupMaintenanceUserIds.setValue(
      checked ? [...selected, strId] : selected.filter(id => id !== strId)
    );
  }

  isBackupSelected(userId: string | number): boolean {
    return this.form.controls.backupMaintenanceUserIds.value.includes(String(userId));
  }

  @HostListener('document:keydown.escape') escape(): void {
    this.close();
  }

  close(): void {
    this.leave(() => this.closed.emit());
  }

  requestDelete(): void {
    if (!this.isDeleteConfirming) {
      this.isDeleteConfirming = true;
      return;
    }
    this.leave(() => this.deleted.emit(this.fence));
  }

  cancelDelete(): void {
    this.isDeleteConfirming = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const provinceId = findProvinceId(v.province);
    const districtId = findDistrictId(v.district, provinceId);
    this.leave(() =>
      this.saved.emit({
        id: this.fence.id,
        name: v.name,
        code: v.code,
        province: v.province,
        district: v.district,
        provinceId,
        districtId,
        lengthKm: v.lengthKm!,
        health: v.health,
        installationDate: v.installationDate,
        gateway: v.gateway,
        startGps: v.startGps,
        endGps: v.endGps,
        description: v.description,
        primaryMaintenanceUserId: v.primaryMaintenanceUserId || null,
        backupMaintenanceUserIds: v.backupMaintenanceUserIds,
      })
    );
  }

  private clearMaintenanceTeam(): void {
    this.form.controls.primaryMaintenanceUserId.setValue(null);
    this.form.controls.backupMaintenanceUserIds.setValue([]);
  }

  private leave(done: () => void): void {
    if (this.isClosing) return;
    this.isClosing = true;
    window.setTimeout(done, 280);
  }
}

