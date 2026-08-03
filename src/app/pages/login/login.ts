import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  readonly loginForm = new FormGroup({
    username: new FormControl('', {
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

  get usernameControl(): FormControl<string> {
    return this.loginForm.controls.username;
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
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: (response) => {
          this.successMessage = `Welcome, ${response.user.name}.`;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getLoginErrorMessage(error);
        },
      });
  }

  private getLoginErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the authentication service.';
    }

    if (error.status === 401) {
      return 'The username or password is incorrect.';
    }

    if (error.status === 429) {
      return 'Too many login attempts. Please try again later.';
    }

    return 'Login failed. Please try again.';
  }
}
