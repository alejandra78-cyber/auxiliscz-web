export interface CambiarPasswordRequest {
  password_actual: string;
  password_nueva: string;
  password_nueva_confirmacion: string;
}

export interface CambiarPasswordResponse {
  ok: boolean;
  mensaje: string;
}

