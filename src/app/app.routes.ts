import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { UserManagement } from './pages/user-management/user-management';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'users',
    component: UserManagement
  }
];
