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
    const rawId = String(id).replace(/^(GW-|GTW-)/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}`, payload, this.options).pipe(
      map((dto) => this.mapDtoToGateway(dto))
    );
  }

  toggleEnabled(id: string, enabled: boolean): Observable<Gateway> {
    const rawId = String(id).replace(/^(GW-|GTW-)/, '');
    return this.http.patch<any>(`${this.endpoint}/${rawId}/status`, { enabled }, this.options).pipe(
      map((dto) => this.mapDtoToGateway(dto))
    );
  }

  deleteGateway(id: string): Observable<void> {
    const rawId = String(id).replace(/^(GW-|GTW-)/, '');
    return this.http.delete<void>(`${this.endpoint}/${rawId}`, this.options);
  }

  private mapDtoToGateway(dto: any): Gateway {
    const parseLastSeen = (val: any) => {
      if (!val) return 'Not installed';
      if (typeof val === 'string' && (val.includes('ago') || val.includes('now') || val.includes('Not'))) {
        return val;
      }
      try {
        const diffMs = Date.now() - new Date(val).getTime();
        if (isNaN(diffMs)) return String(val);
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay} days ago`;
      } catch {
        return String(val);
      }
    };

    let idStr = String(dto.id || dto.serial || 'GTW-0');
    if (!idStr.startsWith('GTW-') && !idStr.startsWith('GW-')) {
      idStr = `GTW-${idStr}`;
    }

    return {
      id: idStr,
      name: dto.name || 'Gateway',
      serial: dto.serial || '',
      imei: dto.imei || '',
      fences: Array.isArray(dto.fences) ? dto.fences : [],
      status: (dto.status || 'offline').toLowerCase() as GatewayStatus,
      signal: dto.signal || 0,
      power: dto.power || 0,
      devices: dto.devices || 0,
      lastSeen: parseLastSeen(dto.lastSeen),
      firmware: dto.firmware || 'v2.4.1',
      enabled: dto.enabled !== false,
      latitude: dto.latitude != null ? Number(dto.latitude) : undefined,
      longitude: dto.longitude != null ? Number(dto.longitude) : undefined,
    };
  }
}
