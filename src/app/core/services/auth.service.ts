import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { ChangePasswordRequest, LoginRequest, LoginResponse } from '../models/auth.models';
import { ManagementAccessService, ManagementRole } from './management-access.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly managementAccess = inject(ManagementAccessService);
  private readonly loginEndpoint = '/api/auth/login';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials, {
      withCredentials: true,
    }).pipe(tap(({user})=>this.managementAccess.setScope({
      role:user.role as ManagementRole,
      provinces:user.provinces??[],
      districts:user.districts??[],
      fences:user.fences??[],
      userId:user.id,
      userName:user.name,
    })));
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
