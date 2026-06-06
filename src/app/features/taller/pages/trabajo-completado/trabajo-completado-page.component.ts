import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../auth/services/auth.service';
import { ServicioActivo, TallerService, TecnicoServicioAsignado } from '../../services/taller.service';

@Component({
  selector: 'app-trabajo-completado-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Registrar Trabajo Completado</h2>
      <p class="muted">Selecciona una solicitud activa y registra el cierre operativo.</p>
      <p *ngIf="loadingServicios" class="muted">Cargando solicitudes activas...</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud activa</label>
        <select formControlName="servicioId">
          <option value="" disabled>Selecciona una solicitud</option>
          <option *ngFor="let s of servicios" [value]="s.incidente_id">
            {{ s.codigo_solicitud }} · {{ s.cliente || 'Cliente' }} · {{ s.tipo_servicio || 'servicio general' }} · {{ labelEstado(s.estado) }}
          </option>
          <option *ngFor="let s of serviciosTecnico" [value]="s.asignacion_id">
            {{ s.codigo_solicitud }} · {{ s.cliente_nombre || 'Cliente' }} · {{ s.tipo_problema || 'servicio general' }} · {{ labelEstado(s.estado_servicio) }}
          </option>
        </select>

        <label>Descripción del trabajo</label>
        <textarea rows="2" formControlName="descripcionTrabajo" placeholder="Qué se realizó en el servicio"></textarea>

        <label>Observación final</label>
        <textarea rows="2" formControlName="observacion"></textarea>

        <label>Evidencia (URL opcional)</label>
        <textarea rows="2" formControlName="evidenciaUrl" placeholder="https://... (opcional)"></textarea>

        <button type="submit" [disabled]="loading || form.invalid || (!servicios.length && !serviciosTecnico.length)">
          {{ loading ? 'Guardando...' : 'Marcar como completado' }}
        </button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loadingServicios && !servicios.length && !serviciosTecnico.length" class="muted">
        No hay solicitudes activas para completar.
      </p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; min-width: 0; }
    .grid { display:grid; gap:8px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    .muted { color:#6d7890; }
    @media (max-width: 900px) {
      .card { padding: 12px; }
      .grid button { width: 100%; }
    }
  `],
})
export class TrabajoCompletadoPageComponent implements OnInit {
  loading = false;
  loadingServicios = false;
  ok = '';
  error = '';
  servicios: ServicioActivo[] = [];
  serviciosTecnico: TecnicoServicioAsignado[] = [];
  role = '';

  readonly form = this.fb.nonNullable.group({
    servicioId: ['', [Validators.required]],
    descripcionTrabajo: ['', [Validators.required, Validators.minLength(3)]],
    observacion: [''],
    evidenciaUrl: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getCurrentRole();
    this.cargarServiciosActivos();
  }

  labelEstado(estado: string | null | undefined): string {
    const key = (estado || '').trim().toLowerCase();
    const map: Record<string, string> = {
      pendiente_respuesta: 'Pendiente de respuesta',
      aceptada: 'Solicitud aceptada',
      tecnico_asignado: 'Técnico asignado',
      en_camino: 'Técnico en camino',
      en_diagnostico: 'Técnico en el lugar',
      diagnostico_completado: 'Diagnóstico completado',
      cotizacion_emitida: 'Cotización emitida',
      cotizacion_aceptada: 'Cotización aceptada',
      en_proceso: 'En atención',
      atendido: 'Servicio atendido',
      trabajo_completado: 'Trabajo completado',
      esperando_pago: 'Pago pendiente',
      pagado: 'Pagado',
      finalizado: 'Servicio finalizado',
      cancelado: 'Cancelado',
    };
    return map[key] || (estado || '-');
  }

  cargarServiciosActivos(): void {
    this.loadingServicios = true;
    this.error = '';
    if (this.role === 'tecnico') {
      this.tallerService.listarMisServiciosAsignadosTecnico().subscribe({
        next: (rows) => {
          this.loadingServicios = false;
          this.serviciosTecnico = rows;
          if (rows.length) {
            this.form.patchValue({ servicioId: rows[0].asignacion_id });
          }
        },
        error: (err) => {
          this.loadingServicios = false;
          this.error = err?.error?.detail ?? 'No se pudo cargar trabajos activos';
        },
      });
      return;
    }

    this.tallerService.listarServiciosActivos().subscribe({
      next: (rows) => {
        this.loadingServicios = false;
        this.servicios = rows;
        if (rows.length) {
          this.form.patchValue({ servicioId: rows[0].incidente_id });
        }
      },
      error: (err) => {
        this.loadingServicios = false;
        this.error = err?.error?.detail ?? 'No se pudo cargar servicios activos';
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';

    const { servicioId, descripcionTrabajo, observacion, evidenciaUrl } = this.form.getRawValue();
    const evidencias = evidenciaUrl?.trim() ? [evidenciaUrl.trim()] : [];
    const request$ = this.role === 'tecnico'
      ? this.tallerService.registrarTrabajoCompletadoTecnico(
          servicioId,
          descripcionTrabajo.trim(),
          observacion || undefined,
          evidencias,
        )
      : this.tallerService.registrarTrabajoCompletado(
          servicioId,
          descripcionTrabajo.trim(),
          observacion || undefined,
          evidenciaUrl || undefined,
        );
    request$.subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Trabajo completado registrado';
        this.cargarServiciosActivos();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo registrar el trabajo completado';
      },
    });
  }
}
