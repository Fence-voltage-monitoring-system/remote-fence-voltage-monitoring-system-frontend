import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface TelemetryIngestPayload {
  deviceSerial: string;
  voltage: number;
  battery?: number;
  signal?: number;
}

export interface TelemetryReadingRecord {
  id: string;
  deviceSerial: string;
  voltageKv: number;
  battery?: number;
  signal?: number;
  recordedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/telemetry';

  ingestTelemetry(payload: TelemetryIngestPayload): Observable<TelemetryReadingRecord> {
    return this.http.post<TelemetryReadingRecord>(`${this.baseUrl}/ingest`, payload, { withCredentials: true });
  }

  getDeviceHistory(deviceId: number | string, limit = 50): Observable<TelemetryReadingRecord[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TelemetryReadingRecord[]>(`${this.baseUrl}/device/${deviceId}/history`, { params, withCredentials: true });
  }
}
