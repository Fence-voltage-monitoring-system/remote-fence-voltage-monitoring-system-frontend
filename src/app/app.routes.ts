import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';
import { FenceManagement } from './pages/fence-management/fence-management';
import { SectionManagement } from './pages/section-management/section-management';
import { HistoricalAnalysis } from './pages/historical-analysis/historical-analysis';
import { Notifications } from './pages/notifications/notifications';
import { Alerts } from './pages/alerts/alerts';
import { Configuration } from './pages/configuration/configuration';
import { Reports } from './pages/reports/reports';
import { AuthenticatedLayout } from './shared/components/authenticated-layout/authenticated-layout';

import { managementGuard } from './core/guards/management.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Login,
    title: 'Login | Remote Fence Monitoring',
  },
  {
    path: 'virtual-fence',
    loadComponent: () =>
      import('./pages/virtual-fence/virtual-fence').then(
        page => page.VirtualFencePage
      ),
    title: 'Live View | Remote Fence Monitoring',
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./pages/map/map-page').then(
        page => page.MapPage
      ),
    title: 'Fence Map | Remote Fence Monitoring',
  },
  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/device-management/device-management').then(
        page => page.DeviceManagementPage
      ),
    title: 'Device Management | Remote Fence Monitoring',
  },
  {
    path: 'device-management',
    redirectTo: 'devices',
    pathMatch: 'full',
  },
  {
    path: 'gateways',
    loadComponent: () =>
      import('./pages/gateway-management/gateway-management').then(
        page => page.GatewayManagementPage
      ),
    title: 'Gateway Management | Remote Fence Monitoring',
  },
  {
    path: 'gateway-management',
    redirectTo: 'gateways',
    pathMatch: 'full',
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./pages/audit-logs/audit-logs').then(
        page => page.AuditLogsPage
      ),
    title: 'Audit Logs | Remote Fence Monitoring',
  },

  // Existing profile page
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile').then(
        page => page.ProfilePage
      ),
    title: 'My Profile | Remote Fence Monitoring',
  },

  // Teammate's profile implementation
  {
    path: 'security',
    loadComponent: () =>
      import('./pages/security/security').then(
        page => page.SecurityPage
      ),
    title: 'Security Settings | Remote Fence Monitoring',
  },
  {
    path: 'appearance',
    loadComponent: () =>
      import('./pages/appearance/appearance').then(
        page => page.AppearancePage
      ),
    title: 'Theme & Appearance | Remote Fence Monitoring',
  },
  {
    path: 'help-support',
    loadComponent: () =>
      import('./pages/help-support/help-support').then(
        page => page.HelpSupportPage
      ),
    title: 'Help & Support | Remote Fence Monitoring',
  },
  {
    path: '',
    component: AuthenticatedLayout,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(page => page.Dashboard), title: 'Live Dashboard | Remote Fence Monitoring' },
      { path: 'historical-analysis', component: HistoricalAnalysis, title: 'Historical Analysis | Remote Fence Monitoring' },
      { path: 'alerts', component: Alerts, title: 'Alerts | Remote Fence Monitoring' },
      { path: 'notifications', component: Notifications, title: 'Notifications | Remote Fence Monitoring' },
      { path: 'fences', component: FenceManagement, canActivate: [managementGuard], title: 'Fence Management | Remote Fence Monitoring' },
      { path: 'sections', component: SectionManagement, canActivate: [managementGuard], title: 'Section Management | Remote Fence Monitoring' },
      { path: 'users', component: UserManagement, title: 'User Management | Remote Fence Monitoring' },
      { path: 'reports', component: Reports, canActivate: [managementGuard], title: 'Reports | Remote Fence Monitoring' },
      { path: 'configuration', component: Configuration, canActivate: [superAdminGuard], title: 'System Configuration | Remote Fence Monitoring' },
      { path: 'user-profile', component: UserProfilePage, title: 'User Profile | Remote Fence Monitoring' },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
