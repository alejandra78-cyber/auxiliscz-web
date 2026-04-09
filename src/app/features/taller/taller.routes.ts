import { Routes } from '@angular/router';

import { DisponibilidadPageComponent } from './disponibilidad-page.component';
import { HistorialAtencionesPageComponent } from './historial-atenciones-page.component';
import { ServiciosPageComponent } from './servicios-page.component';
import { TecnicosPageComponent } from './tecnicos-page.component';

export const tallerRoutes: Routes = [
  { path: 'historial-atenciones', component: HistorialAtencionesPageComponent },
  { path: 'tecnicos', component: TecnicosPageComponent },
  { path: 'disponibilidad', component: DisponibilidadPageComponent },
  { path: 'servicios', component: ServiciosPageComponent },
];
