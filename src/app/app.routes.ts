import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';
import { UserProfilePage } from './pages/user-profile/user-profile';

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
  }
];
