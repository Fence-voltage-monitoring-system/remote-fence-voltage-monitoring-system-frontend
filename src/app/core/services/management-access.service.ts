import { Injectable, signal } from '@angular/core';

export type ManagementRole = 'SUPER_ADMIN' | 'REGIONAL_ADMIN' | 'FIELD_ADMIN' | 'MAINTENANCE';
export interface ManagementScope {
  role: ManagementRole;
  provinces: string[];
  districts: string[];
  fences?: string[];
  userId?: string;
  userName?: string;
}

@Injectable({ providedIn: 'root' })
export class ManagementAccessService {
  // Preview defaults to the Super Administrator shown in the current mock UI.
  readonly scope = signal<ManagementScope>({ role: 'SUPER_ADMIN', provinces: [], districts: [] });
  readonly districtMap: Record<string, string[]> = {
    Central:['Kandy','Matale','Nuwara Eliya'], Eastern:['Ampara','Batticaloa','Trincomalee'],
    'North Central':['Anuradhapura','Polonnaruwa'], Southern:['Galle','Hambantota','Matara'], Uva:['Badulla','Monaragala']
  };

  setScope(scope: ManagementScope): void { this.scope.set(scope); }
  get canManage(): boolean { return this.scope().role !== 'MAINTENANCE'; }
  get canConfigureSystem(): boolean { return this.scope().role === 'SUPER_ADMIN'; }
  get lockedProvince(): string { return this.scope().role === 'SUPER_ADMIN' ? '' : this.scope().provinces[0] ?? ''; }
  get lockedDistrict(): string { return this.scope().role === 'FIELD_ADMIN' ? this.scope().districts[0] ?? '' : ''; }
  canView(province: string, district: string, fence = ''): boolean {
    const scope=this.scope();
    if(scope.role==='SUPER_ADMIN') return true;
    if(!scope.provinces.includes(province)) return false;
    if(scope.role==='REGIONAL_ADMIN') return true;
    if(!scope.districts.includes(district)) return false;
    if(scope.role!=='MAINTENANCE') return true;
    return !scope.fences?.length || !!fence&&scope.fences.includes(fence);
  }
  provinces(all:string[]):string[]{return this.scope().role==='SUPER_ADMIN'?all:this.scope().provinces.filter(item=>all.includes(item));}
  districts(province:string,all:string[]):string[]{const allowed=this.scope().role==='SUPER_ADMIN'?(this.districtMap[province]??all):this.scope().role==='REGIONAL_ADMIN'?(this.districtMap[this.lockedProvince]??[]):this.scope().districts;return allowed.filter(item=>all.includes(item)||this.scope().role!=='SUPER_ADMIN');}
}
