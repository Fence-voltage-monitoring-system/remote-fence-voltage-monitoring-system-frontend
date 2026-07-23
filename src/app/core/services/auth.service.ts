import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ChangePasswordRequest, LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loginEndpoint = '/api/auth/login';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials, {
      withCredentials: true,
    });
  }

  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/change-password', request, {
      withCredentials: true,
    });
  }

  signOutOtherSessions(): Observable<{ message: string; revokedSessions: number }> {
    return this.http.post<{ message: string; revokedSessions: number }>(
      '/api/auth/sessions/revoke-others',
      {},
      { withCredentials: true },
    );
  }
}
