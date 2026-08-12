import { Injectable, signal } from '@angular/core';

export type ManagementRole = 'SUPER_ADMIN' | 'REGIONAL_ADMIN' | 'FIELD_ADMIN' | 'MAINTENANCE';
export interface ManagementScope { role: ManagementRole; provinces: string[]; districts: string[]; }

@Injectable({ providedIn: 'root' })
export class ManagementAccessService {
  // Preview defaults to the Super Administrator shown in the current mock UI.
  readonly scope = signal<ManagementScope>({ role: 'SUPER_ADMIN', provinces: [], districts: [] });
  readonly districtMap: Record<string, string[]> = {
    Central:['Kandy','Matale','Nuwara Eliya'], Eastern:['Ampara','Batticaloa','Trincomalee'],
    'North Central':['Anuradhapura','Polonnaruwa'], Southern:['Galle','Hambantota','Matara'], Uva:['Badulla','Monaragala']
  };

  setScope(scope: ManagementScope): void { this.scope.set(scope); }
  get canManage(): boolean { return this.scope().role === 'SUPER_ADMIN' || this.scope().role === 'REGIONAL_ADMIN' || this.scope().role === 'FIELD_ADMIN'; }
  get canConfigureSystem(): boolean { return this.scope().role === 'SUPER_ADMIN'; }
  get lockedProvince(): string { return ''; }
  get lockedDistrict(): string { return ''; }
  canView(_province?: string, _district?: string): boolean { return true; }
  provinces(all: string[]): string[] { return all; }
  districts(province: string, all: string[]): string[] { return this.districtMap[province] ?? all; }
}
