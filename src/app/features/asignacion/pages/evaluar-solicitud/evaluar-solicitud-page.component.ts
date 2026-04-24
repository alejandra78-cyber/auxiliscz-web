import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AsignacionService, SolicitudServicio, SolicitudServicioDetalle } from '../../services/asignacion.service';

@Component({
  selector: 'app-evaluar-solicitud-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Evaluar Solicitud de Servicio</h2>
      <p class="muted">Revisa el incidente asignado a tu taller y decide si aceptas o rechazas.</p>

      <label>Solicitud asignada</label>
      <select [formControl]="form.controls.solicitudId">
        <option value="">Selecciona una solicitud</option>
        <option *ngFor="let s of solicitudes" [value]="s.id">
          {{ s.codigo_solicitud || s.id }} · {{ s.tipo || 'incierto' }} · P{{ s.prioridad || '-' }} · {{ s.estado }}
        </option>
      </select>

      <section class="detalle" *ngIf="detalle">
        <div class="detalle-grid">
          <p><strong>Estado:</strong> {{ detalle.estado }}</p>
          <p><strong>Tipo:</strong> {{ detalle.tipo || 'incierto' }}</p>
          <p><strong>Prioridad:</strong> {{ detalle.prioridad || '-' }}</p>
          <p><strong>Cliente:</strong> {{ detalle.cliente_nombre || 'Cliente' }}</p>
          <p><strong>Ubicación:</strong> {{ detalle.latitud != null && detalle.longitud != null ? (detalle.latitud + ', ' + detalle.longitud) : '-' }}</p>
          <p><strong>Distancia:</strong> {{ detalle.distancia_km != null ? (detalle.distancia_km + ' km') : '-' }}</p>
          <p><strong>Puntaje:</strong> {{ detalle.puntaje_asignacion ?? '-' }}</p>
          <p><strong>Motivo asignación:</strong> {{ detalle.motivo_asignacion || '-' }}</p>
          <p><strong>Fecha asignación:</strong> {{ formatFecha(detalle.fecha_asignacion) }}</p>
        </div>

        <div class="ia-box">
          <strong>Resumen IA</strong>
          <p>{{ detalle.resumen_ia || 'Sin resumen automático' }}</p>
        </div>

        <div class="ev-box">
          <strong>Evidencias</strong>
          <p *ngIf="!detalle.evidencias?.length" class="muted">Sin evidencias.</p>
          <div class="ev-list" *ngIf="detalle.evidencias?.length">
            <article *ngFor="let e of detalle.evidencias" class="ev-item">
              <p><strong>Tipo:</strong> {{ e.tipo }}</p>
              <p *ngIf="e.transcripcion"><strong>Texto:</strong> {{ e.transcripcion }}</p>
              <p *ngIf="e.url_archivo"><strong>Archivo:</strong> {{ e.url_archivo }}</p>
            </article>
          </div>
        </div>

        <label>
          Motivo (solo si rechazas)
          <textarea rows="3" [formControl]="form.controls.observacion" placeholder="Motivo de rechazo (opcional)"></textarea>
        </label>

        <div class="actions" *ngIf="puedeEvaluar(detalle)">
          <button type="button" (click)="aceptar()" [disabled]="loading">{{ loading ? 'Procesando...' : 'Aceptar' }}</button>
          <button type="button" class="warn" (click)="rechazar()" [disabled]="loading">{{ loading ? 'Procesando...' : 'Rechazar' }}</button>
        </div>
        <p *ngIf="!puedeEvaluar(detalle)" class="muted">Esta solicitud ya fue evaluada y no admite cambios en CU15.</p>
      </section>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; display:grid; gap:10px; min-width:0; }
    .muted { color:#6d7890; margin:0; }
    .detalle { display:grid; gap:10px; border:1px solid #e7ebf5; border-radius:10px; padding:12px; background:#fbfcff; }
    .detalle-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px 10px; }
    .detalle-grid p { margin:0; font-size:13px; color:#31445f; }
    .ia-box, .ev-box { border:1px solid #e5ebf9; border-radius:10px; padding:10px; background:#fff; }
    .ia-box p { margin:6px 0 0; color:#334766; }
    .ev-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:6px; }
    .ev-item { border:1px solid #edf1f8; border-radius:8px; padding:8px; }
    .ev-item p { margin:0 0 4px; font-size:12px; color:#3e4f6b; }
    .actions { display:flex; gap:10px; }
    .warn { background:#c33d3c; }
    .ok { color:#027a48; margin:0; }
    .error { color:#b42318; margin:0; }
    @media (max-width: 900px) {
      .card { padding:12px; }
      .detalle-grid { grid-template-columns:1fr; }
      .ev-list { grid-template-columns:1fr; }
      .actions { flex-direction:column; }
      .actions button { width:100%; }
    }
  `],
})
export class EvaluarSolicitudPageComponent implements OnInit {
  solicitudes: SolicitudServicio[] = [];
  detalle: SolicitudServicioDetalle | null = null;
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.group({
    solicitudId: ['', [Validators.required]],
    observacion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.form.controls.solicitudId.valueChanges.subscribe((id) => {
      if (!id) {
        this.detalle = null;
        return;
      }
      this.cargarDetalle(id);
    });
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudes = (rows ?? []).filter((s) => this.puedeEvaluar(s));
        const selectedId = this.form.getRawValue().solicitudId;
        if (selectedId) this.cargarDetalle(selectedId);
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes';
      },
    });
  }

  cargarDetalle(id: string): void {
    const reqId = this.solicitudes.find((x) => x.id === id)?.incidente_id || id;
    this.asignacionService.obtenerDetalleSolicitud(reqId).subscribe({
      next: (res) => {
        this.detalle = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar el detalle';
        this.detalle = null;
      },
    });
  }

  puedeEvaluar(s: Pick<SolicitudServicio, 'estado'>): boolean {
    const est = (s.estado || '').toLowerCase();
    return ['asignada', 'pendiente_respuesta'].includes(est);
  }

  aceptar(): void {
    if (!this.detalle) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const reqId = this.detalle.incidente_id || this.detalle.id;
    this.asignacionService.aceptarSolicitud(reqId).subscribe({
      next: (res) => {
        this.loading = false;
        this.ok = `Solicitud ${res.codigo_solicitud || ''} aceptada correctamente`;
        this.form.patchValue({ observacion: '' });
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo aceptar la solicitud';
      },
    });
  }

  rechazar(): void {
    if (!this.detalle) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const reqId = this.detalle.incidente_id || this.detalle.id;
    const motivo = this.form.getRawValue().observacion?.trim() || undefined;
    this.asignacionService.rechazarSolicitud(reqId, motivo).subscribe({
      next: (res) => {
        this.loading = false;
        this.ok = `Solicitud ${res.codigo_solicitud || ''} rechazada`;
        this.form.patchValue({ solicitudId: '', observacion: '' });
        this.detalle = null;
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo rechazar la solicitud';
      },
    });
  }

  formatFecha(v?: string | null): string {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  }
}

