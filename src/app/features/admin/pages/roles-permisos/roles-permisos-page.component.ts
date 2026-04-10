import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';

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
          <option value="admin">admin</option>
        </select>
        <button type="submit" [disabled]="consultaForm.invalid || loadingConsulta">{{ loadingConsulta ? 'Consultando...' : 'Consultar permisos' }}</button>
      </form>

      <ul *ngIf="permisos.length" class="permisos">
        <li *ngFor="let permiso of permisos">{{ permiso }}</li>
      </ul>

      <form [formGroup]="cambioForm" (ngSubmit)="cambiarRol()" class="form-grid">
        <h3>Cambiar rol de usuario</h3>
        <label>ID usuario</label>
        <input type="text" formControlName="usuario_id" />

        <label>Nuevo rol</label>
        <select formControlName="nuevo_rol">
          <option value="conductor">conductor</option>
          <option value="taller">taller</option>
          <option value="admin">admin</option>
        </select>

        <button type="submit" [disabled]="cambioForm.invalid || loadingCambio">{{ loadingCambio ? 'Actualizando...' : 'Cambiar rol' }}</button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 760px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .form-grid { display:grid; gap:8px; margin-top: 14px; }
    .permisos { margin: 12px 0; padding-left: 16px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    h3 { margin: 10px 0 0; }
  `],
})
export class RolesPermisosPageComponent {
  loadingConsulta = false;
  loadingCambio = false;
  permisos: string[] = [];
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
      nuevo_rol: raw.nuevo_rol as 'conductor' | 'taller' | 'admin',
    }).subscribe({
      next: (res) => {
        this.loadingCambio = false;
        this.ok = `Rol actualizado: ${res.email} -> ${res.rol}`;
      },
      error: (err) => {
        this.loadingCambio = false;
        this.error = err?.error?.detail ?? 'No se pudo cambiar rol';
      },
    });
  }
}
