import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { AssignDevicePayload, CreateDevicePayload, Device, DeviceStatus, UpdateDevicePayload } from '../models/device.models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/devices';
  private readonly options = { withCredentials: true } as const;

  getDevices(): Observable<Device[]> {
    return this.http.get<any[]>(this.endpoint, this.options).pipe(
      map((dtos) => (Array.isArray(dtos) ? dtos : []).map((dto) => this.mapDtoToDevice(dto)))
    );
  }

  createDevice(payload: CreateDevicePayload): Observable<Device> {
    return this.http.post<any>(this.endpoint, payload, this.options).pipe(
      map((dto) => this.mapDtoToDevice(dto))
    );
  }

  updateDevice(id: string, payload: UpdateDevicePayload): Observable<Device> {
    const rawId = String(id).replace(/^DVC-/, '').replace(/^DEV-EFE-/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}`, payload, this.options).pipe(
      map((dto) => this.mapDtoToDevice(dto))
    );
  }

  assignDevice(id: string, payload: AssignDevicePayload): Observable<Device> {
    const rawId = String(id).replace(/^DVC-/, '').replace(/^DEV-EFE-/, '');
    return this.http.post<any>(`${this.endpoint}/${rawId}/assign`, payload, this.options).pipe(
      map((dto) => this.mapDtoToDevice(dto))
    );
  }

  unassignDevice(id: string): Observable<Device> {
    const rawId = String(id).replace(/^DVC-/, '').replace(/^DEV-EFE-/, '');
    return this.http.post<any>(`${this.endpoint}/${rawId}/unassign`, {}, this.options).pipe(
      map((dto) => this.mapDtoToDevice(dto))
    );
  }

  toggleEnabled(id: string, enabled: boolean): Observable<Device> {
    const rawId = String(id).replace(/^DVC-/, '').replace(/^DEV-EFE-/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}/status`, { enabled }, this.options).pipe(
      map((dto) => this.mapDtoToDevice(dto))
    );
  }

  deleteDevice(id: string): Observable<void> {
    const rawId = String(id).replace(/^DVC-/, '').replace(/^DEV-EFE-/, '');
    return this.http.delete<void>(`${this.endpoint}/${rawId}`, this.options);
  }

  private mapDtoToDevice(dto: any): Device {
    const formatDate = (iso: string | null) => {
      if (!iso) return dto.section ? 'Just now' : 'Not installed';
      try {
        const diffMs = Date.now() - new Date(iso).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay} days ago`;
      } catch {
        return iso;
      }
    };

    return {
      id: dto.id ? (String(dto.id).startsWith('DVC-') || String(dto.id).startsWith('DEV-') ? dto.id : `DVC-${dto.id}`) : (dto.serial || 'DVC-0000'),
      name: dto.name || 'Device',
      serial: dto.serial || '',
      type: dto.type || 'Voltage Monitor',
      fence: dto.fence || null,
      section: dto.section || null,
      status: (dto.status || 'offline').toLowerCase() as DeviceStatus,
      voltage: dto.voltage !== undefined && dto.voltage !== null ? dto.voltage : (dto.section ? 6.0 : null),
      signal: dto.signal || 0,
      battery: dto.battery || 0,
      lastSeen: formatDate(dto.lastSeen),
      enabled: dto.enabled !== false,
    };
  }
}
