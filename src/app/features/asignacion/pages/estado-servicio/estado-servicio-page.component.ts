import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService } from '../../services/asignacion.service';

@Component({
  selector: 'app-estado-servicio-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Evaluar / Asignar / Actualizar Estado</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>ID incidente</label>
        <input type="text" formControlName="incidenteId" />
        <label>Nuevo estado</label>
        <select formControlName="estado">
          <option value="en_proceso">en_proceso</option>
          <option value="atendido">atendido</option>
          <option value="cancelado">cancelado</option>
        </select>
        <label>Costo (solo si atendido)</label>
        <input type="number" formControlName="costo" />
        <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Guardando...' : 'Actualizar' }}</button>
      </form>
      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class EstadoServicioPageComponent {
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    incidenteId: ['', [Validators.required]],
    estado: ['en_proceso', [Validators.required]],
    costo: [0],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const raw = this.form.getRawValue();
    const costo = Number(raw.costo) > 0 ? Number(raw.costo) : undefined;
    this.asignacionService.actualizarEstado(raw.incidenteId, raw.estado, costo).subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Estado actualizado correctamente';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo actualizar estado';
      },
    });
  }
}

