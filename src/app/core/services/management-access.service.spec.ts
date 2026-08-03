import { TestBed } from '@angular/core/testing';

import { ManagementAccessService } from './management-access.service';

describe('ManagementAccessService operational scopes', () => {
  let service: ManagementAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagementAccessService);
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
});
