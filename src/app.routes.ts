import { Routes } from '@angular/router';

import { DashboardLayoutComponent } from './app/layout/dashboard-layout.component';
import { roleGuard } from './app/core/guards/role.guard';
import { authGuard } from './app/features/auth/guards/auth.guard';
import { LoginComponent } from './app/features/auth/pages/login/login-page.component';
import { RecoverPasswordPageComponent } from './app/features/auth/pages/recover-password/recover-password-page.component';
import { RolesPermisosPageComponent } from './app/features/admin/pages/roles-permisos/roles-permisos-page.component';
import { InicioPageComponent } from './app/features/admin/pages/inicio/inicio-page.component';
import { DisponibilidadPageComponent } from './app/features/taller/pages/disponibilidad/disponibilidad-page.component';
import { RegistrarTallerPageComponent } from './app/features/taller/pages/registrar-taller/registrar-taller-page.component';
import { TecnicosPageComponent } from './app/features/taller/pages/tecnicos/tecnicos-page.component';
import { DesempenoPageComponent } from './app/features/taller/pages/desempeno/desempeno-page.component';

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
        path: 'taller/registrar',
        component: RegistrarTallerPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'taller/disponibilidad',
        component: DisponibilidadPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      { path: 'taller/tecnicos', component: TecnicosPageComponent, canActivate: [roleGuard(['taller', 'admin'])] },
      { path: 'taller/desempeno', component: DesempenoPageComponent, canActivate: [roleGuard(['taller', 'admin'])] },
    ],
  },
  { path: '**', redirectTo: '' },
];
