import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { DashboardOverviewResponse, DeviceAnalyticsResponse } from '../models/dashboard-api';
import { MOCK_DASHBOARD_OVERVIEW, createMockDeviceAnalytics } from '../data/dashboard-mock-data';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/dashboard';
  readonly usingMockData = signal(false);

  getOverview(): Observable<DashboardOverviewResponse> {
    return this.http.get<DashboardOverviewResponse>(this.baseUrl).pipe(
      tap(() => this.usingMockData.set(false)),
      catchError(() => { this.usingMockData.set(true); return of(MOCK_DASHBOARD_OVERVIEW); }),
    );
  }
  getDeviceAnalytics(deviceId: string): Observable<DeviceAnalyticsResponse> {
    return this.http.get<DeviceAnalyticsResponse>(`${this.baseUrl}/devices/${encodeURIComponent(deviceId)}`).pipe(
      catchError(() => { this.usingMockData.set(true); return of(createMockDeviceAnalytics(deviceId)); }),
    );
  }
}
