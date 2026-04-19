import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface IncidenteResumen {
  id: string;
  codigo_solicitud?: string | null;
  estado: string;
  tipo: string;
  prioridad: number;
  cliente_nombre?: string | null;
}

export interface MensajeSolicitud {
  evidencia_id: string;
  autor_rol: string;
  texto: string;
  creado_en?: string | null;
}

export interface NotificacionSolicitud {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  estado: string;
  creada_en?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmergenciaService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  listarIncidentesParaTaller(): Observable<IncidenteResumen[]> {
    return this.http.get<IncidenteResumen[]>(`${this.apiBase}/asignacion/solicitudes`);
  }

  listarMensajes(incidenteId: string): Observable<MensajeSolicitud[]> {
    return this.http.get<MensajeSolicitud[]>(`${this.apiBase}/emergencias/solicitud/${incidenteId}/mensajes`);
  }

  enviarMensaje(incidenteId: string, texto: string): Observable<MensajeSolicitud> {
    return this.http.post<MensajeSolicitud>(`${this.apiBase}/emergencias/solicitud/${incidenteId}/mensajes`, { texto });
  }

  listarNotificaciones(incidenteId?: string): Observable<NotificacionSolicitud[]> {
    const qs = incidenteId ? `?incidente_id=${encodeURIComponent(incidenteId)}` : '';
    return this.http.get<NotificacionSolicitud[]>(`${this.apiBase}/emergencias/notificaciones${qs}`);
  }
}
