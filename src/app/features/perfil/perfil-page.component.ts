import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h2>Perfil</h2>
      <p class="muted">Datos visibles de sesión</p>
      <p><strong>Email:</strong> {{ email }}</p>
      <p><strong>Rol:</strong> {{ rol }}</p>
      <a routerLink="/cambiar-password">Ir a cambiar contraseña</a>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin: 4px 0 12px; }
  `],
})
export class PerfilPageComponent {
  email = 'admin@auxilioscz.com';
  rol = 'admin';
}
