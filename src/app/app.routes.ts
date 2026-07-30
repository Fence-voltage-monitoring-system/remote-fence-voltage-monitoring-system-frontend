import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((page) => page.Dashboard),
    title: 'Live Dashboard | Remote Fence Monitoring',
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
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(page => page.ProfilePage), title: 'My Profile | Remote Fence Monitoring' },
  { path: 'security', loadComponent: () => import('./pages/security/security').then(page => page.SecurityPage), title: 'Security Settings | Remote Fence Monitoring' },
  { path: 'appearance', loadComponent: () => import('./pages/appearance/appearance').then(page => page.AppearancePage), title: 'Theme & Appearance | Remote Fence Monitoring' },
  { path: 'help-support', loadComponent: () => import('./pages/help-support/help-support').then(page => page.HelpSupportPage), title: 'Help & Support | Remote Fence Monitoring' },
  { path: '**', redirectTo: '' },
];
