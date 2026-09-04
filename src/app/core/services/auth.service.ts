import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';

import { ChangePasswordRequest, LoginRequest, LoginResponse } from '../models/auth.models';
import { ManagementAccessService, ManagementRole } from './management-access.service';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  contactNumber?: string;
}

const SESSION_KEY = 'auth_user_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly managementAccess = inject(ManagementAccessService);
  private readonly loginEndpoint = '/api/auth/login';

  readonly currentUser = signal<AuthUser | null>(this.loadStoredUser());

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials, {
      withCredentials: true,
    }).pipe(tap((res) => {
      const { user, accessToken } = res;
      if (accessToken) {
        sessionStorage.setItem('access_token', accessToken);
        localStorage.setItem('access_token', accessToken);
      }
      const authUser: AuthUser = {
        id: user.id,
        fullName: user.fullName || user.name || 'System User',
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
      };
      this.currentUser.set(authUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));

      this.managementAccess.setScope({
        role: user.role as ManagementRole,
        provinces: user.provinces ?? [],
        districts: user.districts ?? [],
        fences: user.fences ?? [],
        userId: user.id,
        userName: authUser.fullName,
      });
    }));
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.clearSessionLocally()),
      catchError(() => {
        this.clearSessionLocally();
        return of(void 0);
      })
    );
  }

  clearSessionLocally(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('access_token');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
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

  private loadStoredUser(): AuthUser | null {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) as AuthUser : null;
    } catch {
      return null;
    }
  }
}
