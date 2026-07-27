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
  { path: '**', redirectTo: '' },
];
