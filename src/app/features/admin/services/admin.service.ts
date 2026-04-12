import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface AdminResumen {
  incidentes: { total: number; hoy: number; este_mes: number };
  talleres: { total: number; activos: number };
  conductores: number;
  ingresos: { este_mes_bs: number; total_bs: number };
}

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  resumen(): Observable<AdminResumen> {
    return this.http.get<AdminResumen>(`${this.apiBase}/admin/reportes/resumen`);
  }

  miPerfil(): Observable<UsuarioPerfil> {
    return this.http.get<UsuarioPerfil>(`${this.apiBase}/admin/usuarios/me`);
  }
}

