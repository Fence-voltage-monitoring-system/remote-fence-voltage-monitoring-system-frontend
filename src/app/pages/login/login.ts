import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  passwordVisible = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  get emailControl(): FormControl<string> {
    return this.loginForm.controls.email;
  }

  get passwordControl(): FormControl<string> {
    return this.loginForm.controls.password;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  submitLogin(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.loginForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          const userName = response.user.fullName || response.user.name || 'User';
          this.successMessage = `Welcome, ${userName}.`;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 500);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getLoginErrorMessage(error);
          this.cdr.markForCheck();
        },
      });
  }

  private getLoginErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the authentication service.';
    }

    if (error.status === 401) {
      return 'The email address or password is incorrect.';
    }

    if (error.status === 429) {
      return 'Too many login attempts. Please try again later.';
    }

    return 'Login failed. Please try again.';
  }
}
