import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ConfigurationService } from '../../../../core/services/configuration.service';
import { ActiveSessionRecord, SessionManagementSettings, SessionOverview } from '../../configuration.models';

@Component({
  selector: 'app-session-management-editor',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './session-management-editor.html',
  styleUrl: './session-management-editor.css'
})
export class SessionManagementEditor implements OnInit {
  private readonly cdr=inject(ChangeDetectorRef);
  private readonly service = inject(ConfigurationService);

  @Input({ required: true }) value!: SessionManagementSettings;
  @Output() valueChange = new EventEmitter<SessionManagementSettings>();

  overview: SessionOverview = {totalActiveSessions:0,activeUsers:0,administratorSessions:0,expiringSoon:0,suspiciousSessions:0,sessions:[]};
  loadingSessions = false;
  actionInProgress = '';
  pendingAction: { type: 'SESSION' | 'USER'; session: ActiveSessionRecord } | null = null;
  revocationReason = '';
  actionNotice = '';

  ngOnInit(): void { this.loadSessions(); }

  update<K extends keyof SessionManagementSettings>(field: K, value: SessionManagementSettings[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }

  requestRevoke(type: 'SESSION' | 'USER', session: ActiveSessionRecord): void {
    this.pendingAction = { type, session };
    this.revocationReason = '';
    this.actionNotice = '';
  }

  cancelRevoke(): void { this.pendingAction = null; this.revocationReason = ''; }

  confirmRevoke(): void {
    if (!this.pendingAction || !this.revocationReason.trim() || this.actionInProgress) return;
    const { type, session } = this.pendingAction;
    this.actionInProgress = type === 'SESSION' ? session.id : `user-${session.userId}`;
    const request = type === 'SESSION'
      ? this.service.revokeSession(session.id, this.revocationReason.trim())
      : this.service.revokeUserSessions(session.userId, this.revocationReason.trim());
    request.pipe(finalize(() => {this.actionInProgress = '';this.cdr.markForCheck();})).subscribe({
      next: () => {
        if (type === 'SESSION') this.overview = { ...this.overview, sessions: this.overview.sessions.filter(item => item.id !== session.id) };
        else this.overview = { ...this.overview, sessions: this.overview.sessions.filter(item => item.userId !== session.userId || item.current) };
        this.loadSessions();
        this.actionNotice = type === 'SESSION' ? 'Session revoked successfully.' : `All eligible sessions for ${session.userName} were revoked.`;
        this.cancelRevoke();
      },
      error: (error: HttpErrorResponse) => this.actionNotice = this.errorMessage(error)
    });
  }

  private loadSessions(): void {
    this.loadingSessions = true;
    this.service.getSessionOverview().pipe(finalize(() => {this.loadingSessions = false;this.cdr.markForCheck();})).subscribe({
      next: overview => this.overview = overview,
      error: () => this.actionNotice = 'Unable to load active sessions. Reopen this section to retry.'
    });
  }

  private recalculateOverview(): void {
    const sessions = this.overview.sessions;
    this.overview = {
      ...this.overview,
      totalActiveSessions: sessions.length,
      activeUsers: new Set(sessions.map(item => item.userId)).size,
      administratorSessions: sessions.filter(item => item.role.includes('ADMIN')).length,
      suspiciousSessions: sessions.filter(item => item.suspicious).length
    };
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) return 'Your session has expired. Sign in again.';
    if (error.status === 403) return 'Only super administrators may revoke other users’ sessions.';
    if (error.status === 404) return 'This session has already ended.';
    return error.error?.message ?? 'Unable to revoke the session.';
  }

}
