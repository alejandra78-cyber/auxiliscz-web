import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SolicitudAfiliacion, TallerService } from '../../../taller/services/taller.service';

@Component({
  selector: 'app-aprobar-talleres-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="hero">
        <p class="eyebrow">CU27 · Administración</p>
        <h2>Aprobar Solicitudes de Taller</h2>
        <p class="sub">Revisa solicitudes públicas de afiliación y decide su aprobación o rechazo.</p>
      </header>

      <div class="toolbar">
        <label>
          Estado
          <select [(ngModel)]="filtroEstado" (change)="cargar()">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </label>
        <button type="button" class="secondary" (click)="cargar()" [disabled]="loading">
          {{ loading ? 'Actualizando...' : 'Actualizar lista' }}
        </button>
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="desktop-table" *ngIf="!loading && solicitudes.length">
        <table>
          <thead>
            <tr>
              <th>Taller</th>
              <th>Responsable</th>
              <th>Servicios</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of solicitudes">
              <td>
                <strong>{{ s.nombre_taller }}</strong>
                <div class="mini">{{ s.direccion || 'Sin dirección' }}</div>
              </td>
              <td>
                <div>{{ s.responsable_nombre }}</div>
                <div class="mini">{{ s.responsable_email }}</div>
                <div class="mini">{{ s.responsable_telefono }}</div>
              </td>
              <td class="mini">{{ s.servicios.join(', ') || 'Sin servicios' }}</td>
              <td>
                <span class="pill" [class.pending]="s.estado === 'pendiente'" [class.rejected]="s.estado === 'rechazado'">
                  {{ s.estado }}
                </span>
              </td>
              <td>
                <div class="actions" *ngIf="s.estado === 'pendiente'; else sinAccion">
                  <button type="button" (click)="aprobar(s)" [disabled]="actionLoadingId === s.id">Aprobar</button>
                  <button type="button" class="warn" (click)="rechazar(s)" [disabled]="actionLoadingId === s.id">Rechazar</button>
                </div>
                <ng-template #sinAccion>
                  <span class="mini">Sin acciones</span>
                </ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list" *ngIf="!loading && solicitudes.length">
        <article class="card" *ngFor="let s of solicitudes">
          <div class="card-head">
            <h4>{{ s.nombre_taller }}</h4>
            <span class="pill" [class.pending]="s.estado === 'pendiente'" [class.rejected]="s.estado === 'rechazado'">
              {{ s.estado }}
            </span>
          </div>
          <p>{{ s.direccion || 'Sin dirección' }}</p>
          <p class="mini">{{ s.responsable_nombre }} · {{ s.responsable_email }}</p>
          <p class="mini">Servicios: {{ s.servicios.join(', ') || 'Sin servicios' }}</p>
          <p class="mini" *ngIf="s.descripcion">Descripción: {{ s.descripcion }}</p>
          <div class="actions" *ngIf="s.estado === 'pendiente'">
            <button type="button" (click)="aprobar(s)" [disabled]="actionLoadingId === s.id">Aprobar</button>
            <button type="button" class="warn" (click)="rechazar(s)" [disabled]="actionLoadingId === s.id">Rechazar</button>
          </div>
        </article>
      </div>

      <p *ngIf="!loading && !solicitudes.length" class="empty">No hay solicitudes para el filtro seleccionado.</p>
    </section>
  `,
  styles: [`
    :host { display:block; }
    .page { display:grid; gap: 14px; }
    .hero { background: linear-gradient(135deg, #ecf7f3, #eff6ff); border: 1px solid #dce9fe; border-radius: 14px; padding: 16px; }
    .eyebrow { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #165a90; text-transform: uppercase; letter-spacing: 0.5px; }
    .hero h2 { margin: 0; font-size: 28px; color: #1f2b45; }
    .sub { margin: 6px 0 0; color: #52627f; }
    .toolbar { background: #fff; border: 1px solid #e2e9f5; border-radius: 12px; padding: 10px; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
    label { display:grid; gap: 6px; font-size: 13px; font-weight: 600; color: #213454; }
    .secondary { background: #eff4ff; color: #1f3a7a; border: 1px solid #d4def8; }
    .desktop-table { background: #fff; border: 1px solid #e2e9f5; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #edf1f8; text-align: left; vertical-align: top; }
    th { background: #f8faff; color: #304b73; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
    .mini { color: #6d7890; font-size: 12px; }
    .actions { display: flex; gap: 8px; }
    .warn { background: #c33d3c; }
    .pill { display: inline-block; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dff2e7; color: #0f6f40; }
    .pill.pending { background: #fff1d1; color: #8b5a00; }
    .pill.rejected { background: #ffe2df; color: #a11a18; }
    .mobile-list { display: none; gap: 10px; }
    .card { background: #fff; border: 1px solid #e2e9f5; border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
    .card-head { display:flex; justify-content: space-between; align-items: center; gap: 8px; }
    .card h4 { margin: 0; color: #1f2b45; }
    .card p { margin: 0; color: #3b4e6f; }
    .empty { margin: 0; color: #67758f; }
    .error { margin: 0; color: #b42318; font-weight: 600; }
    @media (max-width: 900px) {
      .hero h2 { font-size: 23px; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .toolbar button { width: 100%; }
      .desktop-table { display: none; }
      .mobile-list { display: grid; }
    }
  `],
})
export class AprobarTalleresPageComponent implements OnInit {
  solicitudes: SolicitudAfiliacion[] = [];
  filtroEstado = '';
  loading = false;
  actionLoadingId = '';
  error = '';

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    const estado = this.filtroEstado || undefined;
    this.tallerService.listarSolicitudesAfiliacionAdmin(estado as any).subscribe({
      next: (res) => {
        this.loading = false;
        this.solicitudes = res;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo cargar la lista';
      },
    });
  }

  aprobar(row: SolicitudAfiliacion): void {
    this.actionLoadingId = row.id;
    this.tallerService.aprobarSolicitudAfiliacion(row.id).subscribe({
      next: () => {
        this.actionLoadingId = '';
        this.cargar();
      },
      error: (err) => {
        this.actionLoadingId = '';
        this.error = err?.error?.detail ?? 'No se pudo aprobar la solicitud';
      },
    });
  }

  rechazar(row: SolicitudAfiliacion): void {
    this.actionLoadingId = row.id;
    this.tallerService.rechazarSolicitudAfiliacion(row.id).subscribe({
      next: () => {
        this.actionLoadingId = '';
        this.cargar();
      },
      error: (err) => {
        this.actionLoadingId = '';
        this.error = err?.error?.detail ?? 'No se pudo rechazar la solicitud';
      },
    });
  }
}
