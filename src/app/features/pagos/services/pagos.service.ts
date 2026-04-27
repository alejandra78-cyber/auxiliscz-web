import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface EstadoPagosResponse {
  mensaje: string;
}

export interface CotizacionOut {
  id: string;
  incidente_id?: string | null;
  solicitud_id?: string | null;
  monto_total: number;
  detalle?: string | null;
  estado: string;
  fecha_emision?: string | null;
  validez_hasta?: string | null;
  fecha_respuesta_cliente?: string | null;
  observaciones?: string | null;
  codigo_solicitud?: string | null;
  cliente_nombre?: string | null;
  vehiculo_placa?: string | null;
  tipo_problema?: string | null;
}

export interface CotizacionDecisionOut {
  cotizacion_id: string;
  estado_cotizacion: string;
  incidente_id?: string | null;
  estado_incidente?: string | null;
  estado_solicitud?: string | null;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  estado(): Observable<EstadoPagosResponse> {
    return this.http.get<EstadoPagosResponse>(`${this.apiBase}/pagos/estado`);
  }

  generarCotizacion(payload: {
    incidente_id: string;
    monto_total: number;
    detalle: string;
    observaciones?: string;
    validez_hasta?: string;
  }): Observable<CotizacionOut> {
    return this.http.post<CotizacionOut>(`${this.apiBase}/pagos/taller/cotizaciones`, payload);
  }

  obtenerCotizacionCliente(cotizacionId: string): Observable<CotizacionOut> {
    return this.http.get<CotizacionOut>(`${this.apiBase}/pagos/cliente/cotizaciones/${cotizacionId}`);
  }

  listarCotizacionesTaller(estado?: string): Observable<CotizacionOut[]> {
    const qs = estado?.trim() ? `?estado=${encodeURIComponent(estado.trim())}` : '';
    return this.http.get<CotizacionOut[]>(`${this.apiBase}/pagos/taller/cotizaciones${qs}`);
  }

  aceptarCotizacionCliente(cotizacionId: string, observaciones?: string): Observable<CotizacionDecisionOut> {
    return this.http.post<CotizacionDecisionOut>(
      `${this.apiBase}/pagos/cliente/cotizaciones/${cotizacionId}/aceptar`,
      observaciones?.trim() ? { observaciones: observaciones.trim() } : {},
    );
  }

  rechazarCotizacionCliente(cotizacionId: string, observaciones?: string): Observable<CotizacionDecisionOut> {
    return this.http.post<CotizacionDecisionOut>(
      `${this.apiBase}/pagos/cliente/cotizaciones/${cotizacionId}/rechazar`,
      observaciones?.trim() ? { observaciones: observaciones.trim() } : {},
    );
  }
}

