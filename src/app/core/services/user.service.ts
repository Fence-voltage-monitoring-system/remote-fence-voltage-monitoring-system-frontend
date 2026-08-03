import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserOptions, CreateUserRequest, FenceOption, LocationOption, SystemUser, UserFilters, UserStatus } from '../../pages/user-management/user-management.models';
import { CurrentUserProfile, UpdateCurrentUserProfileRequest, UserNotificationPreferences } from '../../pages/user-profile/user-profile.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/users';

  getUsers(filters: UserFilters): Observable<SystemUser[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<SystemUser[]>(this.endpoint, { params, withCredentials: true });
  }

  getCreateOptions(): Observable<CreateUserOptions> {
    return this.http.get<CreateUserOptions>(`${this.endpoint}/create-options`, { withCredentials: true });
  }

  getDistricts(provinceId: number): Observable<LocationOption[]> {
    return this.http.get<LocationOption[]>(`/api/provinces/${provinceId}/districts`, { withCredentials: true });
  }

  getFences(districtId: number): Observable<FenceOption[]> {
    return this.http.get<FenceOption[]>(`/api/districts/${districtId}/fences`, { withCredentials: true });
  }

  createUser(request: CreateUserRequest): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.endpoint, request, { withCredentials: true });
  }

  updateStatus(userId: number, status: UserStatus): Observable<SystemUser> {
    return this.http.patch<SystemUser>(`${this.endpoint}/${userId}/status`, { status }, { withCredentials: true });
  }

  resetPassword(userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.endpoint}/${userId}/reset-password`, {}, { withCredentials: true });
  }

  getCurrentProfile(): Observable<CurrentUserProfile> {
    return this.http.get<CurrentUserProfile>(`${this.endpoint}/me`, { withCredentials: true });
  }

  updateCurrentProfile(request: UpdateCurrentUserProfileRequest): Observable<CurrentUserProfile> {
    return this.http.patch<CurrentUserProfile>(`${this.endpoint}/me`, request, { withCredentials: true });
  }

  getNotificationPreferences(): Observable<UserNotificationPreferences> {
    return this.http.get<UserNotificationPreferences>(`${this.endpoint}/me/notification-preferences`, { withCredentials: true });
  }

  updateNotificationPreferences(request: UserNotificationPreferences): Observable<UserNotificationPreferences> {
    return this.http.put<UserNotificationPreferences>(`${this.endpoint}/me/notification-preferences`, request, { withCredentials: true });
  }
}
