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
    title: 'Virtual Fence | Remote Fence Monitoring',
  },
  { path: '**', redirectTo: '' },
];
