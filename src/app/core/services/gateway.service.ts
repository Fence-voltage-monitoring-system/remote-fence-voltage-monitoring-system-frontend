import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateGatewayPayload, Gateway, UpdateGatewayPayload } from '../models/gateway.models';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/gateways';
  private readonly options = { withCredentials: true } as const;

  readonly previewGateways: Gateway[] = [
    { id: 'GTW-1004', name: 'Monaragala Main Gateway', serial: 'GW-2026-1004', imei: '356938035643809', fences: ['Monaragala Elephant Protection Fence', 'Gal Oya East Protection Fence'], status: 'online', signal: 94, power: 100, devices: 4, lastSeen: '8 sec ago', firmware: 'v2.4.1', enabled: true },
    { id: 'GTW-1003', name: 'Wilpattu North Gateway', serial: 'GW-2026-1003', imei: '356938035643817', fences: ['Wilpattu North Buffer Fence'], status: 'warning', signal: 46, power: 61, devices: 2, lastSeen: '3 min ago', firmware: 'v2.3.8', enabled: true },
    { id: 'GTW-1002', name: 'Mihintale Field Gateway', serial: 'GW-2026-1002', imei: '356938035643825', fences: ['Mihintale Wildlife Buffer Fence'], status: 'offline', signal: 0, power: 18, devices: 2, lastSeen: '4 hr ago', firmware: 'v2.3.8', enabled: true },
    { id: 'GTW-1001', name: 'Spare Gateway 01', serial: 'GW-2026-1001', imei: '356938035643833', fences: [], status: 'offline', signal: 0, power: 100, devices: 0, lastSeen: 'Not installed', firmware: 'v2.4.1', enabled: false },
  ];

  getGateways(): Observable<Gateway[]> {
    return this.http.get<Gateway[]>(this.endpoint, this.options);
  }

  createGateway(payload: CreateGatewayPayload): Observable<Gateway> {
    return this.http.post<Gateway>(this.endpoint, payload, this.options);
  }

  updateGateway(id: string, payload: UpdateGatewayPayload): Observable<Gateway> {
    return this.http.patch<Gateway>(`${this.endpoint}/${id}`, payload, this.options);
  }

  toggleEnabled(id: string, enabled: boolean): Observable<Gateway> {
    return this.http.patch<Gateway>(`${this.endpoint}/${id}/status`, { enabled }, this.options);
  }

  deleteGateway(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }
}
