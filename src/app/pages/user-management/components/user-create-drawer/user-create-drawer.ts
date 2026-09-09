import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { ApiValidationError, CreateUserRequest, FenceOption, LocationOption, RoleOption, SystemUser, UserRole, UserStatus } from '../../user-management.models';
import { CurrentUserProfile } from '../../../user-profile/user-profile.models';

@Component({ selector: 'app-user-create-drawer', standalone: true, imports: [ReactiveFormsModule], templateUrl: './user-create-drawer.html', styleUrl: './user-create-drawer.css' })
export class UserCreateDrawer implements OnInit {
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  @Output() closed = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<SystemUser>();
  @Output() userUpdated = new EventEmitter<SystemUser>();
  @Input() editingUser?: SystemUser | null;

  private _currentUserProfile: CurrentUserProfile | null = null;
  @Input() set currentUserProfile(profile: CurrentUserProfile | null | undefined) {
    this._currentUserProfile = profile ?? null;
    this.applyActorRestrictions();
  }
  get currentUserProfile(): CurrentUserProfile | null {
    return this._currentUserProfile;
  }

  roles: RoleOption[] = [
    { value: 'SUPER_ADMIN', label: 'Super Administrator' },
    { value: 'REGIONAL_ADMIN', label: 'Regional Administrator' },
    { value: 'FIELD_ADMIN', label: 'Field Administrator' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];
  allProvinces: LocationOption[] = [];
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

  private applyActorRestrictions(): void {
    const actorRole = this.currentUserProfile?.role;

    if (actorRole === 'REGIONAL_ADMIN') {
      this.roles = [
        { value: 'FIELD_ADMIN', label: 'Field Administrator' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
      ];
    } else if (actorRole === 'FIELD_ADMIN') {
      this.roles = [
        { value: 'MAINTENANCE', label: 'Maintenance' },
      ];
    } else {
      this.roles = [
        { value: 'SUPER_ADMIN', label: 'Super Administrator' },
        { value: 'REGIONAL_ADMIN', label: 'Regional Administrator' },
        { value: 'FIELD_ADMIN', label: 'Field Administrator' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
      ];
    }

    if (actorRole === 'REGIONAL_ADMIN' && this.currentUserProfile?.provinces?.length) {
      const actorProvinceIds = this.currentUserProfile.provinces.map((p) => p.id);
      const actorProvinceNames = this.currentUserProfile.provinces.map((p) => p.name.toLowerCase());

      if (this.allProvinces && this.allProvinces.length > 0) {
        this.provinces = this.allProvinces.filter(
          (p) => actorProvinceIds.includes(p.id) || actorProvinceNames.includes(p.name.toLowerCase())
        );
      }

      if (this.provinces.length === 1 && !this.form.controls.provinceId.value && !this.editingUser) {
        this.changeProvince(this.provinces[0].id);
      }
    } else if (this.allProvinces && this.allProvinces.length > 0) {
      this.provinces = [...this.allProvinces];
    }
  }

  private populateEditingUserForm(u: SystemUser): void {
    this.form.controls.fullName.setValue(u.name);
    this.form.controls.username.setValue(u.email ? u.email.split('@')[0] : '');
    this.form.controls.email.setValue(u.email);
    this.form.controls.contactNumber.setValue(u.contactNumber || (u as any).contact_number || '');
    this.form.controls.role.setValue(u.role as any);
    this.form.controls.status.setValue(u.status as any);
    this.configureAssignmentValidators();

    if (u.provinceIds && u.provinceIds.length > 0) {
      const provId = u.provinceIds[0];
      this.form.controls.provinceId.setValue(provId);
      if (this.needsDistrict) {
        this.isLoadingDistricts = true;
        this.userService.getDistricts(provId).pipe(finalize(() => { this.isLoadingDistricts = false; })).subscribe({
          next: (districts) => {
            this.districts = districts;
            if (u.districtIds && u.districtIds.length > 0) {
              this.changeDistrict(u.districtIds[0], u.fenceIds || []);
            }
          },
          error: () => { this.apiError = 'Unable to load districts.'; }
        });
      }
    } else if (u.province && this.provinces.length > 0) {
      const match = this.provinces.find(p => p.name.toLowerCase() === u.province.toLowerCase() || `province #${p.id}` === u.province.toLowerCase());
      if (match) {
        this.form.controls.provinceId.setValue(match.id);
        if (this.needsDistrict) {
          this.isLoadingDistricts = true;
          this.userService.getDistricts(match.id).pipe(finalize(() => { this.isLoadingDistricts = false; })).subscribe({
            next: (districts) => {
              this.districts = districts;
              if (u.districtIds && u.districtIds.length > 0) {
                this.changeDistrict(u.districtIds[0], u.fenceIds || []);
              }
            },
            error: () => { this.apiError = 'Unable to load districts.'; }
          });
        }
      }
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
        if (options.provinces) {
          this.allProvinces = options.provinces;
          this.provinces = [...options.provinces];
        }
        this.applyActorRestrictions();
        if (this.editingUser) {
          this.populateEditingUserForm(this.editingUser);
        }
      },
      error: () => {
        this.optionsLoadFailed = false;
        this.applyActorRestrictions();
        if (this.editingUser) {
          this.populateEditingUserForm(this.editingUser);
        }
      },
    });
  }

  @HostListener('document:keydown.escape') closeOnEscape(): void { if (!this.isSubmitting) this.closed.emit(); }

  changeRole(role: UserRole): void {
    this.form.controls.role.setValue(role);
    this.configureAssignmentValidators();
    if (!this.needsProvince) {
      this.form.controls.provinceId.setValue(null);
      this.form.controls.districtId.setValue(null);
      this.form.controls.fenceIds.setValue([]);
      this.districts = [];
      this.fences = [];
    } else if (!this.needsDistrict) {
      this.form.controls.districtId.setValue(null);
      this.form.controls.fenceIds.setValue([]);
      this.fences = [];
    } else if (!this.needsFence) {
      this.form.controls.fenceIds.setValue([]);
      this.fences = [];
    }
  }

  changeProvince(provinceId: number): void {
    this.form.controls.provinceId.setValue(provinceId);
    this.form.controls.districtId.setValue(null);
    this.form.controls.fenceIds.setValue([]);
    this.districts = [];
    this.fences = [];
    if (!this.needsDistrict) return;
    this.isLoadingDistricts = true;
    this.userService.getDistricts(provinceId).pipe(finalize(() => { this.isLoadingDistricts = false; this.cdr.markForCheck(); })).subscribe({
      next: (districts) => { this.districts = districts; },
      error: () => { this.apiError = 'Unable to load districts.'; },
    });
  }

  changeDistrict(districtId: number, preserveFenceIds?: number[]): void {
    this.form.controls.districtId.setValue(districtId);
    this.fences = [];
    this.apiError = '';
    if (!this.needsFence) {
      this.form.controls.fenceIds.setValue([]);
      return;
    }
    this.isLoadingFences = true;
    this.userService.getFences(districtId).pipe(finalize(() => { this.isLoadingFences = false; })).subscribe({
      next: (fences) => {
        this.fences = fences;
        this.apiError = '';
        if (preserveFenceIds && preserveFenceIds.length > 0) {
          const validIds = preserveFenceIds.filter(id => fences.some(f => f.id === id));
          this.form.controls.fenceIds.setValue(validIds.length > 0 ? validIds : [fences[0].id]);
        } else if (fences.length > 0) {
          this.form.controls.fenceIds.setValue([fences[0].id]);
        }
      },
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
    const actionText = this.editingUser ? 'update' : 'create';
    this.apiError = body?.message ?? (error.status === 403 ? `You are not authorized to ${actionText} this user.` : `Unable to ${actionText} the user. Please try again.`);
  }
}
