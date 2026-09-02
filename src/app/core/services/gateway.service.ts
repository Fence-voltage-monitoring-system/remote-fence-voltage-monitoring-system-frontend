import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateGatewayPayload, Gateway, UpdateGatewayPayload } from '../models/gateway.models';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/gateways';
  private readonly options = { withCredentials: true } as const;

  readonly previewGateways: Gateway[] = [];

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
