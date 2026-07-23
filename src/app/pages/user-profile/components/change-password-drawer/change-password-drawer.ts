import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, HostListener, inject, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

@Component({ selector: 'app-change-password-drawer', standalone: true, imports: [ReactiveFormsModule], templateUrl: './change-password-drawer.html', styleUrl: './change-password-drawer.css' })
export class ChangePasswordDrawer {
  private readonly authService = inject(AuthService);
  @Output() closed = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<string>();

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmation = false;
  isSubmitting = false;
  errorMessage = '';

  readonly form = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(15), Validators.maxLength(64)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
  }, { validators: passwordMatchValidator });

  @HostListener('document:keydown.escape')
  closeOnEscape(): void { if (!this.isSubmitting) this.closed.emit(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { currentPassword, newPassword } = this.form.getRawValue();
    if (currentPassword === newPassword) {
      this.form.controls.newPassword.setErrors({ sameAsCurrent: true });
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.changePassword({ currentPassword, newPassword }).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
      next: (response) => this.passwordChanged.emit(response.message || 'Your password was changed successfully.'),
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) this.form.controls.currentPassword.setErrors({ incorrect: true });
        this.errorMessage = error.error?.message ?? 'Unable to change your password. Please try again.';
      },
    });
  }
}
