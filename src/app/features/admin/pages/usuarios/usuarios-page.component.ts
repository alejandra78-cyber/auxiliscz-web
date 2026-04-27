import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AdminService, UsuarioAdminItem } from '../../services/admin.service';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>CU26 · Gestionar usuarios</h2>
      <div class="toolbar">
        <select [value]="rolFiltro" (change)="onRol($event)">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="taller">Taller</option>
          <option value="tecnico">Técnico</option>
          <option value="cliente">Cliente</option>
          <option value="conductor">Conductor</option>
        </select>
        <select [value]="estadoFiltro" (change)="onEstado($event)">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <button type="button" (click)="cargar()">Recargar</button>
      </div>
      <p *ngIf="error" class="error">{{ error }}</p>

      <div class="list" *ngIf="usuarios.length">
        <article class="item" *ngFor="let u of usuarios">
          <header>
            <strong>{{ u.nombre }}</strong>
            <span class="chip">{{ u.rol }}</span>
          </header>
          <p>{{ u.email }}</p>
          <p>Estado: {{ u.estado }}</p>
          <div class="actions">
            <button type="button" (click)="cambiarEstado(u, 'activo')">Activar</button>
            <button type="button" (click)="cambiarEstado(u, 'inactivo')">Desactivar</button>
          </div>
        </article>
      </div>
      <p *ngIf="!usuarios.length && !error" class="muted">No hay usuarios para el filtro seleccionado.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; }
    select, button { border:1px solid #d0d7e6; border-radius:8px; padding:8px 10px; font: inherit; }
    button { background:#1f3a7a; color:#fff; border:0; }
    .list { display:grid; gap:10px; }
    .item { border:1px solid #e6ebf5; border-radius:10px; padding:10px; }
    header { display:flex; justify-content:space-between; align-items:center; }
    .chip { background:#eaf2ff; color:#1f3a7a; border-radius:999px; padding:2px 8px; font-size:12px; }
    .actions { display:flex; gap:8px; margin-top:8px; }
    .error { color:#b42318; }
    .muted { color:#6d7890; }
  `],
})
export class UsuariosPageComponent implements OnInit {
  usuarios: UsuarioAdminItem[] = [];
  rolFiltro = '';
  estadoFiltro = '';
  error = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  onRol(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.rolFiltro = target.value || '';
    this.cargar();
  }

  onEstado(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.estadoFiltro = target.value || '';
    this.cargar();
  }

  cargar(): void {
    this.error = '';
    this.adminService.listarUsuarios(this.rolFiltro || undefined, this.estadoFiltro || undefined).subscribe({
      next: (rows) => {
        this.usuarios = rows || [];
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar usuarios';
      },
    });
  }

  cambiarEstado(row: UsuarioAdminItem, estado: string): void {
    this.adminService.cambiarEstadoUsuario(row.id, estado).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo actualizar estado';
      },
    });
  }
}
