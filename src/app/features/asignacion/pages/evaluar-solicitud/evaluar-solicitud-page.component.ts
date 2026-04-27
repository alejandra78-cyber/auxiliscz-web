import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { divIcon, latLng, Map, marker, Marker, tileLayer } from 'leaflet';

import { AsignacionService, SolicitudServicio, SolicitudServicioDetalle } from '../../services/asignacion.service';
import { environment } from '../../../../../environments/environment';

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
          <p><strong>Ubicación reportada:</strong> {{ detalle.latitud != null && detalle.longitud != null ? (detalle.latitud + ', ' + detalle.longitud) : '-' }}</p>
          <p><strong>Distancia:</strong> {{ detalle.distancia_km != null ? (detalle.distancia_km + ' km') : '-' }}</p>
          <p><strong>Fecha asignación:</strong> {{ formatFecha(detalle.fecha_asignacion) }}</p>
        </div>

        <details class="tech-box">
          <summary>Detalles técnicos de asignación (CU16)</summary>
          <div class="tech-grid">
            <p><strong>Puntaje:</strong> {{ detalle.puntaje_asignacion ?? '-' }}</p>
            <p><strong>Origen:</strong> {{ detalle.origen_asignacion || '-' }}</p>
            <p class="full"><strong>Motivo asignación:</strong> {{ detalle.motivo_asignacion || '-' }}</p>
          </div>
        </details>

        <div class="map-box">
          <strong>Mapa de ubicación reportada por el cliente</strong>
          <p class="muted">Esta ubicación corresponde al punto reportado en la emergencia (no seguimiento en tiempo real del cliente).</p>
          <div id="evaluar-solicitud-map" class="map"></div>
        </div>

        <div class="ia-box">
          <strong>Resumen IA</strong>
          <p>{{ obtenerResumenIA(detalle) }}</p>
        </div>

        <div class="ev-box">
          <strong>Evidencias</strong>
          <p *ngIf="!evidenciasVisibles(detalle).length" class="muted">Sin evidencias.</p>
          <div class="ev-list" *ngIf="detalle.evidencias?.length">
            <article *ngFor="let e of evidenciasVisibles(detalle)" class="ev-item">
              <p><strong>Tipo:</strong> {{ etiquetaTipoEvidencia(e.tipo, e.metadata_json) }}</p>
              <ng-container *ngIf="esImagenEvidencia(e)">
                <img *ngIf="evidenciaImageUrl(e) as imgUrl" [src]="imgUrl" class="ev-image" alt="Evidencia de emergencia" />
                <p *ngIf="!evidenciaImageUrl(e)" class="muted">Imagen recibida{{ nombreArchivo(e.metadata_json) ? (': ' + nombreArchivo(e.metadata_json)) : '' }}.</p>
                <p *ngIf="e.transcripcion"><strong>Análisis IA:</strong> {{ textoAnalisis(e.transcripcion) }}</p>
              </ng-container>
              <p *ngIf="!esImagenEvidencia(e) && e.transcripcion"><strong>Texto:</strong> {{ e.transcripcion }}</p>
              <p *ngIf="e.url_archivo"><strong>Archivo:</strong> <a [href]="resolveFileUrl(e.url_archivo)" target="_blank" rel="noopener">Abrir evidencia</a></p>
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
    .tech-box { border:1px dashed #d8e1f4; border-radius:10px; padding:8px 10px; background:#fff; }
    .tech-box summary { cursor:pointer; font-weight:700; color:#2e4a77; }
    .tech-grid { margin-top:8px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px 10px; }
    .tech-grid p { margin:0; font-size:13px; color:#31445f; }
    .tech-grid .full { grid-column:1 / -1; }
    .map-box { border:1px solid #e5ebf9; border-radius:10px; padding:10px; background:#fff; display:grid; gap:6px; }
    .map { height: 240px; width:100%; border-radius:8px; border:1px solid #dbe4f7; }
    :host ::ng-deep .pin-dot {
      width: 16px; height: 16px; border-radius: 50%;
      background: #e24b4a; border: 3px solid #fff; box-shadow: 0 0 0 2px #e24b4a;
    }
    .ia-box, .ev-box { border:1px solid #e5ebf9; border-radius:10px; padding:10px; background:#fff; }
    .ia-box p { margin:6px 0 0; color:#334766; }
    .ev-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:6px; }
    .ev-item { border:1px solid #edf1f8; border-radius:8px; padding:8px; }
    .ev-item p { margin:0 0 4px; font-size:12px; color:#3e4f6b; }
    .ev-image { width:100%; max-height:220px; object-fit:cover; border-radius:8px; border:1px solid #dbe4f7; margin-bottom:6px; }
    .actions { display:flex; gap:10px; }
    .warn { background:#c33d3c; }
    .ok { color:#027a48; margin:0; }
    .error { color:#b42318; margin:0; }
    @media (max-width: 900px) {
      .card { padding:12px; }
      .detalle-grid { grid-template-columns:1fr; }
      .tech-grid { grid-template-columns:1fr; }
      .ev-list { grid-template-columns:1fr; }
      .map { height: 210px; }
      .actions { flex-direction:column; }
      .actions button { width:100%; }
    }
  `],
})
export class EvaluarSolicitudPageComponent implements OnInit, AfterViewInit, OnDestroy {
  solicitudes: SolicitudServicio[] = [];
  detalle: SolicitudServicioDetalle | null = null;
  loading = false;
  ok = '';
  error = '';
  private map: Map | null = null;
  private markerIncidente: Marker | null = null;

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

  ngAfterViewInit(): void {
    this.ensureMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    window.removeEventListener('resize', this.onResize);
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
        setTimeout(() => {
          this.ensureMap();
          this.actualizarMapaUbicacion();
        }, 0);
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

  obtenerResumenIA(detalle: SolicitudServicioDetalle): string {
    if (detalle.resumen_ia?.trim()) return detalle.resumen_ia.trim();
    for (const e of detalle.evidencias || []) {
      if (e.tipo !== 'texto' || !e.transcripcion) continue;
      try {
        const meta = JSON.parse(e.metadata_json || '{}');
        if (meta?.subtipo === 'resumen_ia') return e.transcripcion;
      } catch {
        // ignore
      }
    }
    return 'Sin resumen automático';
  }

  evidenciasVisibles(detalle: SolicitudServicioDetalle) {
    return (detalle.evidencias || []).filter((e) => {
      if (e.tipo !== 'texto') return true;
      try {
        const meta = JSON.parse(e.metadata_json || '{}');
        return !['resumen_ia', 'clasificacion_ia'].includes(String(meta?.subtipo || ''));
      } catch {
        return true;
      }
    });
  }

  esImagenEvidencia(e: { tipo: string }): boolean {
    return (e.tipo || '').toLowerCase() === 'imagen';
  }

  etiquetaTipoEvidencia(tipo: string, metadata?: string | null): string {
    const t = (tipo || '').toLowerCase();
    if (t !== 'texto') return t;
    try {
      const meta = JSON.parse(metadata || '{}');
      if (meta?.subtipo === 'resumen_ia') return 'resumen_ia';
      if (meta?.subtipo === 'clasificacion_ia') return 'clasificacion_ia';
    } catch {
      // ignore
    }
    return 'texto';
  }

  nombreArchivo(metadata?: string | null): string {
    if (!metadata) return '';
    try {
      const meta = JSON.parse(metadata);
      return String(meta?.filename || '').trim();
    } catch {
      return '';
    }
  }

  textoAnalisis(raw?: string | null): string {
    const v = (raw || '').trim();
    if (!v) return '-';
    try {
      const o = JSON.parse(v);
      const problema = o?.problema_detectado ? `Problema: ${o.problema_detectado}` : '';
      const categoria = o?.categoria_probable ? `Categoría: ${o.categoria_probable}` : '';
      const nivel = o?.nivel_danio ? `Daño: ${o.nivel_danio}` : '';
      const conf = typeof o?.confianza === 'number' ? `Confianza: ${o.confianza}` : '';
      return [problema, categoria, nivel, conf].filter(Boolean).join(' | ') || v;
    } catch {
      return v;
    }
  }

  resolveFileUrl(raw?: string | null): string {
    const v = (raw || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    const base = environment.apiUrl.replace(/\/api\/?$/i, '');
    if (v.startsWith('/')) return `${base}${v}`;
    return `${base}/${v}`;
  }

  evidenciaImageUrl(e: { url_archivo?: string | null; metadata_json?: string | null; tipo?: string }): string | null {
    const direct = this.resolveFileUrl(e.url_archivo || '');
    if (direct) return direct;
    const filename = this.nombreArchivo(e.metadata_json);
    if (!filename) return null;
    return this.resolveFileUrl(`/uploads/emergencias/${filename}`);
  }

  private ensureMap(): void {
    if (this.map) return;
    const host = document.getElementById('evaluar-solicitud-map');
    if (!host) return;
    this.map = new Map('evaluar-solicitud-map', { zoomControl: true, preferCanvas: true }).setView([-17.7833, -63.1821], 12);
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      updateWhenIdle: true,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    const defaultIcon = divIcon({
      className: '',
      html: '<div class="pin-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    this.markerIncidente = marker([-17.7833, -63.1821], { draggable: false, icon: defaultIcon }).addTo(this.map);
    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
      setTimeout(() => this.map?.invalidateSize(), 250);
    });
    window.addEventListener('resize', this.onResize);
  }

  private actualizarMapaUbicacion(): void {
    if (!this.map || !this.markerIncidente || !this.detalle) return;
    if (this.detalle.latitud == null || this.detalle.longitud == null) return;
    const lat = Number(this.detalle.latitud);
    const lng = Number(this.detalle.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    this.markerIncidente.setLatLng(latLng(lat, lng));
    this.map.setView([lat, lng], 14);
    this.map.invalidateSize();
  }

  private readonly onResize = () => this.map?.invalidateSize();
}
