import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap, catchError } from "rxjs";

import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
} from "../models/auth.models";
import {
  ManagementAccessService,
  ManagementRole,
} from "./management-access.service";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  contactNumber?: string;
  provinces?: string[];
  districts?: string[];
  fences?: string[];
}

const SESSION_KEY = "auth_user_session";
const TOKEN_KEY = "auth_access_token";
const SCOPE_KEY = "auth_management_scope";

const PROVINCE_MAP: Record<number, string> = {
  1: 'Central', 2: 'Western', 3: 'North Central', 4: 'North Western', 5: 'Sabaragamuwa', 6: 'Eastern', 7: 'Southern', 8: 'Uva', 9: 'Northern'
};

const DISTRICT_MAP: Record<number, string> = {
  1: 'Kandy', 2: 'Matale', 3: 'Nuwara Eliya', 4: 'Colombo', 5: 'Gampaha', 6: 'Kalutara', 7: 'Anuradhapura', 8: 'Polonnaruwa', 9: 'Kurunegala', 10: 'Puttalam', 11: 'Ratnapura', 12: 'Kegalle', 13: 'Trincomalee', 14: 'Batticaloa', 15: 'Ampara', 16: 'Galle', 17: 'Matara', 18: 'Hambantota', 19: 'Badulla', 20: 'Monaragala', 21: 'Jaffna', 22: 'Kilinochchi', 23: 'Mannar', 24: 'Vavuniya', 25: 'Mullaitivu'
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly managementAccess = inject(ManagementAccessService);
  private readonly loginEndpoint = "/api/auth/login";

  readonly currentUser = signal<AuthUser | null>(this.loadStoredUser());

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.managementAccess.setScope({
        role: user.role as ManagementRole,
        provinces: user.provinces ?? [],
        districts: user.districts ?? [],
        fences: user.fences ?? [],
        userId: user.id,
        userName: user.fullName,
      });
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.loginEndpoint, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          const { user, accessToken } = response;
          if (accessToken) {
            sessionStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_KEY);
            (credentials.rememberMe ? localStorage : sessionStorage).setItem(
              TOKEN_KEY,
              accessToken,
            );
            sessionStorage.setItem("access_token", accessToken);
            localStorage.setItem("access_token", accessToken);
          }

          const provincesList = (Array.isArray(user.provinceNames) && user.provinceNames.length > 0)
            ? user.provinceNames
            : (Array.isArray(user.provinceIds) && user.provinceIds.length > 0)
              ? user.provinceIds.map((id: number) => PROVINCE_MAP[id] || `Province #${id}`)
              : (user.province ? [user.province] : (user.provinces ?? []));

          const districtsList = (Array.isArray(user.districtNames) && user.districtNames.length > 0)
            ? user.districtNames
            : (Array.isArray(user.districtIds) && user.districtIds.length > 0)
              ? user.districtIds.map((id: number) => DISTRICT_MAP[id] || `District #${id}`)
              : (user.district ? [user.district] : (user.districts ?? []));

          const authUser: AuthUser = {
            id: user.id,
            fullName: user.fullName || user.name || "System User",
            email: user.email,
            role: user.role,
            contactNumber: user.contactNumber,
            provinces: provincesList,
            districts: districtsList,
            fences: user.fences ?? [],
          };
          this.currentUser.set(authUser);
          sessionStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(SESSION_KEY);
          (credentials.rememberMe ? localStorage : sessionStorage).setItem(
            SESSION_KEY,
            JSON.stringify(authUser),
          );

          const scopeData = {
            role: user.role as ManagementRole,
            provinces: provincesList,
            districts: districtsList,
            fences: user.fences ?? [],
            userId: user.id,
            userName: authUser.fullName,
          };
          this.managementAccess.setScope(scopeData);
          sessionStorage.setItem(SCOPE_KEY, JSON.stringify(scopeData));
          localStorage.setItem(SCOPE_KEY, JSON.stringify(scopeData));
        }),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>("/api/auth/logout", {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearSessionLocally()),
        catchError(() => {
          this.clearSessionLocally();
          return of(void 0);
        }),
      );
  }

  clearSessionLocally(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SCOPE_KEY);
    sessionStorage.removeItem("access_token");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SCOPE_KEY);
    localStorage.removeItem("access_token");
    this.managementAccess.setScope({
      role: "MAINTENANCE",
      provinces: [],
      districts: [],
      fences: [],
    });
  }

  getAccessToken(): string | null {
    return (
      sessionStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("access_token")
    );
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null && this.getAccessToken() !== null;
  }

  changePassword(
    request: ChangePasswordRequest,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      "/api/auth/change-password",
      request,
      {
        withCredentials: true,
      },
    );
  }

  signOutOtherSessions(): Observable<{
    message: string;
    revokedSessions: number;
  }> {
    return this.http.post<{ message: string; revokedSessions: number }>(
      "/api/auth/sessions/revoke-others",
      {},
      { withCredentials: true },
    );
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const stored =
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SESSION_KEY);
      if (stored) {
        const authUser = JSON.parse(stored) as AuthUser;
        const storedScope =
          sessionStorage.getItem(SCOPE_KEY) ||
          localStorage.getItem(SCOPE_KEY);
        if (storedScope) {
          try {
            this.managementAccess.setScope(JSON.parse(storedScope));
          } catch {}
        } else if (authUser.role) {
          this.managementAccess.setScope({
            role: authUser.role as ManagementRole,
            provinces: authUser.provinces ?? [],
            districts: authUser.districts ?? [],
            fences: authUser.fences ?? [],
            userId: authUser.id,
            userName: authUser.fullName,
          });
        }
        return authUser;
      }
      return null;
    } catch {
      return null;
    }
  }
}
