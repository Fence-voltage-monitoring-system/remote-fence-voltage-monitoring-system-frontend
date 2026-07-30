import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';
import { FenceManagement } from './pages/fence-management/fence-management';
import { SectionManagement } from './pages/section-management/section-management';
import { managementGuard } from './core/guards/management.guard';
import { HistoricalAnalysis } from './pages/historical-analysis/historical-analysis';
import { Notifications } from './pages/notifications/notifications';
import { Alerts } from './pages/alerts/alerts';
import { Configuration } from './pages/configuration/configuration';

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
  },
  {
    path: 'notifications',
    component: Notifications
  },
  {
    path: 'alerts',
    component: Alerts
  },
  {
    path: 'configuration',
    component: Configuration,
    canActivate: [managementGuard]
  }
];
