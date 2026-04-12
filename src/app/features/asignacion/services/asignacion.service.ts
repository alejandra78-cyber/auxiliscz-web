import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface SolicitudServicio {
  id: string;
  estado: string;
  tipo: string;
  prioridad: number;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  listarSolicitudes(): Observable<SolicitudServicio[]> {
    return this.http.get<SolicitudServicio[]>(`${this.apiBase}/incidentes/talleres/disponibles`);
  }

  actualizarEstado(incidenteId: string, nuevoEstado: string, costo?: number): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.apiBase}/incidentes/${incidenteId}/estado`, {
      nuevo_estado: nuevoEstado,
      costo,
    });
  }
}

