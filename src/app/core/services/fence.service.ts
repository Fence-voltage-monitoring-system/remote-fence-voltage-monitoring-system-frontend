import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  DistrictOption,
  FenceCreatePayload,
  FenceRecord,
  FenceUpdatePayload,
  MaintenanceTeamPayload,
  MaintenanceUserOption,
  ProvinceOption,
} from '../../pages/fence-management/fence-management.models';

interface BackendUserDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class FenceService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/fences';
  private readonly locationsEndpoint = '/api/locations';
  private readonly options = { withCredentials: true } as const;

  getFences(provinceId?: number, districtId?: number): Observable<FenceRecord[]> {
    let params = new HttpParams();
    if (provinceId) params = params.set('provinceId', provinceId.toString());
    if (districtId) params = params.set('districtId', districtId.toString());

    return this.http.get<FenceRecord[]>(this.endpoint, { params, ...this.options }).pipe(
      map(fences => fences.map(fence => this.normalizeFence(fence)))
    );
  }

  getFenceById(id: number): Observable<FenceRecord> {
    return this.http.get<FenceRecord>(`${this.endpoint}/${id}`, this.options).pipe(
      map(fence => this.normalizeFence(fence))
    );
  }

  getProvinces(): Observable<ProvinceOption[]> {
    return this.http.get<ProvinceOption[]>(`${this.locationsEndpoint}/provinces`, this.options);
  }

  getDistricts(provinceId?: number): Observable<DistrictOption[]> {
    let params = new HttpParams();
    if (provinceId) params = params.set('provinceId', provinceId.toString());
    return this.http.get<DistrictOption[]>(`${this.locationsEndpoint}/districts`, { params, ...this.options });
  }

  getMaintenanceCandidates(provinceId?: number, districtId?: number, fenceId?: number): Observable<MaintenanceUserOption[]> {
    let params = new HttpParams();
    if (provinceId) params = params.set('provinceId', provinceId.toString());
    if (districtId) params = params.set('districtId', districtId.toString());
    if (fenceId) params = params.set('fenceId', fenceId.toString());

    return this.http.get<BackendUserDTO[]>(`${this.endpoint}/maintenance-candidates`, { params, ...this.options }).pipe(
      map(users =>
        (users || []).map(u => ({
          id: u.id,
          name: u.fullName || u.email,
          email: u.email,
          active: u.enabled,
          role: u.role,
        }))
      )
    );
  }

  createFence(payload: FenceCreatePayload): Observable<FenceRecord> {
    return this.http.post<FenceRecord>(this.endpoint, payload, this.options).pipe(
      map(fence => this.normalizeFence(fence))
    );
  }

  saveDraft(payload: FenceCreatePayload): Observable<FenceRecord> {
    return this.http.post<FenceRecord>(`${this.endpoint}/drafts`, payload, this.options).pipe(
      map(fence => this.normalizeFence(fence))
    );
  }

  updateFence(id: number, payload: FenceUpdatePayload): Observable<FenceRecord> {
    return this.http.put<FenceRecord>(`${this.endpoint}/${id}`, payload, this.options).pipe(
      map(fence => this.normalizeFence(fence))
    );
  }

  updateMaintenanceTeam(id: number, payload: MaintenanceTeamPayload): Observable<FenceRecord> {
    return this.http.put<FenceRecord>(`${this.endpoint}/${id}/maintenance-team`, payload, this.options).pipe(
      map(fence => this.normalizeFence(fence))
    );
  }

  deleteFence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }

  // Backward compatibility methods
  register(payload: FenceCreatePayload): Observable<FenceRecord> {
    return this.createFence(payload);
  }

  update(id: number, payload: FenceUpdatePayload): Observable<FenceRecord> {
    return this.updateFence(id, payload);
  }

  delete(id: number): Observable<void> {
    return this.deleteFence(id);
  }

  private normalizeFence(fence: any): FenceRecord {
    return {
      ...fence,
      province: fence.province || fence.provinceName || '',
      district: fence.district || fence.districtName || '',
      lengthKm: Number(fence.lengthKm) || 0,
      sections: fence.sections ?? 0,
      gateway: fence.gateway || '',
      averageVoltageKv: fence.averageVoltageKv != null ? Number(fence.averageVoltageKv) : null,
      health: fence.health || 'OFFLINE',
      lastUpdated: fence.updatedAt ? new Date(fence.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unavailable',
    };
  }
}

