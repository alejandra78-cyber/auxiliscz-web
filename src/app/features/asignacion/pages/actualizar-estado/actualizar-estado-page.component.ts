import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService, SolicitudServicio } from '../../services/asignacion.service';

@Component({
  selector: 'app-actualizar-estado-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Actualizar Estado del Servicio</h2>
      <p class="muted">Selecciona una solicitud activa y actualiza su avance operativo.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud</label>
        <select formControlName="solicitudId">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudesOperativas" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} - {{ s.cliente_nombre || 'Cliente' }} - {{ s.estado }}
          </option>
        </select>

        <label>Nuevo estado</label>
        <select formControlName="estado">
          <option value="asignada">asignada</option>
          <option value="en_proceso">en_proceso</option>
          <option value="completada">completada</option>
          <option value="cancelada">cancelada</option>
        </select>

        <label>Observación</label>
        <textarea rows="3" formControlName="observacion" placeholder="Comentario del cambio de estado"></textarea>

        <label>Costo (solo si aplica)</label>
        <input type="number" formControlName="costo" />

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Guardando...' : 'Actualizar estado' }}
        </button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class ActualizarEstadoPageComponent implements OnInit {
  solicitudesOperativas: SolicitudServicio[] = [];
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
    estado: ['en_proceso', [Validators.required]],
    observacion: [''],
    costo: [0],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesOperativas = rows.filter((s) =>
          ['aprobada', 'asignada', 'en_proceso'].includes((s.estado || '').toLowerCase()),
        );
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes';
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const raw = this.form.getRawValue();
    const costo = Number(raw.costo) > 0 ? Number(raw.costo) : undefined;
    this.asignacionService
      .actualizarEstado(raw.solicitudId, raw.estado, costo, raw.observacion || undefined)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.ok = `Estado actualizado a ${res.estado}`;
          this.form.patchValue({ solicitudId: '', observacion: '', costo: 0 });
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo actualizar estado';
        },
      });
  }
}

