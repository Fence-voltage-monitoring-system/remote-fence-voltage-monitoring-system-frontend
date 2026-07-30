import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ManagementAccessService } from '../services/management-access.service';

/**
 * Protects system-wide configuration from every role except SUPER_ADMIN.
 * The backend must apply the same authorization rule to /api/configuration/**.
 */
export const superAdminGuard: CanActivateFn = () => {
  const access = inject(ManagementAccessService);
  const router = inject(Router);

  return access.canConfigureSystem || router.createUrlTree(['/profile'], {
    queryParams: { accessDenied: 'configuration' },
  });
};
