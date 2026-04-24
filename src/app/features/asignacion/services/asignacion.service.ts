import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface SolicitudServicio {
  id: string;
  codigo_solicitud?: string | null;
  estado: string;
  tipo: string;
  tipo_sugerido_ia?: string | null;
  descripcion?: string | null;
  prioridad: number;
  prioridad_sugerida_ia?: number | null;
  resumen_ia?: string | null;
  cliente_nombre?: string | null;
  creado_en: string;
  taller_nombre?: string | null;
  estado_asignacion?: string | null;
  tecnico_nombre?: string | null;
  servicio?: string | null;
  incidente_id?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  distancia_km?: number | null;
  puntaje_asignacion?: number | null;
  motivo_asignacion?: string | null;
  origen_asignacion?: string | null;
  motivo_rechazo?: string | null;
  fecha_asignacion?: string | null;
  fecha_respuesta_taller?: string | null;
  tecnico_id?: string | null;
  taller_id?: string | null;
}

export interface EvidenciaSolicitud {
  id: string;
  tipo: string;
  url_archivo?: string | null;
  transcripcion?: string | null;
  subido_en?: string | null;
}

export interface SolicitudServicioDetalle extends SolicitudServicio {
  evidencias: EvidenciaSolicitud[];
}

export interface SolicitudesFiltro {
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface TecnicoDisponible {
  id: string;
  nombre: string;
  especialidad?: string | null;
  disponible: boolean;
}

export interface ServicioCatalogo {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface SugerenciaAsignacion {
  solicitud_id: string;
  codigo_solicitud: string;
  tecnico_id?: string | null;
  tecnico_nombre?: string | null;
  taller_id?: string | null;
  taller_nombre?: string | null;
  servicio_sugerido?: string | null;
  puntaje?: number | null;
  motivo?: string | null;
}

export interface CandidatoAsignacion {
  taller_id: string;
  nombre: string;
  distancia_km: number;
  puntaje: number;
  capacidad_disponible?: number | null;
  tecnicos_disponibles?: number | null;
  estado_operativo?: string | null;
  motivo?: string | null;
}

export interface ResultadoAsignacionAutomatica {
  taller_id?: string | null;
  nombre_taller?: string | null;
  mensaje: string;
  distancia_km?: number | null;
  puntaje?: number | null;
  motivo_asignacion?: string | null;
  origen_asignacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  listarSolicitudes(filtro?: SolicitudesFiltro): Observable<SolicitudServicio[]> {
    const query = new URLSearchParams();
    if (filtro?.estado) query.set('estado', filtro.estado);
    if (filtro?.fecha_desde) query.set('fecha_desde', filtro.fecha_desde);
    if (filtro?.fecha_hasta) query.set('fecha_hasta', filtro.fecha_hasta);
    const qs = query.toString();
    return this.http.get<SolicitudServicio[]>(`${this.apiBase}/asignacion/solicitudes${qs ? `?${qs}` : ''}`);
  }

  obtenerDetalleSolicitud(incidenteId: string): Observable<SolicitudServicioDetalle> {
    return this.http.get<SolicitudServicioDetalle>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}`);
  }

  evaluarSolicitud(incidenteId: string, aprobar: boolean, observacion?: string): Observable<SolicitudServicio> {
    return this.http.post<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/evaluar`, {
      aprobar,
      observacion,
    });
  }

  aceptarSolicitud(incidenteId: string): Observable<SolicitudServicio> {
    return this.http.post<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/aceptar`, {});
  }

  rechazarSolicitud(incidenteId: string, motivoRechazo?: string): Observable<SolicitudServicio> {
    return this.http.post<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/rechazar`, {
      motivo_rechazo: motivoRechazo,
    });
  }

  asignarServicio(
    incidenteId: string,
    tecnicoId: string,
    servicio: string,
    observacion?: string,
  ): Observable<SolicitudServicio> {
    return this.http.post<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/asignar`, {
      tecnico_id: tecnicoId,
      servicio,
      observacion,
    });
  }

  actualizarEstado(incidenteId: string, estado: string, costo?: number, observacion?: string): Observable<SolicitudServicio> {
    return this.http.patch<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/estado`, {
      estado,
      costo,
      observacion,
    });
  }

  actualizarEstadoServicio(
    incidenteId: string,
    estado: string,
    observacion?: string,
    tecnicoId?: string,
    costo?: number,
  ): Observable<SolicitudServicio> {
    return this.http.patch<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/estado`, {
      estado,
      observacion,
      tecnico_id: tecnicoId,
      costo,
    });
  }

  listarTecnicosDisponibles(solicitudId?: string): Observable<TecnicoDisponible[]> {
    const qs = solicitudId ? `?solicitud_id=${encodeURIComponent(solicitudId)}` : '';
    return this.http.get<TecnicoDisponible[]>(`${this.apiBase}/asignacion/tecnicos/disponibles${qs}`);
  }

  listarServiciosCatalogo(): Observable<ServicioCatalogo[]> {
    return this.http.get<ServicioCatalogo[]>(`${this.apiBase}/asignacion/servicios/catalogo`);
  }

  sugerenciaAsignacionIA(incidenteId: string): Observable<SugerenciaAsignacion> {
    return this.http.get<SugerenciaAsignacion>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/sugerencia-ia`);
  }

  listarCandidatosIncidente(incidenteId: string): Observable<CandidatoAsignacion[]> {
    return this.http.get<CandidatoAsignacion[]>(`${this.apiBase}/asignacion/candidatos/${incidenteId}`);
  }

  asignarAutomaticamente(incidenteId: string): Observable<ResultadoAsignacionAutomatica> {
    return this.http.post<ResultadoAsignacionAutomatica>(`${this.apiBase}/asignacion/asignar/${incidenteId}`, {});
  }
}
