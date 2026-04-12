import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-trabajo-completado-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Registrar Trabajo Completado</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>ID del incidente</label>
        <input type="text" formControlName="incidenteId" />
        <label>Costo final</label>
        <input type="number" formControlName="costo" />
        <button type="submit" [disabled]="loading || form.invalid">{{ loading ? 'Guardando...' : 'Marcar como atendido' }}</button>
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
export class TrabajoCompletadoPageComponent {
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    incidenteId: ['', [Validators.required]],
    costo: [0, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
  ) {}

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const { incidenteId, costo } = this.form.getRawValue();
    this.tallerService.actualizarEstadoServicio(incidenteId, 'atendido', Number(costo)).subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Trabajo completado registrado';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo registrar el trabajo completado';
      },
    });
  }
}

