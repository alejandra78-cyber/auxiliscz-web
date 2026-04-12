import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface IncidenteResumen {
  id: string;
  estado: string;
  tipo: string;
  prioridad: number;
}

@Injectable({ providedIn: 'root' })
export class EmergenciaService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  listarIncidentesParaTaller(): Observable<IncidenteResumen[]> {
    return this.http.get<IncidenteResumen[]>(`${this.apiBase}/incidentes/talleres/disponibles`);
  }
}

