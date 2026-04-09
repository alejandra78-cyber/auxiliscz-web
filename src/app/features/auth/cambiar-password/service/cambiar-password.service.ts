import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../../auth.service';
import {
  CambiarPasswordRequest,
  CambiarPasswordResponse,
} from '../models/cambiar-password.model';

@Injectable({ providedIn: 'root' })
export class CambiarPasswordService {
  constructor(private readonly authService: AuthService) {}

  ejecutar(payload: CambiarPasswordRequest): Observable<CambiarPasswordResponse> {
    return this.authService.cambiarPassword(payload);
  }
}

