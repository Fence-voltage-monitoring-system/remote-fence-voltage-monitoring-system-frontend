export type FenceHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export interface MaintenanceUserOption { id: number; name: string; email: string; province: string; district: string; active: boolean; }
export interface FenceRecord { id: number; code: string; name: string; province: string; district: string; lengthKm: number; sections: number; gateway: string; averageVoltageKv: number | null; health: FenceHealth; lastUpdated: string; primaryMaintenanceUserId?: number | null; backupMaintenanceUserIds?: number[]; }
export interface FenceFilters { search: string; province: string; district: string; gateway: string; health: string; }
export interface FenceSummaryData { total: number; operational: number; warning: number; critical: number; monitoredLengthKm: number; }
