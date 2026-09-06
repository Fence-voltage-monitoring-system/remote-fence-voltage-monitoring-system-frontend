export type FenceHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface MaintenanceUserOption {
  id: number | string;
  name: string;
  email: string;
  province?: string;
  district?: string;
  active?: boolean;
  role?: string;
}

export interface FenceRecord {
  id: number;
  code: string;
  name: string;
  provinceId?: number;
  provinceName?: string;
  province: string;
  districtId?: number;
  districtName?: string;
  district: string;
  lengthKm: number;
  sections: number;
  gateway?: string;
  averageVoltageKv: number | null;
  health: FenceHealth;
  lastUpdated?: string;
  primaryMaintenanceUserId?: string | number | null;
  primaryMaintenanceUserName?: string | null;
  backupMaintenanceUserIds?: (string | number)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FenceFilters {
  search: string;
  province: string;
  district: string;
  gateway: string;
  health: string;
}

export interface FenceSummaryData {
  total: number;
  operational: number;
  warning: number;
  critical: number;
  monitoredLengthKm: number;
}

export interface ProvinceOption {
  id: number;
  name: string;
}

export interface DistrictOption {
  id: number;
  name: string;
  provinceId: number;
  provinceName: string;
}

export interface FenceCreatePayload {
  code: string;
  name: string;
  provinceId: number;
  districtId: number;
  lengthKm: number;
  health?: FenceHealth;
}

export interface FenceUpdatePayload {
  code?: string;
  name?: string;
  provinceId?: number;
  districtId?: number;
  lengthKm?: number;
  health?: FenceHealth;
}

export interface MaintenanceTeamPayload {
  primaryMaintenanceUserId: string | null;
  backupMaintenanceUserIds: string[];
}

export interface LocationDistrict {
  id: number;
  name: string;
}

export interface LocationProvince {
  id: number;
  name: string;
  districts: LocationDistrict[];
}

export const SRI_LANKA_PROVINCES: LocationProvince[] = [
  { id: 1, name: 'Northern', districts: [{ id: 1, name: 'Jaffna' }, { id: 2, name: 'Kilinochchi' }, { id: 3, name: 'Mannar' }, { id: 4, name: 'Vavuniya' }, { id: 5, name: 'Mullaitivu' }] },
  { id: 2, name: 'Central', districts: [{ id: 6, name: 'Kandy' }, { id: 7, name: 'Matale' }, { id: 8, name: 'Nuwara Eliya' }] },
  { id: 3, name: 'Western', districts: [{ id: 9, name: 'Colombo' }, { id: 10, name: 'Gampaha' }, { id: 11, name: 'Kalutara' }] },
  { id: 4, name: 'North Central', districts: [{ id: 12, name: 'Anuradhapura' }, { id: 13, name: 'Polonnaruwa' }] },
  { id: 5, name: 'North Western', districts: [{ id: 14, name: 'Kurunegala' }, { id: 15, name: 'Puttalam' }] },
  { id: 6, name: 'Sabaragamuwa', districts: [{ id: 16, name: 'Ratnapura' }, { id: 17, name: 'Kegalle' }] },
  { id: 7, name: 'Eastern', districts: [{ id: 18, name: 'Trincomalee' }, { id: 19, name: 'Batticaloa' }, { id: 20, name: 'Ampara' }] },
  { id: 8, name: 'Southern', districts: [{ id: 21, name: 'Galle' }, { id: 22, name: 'Matara' }, { id: 23, name: 'Hambantota' }] },
  { id: 9, name: 'Uva', districts: [{ id: 24, name: 'Badulla' }, { id: 25, name: 'Monaragala' }] }
];

export function findProvinceId(provinceName: string): number {
  const p = SRI_LANKA_PROVINCES.find(item => item.name.toLowerCase() === (provinceName || '').toLowerCase());
  return p ? p.id : 3; // Default Western
}

export function findDistrictId(districtName: string, provinceId?: number): number {
  if (provinceId) {
    const prov = SRI_LANKA_PROVINCES.find(p => p.id === provinceId);
    const d = prov?.districts.find(item => item.name.toLowerCase() === (districtName || '').toLowerCase());
    if (d) return d.id;
  }
  for (const prov of SRI_LANKA_PROVINCES) {
    const d = prov.districts.find(item => item.name.toLowerCase() === (districtName || '').toLowerCase());
    if (d) return d.id;
  }
  return 9; // Default Colombo
}

