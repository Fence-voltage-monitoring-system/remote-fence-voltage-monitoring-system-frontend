import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ManagementAccessService } from '../services/management-access.service';

export const userManagementGuard: CanActivateFn = () =>
  inject(ManagementAccessService).canManageUsers || inject(Router).createUrlTree(['/dashboard']);
