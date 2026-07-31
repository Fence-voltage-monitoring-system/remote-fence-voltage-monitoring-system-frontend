import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';
import { FenceManagement } from './pages/fence-management/fence-management';
import { SectionManagement } from './pages/section-management/section-management';
import { managementGuard } from './core/guards/management.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { HistoricalAnalysis } from './pages/historical-analysis/historical-analysis';
import { Notifications } from './pages/notifications/notifications';
import { Alerts } from './pages/alerts/alerts';
import { Configuration } from './pages/configuration/configuration';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((page) => page.Dashboard),
    title: 'Live Dashboard | Remote Fence Monitoring'
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
    path: 'account-profile',
    loadComponent: () =>
      import('./pages/profile/profile').then((page) => page.ProfilePage),
    title: 'My Profile | Remote Fence Monitoring'
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
    canActivate: [superAdminGuard]
  },
  {
    path: 'reports',
    component: Reports,
    canActivate: [managementGuard]
  },
  {
    path: 'virtual-fence',
    loadComponent: () =>
      import('./pages/virtual-fence/virtual-fence').then((page) => page.VirtualFencePage),
    title: 'Live View | Remote Fence Monitoring',
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./pages/map/map-page').then((page) => page.MapPage),
    title: 'Fence Map | Remote Fence Monitoring',
  },
  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/device-management/device-management').then((page) => page.DeviceManagementPage),
    title: 'Device Management | Remote Fence Monitoring',
  },
  { path: 'device-management', redirectTo: 'devices', pathMatch: 'full' },
  {
    path: 'gateways',
    loadComponent: () =>
      import('./pages/gateway-management/gateway-management').then((page) => page.GatewayManagementPage),
    title: 'Gateway Management | Remote Fence Monitoring',
  },
  { path: 'gateway-management', redirectTo: 'gateways', pathMatch: 'full' },
  { path: 'audit-logs', loadComponent: () => import('./pages/audit-logs/audit-logs').then(page => page.AuditLogsPage), title: 'Audit Logs | Remote Fence Monitoring' },
  { path: 'security', loadComponent: () => import('./pages/security/security').then(page => page.SecurityPage), title: 'Security Settings | Remote Fence Monitoring' },
  { path: 'appearance', loadComponent: () => import('./pages/appearance/appearance').then(page => page.AppearancePage), title: 'Theme & Appearance | Remote Fence Monitoring' },
  { path: 'help-support', loadComponent: () => import('./pages/help-support/help-support').then(page => page.HelpSupportPage), title: 'Help & Support | Remote Fence Monitoring' },
  { path: '**', redirectTo: '' },
];
