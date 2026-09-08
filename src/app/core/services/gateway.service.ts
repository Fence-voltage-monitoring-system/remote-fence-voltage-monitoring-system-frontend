import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CreateGatewayPayload, Gateway, GatewayStatus, UpdateGatewayPayload } from '../models/gateway.models';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/gateways';
  private readonly options = { withCredentials: true } as const;

  getGateways(): Observable<Gateway[]> {
    return this.http.get<any[]>(this.endpoint, this.options).pipe(
      map((dtos) => (Array.isArray(dtos) ? dtos : []).map((dto) => this.mapDtoToGateway(dto)))
    );
  }

  createGateway(payload: CreateGatewayPayload): Observable<Gateway> {
    return this.http.post<any>(this.endpoint, payload, this.options).pipe(
      map((dto) => this.mapDtoToGateway(dto))
    );
  }

  updateGateway(id: string, payload: UpdateGatewayPayload): Observable<Gateway> {
    const rawId = String(id).replace(/^GW-/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}`, payload, this.options).pipe(
      map((dto) => this.mapDtoToGateway(dto))
    );
  }

  toggleEnabled(id: string, enabled: boolean): Observable<Gateway> {
    const rawId = String(id).replace(/^GW-/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}/status`, { enabled }, this.options).pipe(
      map((dto) => this.mapDtoToGateway(dto))
    );
  }

  deleteGateway(id: string): Observable<void> {
    const rawId = String(id).replace(/^GW-/, '');
    return this.http.delete<void>(`${this.endpoint}/${rawId}`, this.options);
  }

  private mapDtoToGateway(dto: any): Gateway {
    const formatDate = (iso: string | null) => {
      if (!iso) return 'Not installed';
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
      id: dto.id ? (String(dto.id).startsWith('GW-') ? dto.id : `GW-${dto.id}`) : (dto.serial || 'GW-0000'),
      name: dto.name || 'Gateway',
      serial: dto.serial || '',
      imei: dto.imei || '',
      fences: Array.isArray(dto.fences) ? dto.fences : [],
      status: (dto.status || 'offline').toLowerCase() as GatewayStatus,
      signal: dto.signal || 0,
      power: dto.power || 0,
      devices: dto.devices || 0,
      lastSeen: formatDate(dto.lastSeen),
      firmware: dto.firmware || 'v2.4.1',
      enabled: dto.enabled !== false,
    };
  }
}
