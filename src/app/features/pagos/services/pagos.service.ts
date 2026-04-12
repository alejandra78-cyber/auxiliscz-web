import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface EstadoPagosResponse {
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
}

