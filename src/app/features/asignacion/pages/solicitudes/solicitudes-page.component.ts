import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AsignacionService,
  SolicitudServicio,
  SolicitudServicioDetalle,
} from '../../services/asignacion.service';

@Component({
  selector: 'app-solicitudes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="hero">
        <p class="eyebrow">Taller</p>
        <h2>Consultar solicitudes de servicio</h2>
        <p class="sub">Visualiza solo solicitudes de tu taller con prioridad, ubicación, evidencias y contexto para CU15/CU16/CU17.</p>
      </header>

      <section class="filters">
        <label>
          Estado
          <select [(ngModel)]="filtroEstado" (change)="cargar()">
            <option value="">Todos</option>
            <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
          </select>
        </label>
        <label>
          Fecha desde
          <input type="date" [(ngModel)]="fechaDesde" (change)="cargar()" />
        </label>
        <label>
          Fecha hasta
          <input type="date" [(ngModel)]="fechaHasta" (change)="cargar()" />
        </label>
        <label class="search">
          Buscar
          <input type="text" [(ngModel)]="textoBusqueda" placeholder="Código, cliente, tipo..." />
        </label>
        <button type="button" (click)="cargar()" [disabled]="loading">{{ loading ? 'Actualizando...' : 'Actualizar' }}</button>
      </section>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="desktop-table" *ngIf="!loading && solicitudesFiltradas.length">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Distancia</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of solicitudesFiltradas">
              <td>{{ s.codigo_solicitud || ('SOL-' + s.id.slice(0, 8).toUpperCase()) }}</td>
              <td>{{ s.cliente_nombre || 'Cliente' }}</td>
              <td>{{ s.tipo || 'incierto' }}</td>
              <td><span class="prio" [class.p1]="s.prioridad === 1" [class.p2]="s.prioridad === 2">{{ s.prioridad || '-' }}</span></td>
              <td><span class="estado">{{ s.estado_asignacion || s.estado }}</span></td>
              <td>{{ s.distancia_km != null ? (s.distancia_km + ' km') : '-' }}</td>
              <td>{{ formatFecha(s.creado_en) }}</td>
              <td><button type="button" (click)="verDetalle(s)">Ver detalle</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list" *ngIf="!loading && solicitudesFiltradas.length">
        <article class="card" *ngFor="let s of solicitudesFiltradas">
          <div class="head">
            <h4>{{ s.codigo_solicitud || ('SOL-' + s.id.slice(0, 8).toUpperCase()) }}</h4>
            <span class="estado">{{ s.estado_asignacion || s.estado }}</span>
          </div>
          <p><strong>Cliente:</strong> {{ s.cliente_nombre || 'Cliente' }}</p>
          <p><strong>Tipo:</strong> {{ s.tipo || 'incierto' }}</p>
          <p><strong>Prioridad:</strong> {{ s.prioridad || '-' }}</p>
          <p><strong>Distancia:</strong> {{ s.distancia_km != null ? (s.distancia_km + ' km') : '-' }}</p>
          <p><strong>Fecha:</strong> {{ formatFecha(s.creado_en) }}</p>
          <button type="button" (click)="verDetalle(s)">Ver detalle</button>
        </article>
      </div>

      <p *ngIf="!loading && !solicitudesFiltradas.length && !error" class="muted">No hay solicitudes para los filtros seleccionados.</p>

      <section class="detalle" *ngIf="detalle">
        <div class="detalle-head">
          <h3>Detalle de solicitud {{ detalle.codigo_solicitud || ('SOL-' + detalle.id.slice(0, 8).toUpperCase()) }}</h3>
          <button type="button" class="secondary" (click)="cerrarDetalle()">Cerrar</button>
        </div>
        <div class="detalle-grid">
          <p><strong>Estado:</strong> {{ detalle.estado }}</p>
          <p><strong>Tipo problema:</strong> {{ detalle.tipo || 'incierto' }}</p>
          <p><strong>Prioridad:</strong> {{ detalle.prioridad || '-' }}</p>
          <p><strong>Cliente:</strong> {{ detalle.cliente_nombre || 'Cliente' }}</p>
          <p><strong>Taller:</strong> {{ detalle.taller_nombre || '-' }}</p>
          <p><strong>Técnico:</strong> {{ detalle.tecnico_nombre || '-' }}</p>
          <p><strong>Servicio:</strong> {{ detalle.servicio || '-' }}</p>
          <p><strong>Ubicación:</strong> {{ detalle.latitud != null && detalle.longitud != null ? (detalle.latitud + ', ' + detalle.longitud) : '-' }}</p>
          <p><strong>Distancia:</strong> {{ detalle.distancia_km != null ? (detalle.distancia_km + ' km') : '-' }}</p>
          <p><strong>Puntaje asignación:</strong> {{ detalle.puntaje_asignacion ?? '-' }}</p>
          <p><strong>Fecha creación:</strong> {{ formatFecha(detalle.creado_en) }}</p>
          <p><strong>Fecha asignación:</strong> {{ formatFecha(detalle.fecha_asignacion) }}</p>
        </div>
        <p class="motivo"><strong>Motivo asignación:</strong> {{ detalle.motivo_asignacion || '-' }}</p>
        <div class="ia-box" *ngIf="detalle.resumen_ia">
          <strong>Resumen IA</strong>
          <p>{{ detalle.resumen_ia }}</p>
        </div>

        <section class="evidencias">
          <h4>Evidencias</h4>
          <p *ngIf="!detalle.evidencias?.length" class="muted">Sin evidencias registradas.</p>
          <div class="ev-list" *ngIf="detalle.evidencias?.length">
            <article class="ev-item" *ngFor="let e of detalle.evidencias">
              <p><strong>Tipo:</strong> {{ e.tipo }}</p>
              <p *ngIf="e.transcripcion"><strong>Texto:</strong> {{ e.transcripcion }}</p>
              <p *ngIf="e.url_archivo"><strong>Archivo:</strong> {{ e.url_archivo }}</p>
              <p><strong>Fecha:</strong> {{ formatFecha(e.subido_en) }}</p>
            </article>
          </div>
        </section>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:14px; min-width:0; }
    .hero { background:linear-gradient(135deg,#eef6ff,#f1f8f3); border:1px solid #dce7fa; border-radius:12px; padding:14px; }
    .eyebrow { margin:0 0 4px; font-size:12px; font-weight:700; color:#1f3a7a; text-transform:uppercase; letter-spacing:.4px; }
    .hero h2 { margin:0; color:#1f2b45; }
    .sub { margin:6px 0 0; color:#5b6881; }
    .filters { background:#fff; border:1px solid #e2e9f5; border-radius:12px; padding:10px; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; align-items:end; }
    .filters label { display:grid; gap:6px; font-size:13px; font-weight:600; color:#213454; }
    .search { grid-column: span 2; }
    .desktop-table { background:#fff; border:1px solid #e2e9f5; border-radius:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
    table { width:100%; min-width:900px; border-collapse:collapse; }
    th, td { padding:10px; border-bottom:1px solid #edf1f8; text-align:left; font-size:13px; }
    th { background:#f8faff; color:#304b73; font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
    .prio { padding:3px 8px; border-radius:999px; font-weight:700; background:#eff3ff; color:#1f3a7a; }
    .prio.p1 { background:#ffe2df; color:#a11a18; }
    .prio.p2 { background:#fff1d1; color:#8b5a00; }
    .estado { display:inline-block; border-radius:999px; padding:3px 8px; background:#eef4ff; color:#1f3a7a; font-weight:600; font-size:12px; text-transform:lowercase; }
    .mobile-list { display:none; gap:10px; }
    .card { background:#fff; border:1px solid #e2e9f5; border-radius:12px; padding:12px; display:grid; gap:8px; }
    .card p { margin:0; color:#3b4e6f; font-size:13px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .head h4 { margin:0; color:#1f2b45; font-size:16px; }
    .detalle { background:#fff; border:1px solid #dfe6f4; border-radius:12px; padding:14px; display:grid; gap:10px; }
    .detalle-head { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .detalle-head h3 { margin:0; color:#1f2b45; font-size:20px; }
    .detalle-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 12px; }
    .detalle-grid p, .motivo { margin:0; color:#30425f; font-size:13px; }
    .ia-box { border:1px solid #e5ebf9; border-radius:10px; background:#f8fbff; padding:10px; }
    .ia-box p { margin:6px 0 0; color:#334766; }
    .evidencias h4 { margin:0 0 6px; color:#1f2b45; }
    .ev-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .ev-item { border:1px solid #ebeff8; border-radius:10px; padding:8px; background:#fff; }
    .ev-item p { margin:0 0 4px; font-size:12px; color:#3e4f6b; }
    .error { color:#b42318; margin:0; }
    .muted { color:#6d7890; margin:0; }
    .secondary { background:#eff4ff; color:#1f3a7a; border:1px solid #d4def8; }
    @media (max-width: 1100px) { .filters { grid-template-columns:repeat(2,minmax(0,1fr)); } .search { grid-column: auto; } }
    @media (max-width: 900px) {
      .desktop-table { display:none; }
      .mobile-list { display:grid; }
      .detalle-grid { grid-template-columns:1fr; }
      .ev-list { grid-template-columns:1fr; }
      .filters { grid-template-columns:1fr; }
      .filters button { width:100%; }
    }
  `],
})
export class SolicitudesPageComponent implements OnInit {
  readonly estados = [
    'pendiente',
    'en_evaluacion',
    'aprobada',
    'rechazada',
    'pendiente_respuesta',
    'aceptada',
    'tecnico_asignado',
    'en_camino',
    'en_proceso',
    'atendido',
    'finalizado',
    'cancelado',
  ];

  solicitudes: SolicitudServicio[] = [];
  detalle: SolicitudServicioDetalle | null = null;
  loading = false;
  error = '';

  filtroEstado = '';
  fechaDesde = '';
  fechaHasta = '';
  textoBusqueda = '';

  constructor(private readonly asignacionService: AsignacionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get solicitudesFiltradas(): SolicitudServicio[] {
    const q = this.textoBusqueda.trim().toLowerCase();
    if (!q) return this.solicitudes;
    return this.solicitudes.filter((s) =>
      `${s.codigo_solicitud || ''} ${s.cliente_nombre || ''} ${s.tipo || ''} ${s.estado || ''}`.toLowerCase().includes(q),
    );
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.asignacionService.listarSolicitudes({
      estado: this.filtroEstado || undefined,
      fecha_desde: this.fechaDesde || undefined,
      fecha_hasta: this.fechaHasta || undefined,
    }).subscribe({
      next: (rows) => {
        this.loading = false;
        this.solicitudes = rows ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo cargar solicitudes';
      },
    });
  }

  verDetalle(row: SolicitudServicio): void {
    this.detalle = null;
    const id = row.incidente_id || row.id;
    this.asignacionService.obtenerDetalleSolicitud(id).subscribe({
      next: (res) => {
        this.detalle = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar detalle';
      },
    });
  }

  cerrarDetalle(): void {
    this.detalle = null;
  }

  formatFecha(v?: string | null): string {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  }
}
