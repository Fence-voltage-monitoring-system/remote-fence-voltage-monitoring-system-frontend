import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceUserOption } from '../../fence-management.models';

export interface FenceRegistrationValue {
  name: string; code: string; province: string; district: string; lengthKm: number;
  installationDate: string; gateway: string; startGps: string; endGps: string; description: string;
  primaryMaintenanceUserId: number; backupMaintenanceUserIds: number[];
}

@Component({
  selector: 'app-fence-registration-drawer', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './fence-registration-drawer.html', styleUrl: './fence-registration-drawer.css'
})
export class FenceRegistrationDrawer {
  @Input() maintenanceUsers: MaintenanceUserOption[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() draftSaved = new EventEmitter<FenceRegistrationValue>();
  @Output() registered = new EventEmitter<FenceRegistrationValue>();

  readonly provinces = ['Central', 'Eastern', 'North Central', 'Southern', 'Uva'];
  readonly districtMap: Record<string, string[]> = {
    Central: ['Kandy', 'Matale', 'Nuwara Eliya'], Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'], Southern: ['Galle', 'Hambantota', 'Matara'], Uva: ['Badulla', 'Monaragala']
  };
  readonly gateways = ['GTW-MNR-01', 'GTW-ANR-02', 'GTW-PLN-03', 'GTW-AMP-04', 'GTW-HMB-05'];
  isClosing = false;
  readonly form = new FormGroup({
    name: new FormControl('Monaragala Zone A', { nonNullable: true, validators: Validators.required }),
    code: new FormControl('EPF-MNR-A', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^EPF-[A-Z0-9-]+$/)] }),
    province: new FormControl('Uva', { nonNullable: true, validators: Validators.required }),
    district: new FormControl('Monaragala', { nonNullable: true, validators: Validators.required }),
    lengthKm: new FormControl<number | null>(48.6, [Validators.required, Validators.min(0.1)]),
    installationDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    gateway: new FormControl('GTW-MNR-01', { nonNullable: true, validators: Validators.required }),
    startGps: new FormControl('6.8721, 81.3382', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)] }),
    endGps: new FormControl('6.9102, 81.4210', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)] }),
    description: new FormControl('', { nonNullable: true })
    ,primaryMaintenanceUserId: new FormControl<number | null>(null, Validators.required)
    ,backupMaintenanceUserIds: new FormControl<number[]>([], { nonNullable: true })
  });

  get districts(): string[] { return this.districtMap[this.form.controls.province.value] ?? []; }
  get eligibleMaintenanceUsers(): MaintenanceUserOption[] { const v=this.form.getRawValue();return this.maintenanceUsers.filter(user=>user.active&&user.province===v.province&&user.district===v.district); }
  get backupCandidates(): MaintenanceUserOption[] { return this.eligibleMaintenanceUsers.filter(user=>user.id!==this.form.controls.primaryMaintenanceUserId.value); }
  @HostListener('document:keydown.escape') closeOnEscape(): void { this.close(); }
  changeProvince(province: string): void { this.form.controls.province.setValue(province); this.changeDistrict(this.districtMap[province]?.[0] ?? ''); }
  changeDistrict(district: string): void { this.form.controls.district.setValue(district);this.clearMaintenanceTeam(); }
  changePrimary(userId: string): void { const id=Number(userId)||null;this.form.controls.primaryMaintenanceUserId.setValue(id);this.form.controls.backupMaintenanceUserIds.setValue(this.form.controls.backupMaintenanceUserIds.value.filter(item=>item!==id)); }
  toggleBackup(userId:number,checked:boolean):void{const selected=this.form.controls.backupMaintenanceUserIds.value;this.form.controls.backupMaintenanceUserIds.setValue(checked?[...selected,userId]:selected.filter(id=>id!==userId));}
  isBackupSelected(userId:number):boolean{return this.form.controls.backupMaintenanceUserIds.value.includes(userId);}
  close(): void { this.leave(() => this.closed.emit()); }
  saveDraft(): void { const value = this.value(); this.leave(() => this.draftSaved.emit(value)); }
  submit(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } const value = this.value(); this.leave(() => this.registered.emit(value)); }
  private leave(done: () => void): void { if (this.isClosing) return; this.isClosing = true; window.setTimeout(done, 280); }
  private clearMaintenanceTeam():void{this.form.controls.primaryMaintenanceUserId.setValue(null);this.form.controls.backupMaintenanceUserIds.setValue([]);}
  private value(): FenceRegistrationValue { const v = this.form.getRawValue(); return { ...v, lengthKm: v.lengthKm ?? 0, primaryMaintenanceUserId:v.primaryMaintenanceUserId!, backupMaintenanceUserIds:v.backupMaintenanceUserIds }; }
}
