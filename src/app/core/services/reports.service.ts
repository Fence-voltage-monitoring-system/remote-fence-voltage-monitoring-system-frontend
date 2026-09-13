import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GeneratedReport, ReportFilterOptions, ReportGenerationRequest, ReportHistoryPage, ReportPreview } from '../../pages/reports/reports.models';
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

  preview(request: ReportGenerationRequest): Observable<ReportPreview> {
    return this.http.post<ReportPreview>('/api/reports/preview', request);
  }
  generate(request: ReportGenerationRequest): Observable<GeneratedReport> {
    return this.http.post<GeneratedReport>('/api/reports', request);
  }
  download(id: number): Observable<Blob> {
    return this.http.get(`/api/reports/${id}/download`, { responseType: 'blob' });
  }
  getFilterOptions(scope: {province: string; district: string; fence: string}): Observable<ReportFilterOptions> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(scope)) if (value) params = params.set(key, value);
    return this.http.get<ReportFilterOptions>('/api/reports/filters', { params });
  }
  getHistory(page = 0): Observable<ReportHistoryPage> {
    return this.http.get<ReportHistoryPage>('/api/reports', { params: { page } });
  }
}
