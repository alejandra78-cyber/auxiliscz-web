import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AdminService, UsuarioPerfil } from '../../services/admin.service';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Gestión de Usuarios</h2>
      <p class="muted">Vista conectada al perfil del usuario autenticado.</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <div *ngIf="perfil" class="info">
        <p><strong>Nombre:</strong> {{ perfil.nombre }}</p>
        <p><strong>Email:</strong> {{ perfil.email }}</p>
        <p><strong>Rol:</strong> {{ perfil.rol }}</p>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; }
    .error { color:#b42318; }
    .info p { margin:6px 0; }
  `],
})
export class UsuariosPageComponent implements OnInit {
  perfil: UsuarioPerfil | null = null;
  error = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.miPerfil().subscribe({
      next: (res) => {
        this.perfil = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar perfil de usuario';
      },
    });
  }
}

