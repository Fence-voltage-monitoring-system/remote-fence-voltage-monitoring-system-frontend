import { TestBed } from '@angular/core/testing';

import { ManagementAccessService } from './management-access.service';
import { SystemIdentityService, DEFAULT_GENERAL_CONFIGURATION } from './system-identity.service';

describe('ManagementAccessService operational scopes', () => {
  let service: ManagementAccessService;
  let identityService: SystemIdentityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagementAccessService);
    identityService = TestBed.inject(SystemIdentityService);
    identityService.apply({ ...DEFAULT_GENERAL_CONFIGURATION, readOnlyMode: false });
  });

  it('allows a super administrator to view every location', () => {
    service.setScope({ role: 'SUPER_ADMIN', provinces: [], districts: [] });
    expect(service.canView('Southern', 'Hambantota', 'EPF-HMB-E')).toBe(true);
  });

  it('limits a regional administrator to assigned provinces', () => {
    service.setScope({ role: 'REGIONAL_ADMIN', provinces: ['Uva'], districts: [] });
    expect(service.canView('Uva', 'Monaragala', 'EPF-MNR-A')).toBe(true);
    expect(service.canView('Southern', 'Hambantota', 'EPF-HMB-E')).toBe(false);
  });

  it('limits a field administrator to assigned districts', () => {
    service.setScope({ role: 'FIELD_ADMIN', provinces: ['Uva'], districts: ['Monaragala'] });
    expect(service.canView('Uva', 'Monaragala', 'EPF-MNR-A')).toBe(true);
    expect(service.canView('Uva', 'Badulla', 'EPF-BDL-B')).toBe(false);
  });

  it('limits maintenance staff to assigned fences', () => {
    service.setScope({ role: 'MAINTENANCE', provinces: ['Uva'], districts: ['Monaragala'], fences: ['EPF-MNR-A'] });
    expect(service.canView('Uva', 'Monaragala', 'EPF-MNR-A')).toBe(true);
    expect(service.canView('Uva', 'Monaragala', 'EPF-MNR-B')).toBe(false);
  });

  describe('read-only mode enforcement', () => {
    it('restricts management operations for regional admins when read-only mode is active', () => {
      service.setScope({ role: 'REGIONAL_ADMIN', provinces: ['Uva'], districts: [] });
      expect(service.canManage).toBe(true);
      expect(service.canManageUsers).toBe(true);

      identityService.apply({ ...DEFAULT_GENERAL_CONFIGURATION, readOnlyMode: true });

      expect(service.isReadOnly).toBe(true);
      expect(service.canManage).toBe(false);
      expect(service.canManageUsers).toBe(false);
    });

    it('always preserves full management permissions for super admin even in read-only mode', () => {
      service.setScope({ role: 'SUPER_ADMIN', provinces: [], districts: [] });
      identityService.apply({ ...DEFAULT_GENERAL_CONFIGURATION, readOnlyMode: true });

      expect(service.isReadOnly).toBe(true);
      expect(service.canManage).toBe(true);
      expect(service.canManageUsers).toBe(true);
      expect(service.canConfigureSystem).toBe(true);
    });
  });
});
