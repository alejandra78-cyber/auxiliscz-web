import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface Tecnico {
  id: string;
  usuario_id?: string | null;
  email?: string | null;
  nombre: string;
  telefono?: string | null;
  especialidad?: string | null;
  estado_operativo?: 'disponible' | 'ocupado' | 'en_camino' | 'en_proceso' | 'fuera_de_servicio';
  activo?: boolean;
  disponible: boolean;
  servicio_ids?: string[];
  especialidades?: string[];
  especialidades_nombres?: string[];
  latitud_actual?: number | null;
  longitud_actual?: number | null;
  ultima_actualizacion_ubicacion?: string | null;
}

export interface TecnicoCandidato {
  id: string;
  nombre: string;
  email: string;
}

export interface TecnicoCreateRequest {
  usuario_id?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  servicio_ids?: string[];
  disponible?: boolean;
}

export interface TecnicoUpdateRequest {
  nombre?: string;
  telefono?: string;
  especialidad?: string;
  estado_operativo?: 'disponible' | 'ocupado' | 'en_camino' | 'en_proceso' | 'fuera_de_servicio';
  disponible?: boolean;
}

export interface TecnicoEstadoRequest {
  activo?: boolean;
  estado_operativo?: 'disponible' | 'ocupado' | 'en_camino' | 'en_proceso' | 'fuera_de_servicio';
  disponible?: boolean;
}

export interface ServicioCatalogo {
  id: string;
  codigo: string;
  nombre_visible: string;
  activo: boolean;
}

export interface Taller {
  id: string;
  usuario_id: string;
  nombre: string;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  disponible: boolean;
  estado_operativo?: 'disponible' | 'ocupado' | 'cerrado' | 'fuera_de_servicio';
  capacidad_maxima?: number;
  radio_cobertura_km?: number;
  observaciones_operativas?: string | null;
  servicios: string[];
  calificacion?: number;
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
  aprobado_por?: string | null;
  aprobado_en?: string | null;
  responsable_nombre?: string | null;
  responsable_email?: string | null;
  responsable_telefono?: string | null;
}

export interface TurnoDisponible {
  tecnico_id: string;
  tecnico_nombre: string;
  turno_id: string;
  nombre: string;
  especialidad?: string | null;
  disponible: boolean;
  inicio?: string | null;
  fin?: string | null;
}

export interface DisponibilidadTaller {
  taller_id: string;
  nombre_taller: string;
  estado_operativo: 'disponible' | 'ocupado' | 'cerrado' | 'fuera_de_servicio';
  disponible: boolean;
  capacidad_maxima: number;
  capacidad_disponible: number;
  radio_cobertura_km: number;
  servicios: string[];
  tecnicos_disponibles: number;
  tecnicos_totales: number;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  observaciones_operativas?: string | null;
  turnos_disponibles: TurnoDisponible[];
}

export interface DisponibilidadUpdateRequest {
  disponible?: boolean;
  estado_operativo?: 'disponible' | 'ocupado' | 'cerrado' | 'fuera_de_servicio';
  capacidad_maxima?: number;
  radio_cobertura_km?: number;
  servicios?: string[];
  latitud?: number;
  longitud?: number;
  observaciones_operativas?: string;
}

export interface Incidente {
  id: string;
  estado: string;
  tipo: string;
  prioridad: number;
  creado_en: string;
}

export interface HistorialAtencion {
  id: string;
  fecha: string;
  cliente: string | null;
  vehiculo: string | null;
  tipo_incidente: string;
  estado_final: string;
  tecnico_asignado: string | null;
  ubicacion: string | null;
  costo: number | null;
  pago_monto: number | null;
  pago_estado: string | null;
}

export interface ServicioActivo {
  incidente_id: string;
  codigo_solicitud: string;
  estado: string;
  tipo_servicio?: string | null;
  tecnico_id?: string | null;
  tecnico_nombre?: string | null;
  cliente?: string | null;
}

export interface TecnicoServicioAsignado {
  asignacion_id: string;
  incidente_id: string;
  codigo_solicitud: string;
  estado_servicio: string;
  cliente_nombre?: string | null;
  vehiculo_placa?: string | null;
  tipo_problema?: string | null;
  tecnico_nombre: string;
}

export interface TecnicoUbicacionSendRequest {
  asignacion_id: string;
  latitud: number;
  longitud: number;
}

export interface TecnicoUbicacionSendResponse {
  mensaje: string;
  estado_servicio: string;
  ultima_actualizacion: string;
}

export interface TallerCreateRequest {
  usuario_id?: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  servicios: string[];
  disponible: boolean;
  responsable_nombre?: string;
  responsable_email?: string;
  responsable_telefono?: string;
  password_temporal?: string;
}

export interface SolicitudAfiliacionRequest {
  nombre_taller: string;
  responsable_nombre: string;
  responsable_email: string;
  responsable_telefono: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  servicios: string[];
  descripcion?: string;
}

export interface SolicitudAfiliacion {
  id: string;
  nombre_taller: string;
  responsable_nombre: string;
  responsable_email: string;
  responsable_telefono: string;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  servicios: string[];
  descripcion?: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  observaciones?: string | null;
  creado_en: string;
  revisado_en?: string | null;
  revisado_por?: string | null;
  usuario_id?: string | null;
  taller_id?: string | null;
}

export interface TallerAdminOption {
  id: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class TallerService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  obtenerMiTaller(): Observable<Taller> {
    return this.http.get<Taller>(`${this.apiBase}/taller/mi-taller`);
  }

  registrarTaller(payload: TallerCreateRequest): Observable<Taller> {
    return this.http.post<Taller>(`${this.apiBase}/taller/`, payload);
  }

  registrarSolicitudAfiliacion(payload: SolicitudAfiliacionRequest): Observable<SolicitudAfiliacion> {
    return this.http.post<SolicitudAfiliacion>(`${this.apiBase}/taller/solicitudes-afiliacion`, payload);
  }

  listarSolicitudesAfiliacionAdmin(estado?: 'pendiente' | 'aprobado' | 'rechazado'): Observable<SolicitudAfiliacion[]> {
    const qs = estado ? `?estado=${estado}` : '';
    return this.http.get<SolicitudAfiliacion[]>(`${this.apiBase}/taller/admin/solicitudes-afiliacion${qs}`);
  }

  detalleSolicitudAfiliacionAdmin(id: string): Observable<SolicitudAfiliacion> {
    return this.http.get<SolicitudAfiliacion>(`${this.apiBase}/taller/admin/solicitudes-afiliacion/${id}`);
  }

  aprobarSolicitudAfiliacion(id: string, observaciones?: string): Observable<SolicitudAfiliacion> {
    return this.http.patch<SolicitudAfiliacion>(`${this.apiBase}/taller/admin/solicitudes-afiliacion/${id}/aprobar`, { observaciones });
  }

  rechazarSolicitudAfiliacion(id: string, observaciones?: string): Observable<SolicitudAfiliacion> {
    return this.http.patch<SolicitudAfiliacion>(`${this.apiBase}/taller/admin/solicitudes-afiliacion/${id}/rechazar`, { observaciones });
  }

  listarOnboardingTalleres(estado?: 'pendiente' | 'aprobado' | 'rechazado'): Observable<Taller[]> {
    const qs = estado ? `?estado=${estado}` : '';
    return this.http.get<Taller[]>(`${this.apiBase}/taller/admin/onboarding${qs}`);
  }

  listarTalleresAdmin(): Observable<TallerAdminOption[]> {
    return this.http.get<TallerAdminOption[]>(`${this.apiBase}/taller/admin/talleres`);
  }

  aprobarTaller(tallerId: string, comentario?: string): Observable<any> {
    return this.http.patch(`${this.apiBase}/taller/admin/${tallerId}/aprobar`, { comentario });
  }

  rechazarTaller(tallerId: string, comentario?: string): Observable<any> {
    return this.http.patch(`${this.apiBase}/taller/admin/${tallerId}/rechazar`, { comentario });
  }

  cambiarDisponibilidad(disponible: boolean): Observable<Taller> {
    return this.http.patch<Taller>(`${this.apiBase}/taller/mi-taller/disponibilidad`, { disponible });
  }

  obtenerDisponibilidadMiTaller(): Observable<DisponibilidadTaller> {
    return this.http.get<DisponibilidadTaller>(`${this.apiBase}/taller/mi-taller/disponibilidad`);
  }

  listarServiciosMiTaller(): Observable<ServicioCatalogo[]> {
    return this.http.get<ServicioCatalogo[]>(`${this.apiBase}/taller/servicios`);
  }

  obtenerDisponibilidadTallerAdmin(tallerId: string): Observable<DisponibilidadTaller> {
    return this.http.get<DisponibilidadTaller>(`${this.apiBase}/taller/admin/talleres/${tallerId}/disponibilidad`);
  }

  actualizarDisponibilidadMiTaller(payload: DisponibilidadUpdateRequest): Observable<Taller> {
    return this.http.patch<Taller>(`${this.apiBase}/taller/mi-taller/disponibilidad`, payload);
  }

  actualizarUbicacionMiTaller(latitud: number, longitud: number): Observable<Taller> {
    return this.actualizarDisponibilidadMiTaller({ latitud, longitud });
  }

  listarTecnicos(): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiBase}/taller/mi-taller/tecnicos`);
  }

  listarTecnicosTallerAdmin(tallerId: string): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiBase}/taller/admin/talleres/${tallerId}/tecnicos`);
  }

  listarCandidatosTecnico(): Observable<TecnicoCandidato[]> {
    return this.http.get<TecnicoCandidato[]>(`${this.apiBase}/taller/mi-taller/tecnicos/candidatos`);
  }

  registrarTecnico(payload: TecnicoCreateRequest): Observable<Tecnico> {
    return this.http.post<Tecnico>(`${this.apiBase}/taller/mi-taller/tecnicos`, payload);
  }

  actualizarTecnico(tecnicoId: string, payload: TecnicoUpdateRequest): Observable<Tecnico> {
    return this.http.put<Tecnico>(`${this.apiBase}/taller/mi-taller/tecnicos/${tecnicoId}`, payload);
  }

  cambiarEstadoTecnico(tecnicoId: string, payload: TecnicoEstadoRequest): Observable<Tecnico> {
    return this.http.patch<Tecnico>(`${this.apiBase}/taller/mi-taller/tecnicos/${tecnicoId}/estado`, payload);
  }

  actualizarEspecialidadesTecnico(tecnicoId: string, servicioIds: string[]): Observable<Tecnico> {
    return this.http.put<Tecnico>(`${this.apiBase}/taller/mi-taller/tecnicos/${tecnicoId}/especialidades`, {
      servicio_ids: servicioIds,
    });
  }

  listarSolicitudesPendientes(): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.apiBase}/asignacion/solicitudes`);
  }

  actualizarEstadoServicio(incidenteId: string, nuevoEstado: string, costo?: number): Observable<any> {
    return this.http.patch(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/estado`, { estado: nuevoEstado, costo });
  }

  registrarTrabajoCompletado(
    incidenteId: string,
    costo: number,
    observacion?: string,
    evidenciaTexto?: string,
  ): Observable<any> {
    return this.http.patch(`${this.apiBase}/taller/mi-taller/servicios/${incidenteId}/completar`, {
      costo,
      observacion,
      evidencia_texto: evidenciaTexto,
    });
  }

  listarServiciosActivos(): Observable<ServicioActivo[]> {
    return this.http.get<ServicioActivo[]>(`${this.apiBase}/taller/mi-taller/servicios/activos`);
  }

  listarMisServiciosAsignadosTecnico(): Observable<TecnicoServicioAsignado[]> {
    return this.http.get<TecnicoServicioAsignado[]>(`${this.apiBase}/tecnico/mis-servicios-asignados`);
  }

  enviarUbicacionTecnico(payload: TecnicoUbicacionSendRequest): Observable<TecnicoUbicacionSendResponse> {
    return this.http.post<TecnicoUbicacionSendResponse>(`${this.apiBase}/tecnico/ubicacion`, payload);
  }

  obtenerHistorialAtenciones(): Observable<HistorialAtencion[]> {
    return this.http.get<HistorialAtencion[]>(`${this.apiBase}/taller/mi-taller/historial-atenciones`);
  }
}
