import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CreateUserOptions, CreateUserRequest, FenceOption, LocationOption, RoleOption, SystemUser, UserFilters, UserStatus } from '../../pages/user-management/user-management.models';
import { CurrentUserProfile, UpdateCurrentUserProfileRequest, UserNotificationPreferences } from '../../pages/user-profile/user-profile.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/users';

  getUsers(filters?: UserFilters): Observable<SystemUser[]> {
    return this.http.get<any[]>(this.endpoint, { withCredentials: true }).pipe(
      map(dtos => (Array.isArray(dtos) ? dtos : []).map(dto => this.mapUserDtoToSystemUser(dto)))
    );
  }

  getCreateOptions(): Observable<CreateUserOptions> {
    const roles: RoleOption[] = [
      { value: 'SUPER_ADMIN', label: 'Super Administrator' },
      { value: 'REGIONAL_ADMIN', label: 'Regional Administrator' },
      { value: 'FIELD_ADMIN', label: 'Field Administrator' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
    ];
    return this.http.get<any[]>('/api/locations/provinces', { withCredentials: true }).pipe(
      map(provinces => ({
        roles,
        provinces: provinces.map(p => ({ id: p.id, name: p.name }))
      }))
    );
  }

  getDistricts(provinceId: number): Observable<LocationOption[]> {
    return this.http.get<any[]>(`/api/locations/districts?provinceId=${provinceId}`, { withCredentials: true }).pipe(
      map(districts => districts.map(d => ({ id: d.id, name: d.name })))
    );
  }

  getFences(districtId: number): Observable<FenceOption[]> {
    return this.http.get<any[]>(`/api/fences?districtId=${districtId}`, { withCredentials: true }).pipe(
      map(fences => fences.map(f => ({ id: f.id, name: f.name || f.code, code: f.code || '' })))
    );
  }

  createUser(request: CreateUserRequest): Observable<SystemUser> {
    const payload = {
      fullName: request.fullName,
      email: request.email,
      password: request.temporaryPassword || 'Password@123456',
      role: request.role,
      staffId: `DWC-${Math.floor(1000 + Math.random() * 9000)}`,
      contactNumber: request.contactNumber,
      provinceIds: request.provinceIds || [],
      districtIds: request.districtIds || []
    };
    return this.http.post<any>(this.endpoint, payload, { withCredentials: true }).pipe(
      map(dto => this.mapUserDtoToSystemUser(dto))
    );
  }

  updateUser(userId: number | string, request: Partial<CreateUserRequest>): Observable<SystemUser> {
    const payload: any = {};
    if (request.fullName) payload.fullName = request.fullName;
    if (request.role) payload.role = request.role;
    if (request.contactNumber) payload.contactNumber = request.contactNumber;
    if (request.provinceIds) payload.provinceIds = request.provinceIds;
    if (request.districtIds) payload.districtIds = request.districtIds;
    if (request.status !== undefined) payload.enabled = request.status === 'ACTIVE';
    return this.http.put<any>(`${this.endpoint}/${userId}`, payload, { withCredentials: true }).pipe(
      map(dto => this.mapUserDtoToSystemUser(dto))
    );
  }

  updateStatus(userId: number | string, status: UserStatus): Observable<SystemUser> {
    return this.http.patch<any>(`${this.endpoint}/${userId}/status`, { status, enabled: status === 'ACTIVE' }, { withCredentials: true }).pipe(
      map(dto => this.mapUserDtoToSystemUser(dto))
    );
  }

  deleteUser(userId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${userId}`, { withCredentials: true });
  }

  resetPassword(userId: number | string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.endpoint}/${userId}/reset-password`, {}, { withCredentials: true });
  }

  private mapUserDtoToSystemUser(dto: any): SystemUser {
    const fullName = dto.fullName || dto.name || 'User';
    const parts = fullName.trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();
    const formatDate = (iso: string | null) => {
      if (!iso) return 'Not available';
      try {
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
      } catch {
        return iso;
      }
    };

    const provinceIds: number[] = Array.isArray(dto.provinceIds) ? dto.provinceIds : [];
    const districtIds: number[] = Array.isArray(dto.districtIds) ? dto.districtIds : [];

    return {
      id: dto.id,
      initials,
      name: fullName,
      email: dto.email || '',
      contactNumber: dto.contactNumber || dto.contact_number || dto.phone || '',
      role: dto.role || 'FIELD_ADMIN',
      province: (provinceIds.length > 0) ? `Province #${provinceIds[0]}` : (dto.province || 'All'),
      provinceIds,
      district: (districtIds.length > 0) ? `District #${districtIds[0]}` : (dto.district || 'All'),
      districtIds,
      status: dto.enabled === false ? 'INACTIVE' : 'ACTIVE',
      lastLogin: formatDate(dto.lastLoginAt),
      created: formatDate(dto.createdAt),
      recentActivity: ['User account active']
    };
  }

  getCurrentProfile(): Observable<CurrentUserProfile> {
    return this.http.get<any>('/api/auth/me', { withCredentials: true }).pipe(
      map(dto => this.mapUserDtoToProfile(dto))
    );
  }

  private mapUserDtoToProfile(dto: any): CurrentUserProfile {
    const fullName = dto.fullName || 'System Administrator';
    const email = dto.email || 'admin@nerdc.lk';
    const parts = fullName.trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();
    const formatDate = (iso: string | null) => {
      if (!iso) return 'Not available';
      try {
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
      } catch {
        return iso;
      }
    };

    return {
      id: dto.id || 1,
      staffId: dto.staffId || 'NERDC-ADMIN-01',
      initials: initials,
      fullName: fullName,
      username: email.split('@')[0],
      email: email,
      contactNumber: dto?.contactNumber ?? dto?.contact_number ?? '',
      department: 'Department of Wildlife Conservation / NERDC',
      role: dto.role || 'SUPER_ADMIN',
      status: dto.enabled ? 'ACTIVE' : 'INACTIVE',
      mustChangePassword: dto.passwordChangeRequired || false,
      provinces: (dto.provinceIds || []).map((id: number) => ({ id, name: `Province #${id}` })),
      districts: (dto.districtIds || []).map((id: number) => ({ id, name: `District #${id}` })),
      fences: [],
      createdAt: formatDate(dto.createdAt),
      lastLoginAt: formatDate(dto.lastLoginAt),
      passwordChangedAt: formatDate(dto.passwordChangedAt),
      recentActivity: [
        { id: 1, action: 'Logged in successfully', occurredAt: formatDate(dto.lastLoginAt), category: 'SECURITY' }
      ]
    };
  }

  updateCurrentProfile(request: UpdateCurrentUserProfileRequest): Observable<CurrentUserProfile> {
    return this.http.put<any>('/api/auth/me', request, { withCredentials: true }).pipe(
      map(dto => this.mapUserDtoToProfile(dto))
    );
  }

  getNotificationPreferences(): Observable<UserNotificationPreferences> {
    return this.http.get<UserNotificationPreferences>(`${this.endpoint}/me/notification-preferences`, { withCredentials: true });
  }

  updateNotificationPreferences(request: UserNotificationPreferences): Observable<UserNotificationPreferences> {
    return this.http.put<UserNotificationPreferences>(`${this.endpoint}/me/notification-preferences`, request, { withCredentials: true });
  }
}
