import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface AdminResumen {
  incidentes: { total: number; hoy: number; este_mes: number };
  talleres: { total: number; aprobados: number; pendientes: number };
  servicios_completados: number;
  pagos: { total: number; pagados: number; ingresos_total: number };
  comision_total: number;
  promedio_calificacion: number;
  incidentes_por_tipo: Record<string, number>;
  incidentes_por_estado: Record<string, number>;
}

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: string;
}

export interface UsuarioAdminItem {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  estado: string;
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

  listarUsuarios(rol?: string, estado?: string): Observable<UsuarioAdminItem[]> {
    const query = new URLSearchParams();
    if ((rol ?? '').trim()) query.set('rol', rol!.trim());
    if ((estado ?? '').trim()) query.set('estado', estado!.trim());
    const qs = query.toString();
    return this.http.get<UsuarioAdminItem[]>(`${this.apiBase}/admin/usuarios${qs ? `?${qs}` : ''}`);
  }

  cambiarEstadoUsuario(usuarioId: string, estado: string): Observable<UsuarioAdminItem> {
    return this.http.patch<UsuarioAdminItem>(`${this.apiBase}/admin/usuarios/${usuarioId}/estado`, { estado });
  }

  cambiarRolUsuario(usuarioId: string, rol: string): Observable<UsuarioAdminItem> {
    return this.http.patch<UsuarioAdminItem>(`${this.apiBase}/admin/usuarios/${usuarioId}/rol`, { rol });
  }
}

