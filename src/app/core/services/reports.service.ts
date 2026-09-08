import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AnalysisPeriod } from '../../pages/historical-analysis/historical-analysis.models';

export interface HistoricalAnalysisData {
  summaryMetrics: Array<{ label: string; value: string; unit?: string; tone: 'green' | 'amber' | 'red' | 'neutral' }>;
  voltageTrend: Array<{ time: string; value: string; voltage: number; x: number; y: number }>;
  powerHealth: { currentBatteryPercent: number; periodChangePercent: number; batteryCurve: number[] };
  voltageEvents: { totalVoltageDrops: number; significantEvents: number; periodChangePercent: number };
  alertFrequency: { totalAlerts: number; peakHourLabel: string; periodChangePercent: number; hourlyHistogram: number[] };
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/reports';

  getHistoricalAnalysis(period: AnalysisPeriod = '24h', deviceId?: string): Observable<HistoricalAnalysisData> {
    let params = new HttpParams().set('period', period);
    if (deviceId && deviceId !== 'all') {
      params = params.set('deviceId', deviceId);
    }
    return this.http.get<HistoricalAnalysisData>(`${this.baseUrl}/historical-analysis`, { params, withCredentials: true });
  }

  // Reports page methods
  preview(request: any): Observable<any> {
    return of({
      title: 'Fence Performance Report Preview',
      recordCount: 1420,
      scopeLabel: request.scope?.province || 'All Regions',
      dateRangeLabel: request.dateRange?.preset || 'Last 30 Days',
      warnings: []
    });
  }

  generate(request: any): Observable<any> {
    return of({
      id: Date.now(),
      name: 'Fence Health Report',
      generatedBy: 'System Administrator',
      dateRange: 'Current Period',
      generatedAt: new Date().toISOString(),
      status: 'READY',
      size: '1.8 MB',
      format: request.format || 'PDF'
    });
  }

  download(id: number): Observable<Blob> {
    const blob = new Blob(['Sample Report Content'], { type: 'application/pdf' });
    return of(blob);
  }

  getFilterOptions(scope: any): Observable<any> {
    return of({
      provinces: [{ value: 'Uva', label: 'Uva' }, { value: 'Western', label: 'Western' }],
      districts: [{ value: 'Monaragala', label: 'Monaragala' }, { value: 'Puttalam', label: 'Puttalam' }],
      fences: [{ value: 'EPF-MON-01', label: 'Monaragala Elephant Protection Fence' }],
      sections: [{ value: 'SEC-001', label: 'SEC-001' }]
    });
  }

  getHistory(): Observable<any> {
    return of({
      items: [
        {
          id: 1,
          name: 'Fence Health Report — September 2026',
          generatedBy: 'System Administrator',
          dateRange: '01 Sep – 08 Sep 2026',
          generatedAt: new Date().toISOString(),
          status: 'READY',
          size: '2.4 MB',
          format: 'PDF'
        }
      ]
    });
  }
}
