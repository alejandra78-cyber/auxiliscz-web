import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminUserListItem, AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-roles-permisos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Gestión de Roles y Permisos</h2>

      <form [formGroup]="consultaForm" (ngSubmit)="consultar()" class="form-grid">
        <label>Rol a consultar</label>
        <select formControlName="rol">
          <option value="conductor">conductor</option>
          <option value="taller">taller</option>
          <option value="tecnico">tecnico</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" [disabled]="consultaForm.invalid || loadingConsulta">{{ loadingConsulta ? 'Consultando...' : 'Consultar permisos' }}</button>
      </form>

      <ul *ngIf="permisos.length" class="permisos">
        <li *ngFor="let permiso of permisos">{{ permiso }}</li>
      </ul>

      <section class="users-block">
        <h3>Usuarios creados</h3>
        <p *ngIf="loadingUsuarios">Cargando usuarios...</p>
        <div class="table-wrap" *ngIf="usuarios.length">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acción</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td>{{ u.nombre }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.rol }}</td>
                <td><button type="button" (click)="seleccionarUsuario(u.id)">Seleccionar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="!loadingUsuarios && !usuarios.length">No hay usuarios registrados.</p>
      </section>

      <form [formGroup]="cambioForm" (ngSubmit)="cambiarRol()" class="form-grid">
        <h3>Cambiar rol de usuario</h3>
        <label>Usuario</label>
        <select formControlName="usuario_id">
          <option value="" disabled>Selecciona un usuario</option>
          <option *ngFor="let u of usuarios" [value]="u.id">
            {{ u.nombre }} ({{ u.email }}) - rol actual: {{ u.rol }}
          </option>
        </select>

        <label>Nuevo rol</label>
        <select formControlName="nuevo_rol">
          <option value="conductor">conductor</option>
          <option value="taller">taller</option>
          <option value="tecnico">tecnico</option>
          <option value="admin">admin</option>
        </select>

        <button type="submit" [disabled]="cambioForm.invalid || loadingCambio">{{ loadingCambio ? 'Actualizando...' : 'Cambiar rol' }}</button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 860px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .form-grid { display:grid; gap:8px; margin-top: 14px; }
    .permisos { margin: 12px 0; padding-left: 16px; }
    .users-block { margin-top: 14px; }
    table { width:100%; border-collapse: collapse; margin-top:8px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table-wrap table { min-width: 620px; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; }
    th { color:#1f3a7a; }
    td button { padding:6px 10px; font-size:12px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    h3 { margin: 10px 0 0; }
    @media (max-width: 900px) {
      .card { padding: 12px; }
      .form-grid button { width: 100%; }
    }
  `],
})
export class RolesPermisosPageComponent implements OnInit {
  loadingConsulta = false;
  loadingCambio = false;
  loadingUsuarios = false;
  permisos: string[] = [];
  usuarios: AdminUserListItem[] = [];
  ok = '';
  error = '';

  readonly consultaForm = this.fb.nonNullable.group({
    rol: ['conductor', [Validators.required]],
  });

  readonly cambioForm = this.fb.nonNullable.group({
    usuario_id: ['', [Validators.required]],
    nuevo_rol: ['conductor', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loadingUsuarios = true;
    this.authService.listUsersForAdmin().subscribe({
      next: (res) => {
        this.loadingUsuarios = false;
        this.usuarios = res ?? [];
      },
      error: (err) => {
        this.loadingUsuarios = false;
        this.error = err?.error?.detail ?? 'No se pudo cargar usuarios';
      },
    });
  }

  seleccionarUsuario(id: string): void {
    this.cambioForm.patchValue({ usuario_id: id });
  }

  consultar(): void {
    this.loadingConsulta = true;
    this.error = '';
    this.ok = '';
    this.permisos = [];

    this.authService.getRolePermissions(this.consultaForm.getRawValue().rol).subscribe({
      next: (res) => {
        this.loadingConsulta = false;
        this.permisos = res.permisos ?? [];
      },
      error: (err) => {
        this.loadingConsulta = false;
        this.error = err?.error?.detail ?? 'No se pudo consultar permisos';
      },
    });
  }

  cambiarRol(): void {
    if (this.cambioForm.invalid) return;
    this.loadingCambio = true;
    this.error = '';
    this.ok = '';

    const raw = this.cambioForm.getRawValue();
    this.authService.changeRole({
      usuario_id: raw.usuario_id,
      nuevo_rol: raw.nuevo_rol as 'conductor' | 'taller' | 'tecnico' | 'admin',
    }).subscribe({
      next: (res) => {
        this.loadingCambio = false;
        this.ok = `Rol actualizado: ${res.email} -> ${res.rol}`;
        if (res.rol === 'taller') {
          this.ok += ' | Siguiente paso: registrar datos del taller en "Registrar taller".';
        }
        this.cargarUsuarios();
      },
      error: (err) => {
        this.loadingCambio = false;
        this.error = err?.error?.detail ?? 'No se pudo cambiar rol';
      },
    });
  }
}
