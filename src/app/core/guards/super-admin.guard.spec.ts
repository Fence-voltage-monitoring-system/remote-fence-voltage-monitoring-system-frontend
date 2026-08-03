import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { ManagementAccessService, ManagementRole } from '../services/management-access.service';
import { superAdminGuard } from './super-admin.guard';

describe('superAdminGuard', () => {
  let access: ManagementAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    access = TestBed.inject(ManagementAccessService);
  });

  function evaluate(role: ManagementRole): boolean | UrlTree {
    access.setScope({ role, provinces: [], districts: [] });
    return TestBed.runInInjectionContext(() => superAdminGuard({} as never, {} as never)) as boolean | UrlTree;
  }

  it('allows super administrators', () => {
    expect(evaluate('SUPER_ADMIN')).toBe(true);
  });

  for (const role of ['REGIONAL_ADMIN', 'FIELD_ADMIN', 'MAINTENANCE'] as const) {
    it(`redirects ${role}`, () => {
      const result = evaluate(role) as UrlTree;
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/profile?accessDenied=configuration');
    });
  }
});
