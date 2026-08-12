import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { managementGuard } from './core/guards/management.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { ApplicationLayout } from './shared/layouts/application-layout/application-layout';

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
    path: '',
    component: ApplicationLayout,
    children: [
      { path: 'users', loadComponent: () => import('./pages/user-management/user-management').then(m => m.UserManagement), title: 'User Management | Remote Fence Monitoring' },
      { path: 'fences', loadComponent: () => import('./pages/fence-management/fence-management').then(m => m.FenceManagement), canActivate: [managementGuard], title: 'Fence Management | Remote Fence Monitoring' },
      { path: 'sections', loadComponent: () => import('./pages/section-management/section-management').then(m => m.SectionManagement), canActivate: [managementGuard], title: 'Section Management | Remote Fence Monitoring' },
      { path: 'historical-analysis', loadComponent: () => import('./pages/historical-analysis/historical-analysis').then(m => m.HistoricalAnalysis), title: 'Historical Analysis | Remote Fence Monitoring' },
      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications').then(m => m.Notifications), title: 'Notifications | Remote Fence Monitoring' },
      { path: 'alerts', loadComponent: () => import('./pages/alerts/alerts').then(m => m.Alerts), title: 'Alerts | Remote Fence Monitoring' },
      { path: 'configuration', loadComponent: () => import('./pages/configuration/configuration').then(m => m.Configuration), canActivate: [superAdminGuard], title: 'System Configuration | Remote Fence Monitoring' },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.Reports), canActivate: [managementGuard], title: 'Reports | Remote Fence Monitoring' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-profile/user-profile').then((page) => page.UserProfilePage),
        title: 'My Profile | Remote Fence Monitoring'
      },
    ]
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
