import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminDashboardPage } from './features/admin/admin-dashboard.page';
import { LoginPage } from './features/auth/login.page';
import { RegisterPage } from './features/auth/register.page';
import { UserDashboardPage } from './features/user/user-dashboard.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    title: 'Login',
  },
  {
    path: 'register',
    component: RegisterPage,
    title: 'Register',
  },
  {
    path: 'dashboard',
    component: UserDashboardPage,
    canActivate: [authGuard],
    title: 'User Dashboard',
  },
  {
    path: 'admin',
    component: AdminDashboardPage,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN'],
    },
    title: 'Admin Dashboard',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
