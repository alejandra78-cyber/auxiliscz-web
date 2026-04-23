import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService, SolicitudServicio } from '../../services/asignacion.service';

@Component({
  selector: 'app-evaluar-solicitud-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Evaluar Solicitud de Servicio</h2>
      <p class="muted">Selecciona una solicitud pendiente y decide si se aprueba o rechaza.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud</label>
        <select formControlName="solicitudId">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudes" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} - {{ s.tipo || 'incierto' }} - P{{ s.prioridad }} - {{ s.estado }}
          </option>
        </select>

        <div *ngIf="selected" class="ia-box">
          <strong>Asistencia IA</strong>
          <div>Tipo sugerido: {{ selected.tipo_sugerido_ia || selected.tipo || 'incierto' }}</div>
          <div>Prioridad sugerida: {{ selected.prioridad_sugerida_ia || selected.prioridad || '-' }}</div>
          <div>Resumen: {{ selected.resumen_ia || 'Sin resumen automático' }}</div>
        </div>

        <label>Decisión</label>
        <select formControlName="aprobar">
          <option [ngValue]="true">Aprobar</option>
          <option [ngValue]="false">Rechazar</option>
        </select>

        <label>Observación</label>
        <textarea rows="3" formControlName="observacion" placeholder="Comentario de evaluación"></textarea>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Guardando...' : 'Evaluar solicitud' }}
        </button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; min-width: 0; }
    .grid { display:grid; gap:8px; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .ia-box { background:#f8fafc; border:1px solid #e2e6ef; border-radius:10px; padding:10px; margin-top:2px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    @media (max-width: 900px) {
      .card { padding: 12px; }
      .grid button { width: 100%; }
    }
  `],
})
export class EvaluarSolicitudPageComponent implements OnInit {
  solicitudes: SolicitudServicio[] = [];
  selected: SolicitudServicio | null = null;
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
    aprobar: [true, [Validators.required]],
    observacion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.form.controls.solicitudId.valueChanges.subscribe((id) => {
      this.selected = this.solicitudes.find((s) => s.id === id) ?? null;
    });
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudes = rows.filter((s) => ['pendiente', 'en_evaluacion'].includes((s.estado || '').toLowerCase()));
        const selectedId = this.form.getRawValue().solicitudId;
        this.selected = this.solicitudes.find((s) => s.id === selectedId) ?? null;
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
    this.asignacionService.evaluarSolicitud(raw.solicitudId, !!raw.aprobar, raw.observacion || undefined).subscribe({
      next: (res) => {
        this.loading = false;
        this.ok = `Solicitud ${res.codigo_solicitud || ''} evaluada: ${res.estado}`;
        this.form.patchValue({ solicitudId: '', observacion: '' });
        this.selected = null;
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo evaluar solicitud';
      },
    });
  }
}

