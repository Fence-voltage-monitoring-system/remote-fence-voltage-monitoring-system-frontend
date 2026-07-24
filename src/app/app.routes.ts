import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';
import { FenceManagement } from './pages/fence-management/fence-management';
import { SectionManagement } from './pages/section-management/section-management';
import { managementGuard } from './core/guards/management.guard';
import { HistoricalAnalysis } from './pages/historical-analysis/historical-analysis';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'users',
    component: UserManagement
  },
  {
    path: 'profile',
    component: UserProfilePage
  },
  {
    path: 'fences',
    component: FenceManagement,
    canActivate: [managementGuard]
  },
  {
    path: 'sections',
    component: SectionManagement,
    canActivate: [managementGuard]
  },
  {
    path: 'historical-analysis',
    component: HistoricalAnalysis
  }
];
