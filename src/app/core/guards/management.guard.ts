import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ManagementAccessService } from '../services/management-access.service';
export const managementGuard:CanActivateFn=()=>inject(ManagementAccessService).canManage||inject(Router).createUrlTree(['/']);
