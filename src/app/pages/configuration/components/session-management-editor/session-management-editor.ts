import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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
  private readonly service = inject(ConfigurationService);

  @Input({ required: true }) value!: SessionManagementSettings;
  @Output() valueChange = new EventEmitter<SessionManagementSettings>();

  overview: SessionOverview = this.previewOverview();
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
    request.pipe(finalize(() => this.actionInProgress = '')).subscribe({
      next: () => {
        if (type === 'SESSION') this.overview = { ...this.overview, sessions: this.overview.sessions.filter(item => item.id !== session.id) };
        else this.overview = { ...this.overview, sessions: this.overview.sessions.filter(item => item.userId !== session.userId || item.current) };
        this.recalculateOverview();
        this.actionNotice = type === 'SESSION' ? 'Session revoked successfully.' : `All eligible sessions for ${session.userName} were revoked.`;
        this.cancelRevoke();
      },
      error: (error: HttpErrorResponse) => this.actionNotice = this.errorMessage(error)
    });
  }

  private loadSessions(): void {
    this.loadingSessions = true;
    this.service.getSessionOverview().pipe(finalize(() => this.loadingSessions = false)).subscribe({
      next: overview => this.overview = overview,
      error: () => this.actionNotice = 'Session API unavailable. Displaying preview data.'
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

  private previewOverview(): SessionOverview {
    return {
      totalActiveSessions: 4, activeUsers: 3, administratorSessions: 3, expiringSoon: 1, suspiciousSessions: 1,
      sessions: [
        { id:'SES-82A1',userId:1,userName:'Suresh Ambegoda',role:'SUPER_ADMIN',device:'MacBook Pro',browser:'Safari 18',ipAddress:'192.168.1.24',approximateLocation:'Colombo, Sri Lanka',signedInAt:'2026-07-30T08:20:00+05:30',lastActivityAt:'2026-07-30T13:58:00+05:30',expiresAt:'2026-07-30T20:20:00+05:30',current:true,suspicious:false },
        { id:'SES-77D4',userId:2,userName:'Kasun Perera',role:'REGIONAL_ADMIN',device:'Windows PC',browser:'Chrome 127',ipAddress:'10.20.4.18',approximateLocation:'Monaragala, Sri Lanka',signedInAt:'2026-07-30T07:45:00+05:30',lastActivityAt:'2026-07-30T13:42:00+05:30',expiresAt:'2026-07-30T19:45:00+05:30',current:false,suspicious:false },
        { id:'SES-61F9',userId:3,userName:'Nimal Dissanayake',role:'FIELD_ADMIN',device:'Android phone',browser:'Chrome Mobile',ipAddress:'172.18.2.41',approximateLocation:'Anuradhapura, Sri Lanka',signedInAt:'2026-07-30T09:10:00+05:30',lastActivityAt:'2026-07-30T13:49:00+05:30',expiresAt:'2026-07-30T21:10:00+05:30',current:false,suspicious:false },
        { id:'SES-51C2',userId:2,userName:'Kasun Perera',role:'REGIONAL_ADMIN',device:'Unknown Linux device',browser:'Firefox',ipAddress:'203.94.88.17',approximateLocation:'Unknown',signedInAt:'2026-07-30T13:31:00+05:30',lastActivityAt:'2026-07-30T13:31:00+05:30',expiresAt:'2026-07-31T01:31:00+05:30',current:false,suspicious:true }
      ]
    };
  }
}
