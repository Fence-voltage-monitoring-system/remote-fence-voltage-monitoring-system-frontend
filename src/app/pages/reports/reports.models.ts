export type ReportTemplateId = 'FENCE_HEALTH' | 'VOLTAGE_PERFORMANCE' | 'ALERT_SUMMARY' | 'DEVICE_STATUS' | 'GATEWAY_CONNECTIVITY' | 'MAINTENANCE';
export type ReportRange = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
export type ReportFormat = 'PDF' | 'CSV';
export type ReportStatus = 'QUEUED' | 'GENERATING' | 'READY' | 'FAILED';

export interface ReportTemplate {
  id: ReportTemplateId;
  icon: string;
  name: string;
  description: string;
}

export interface ReportConfigurationValue {
  province: string;
  district: string;
  fence: string;
  section: string;
  range: ReportRange;
  customFrom: string;
  customTo: string;
  includeCharts: boolean;
  includeAlertHistory: boolean;
  includeMaintenanceRecords: boolean;
  format: ReportFormat;
}

export interface GeneratedReport {
  id: number;
  name: string;
  generatedBy: string;
  dateRange: string;
  generatedAt: string;
  status: ReportStatus;
  size: string | null;
  format: ReportFormat;
}

export interface ReportOption { value: string; label: string; }
export interface ReportFilterOptions {
  provinces: ReportOption[];
  districts: ReportOption[];
  fences: ReportOption[];
  sections: ReportOption[];
}
export interface ReportGenerationRequest {
  template: ReportTemplateId;
  scope: { province: string | null; district: string | null; fence: string | null; section: string | null; };
  dateRange: { preset: ReportRange | null; from: string | null; to: string | null; };
  options: { includeCharts: boolean; includeAlertHistory: boolean; includeMaintenanceRecords: boolean; };
  format: ReportFormat;
}
export interface ReportHistoryPage { items: GeneratedReport[]; page: number; pageSize: number; total: number; }
export interface ReportPreview { title: string; recordCount: number; scopeLabel: string; dateRangeLabel: string; warnings: string[]; }
