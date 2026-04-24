import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService, SolicitudServicio, TecnicoDisponible } from '../../services/asignacion.service';

@Component({
  selector: 'app-actualizar-estado-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Actualizar Estado del Servicio</h2>
      <p class="muted">CU17: avanza el servicio con transiciones válidas y trazabilidad.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud</label>
        <select formControlName="solicitudId" (change)="onSolicitudChange()">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudesOperativas" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} - {{ s.cliente_nombre || 'Cliente' }} - {{ estadoActual(s) }}
          </option>
        </select>

        <section class="timeline" *ngIf="seleccionada">
          <p class="t-title">Línea de tiempo</p>
          <div class="steps">
            <div *ngFor="let step of flujoEstados" class="step" [class.active]="isEstadoActivo(step)">
              {{ step }}
            </div>
          </div>
        </section>

        <label>Nuevo estado</label>
        <select formControlName="estado" (change)="onEstadoChange()">
          <option value="">Selecciona el siguiente estado</option>
          <option *ngFor="let e of estadosSiguientes" [value]="e">{{ e }}</option>
        </select>

        <label *ngIf="requiereTecnico">Técnico</label>
        <select *ngIf="requiereTecnico" formControlName="tecnicoId">
          <option value="">Selecciona técnico</option>
          <option *ngFor="let t of tecnicos" [value]="t.id">{{ t.nombre }}</option>
        </select>

        <label>Observación</label>
        <textarea rows="3" formControlName="observacion" placeholder="Comentario del cambio de estado"></textarea>

        <label>Costo (opcional)</label>
        <input type="number" formControlName="costo" />

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Guardando...' : 'Actualizar estado' }}
        </button>
      </form>

      <p *ngIf="habilitaCu18" class="hint-ok">Este servicio ya puede pasar a CU18 Registrar trabajo completado.</p>
      <p *ngIf="habilitaCu19" class="hint-info">CU19 habilitado: el cliente puede ver ubicación del técnico.</p>

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
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .hint-ok { color:#027a48; margin:10px 0 0; }
    .hint-info { color:#175cd3; margin:6px 0 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class ActualizarEstadoPageComponent implements OnInit {
  readonly flujoEstados = ['pendiente_respuesta', 'aceptada', 'tecnico_asignado', 'en_camino', 'en_proceso', 'atendido', 'finalizado'];
  private readonly transiciones: Record<string, string[]> = {
    pendiente_respuesta: ['aceptada'],
    aceptada: ['tecnico_asignado', 'cancelado'],
    tecnico_asignado: ['en_camino', 'cancelado'],
    en_camino: ['en_proceso', 'cancelado'],
    en_proceso: ['atendido', 'cancelado'],
    atendido: ['finalizado'],
    finalizado: [],
    cancelado: [],
  };

  solicitudesOperativas: SolicitudServicio[] = [];
  seleccionada: SolicitudServicio | null = null;
  estadosSiguientes: string[] = [];
  tecnicos: TecnicoDisponible[] = [];
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
    estado: ['', [Validators.required]],
    tecnicoId: [''],
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

  get requiereTecnico(): boolean {
    return this.form.getRawValue().estado === 'tecnico_asignado';
  }

  get habilitaCu18(): boolean {
    if (!this.seleccionada) return false;
    const estado = this.estadoActual(this.seleccionada);
    return ['atendido', 'finalizado'].includes(estado);
  }

  get habilitaCu19(): boolean {
    if (!this.seleccionada) return false;
    const estado = this.estadoActual(this.seleccionada);
    return ['tecnico_asignado', 'en_camino', 'en_proceso', 'atendido'].includes(estado);
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
      asignada: 'tecnico_asignado',
      completada: 'finalizado',
      cancelada: 'cancelado',
      aceptado: 'aceptada',
    };
    return map[estado] || estado;
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesOperativas = rows.filter((s) =>
          ['aceptada', 'tecnico_asignado', 'en_camino', 'en_proceso', 'atendido', 'asignada', 'aceptado'].includes(
            this.estadoActual(s),
          ),
        );
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes';
      },
    });
  }

  onSolicitudChange(): void {
    const raw = this.form.getRawValue();
    this.ok = '';
    this.error = '';
    this.tecnicos = [];
    this.form.patchValue({ estado: '', tecnicoId: '' }, { emitEvent: false });
    this.seleccionada = this.solicitudesOperativas.find((s) => s.id === raw.solicitudId) || null;
    if (!this.seleccionada) {
      this.estadosSiguientes = [];
      return;
    }
    const actual = this.estadoActual(this.seleccionada);
    this.estadosSiguientes = this.transiciones[actual] || [];
  }

  onEstadoChange(): void {
    const raw = this.form.getRawValue();
    if (raw.estado !== 'tecnico_asignado') {
      this.form.patchValue({ tecnicoId: '' }, { emitEvent: false });
      this.tecnicos = [];
      return;
    }
    const solicitudId = raw.solicitudId;
    if (!solicitudId) return;
    this.asignacionService.listarTecnicosDisponibles(solicitudId).subscribe({
      next: (rows) => {
        this.tecnicos = rows.filter((t) => !!t.disponible);
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar técnicos disponibles';
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
      .actualizarEstadoServicio(
        raw.solicitudId,
        raw.estado,
        raw.observacion || undefined,
        raw.tecnicoId || undefined,
        costo,
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.ok = `Estado actualizado a ${res.estado}`;
          this.form.patchValue({ solicitudId: '', estado: '', tecnicoId: '', observacion: '', costo: 0 });
          this.estadosSiguientes = [];
          this.seleccionada = null;
          this.tecnicos = [];
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo actualizar estado';
        },
      });
  }
}

