import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol?: 'conductor' | 'taller' | 'tecnico' | 'admin';
}

export interface UserOut {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: 'conductor' | 'taller' | 'tecnico' | 'admin';
  creado_en?: string;
}

export interface RolePermissionsResponse {
  rol: string;
  permisos: string[];
}

export interface ChangeRoleRequest {
  usuario_id: string;
  nuevo_rol: 'conductor' | 'taller' | 'tecnico' | 'admin';
}

export interface AdminUserListItem {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: 'conductor' | 'taller' | 'tecnico' | 'admin';
}

export interface RecoverPasswordRequest {
  email: string;
}

export interface RecoverPasswordResponse {
  ok: boolean;
  mensaje: string;
  reset_token?: string | null;
}

export interface ResetPasswordRequest {
  reset_token: string;
  nueva_password: string;
}

export interface ValidateResetTokenRequest {
  reset_token: string;
}

export interface ValidateResetTokenResponse {
  ok: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  register(payload: RegisterRequest): Observable<UserOut> {
    return this.http.post<UserOut>(`${this.apiBase}/auth/register`, payload);
  }

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

  requestPasswordRecovery(payload: RecoverPasswordRequest): Observable<RecoverPasswordResponse> {
    return this.http.post<RecoverPasswordResponse>(`${this.apiBase}/auth/password/recovery-request`, payload);
  }

  validateResetToken(payload: ValidateResetTokenRequest): Observable<ValidateResetTokenResponse> {
    return this.http.post<ValidateResetTokenResponse>(`${this.apiBase}/auth/password/validate-token`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.post<{ ok: boolean; mensaje: string }>(`${this.apiBase}/auth/password/reset`, payload);
  }

  getRolePermissions(rol: string): Observable<RolePermissionsResponse> {
    return this.http.get<RolePermissionsResponse>(`${this.apiBase}/auth/roles/${rol}/permisos`);
  }

  changeRole(payload: ChangeRoleRequest): Observable<UserOut> {
    return this.http.patch<UserOut>(`${this.apiBase}/auth/roles`, payload);
  }

  listUsersForAdmin(): Observable<AdminUserListItem[]> {
    return this.http.get<AdminUserListItem[]>(`${this.apiBase}/admin/usuarios/lista`);
  }

  listTallerCandidates(): Observable<AdminUserListItem[]> {
    return this.http.get<AdminUserListItem[]>(`${this.apiBase}/admin/usuarios/taller-candidatos`);
  }

  getCurrentRole(): string {
    const token = this.getToken();
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload?.rol ?? '';
    } catch {
      return '';
    }
  }
}
