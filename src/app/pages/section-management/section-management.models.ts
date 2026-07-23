export type SectionStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export interface FenceOption { code: string; name: string; totalSections: number; totalLengthKm: number; operational: number; averageVoltageKv: number; }
export interface FenceSection { id: number; fenceCode: string; code: string; startGps: string; endGps: string; lengthKm: number; device: string | null; voltageKv: number | null; battery: number | null; maintenance: string; status: SectionStatus; updated: string; }
