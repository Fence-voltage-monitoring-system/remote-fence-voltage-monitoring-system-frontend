import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { ApiValidationError, CreateUserRequest, FenceOption, LocationOption, RoleOption, SystemUser, UserRole, UserStatus } from '../../user-management.models';

@Component({ selector: 'app-user-create-drawer', standalone: true, imports: [ReactiveFormsModule], templateUrl: './user-create-drawer.html', styleUrl: './user-create-drawer.css' })
export class UserCreateDrawer implements OnInit {
  private readonly userService = inject(UserService);
  @Output() closed = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<SystemUser>();
  @Output() userUpdated = new EventEmitter<SystemUser>();
  @Input() editingUser?: SystemUser | null;

  roles: RoleOption[] = [
    { value: 'SUPER_ADMIN', label: 'Super Administrator' },
    { value: 'REGIONAL_ADMIN', label: 'Regional Administrator' },
    { value: 'FIELD_ADMIN', label: 'Field Administrator' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];
  provinces: LocationOption[] = [];
  districts: LocationOption[] = [];
  fences: FenceOption[] = [];
  isLoadingOptions = true;
  optionsLoadFailed = false;
  isLoadingDistricts = false;
  isLoadingFences = false;
  isSubmitting = false;
  apiError = '';

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    contactNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[0-9 ]{9,15}$/)] }),
    role: new FormControl<UserRole | null>(null, Validators.required),
    provinceId: new FormControl<number | null>(null),
    districtId: new FormControl<number | null>(null),
    fenceIds: new FormControl<number[]>([], { nonNullable: true }),
    temporaryPassword: new FormControl('', { nonNullable: true, validators: Validators.minLength(8) }),
    status: new FormControl<UserStatus>('ACTIVE', { nonNullable: true }),
  });

  get selectedRole(): UserRole | null { return this.form.controls.role.value; }
  get needsProvince(): boolean { return this.selectedRole === 'REGIONAL_ADMIN' || this.selectedRole === 'FIELD_ADMIN' || this.selectedRole === 'MAINTENANCE'; }
  get needsDistrict(): boolean { return this.selectedRole === 'FIELD_ADMIN' || this.selectedRole === 'MAINTENANCE'; }
  get needsFence(): boolean { return this.selectedRole === 'MAINTENANCE'; }

  ngOnInit(): void {
    if (this.editingUser) {
      this.populateEditingUserForm(this.editingUser);
    }
    this.loadCreateOptions();
  }

  private populateEditingUserForm(u: SystemUser): void {
    this.form.controls.fullName.setValue(u.name);
    this.form.controls.username.setValue(u.email ? u.email.split('@')[0] : '');
    this.form.controls.email.setValue(u.email);
    this.form.controls.contactNumber.setValue(u.contactNumber || (u as any).contact_number || '');
    this.form.controls.role.setValue(u.role as any);
    this.form.controls.status.setValue(u.status as any);

    if (u.provinceIds && u.provinceIds.length > 0) {
      this.changeProvince(u.provinceIds[0]);
    } else if (u.province && this.provinces.length > 0) {
      const match = this.provinces.find(p => p.name.toLowerCase() === u.province.toLowerCase() || `province #${p.id}` === u.province.toLowerCase());
      if (match) {
        this.changeProvince(match.id);
      }
    }

    if (u.districtIds && u.districtIds.length > 0) {
      this.changeDistrict(u.districtIds[0]);
    }

    this.form.controls.temporaryPassword.clearValidators();
    this.form.controls.temporaryPassword.updateValueAndValidity({ emitEvent: false });
  }

  loadCreateOptions(): void {
    this.isLoadingOptions = true;
    this.optionsLoadFailed = false;
    this.apiError = '';
    this.userService.getCreateOptions().pipe(timeout(8000), finalize(() => { this.isLoadingOptions = false; })).subscribe({
      next: (options) => {
        if (options.roles && options.roles.length > 0) this.roles = options.roles;
        if (options.provinces) this.provinces = options.provinces;
        if (this.editingUser) {
          this.populateEditingUserForm(this.editingUser);
        }
      },
      error: () => {
        this.optionsLoadFailed = false;
        if (this.editingUser) {
          this.populateEditingUserForm(this.editingUser);
        }
      },
    });
  }

  @HostListener('document:keydown.escape') closeOnEscape(): void { if (!this.isSubmitting) this.closed.emit(); }

  changeRole(role: UserRole): void {
    this.form.controls.role.setValue(role);
    this.form.controls.provinceId.setValue(null);
    this.form.controls.districtId.setValue(null);
    this.form.controls.fenceIds.setValue([]);
    this.districts = [];
    this.fences = [];
    this.configureAssignmentValidators();
  }

  changeProvince(provinceId: number): void {
    this.form.controls.provinceId.setValue(provinceId);
    this.form.controls.districtId.setValue(null);
    this.form.controls.fenceIds.setValue([]);
    this.districts = [];
    this.fences = [];
    if (!this.needsDistrict) return;
    this.isLoadingDistricts = true;
    this.userService.getDistricts(provinceId).pipe(finalize(() => { this.isLoadingDistricts = false; })).subscribe({
      next: (districts) => { this.districts = districts; },
      error: () => { this.apiError = 'Unable to load districts.'; },
    });
  }

  changeDistrict(districtId: number): void {
    this.form.controls.districtId.setValue(districtId);
    this.form.controls.fenceIds.setValue([]);
    this.fences = [];
    if (!this.needsFence) return;
    this.isLoadingFences = true;
    this.userService.getFences(districtId).pipe(finalize(() => { this.isLoadingFences = false; })).subscribe({
      next: (fences) => { this.fences = fences; },
      error: () => { this.apiError = 'Unable to load fences.'; },
    });
  }

  changeFences(select: HTMLSelectElement): void {
    this.form.controls.fenceIds.setValue(Array.from(select.selectedOptions).map((option) => Number(option.value)));
  }

  submit(): void {
    this.configureAssignmentValidators();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const request: CreateUserRequest = {
      fullName: value.fullName, username: value.username, email: value.email, contactNumber: value.contactNumber,
      role: value.role!,
      provinceIds: value.provinceId === null ? [] : [value.provinceId],
      districtIds: value.districtId === null ? [] : [value.districtId],
      fenceIds: value.fenceIds,
      temporaryPassword: value.temporaryPassword || null,
      status: value.status,
    };
    this.apiError = '';
    this.isSubmitting = true;
    if (this.editingUser) {
      // perform update
      this.userService.updateUser(this.editingUser.id, request).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (user) => { this.userUpdated.emit(user); },
        error: (error: HttpErrorResponse) => { this.applyApiError(error); },
      });
    } else {
      this.userService.createUser(request).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (user) => { this.userCreated.emit(user); },
        error: (error: HttpErrorResponse) => { this.applyApiError(error); },
      });
    }
  }

  private configureAssignmentValidators(): void {
    this.form.controls.provinceId.setValidators(this.needsProvince ? Validators.required : []);
    this.form.controls.districtId.setValidators(this.needsDistrict ? Validators.required : []);
    this.form.controls.fenceIds.setValidators(this.needsFence ? [Validators.required, Validators.minLength(1)] : []);
    this.form.controls.provinceId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.districtId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.fenceIds.updateValueAndValidity({ emitEvent: false });
  }

  private applyApiError(error: HttpErrorResponse): void {
    const body = error.error as ApiValidationError | undefined;
    if (error.status === 422 && body?.fieldErrors) {
      Object.entries(body.fieldErrors).forEach(([field, messages]) => {
        const control = this.form.get(field);
        if (control) control.setErrors({ server: messages[0] });
      });
    }
    this.apiError = body?.message ?? (error.status === 403 ? 'You are not authorized to create this user.' : 'Unable to create the user. Please try again.');
  }
}
