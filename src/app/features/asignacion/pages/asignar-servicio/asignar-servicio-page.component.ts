import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService, ServicioCatalogo, SolicitudServicio, TecnicoDisponible } from '../../services/asignacion.service';

@Component({
  selector: 'app-asignar-servicio-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Asignar Servicio</h2>
      <p class="muted">Solo se muestran solicitudes aprobadas. Debes elegir servicio del catálogo y técnico disponible.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud aprobada</label>
        <select formControlName="solicitudId" (change)="onSolicitudChange()">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudesAprobadas" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} - {{ s.tipo || 'incierto' }} - {{ s.cliente_nombre || 'Cliente' }}
          </option>
        </select>
        <button type="button" (click)="aplicarSugerenciaIA()" [disabled]="!form.getRawValue().solicitudId || loading">
          Sugerir con IA
        </button>
        <small *ngIf="sugerencia" class="muted">{{ sugerencia }}</small>

        <label>Servicio a realizar</label>
        <select formControlName="servicio">
          <option value="">Selecciona un servicio</option>
          <option *ngFor="let srv of servicios" [value]="srv.codigo">
            {{ srv.nombre }} - {{ srv.descripcion }}
          </option>
        </select>

        <label>Técnico disponible</label>
        <select formControlName="tecnicoId">
          <option value="">Selecciona un técnico</option>
          <option *ngFor="let t of tecnicos" [value]="t.id">
            {{ t.nombre }}{{ t.especialidad ? (' - ' + t.especialidad) : '' }} - {{ t.disponible ? 'Disponible' : 'No disponible' }}
          </option>
        </select>

        <label>Observación</label>
        <textarea rows="3" formControlName="observacion" placeholder="Comentario opcional de asignación"></textarea>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Asignando...' : 'Asignar servicio' }}
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
export class AsignarServicioPageComponent implements OnInit {
  solicitudesAprobadas: SolicitudServicio[] = [];
  tecnicos: TecnicoDisponible[] = [];
  servicios: ServicioCatalogo[] = [];
  loading = false;
  ok = '';
  error = '';
  sugerencia = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
    servicio: ['', [Validators.required]],
    tecnicoId: ['', [Validators.required]],
    observacion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarServicios();
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesAprobadas = rows.filter((s) => (s.estado || '').toLowerCase() === 'aprobada');
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes aprobadas';
      },
    });
  }

  cargarServicios(): void {
    this.asignacionService.listarServiciosCatalogo().subscribe({
      next: (rows) => {
        this.servicios = rows;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar catálogo de servicios';
      },
    });
  }

  onSolicitudChange(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    this.tecnicos = [];
    this.form.patchValue({ tecnicoId: '' });
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
    this.asignacionService
      .asignarServicio(raw.solicitudId, raw.tecnicoId, raw.servicio, raw.observacion || undefined)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.ok = `Servicio asignado correctamente a ${res.tecnico_nombre || 'técnico'}`;
          this.form.patchValue({ solicitudId: '', tecnicoId: '', servicio: '', observacion: '' });
          this.sugerencia = '';
          this.tecnicos = [];
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo asignar servicio';
        },
      });
  }

  aplicarSugerenciaIA(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    if (!solicitudId) return;
    this.sugerencia = '';
    this.asignacionService.sugerenciaAsignacionIA(solicitudId).subscribe({
      next: (s) => {
        if (s.tecnico_id) {
          this.form.patchValue({
            tecnicoId: s.tecnico_id,
            servicio: s.servicio_sugerido || this.form.getRawValue().servicio,
          });
        }
        this.sugerencia = `Sugerencia IA: ${s.tecnico_nombre || 'Sin técnico'} | servicio=${s.servicio_sugerido || '-'} | ${s.motivo || ''}`;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo obtener sugerencia IA';
      },
    });
  }
}
