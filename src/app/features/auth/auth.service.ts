import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  CambiarPasswordRequest,
  CambiarPasswordResponse,
} from './cambiar-password/models/cambiar-password.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/auth/login`, payload).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.access_token);
      }),
    );
  }

  getToken(): string {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  isAuthenticated(): boolean {
    return this.getToken().trim().length > 0;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  cambiarPassword(payload: CambiarPasswordRequest): Observable<CambiarPasswordResponse> {
    return this.http.patch<CambiarPasswordResponse>(
      `${this.apiBase}/auth/cambiar-password`,
      payload,
    );
  }
}
