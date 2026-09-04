import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChangePasswordPayload, SecurityActivity, SecuritySession } from '../models/security.models';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/security';
  private readonly options = { withCredentials: true } as const;

  readonly previewSessions: SecuritySession[] = [
    { id: 'SES-01', device: 'Windows PC', browser: 'Chrome 138', location: 'Colombo, Sri Lanka', ip: '192.168.1.24', lastActive: 'Active now', current: true },
    { id: 'SES-02', device: 'Android phone', browser: 'Chrome Mobile', location: 'Colombo, Sri Lanka', ip: '192.168.1.46', lastActive: '2 hours ago', current: false },
    { id: 'SES-03', device: 'iPad Pro', browser: 'Safari 18', location: 'Kandy, Sri Lanka', ip: '192.168.2.110', lastActive: 'Yesterday', current: false },
  ];

  readonly previewActivity: SecurityActivity[] = [
    { id: 'ACT-01', action: 'Successful sign-in', time: 'Today, 15:28', location: 'Colombo · 192.168.1.24', result: 'success' },
    { id: 'ACT-02', action: 'Two-factor verification', time: 'Today, 15:28', location: 'Authenticator application', result: 'success' },
    { id: 'ACT-03', action: 'Failed sign-in attempt', time: '26 Jul 2026, 21:14', location: 'Unknown · 103.125.18.44', result: 'failed' },
    { id: 'ACT-04', action: 'Password changed', time: '03 Jul 2026, 10:42', location: 'Colombo · 192.168.1.24', result: 'success' },
  ];

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.post<void>('/api/auth/change-password', payload, this.options);
  }

  getSessions(): Observable<SecuritySession[]> {
    return this.http.get<SecuritySession[]>(`${this.endpoint}/sessions`, this.options);
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/sessions/${sessionId}`, this.options);
  }

  toggleTwoFactor(enabled: boolean): Observable<{ enabled: boolean }> {
    return this.http.patch<{ enabled: boolean }>(`${this.endpoint}/two-factor`, { enabled }, this.options);
  }
}
