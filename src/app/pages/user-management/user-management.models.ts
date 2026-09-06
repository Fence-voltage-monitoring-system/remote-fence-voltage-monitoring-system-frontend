export type UserRole = 'SUPER_ADMIN' | 'REGIONAL_ADMIN' | 'FIELD_ADMIN' | 'MAINTENANCE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrator',
  REGIONAL_ADMIN: 'Regional Administrator',
  FIELD_ADMIN: 'Field Administrator',
  MAINTENANCE: 'Maintenance',
};

export interface SystemUser {
  id: number | string;
  initials: string;
  name: string;
  email: string;
  contactNumber?: string;
  role: UserRole;
  province: string;
  provinceIds?: number[];
  district: string;
  districtIds?: number[];
  status: UserStatus;
  lastLogin: string;
  created: string;
  recentActivity: string[];
}

export interface UserFilters { search: string; role: string; province: string; status: string; }
export interface RoleOption { value: UserRole; label: string; }
export interface LocationOption { id: number; name: string; }
export interface FenceOption extends LocationOption { code: string; }
export interface CreateUserOptions { roles: RoleOption[]; provinces: LocationOption[]; }

export interface CreateUserRequest {
  fullName: string;
  username: string;
  email: string;
  contactNumber: string;
  role: UserRole;
  provinceIds: number[];
  districtIds: number[];
  fenceIds: number[];
  temporaryPassword: string | null;
  status: UserStatus;
}

export interface ApiValidationError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
