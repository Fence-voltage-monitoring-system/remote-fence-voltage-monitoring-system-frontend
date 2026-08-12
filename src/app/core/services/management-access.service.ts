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
  readonly scope = signal<ManagementScope>({
    role: 'SUPER_ADMIN',
    provinces: [],
    districts: [],
    fences: [],
  });

  readonly districtMap: Record<string, string[]> = {
    Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
    Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    Southern: ['Galle', 'Hambantota', 'Matara'],
    Uva: ['Badulla', 'Monaragala'],
  };

  setScope(scope: ManagementScope): void {
    this.scope.set(scope);
  }

  // System-wide visibility: All users can view status, maps, and monitoring dashboards
  get canViewAll(): boolean {
    return true;
  }

  // General management check (Admins vs Maintenance)
  get canManage(): boolean {
    const role = this.scope().role;
    return role === 'SUPER_ADMIN' || role === 'REGIONAL_ADMIN' || role === 'FIELD_ADMIN';
  }

  get canConfigureSystem(): boolean {
    return this.scope().role === 'SUPER_ADMIN';
  }

  get lockedProvince(): string {
    const current = this.scope();
    return current.role === 'SUPER_ADMIN' ? '' : current.provinces[0] ?? '';
  }

  get lockedDistrict(): string {
    const current = this.scope();
    return current.role === 'FIELD_ADMIN' ? current.districts[0] ?? '' : '';
  }

  // Roles an admin can assign to new users under their level
  get assignableRoles(): ManagementRole[] {
    const currentRole = this.scope().role;
    if (currentRole === 'SUPER_ADMIN') {
      return ['SUPER_ADMIN', 'REGIONAL_ADMIN', 'FIELD_ADMIN', 'MAINTENANCE'];
    }
    if (currentRole === 'REGIONAL_ADMIN') {
      return ['FIELD_ADMIN', 'MAINTENANCE'];
    }
    if (currentRole === 'FIELD_ADMIN') {
      return ['MAINTENANCE'];
    }
    return [];
  }

  // Check if an admin can manage a user with a specific role
  canManageRole(targetRole: ManagementRole): boolean {
    const currentRole = this.scope().role;
    if (currentRole === 'SUPER_ADMIN') return true;
    if (currentRole === 'REGIONAL_ADMIN') return targetRole === 'FIELD_ADMIN' || targetRole === 'MAINTENANCE';
    if (currentRole === 'FIELD_ADMIN') return targetRole === 'MAINTENANCE';
    return false;
  }

  // Scope check for management actions (create/edit/delete fences, sections, devices, gateways, users)
  canManageScope(province?: string, district?: string, fence?: string): boolean {
    const current = this.scope();
    if (current.role === 'SUPER_ADMIN') return true;

    if (current.role === 'REGIONAL_ADMIN') {
      if (!province) return true;
      return current.provinces.includes(province);
    }

    if (current.role === 'FIELD_ADMIN') {
      if (!district) return true;
      return current.districts.includes(district);
    }

    if (current.role === 'MAINTENANCE') {
      if (!fence) return false;
      return !!current.fences?.includes(fence);
    }

    return false;
  }

  // Backwards compatible method for existing page filters
  canView(province?: string, district?: string, fence = ''): boolean {
    const current = this.scope();
    if (current.role === 'SUPER_ADMIN') return true;
    if (province && !current.provinces.includes(province)) return false;
    if (current.role === 'REGIONAL_ADMIN') return true;
    if (district && !current.districts.includes(district)) return false;
    if (current.role !== 'MAINTENANCE') return true;
    return !current.fences?.length || (!!fence && current.fences.includes(fence));
  }

  // Filter alerts & notifications to match user's level / assigned scope
  filterScopedAlerts<T extends { province?: string; district?: string; fence?: string }>(items: T[]): T[] {
    const current = this.scope();
    if (current.role === 'SUPER_ADMIN') return items;

    return items.filter((item) => {
      if (current.role === 'REGIONAL_ADMIN') {
        return !item.province || current.provinces.includes(item.province);
      }
      if (current.role === 'FIELD_ADMIN') {
        return !item.district || current.districts.includes(item.district);
      }
      if (current.role === 'MAINTENANCE') {
        return !item.fence || (current.fences ?? []).includes(item.fence);
      }
      return true;
    });
  }

  provinces(all: string[]): string[] {
    const current = this.scope();
    return current.role === 'SUPER_ADMIN' ? all : current.provinces.filter(item => all.includes(item));
  }

  districts(province: string, all: string[]): string[] {
    const current = this.scope();
    if (current.role === 'SUPER_ADMIN') return this.districtMap[province] ?? all;
    if (current.role === 'REGIONAL_ADMIN') return (this.districtMap[province] ?? []).filter(item => all.includes(item));
    return current.districts.filter(item => all.includes(item));
  }
}
