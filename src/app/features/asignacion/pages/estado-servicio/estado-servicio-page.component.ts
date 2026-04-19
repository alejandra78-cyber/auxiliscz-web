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
      <h2>Gestión de Solicitud de Servicio</h2>
      <p class="hint">Flujo recomendado: evaluar solicitud, asignar técnico y luego actualizar estado a en_proceso o cancelada.</p>
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>ID incidente</label>
        <input type="text" formControlName="incidenteId" />
        <label>Acción</label>
        <select formControlName="accion">
          <option value="evaluar_aprobar">Evaluar solicitud (aprobar)</option>
          <option value="evaluar_rechazar">Evaluar solicitud (rechazar)</option>
          <option value="asignar">Asignar técnico/servicio</option>
          <option value="estado">Actualizar estado operativo</option>
        </select>
        <label>Observación (evaluación)</label>
        <input type="text" formControlName="observacion" />
        <label>ID técnico (asignar)</label>
        <input type="text" formControlName="tecnicoId" />
        <label>Nuevo estado</label>
        <select formControlName="estado">
          <option value="en_proceso">en_proceso</option>
          <option value="cancelada">cancelada</option>
        </select>
        <label>Costo (solo si atendido)</label>
        <input type="number" formControlName="costo" />
        <small class="hint">Nota: el cierre en <b>completada</b> se realiza en la vista "Trabajo completado".</small>
        <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Guardando...' : 'Ejecutar' }}</button>
      </form>
      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .hint { color:#6d7890; margin: 0 0 8px 0; }
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
    accion: ['estado', [Validators.required]],
    observacion: [''],
    tecnicoId: [''],
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
    const done = (msg: string) => {
      this.loading = false;
      this.ok = msg;
    };
    const fail = (err: any) => {
      this.loading = false;
      this.error = err?.error?.detail ?? 'No se pudo ejecutar acción';
    };

    if (raw.accion === 'evaluar_aprobar') {
      this.asignacionService.evaluarSolicitud(raw.incidenteId, true, raw.observacion || undefined).subscribe({
        next: () => done('Solicitud evaluada y aprobada'),
        error: fail,
      });
      return;
    }
    if (raw.accion === 'evaluar_rechazar') {
      this.asignacionService.evaluarSolicitud(raw.incidenteId, false, raw.observacion || undefined).subscribe({
        next: () => done('Solicitud evaluada y rechazada'),
        error: fail,
      });
      return;
    }
    if (raw.accion === 'asignar') {
      this.asignacionService.asignarServicio(raw.incidenteId, raw.tecnicoId || '', 'otro', raw.observacion || undefined).subscribe({
        next: () => done('Servicio asignado'),
        error: fail,
      });
      return;
    }
    this.asignacionService.actualizarEstado(raw.incidenteId, raw.estado, costo, raw.observacion || undefined).subscribe({
      next: () => done('Estado actualizado correctamente'),
      error: fail,
    });
  }
}
