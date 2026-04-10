import { Routes } from '@angular/router';

import { DashboardLayoutComponent } from './app/layout/dashboard-layout.component';
import { roleGuard } from './app/core/guards/role.guard';
import { authGuard } from './app/features/auth/auth.guard';
import { LoginComponent } from './app/features/auth/login/login.component';
import { RecoverPasswordPageComponent } from './app/features/auth/pages/recover-password/recover-password-page.component';
import { RolesPermisosPageComponent } from './app/features/admin/pages/roles-permisos/roles-permisos-page.component';
import { InicioPageComponent } from './app/features/dashboard/pages/inicio/inicio-page.component';
import { DisponibilidadPageComponent } from './app/features/taller/disponibilidad-page.component';
import { RegistrarTallerPageComponent } from './app/features/talleres/pages/registrar-taller/registrar-taller-page.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'recover-password', component: RecoverPasswordPageComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: InicioPageComponent },
      {
        path: 'admin/roles-permisos',
        component: RolesPermisosPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'talleres/registrar',
        component: RegistrarTallerPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'taller/disponibilidad',
        component: DisponibilidadPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
