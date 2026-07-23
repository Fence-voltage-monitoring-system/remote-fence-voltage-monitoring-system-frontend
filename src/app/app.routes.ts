import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';
import { FenceManagement } from './pages/fence-management/fence-management';
import { SectionManagement } from './pages/section-management/section-management';

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
    component: FenceManagement
  },
  {
    path: 'sections',
    component: SectionManagement
  }
];
