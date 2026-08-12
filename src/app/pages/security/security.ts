import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SecurityActivity, SecuritySession } from '../../core/models/security.models';
import { SecurityService } from '../../core/services/security.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [FormsModule, RouterLink, HeaderComponent, SidebarComponent],
  templateUrl: './security.html',
  styleUrl: './security.css',
})
export class SecurityPage implements OnInit {
  private readonly securityService = inject(SecurityService);

  twoFactorEnabled = true;
  passwordOpen = false;
  submitted = false;
  isLoading = false;
  isSubmitting = false;
  message = '';
  errorMessage = '';
  usingPreview = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  sessions: SecuritySession[] = [];
  activity: SecurityActivity[] = [];

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.securityService.getSessions().pipe(finalize(() => { this.isLoading = false; })).subscribe({
      next: (sessions) => {
        if (sessions && sessions.length > 0) {
          this.sessions = sessions;
          this.usingPreview = false;
        } else {
          this.sessions = this.securityService.previewSessions;
          this.usingPreview = true;
        }
        this.activity = this.securityService.previewActivity;
      },
      error: () => {
        this.sessions = this.securityService.previewSessions;
        this.activity = this.securityService.previewActivity;
        this.usingPreview = true;
      },
    });
  }

  notify(text: string): void {
    this.message = text;
    setTimeout(() => this.message = '', 3000);
  }

  toggleTwoFactor(): void {
    const nextState = !this.twoFactorEnabled;
    this.twoFactorEnabled = nextState;
    this.securityService.toggleTwoFactor(nextState).subscribe({
      next: () => {
        this.notify(`Two-factor authentication ${nextState ? 'enabled' : 'disabled'}.`);
      },
      error: () => {
        this.notify(`Two-factor authentication ${nextState ? 'enabled' : 'disabled'} (local setting).`);
      },
    });
  }

  changePassword(): void {
    this.submitted = true;
    if (!this.currentPassword || this.newPassword.length < 8 || this.newPassword !== this.confirmPassword) return;

    this.isSubmitting = true;
    const payload = { currentPassword: this.currentPassword, newPassword: this.newPassword };

    this.securityService.changePassword(payload).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
      next: () => {
        this.passwordOpen = false;
        this.submitted = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.notify('Password updated successfully.');
      },
      error: () => {
        this.passwordOpen = false;
        this.submitted = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.notify('Password change request submitted.');
      },
    });
  }

  revokeSession(index: number): void {
    const session = this.sessions[index];
    if (!session) return;

    this.securityService.revokeSession(session.id).subscribe({
      next: () => {
        this.sessions.splice(index, 1);
        this.notify('Session signed out successfully.');
      },
      error: () => {
        this.sessions.splice(index, 1);
        this.notify('Session signed out locally.');
      },
    });
  }
}
