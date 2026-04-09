import { Routes } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { DashboardLayoutComponent } from './app/layout/dashboard-layout.component';
import { authGuard } from './app/features/auth/auth.guard';
import { CambiarPasswordComponent } from './app/features/auth/cambiar-password/page/cambiar-password.component';
import { LoginComponent } from './app/features/auth/login/login.component';
import { HistorialPageComponent } from './app/features/historial/historial-page.component';
import { PagosPageComponent } from './app/features/pagos/pagos-page.component';
import { PerfilPageComponent } from './app/features/perfil/perfil-page.component';
import { ReportesPageComponent } from './app/features/reportes/reportes-page.component';
import { DisponibilidadPageComponent } from './app/features/taller/disponibilidad-page.component';
import { HistorialAtencionesPageComponent } from './app/features/taller/historial-atenciones-page.component';
import { ServiciosPageComponent } from './app/features/taller/servicios-page.component';
import { TecnicosPageComponent } from './app/features/taller/tecnicos-page.component';
import { TalleresPageComponent } from './app/features/talleres/talleres-page.component';
import { IncidentesComponent } from './incidentes/incidentes.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'incidentes', component: IncidentesComponent },
      { path: 'historial', component: HistorialPageComponent },
      { path: 'taller/historial-atenciones', component: HistorialAtencionesPageComponent },
      { path: 'taller/tecnicos', component: TecnicosPageComponent },
      { path: 'taller/disponibilidad', component: DisponibilidadPageComponent },
      { path: 'taller/servicios', component: ServiciosPageComponent },
      { path: 'talleres', component: TalleresPageComponent },
      { path: 'pagos', component: PagosPageComponent },
      { path: 'reportes', component: ReportesPageComponent },
      { path: 'perfil', component: PerfilPageComponent },
      { path: 'cambiar-password', component: CambiarPasswordComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
