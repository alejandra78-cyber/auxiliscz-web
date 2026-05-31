import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

import {
  AsignacionService,
  SolicitudServicio,
  TecnicoDisponible,
} from '../../services/asignacion.service';
import { OfflineSyncService } from '../../../emergencia/services/offline-sync.service';

type OperativeAction =
  | 'aceptar_solicitud'
  | 'rechazar_solicitud'
  | 'asignar_tecnico'
  | 'iniciar_ruta'
  | 'llegue_al_lugar'
  | 'completar_diagnostico'
  | 'iniciar_atencion'
  | 'generar_cotizacion'
  | 'finalizar_servicio';

@Component({
  selector: 'app-actualizar-estado-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Operación del Servicio</h2>
      <p class="muted">Ejecuta acciones reales. El sistema actualiza el estado automáticamente.</p>

      <form [formGroup]="form" class="grid">
        <label>Solicitud</label>
        <select formControlName="solicitudId" (change)="onSolicitudChange()">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudesOperativas" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} · {{ s.cliente_nombre || 'Cliente' }} · {{ labelEstado(estadoActual(s)) }}
          </option>
        </select>

        <section class="timeline" *ngIf="seleccionada">
          <p class="t-title">Progreso del servicio</p>
          <div class="steps">
            <div *ngFor="let step of flujoEstados" class="step" [class.active]="isEstadoActivo(step)">
              {{ labelEstado(step) }}
            </div>
          </div>
        </section>

        <label *ngIf="showTecnicos">Técnico</label>
        <select *ngIf="showTecnicos" formControlName="tecnicoId">
          <option value="">Selecciona técnico</option>
          <option *ngFor="let t of tecnicos" [value]="t.id">{{ t.nombre }}</option>
        </select>

        <label *ngIf="showServicio">Servicio</label>
        <select *ngIf="showServicio" formControlName="servicio">
          <option value="diagnostico">Diagnóstico</option>
          <option value="cambio_llanta">Cambio de llanta</option>
          <option value="paso_corriente">Paso de corriente</option>
          <option value="combustible">Combustible</option>
          <option value="grua">Grúa</option>
          <option value="otro">Otro</option>
        </select>

        <label>Observación</label>
        <textarea rows="3" formControlName="observacion" placeholder="Comentario opcional"></textarea>
      </form>

      <section *ngIf="seleccionada" class="actions">
        <button *ngFor="let a of accionesDisponibles" type="button" [disabled]="loading || isReadonly" (click)="ejecutar(a.key)">
          {{ a.label }}
        </button>
      </section>

      <p *ngIf="isReadonly" class="hint-info">
        Modo solo lectura: el administrador puede monitorear, pero no operar solicitudes.
      </p>
      <p *ngIf="habilitaCu20" class="hint-info">Diagnóstico completado. Ya puedes generar una cotización.</p>
      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .timeline { border:1px solid #e2e6ef; border-radius:10px; padding:10px; background:#f8fbff; }
    .t-title { margin:0 0 6px; font-weight:700; color:#1f2b45; }
    .steps { display:grid; gap:6px; }
    .step { border:1px solid #e3e9f7; border-radius:8px; padding:6px 8px; color:#5d6b85; font-size:13px; }
    .step.active { border-color:#bfd3ff; background:#eaf2ff; color:#1f3a7a; font-weight:700; }
    .actions { display:grid; gap:8px; margin-top:12px; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); }
    .actions button { border:0; border-radius:10px; background:#1f3a7a; color:#fff; padding:10px 12px; font-weight:600; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .hint-info { color:#175cd3; margin:8px 0 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class ActualizarEstadoPageComponent implements OnInit {
  readonly flujoEstados = [
    'pendiente_respuesta',
    'aceptada',
    'tecnico_asignado',
    'en_camino',
    'en_diagnostico',
    'diagnostico_completado',
    'cotizacion_aceptada',
    'en_proceso',
    'atendido',
    'finalizado',
  ];

  solicitudesOperativas: SolicitudServicio[] = [];
  seleccionada: SolicitudServicio | null = null;
  tecnicos: TecnicoDisponible[] = [];
  loading = false;
  ok = '';
  error = '';
  isReadonly = false;
  currentRole = '';

  private normalizeRole(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  readonly form = this.fb.nonNullable.group({
    solicitudId: [''],
    tecnicoId: [''],
    servicio: ['diagnostico'],
    observacion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly offlineSync: OfflineSyncService,
  ) {}

  ngOnInit(): void {
    this.offlineSync.startAutoSync();
    this.isReadonly = this.route.snapshot.queryParamMap.get('modo') === 'supervision';
    this.currentRole = this.normalizeRole(this.authService.getCurrentRole());
    this.cargarSolicitudes();
  }

  get showTecnicos(): boolean {
    return this.accionesDisponibles.some((a) => a.key === 'asignar_tecnico');
  }

  get showServicio(): boolean {
    return this.showTecnicos;
  }

  get habilitaCu20(): boolean {
    if (!this.seleccionada) return false;
    return this.estadoActual(this.seleccionada) === 'diagnostico_completado';
  }

  get accionesDisponibles(): Array<{ key: OperativeAction; label: string }> {
    if (!this.seleccionada) return [];
    const actual = this.estadoActual(this.seleccionada);
    const mapTaller: Record<string, Array<{ key: OperativeAction; label: string }>> = {
      pendiente_respuesta: [
        { key: 'aceptar_solicitud', label: 'Aceptar solicitud' },
        { key: 'rechazar_solicitud', label: 'Rechazar solicitud' },
      ],
      aceptada: [{ key: 'asignar_tecnico', label: 'Asignar técnico' }],
      en_diagnostico: [{ key: 'generar_cotizacion', label: 'Generar cotización' }],
      diagnostico_completado: [{ key: 'generar_cotizacion', label: 'Generar cotización' }],
      cotizacion_aceptada: [{ key: 'iniciar_atencion', label: 'Iniciar atención' }],
      en_proceso: [{ key: 'finalizar_servicio', label: 'Finalizar servicio' }],
    };
    const mapTecnico: Record<string, Array<{ key: OperativeAction; label: string }>> = {
      tecnico_asignado: [{ key: 'iniciar_ruta', label: 'Iniciar ruta' }],
      en_camino: [{ key: 'llegue_al_lugar', label: 'Llegué al lugar' }],
      en_diagnostico: [
        { key: 'completar_diagnostico', label: 'Diagnóstico completado' },
        { key: 'iniciar_atencion', label: 'Iniciar atención' },
      ],
      diagnostico_completado: [{ key: 'iniciar_atencion', label: 'Iniciar atención' }],
      cotizacion_aceptada: [{ key: 'iniciar_atencion', label: 'Iniciar atención' }],
      en_proceso: [{ key: 'finalizar_servicio', label: 'Finalizar servicio' }],
    };
    if (this.currentRole === 'tecnico') return mapTecnico[actual] || [];
    return mapTaller[actual] || [];
  }

  estadoActual(s: SolicitudServicio): string {
    return this.normalizarEstado((s.estado_asignacion || s.estado || '').toLowerCase());
  }

  isEstadoActivo(estado: string): boolean {
    if (!this.seleccionada) return false;
    const actual = this.estadoActual(this.seleccionada);
    return this.flujoEstados.indexOf(estado) <= this.flujoEstados.indexOf(actual);
  }

  normalizarEstado(estado: string): string {
    const map: Record<string, string> = {
      asignada: 'pendiente_respuesta',
      aceptado: 'aceptada',
      completada: 'finalizado',
      cancelada: 'cancelado',
    };
    return map[estado] || estado;
  }

  labelEstado(estado: string): string {
    const map: Record<string, string> = {
      pendiente_respuesta: 'Pendiente de respuesta',
      aceptada: 'Solicitud aceptada',
      tecnico_asignado: 'Técnico asignado',
      en_camino: 'Técnico en camino',
      en_diagnostico: 'Técnico en el lugar',
      diagnostico_completado: 'Diagnóstico completado',
      cotizacion_aceptada: 'Cotización aceptada',
      en_proceso: 'En atención',
      atendido: 'Servicio atendido',
      finalizado: 'Servicio finalizado',
      cancelado: 'Cancelado',
    };
    return map[estado] || estado;
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesOperativas = (rows || []).filter((s) =>
          [
            'pendiente_respuesta',
            'aceptada',
            'tecnico_asignado',
            'en_camino',
            'en_diagnostico',
            'diagnostico_completado',
            'cotizacion_aceptada',
            'en_proceso',
            'atendido',
          ].includes(this.estadoActual(s)),
        );
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes';
      },
    });
  }

  onSolicitudChange(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    this.ok = '';
    this.error = '';
    this.tecnicos = [];
    this.form.patchValue({ tecnicoId: '' }, { emitEvent: false });
    this.seleccionada = this.solicitudesOperativas.find((s) => s.id === solicitudId) || null;
    if (this.showTecnicos && solicitudId) {
      this.asignacionService.listarTecnicosDisponibles(solicitudId).subscribe({
        next: (rows) => {
          this.tecnicos = (rows || []).filter((t) => !!t.disponible);
        },
        error: (err) => {
          this.error = err?.error?.detail ?? 'No se pudieron cargar técnicos disponibles';
        },
      });
    }
  }

  ejecutar(accion: OperativeAction): void {
    if (!this.seleccionada || this.isReadonly || this.loading) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const raw = this.form.getRawValue();
    if (!navigator.onLine) {
      this.offlineSync.queueOperation('accion_servicio', {
        incidente_id: this.seleccionada.id,
        accion,
        observacion: raw.observacion || undefined,
        tecnico_id: raw.tecnicoId || undefined,
        servicio: raw.servicio || undefined,
      });
      this.loading = false;
      this.ok = 'Acción guardada sin conexión. Se sincronizará cuando vuelva internet.';
      return;
    }
    this.asignacionService
      .ejecutarAccionOperativa(this.seleccionada.id, accion, {
        observacion: raw.observacion || undefined,
        tecnicoId: raw.tecnicoId || undefined,
        servicio: raw.servicio || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.ok = `Acción ejecutada. Estado actual: ${res.estado_asignacion || res.estado}`;
          if (accion === 'generar_cotizacion') {
            this.router.navigate(['/pagos/generar-cotizacion']);
          }
          this.form.patchValue({ tecnicoId: '', observacion: '' }, { emitEvent: false });
          this.cargarSolicitudes();
          this.seleccionada = null;
          this.form.patchValue({ solicitudId: '' }, { emitEvent: false });
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo ejecutar la acción';
        },
      });
  }
}
