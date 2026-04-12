import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>AuxiliSCZ</h2>
      <p>Rol autenticado: <strong>{{ role || 'sin rol' }}</strong></p>
      <p class="muted">Módulos activos: Auth, Taller, Asignación, Pagos, Admin y Emergencia.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; }
  `],
})
export class InicioPageComponent {
  role = '';

  constructor(private readonly authService: AuthService) {
    this.role = authService.getCurrentRole();
  }
}
