import { Routes } from '@angular/router';

import { DashboardLayoutComponent } from './app/layout/dashboard-layout.component';
import { roleGuard } from './app/core/guards/role.guard';
import { authGuard } from './app/features/auth/guards/auth.guard';
import { LoginComponent } from './app/features/auth/pages/login/login-page.component';
import { RecoverPasswordPageComponent } from './app/features/auth/pages/recover-password/recover-password-page.component';
import { RolesPermisosPageComponent } from './app/features/admin/pages/roles-permisos/roles-permisos-page.component';
import { InicioPageComponent } from './app/features/admin/pages/inicio/inicio-page.component';
import { DisponibilidadPageComponent } from './app/features/taller/pages/disponibilidad/disponibilidad-page.component';
import { TecnicosPageComponent } from './app/features/taller/pages/tecnicos/tecnicos-page.component';
import { DesempenoPageComponent } from './app/features/taller/pages/desempeno/desempeno-page.component';
import { TrabajoCompletadoPageComponent } from './app/features/taller/pages/trabajo-completado/trabajo-completado-page.component';
import { SeguimientoTecnicoPageComponent } from './app/features/taller/pages/seguimiento-tecnico/seguimiento-tecnico-page.component';
import { UbicacionTallerPageComponent } from './app/features/taller/pages/ubicacion-taller/ubicacion-taller-page.component';
import { SolicitudesPageComponent } from './app/features/asignacion/pages/solicitudes/solicitudes-page.component';
import { EvaluarSolicitudPageComponent } from './app/features/asignacion/pages/evaluar-solicitud/evaluar-solicitud-page.component';
import { AsignarServicioPageComponent } from './app/features/asignacion/pages/asignar-servicio/asignar-servicio-page.component';
import { ActualizarEstadoPageComponent } from './app/features/asignacion/pages/actualizar-estado/actualizar-estado-page.component';
import { ComunicacionPageComponent } from './app/features/emergencia/pages/comunicacion/comunicacion-page.component';
import { CotizacionesPageComponent } from './app/features/pagos/pages/cotizaciones/cotizaciones-page.component';
import { PackagePlaceholderPageComponent } from './app/shared/pages/package-placeholder-page.component';
import { AprobarTalleresPageComponent } from './app/features/admin/pages/aprobar-talleres/aprobar-talleres-page.component';
import { RegistrarTallerPageComponent } from './app/features/taller/pages/registrar-taller/registrar-taller-page.component';
import { UsuariosPageComponent } from './app/features/admin/pages/usuarios/usuarios-page.component';
import { ReportesPageComponent } from './app/features/admin/pages/reportes/reportes-page.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registrar-taller', component: RegistrarTallerPageComponent },
  { path: 'solicitar-afiliacion-taller', redirectTo: 'registrar-taller', pathMatch: 'full' },
  { path: 'recover-password', component: RecoverPasswordPageComponent },
  { path: 'auth/recuperar-password', component: RecoverPasswordPageComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: InicioPageComponent },

      // Gestión de Clientes y Vehículos
      {
        path: 'clientes-vehiculos/registrar-vehiculo',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Registrar vehículos', description: 'Paquete: Gestión de Clientes y Vehículos' },
      },
      {
        path: 'clientes-vehiculos/estado-solicitud',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Consultar estado de solicitud', description: 'Paquete: Gestión de Clientes y Vehículos' },
      },
      {
        path: 'clientes-vehiculos/ubicacion-tecnico',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Ver ubicación del técnico', description: 'Paquete: Gestión de Clientes y Vehículos' },
      },
      {
        path: 'clientes-vehiculos/evaluar-servicio',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Evaluar servicio', description: 'Paquete: Gestión de Clientes y Vehículos' },
      },
      {
        path: 'clientes-vehiculos/historial-servicios',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Consultar historial de servicios', description: 'Paquete: Gestión de Clientes y Vehículos' },
      },

      // Gestión de Talleres y Operación
      { path: 'talleres-operacion/registrar-taller', redirectTo: 'admin-reportes/aprobar-talleres', pathMatch: 'full' },
      {
        path: 'talleres-operacion/disponibilidad',
        component: DisponibilidadPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'talleres-operacion/ubicacion-taller',
        component: UbicacionTallerPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'talleres-operacion/tecnicos',
        component: TecnicosPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'talleres-operacion/desempeno',
        component: DesempenoPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'talleres-operacion/trabajo-completado',
        component: TrabajoCompletadoPageComponent,
        canActivate: [roleGuard(['taller', 'tecnico', 'admin'])],
      },
      {
        path: 'talleres-operacion/seguimiento-tecnico',
        component: SeguimientoTecnicoPageComponent,
        canActivate: [roleGuard(['tecnico'])],
      },

      // Registro de Emergencias
      {
        path: 'registro-emergencias/reportar-emergencia',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'CU11 · Reportar emergencia', description: 'Paquete: Registro de Emergencias' },
      },
      {
        path: 'registro-emergencias/cancelar-solicitud',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'Cancelar solicitud', description: 'Paquete: Registro de Emergencias' },
      },
      {
        path: 'registro-emergencias/comunicacion-notificaciones',
        component: ComunicacionPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },

      // Atención y Asignación de Solicitudes
      {
        path: 'atencion-solicitudes/consultar-solicitudes',
        component: SolicitudesPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'atencion-solicitudes/evaluar-solicitud',
        component: EvaluarSolicitudPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'atencion-solicitudes/asignar-servicio',
        component: AsignarServicioPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },
      {
        path: 'atencion-solicitudes/actualizar-estado',
        component: ActualizarEstadoPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
      },

      // Pagos
      {
        path: 'pagos/generar-cotizacion',
        component: CotizacionesPageComponent,
        canActivate: [roleGuard(['taller', 'admin'])],
        data: { title: 'CU20 · Generar cotización', description: 'Paquete: Pagos' },
      },
      {
        path: 'pagos/gestionar-cotizacion',
        component: CotizacionesPageComponent,
        canActivate: [roleGuard(['taller', 'admin', 'cliente', 'conductor'])],
        data: { title: 'CU21 · Gestionar cotización', description: 'Paquete: Pagos' },
      },
      {
        path: 'pagos/procesar-pago',
        component: PackagePlaceholderPageComponent,
        canActivate: [roleGuard(['cliente', 'conductor', 'admin'])],
        data: { title: 'CU22 · Procesar pago', description: 'Paquete: Pagos' },
      },

      // Administración y Reportes
      {
        path: 'admin-reportes/roles-permisos',
        component: RolesPermisosPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'admin-reportes/gestionar-usuarios',
        component: UsuariosPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'admin-reportes/aprobar-talleres',
        component: AprobarTalleresPageComponent,
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'admin-reportes/reportes-metricas',
        component: ReportesPageComponent,
        canActivate: [roleGuard(['admin'])],
      },

      // Compatibilidad rutas antiguas
      { path: 'dashboard', redirectTo: '/inicio', pathMatch: 'full' },
      { path: 'taller/registrar', redirectTo: 'talleres-operacion/registrar-taller', pathMatch: 'full' },
      { path: 'taller/disponibilidad', redirectTo: 'talleres-operacion/disponibilidad', pathMatch: 'full' },
      { path: 'taller/ubicacion', redirectTo: 'talleres-operacion/ubicacion-taller', pathMatch: 'full' },
      { path: 'taller/tecnicos', redirectTo: 'talleres-operacion/tecnicos', pathMatch: 'full' },
      { path: 'taller/desempeno', redirectTo: 'talleres-operacion/desempeno', pathMatch: 'full' },
      { path: 'taller/trabajo-completado', redirectTo: 'talleres-operacion/trabajo-completado', pathMatch: 'full' },
      { path: 'tecnico/seguimiento', redirectTo: 'talleres-operacion/seguimiento-tecnico', pathMatch: 'full' },
      { path: 'asignacion/solicitudes', redirectTo: 'atencion-solicitudes/consultar-solicitudes', pathMatch: 'full' },
      { path: 'asignacion/evaluar', redirectTo: 'atencion-solicitudes/evaluar-solicitud', pathMatch: 'full' },
      { path: 'asignacion/asignar', redirectTo: 'atencion-solicitudes/asignar-servicio', pathMatch: 'full' },
      { path: 'asignacion/actualizar-estado', redirectTo: 'atencion-solicitudes/actualizar-estado', pathMatch: 'full' },
      { path: 'emergencia/comunicacion', redirectTo: 'registro-emergencias/comunicacion-notificaciones', pathMatch: 'full' },
      { path: 'admin/roles-permisos', redirectTo: 'admin-reportes/roles-permisos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
