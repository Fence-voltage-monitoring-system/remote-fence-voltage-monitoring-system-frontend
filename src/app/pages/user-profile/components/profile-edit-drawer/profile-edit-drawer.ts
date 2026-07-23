import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, HostListener, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { CurrentUserProfile, UpdateCurrentUserProfileRequest } from '../../user-profile.models';

@Component({ selector: 'app-profile-edit-drawer', standalone: true, imports: [ReactiveFormsModule], templateUrl: './profile-edit-drawer.html', styleUrl: './profile-edit-drawer.css' })
export class ProfileEditDrawer implements OnChanges {
  private readonly userService = inject(UserService);
  @Input({ required: true }) profile!: CurrentUserProfile;
  @Output() closed = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<CurrentUserProfile>();

  isSubmitting = false;
  errorMessage = '';
  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)] }),
    contactNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[0-9 ]{9,15}$/)] }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && this.profile) this.form.reset({ fullName: this.profile.fullName, contactNumber: this.profile.contactNumber });
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void { if (!this.isSubmitting) this.closed.emit(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const request: UpdateCurrentUserProfileRequest = this.form.getRawValue();
    this.isSubmitting = true;
    this.errorMessage = '';
    this.userService.updateCurrentProfile(request).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
      next: (profile) => this.profileUpdated.emit(profile),
      error: (error: HttpErrorResponse) => { this.errorMessage = error.error?.message ?? 'Unable to update your profile. Please try again.'; },
    });
  }
}
