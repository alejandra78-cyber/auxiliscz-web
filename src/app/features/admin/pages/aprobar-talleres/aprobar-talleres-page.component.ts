import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-aprobar-talleres-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Aprobar Talleres</h2>
      <p class="muted">
        Este flujo queda preparado en frontend. La aprobación formal depende del endpoint específico de aprobación.
      </p>
      <p class="muted">
        Mientras tanto, puedes usar “Registrar taller” y “Roles y permisos” para habilitar cuentas de taller.
      </p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; }
  `],
})
export class AprobarTalleresPageComponent {}

