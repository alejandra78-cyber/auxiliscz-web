import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Tecnico {
  id: string;
  nombre: string;
  disponible: boolean;
}

export interface Taller {
  id: string;
  nombre: string;
  disponible: boolean;
  servicios: string[];
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

@Injectable({ providedIn: 'root' })
export class TallerService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  obtenerMiTaller(): Observable<Taller> {
    return this.http.get<Taller>(`${this.apiBase}/talleres/mi-taller`);
  }

  cambiarDisponibilidad(disponible: boolean): Observable<Taller> {
    return this.http.patch<Taller>(
      `${this.apiBase}/talleres/mi-taller/disponibilidad`,
      { disponible },
    );
  }

  listarTecnicos(): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiBase}/talleres/mi-taller/tecnicos`);
  }

  registrarTecnico(nombre: string, disponible = true): Observable<Tecnico> {
    return this.http.post<Tecnico>(
      `${this.apiBase}/talleres/mi-taller/tecnicos`,
      { nombre, disponible },
    );
  }

  listarSolicitudesPendientes(): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.apiBase}/incidentes/talleres/disponibles`);
  }

  actualizarEstadoServicio(incidenteId: string, nuevoEstado: string, costo?: number): Observable<any> {
    return this.http.patch(
      `${this.apiBase}/incidentes/${incidenteId}/estado`,
      { nuevo_estado: nuevoEstado, costo },
    );
  }

  obtenerHistorialAtenciones(): Observable<HistorialAtencion[]> {
    return this.http.get<HistorialAtencion[]>(
      `${this.apiBase}/talleres/mi-taller/historial-atenciones`,
    );
  }
}
