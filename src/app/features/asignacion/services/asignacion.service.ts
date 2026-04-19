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
  tecnico_nombre?: string | null;
  servicio?: string | null;
  tecnico_id?: string | null;
  taller_id?: string | null;
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

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  listarSolicitudes(): Observable<SolicitudServicio[]> {
    return this.http.get<SolicitudServicio[]>(`${this.apiBase}/asignacion/solicitudes`);
  }

  evaluarSolicitud(incidenteId: string, aprobar: boolean, observacion?: string): Observable<SolicitudServicio> {
    return this.http.post<SolicitudServicio>(`${this.apiBase}/asignacion/solicitudes/${incidenteId}/evaluar`, {
      aprobar,
      observacion,
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
}
