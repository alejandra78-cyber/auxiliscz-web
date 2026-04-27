import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  TallerService,
  TecnicoServicioAsignado,
} from '../../services/taller.service';

@Component({
  selector: 'app-seguimiento-tecnico-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h2>Seguimiento de ubicación del técnico</h2>
      <p class="muted">Comparte tu ubicación GPS para que el cliente pueda ver tu ruta en CU19.</p>

      <div class="grid">
        <label>Servicio asignado</label>
        <select [(ngModel)]="asignacionSeleccionadaId" [disabled]="sending || sharing">
          <option value="" disabled>Selecciona un servicio</option>
          <option *ngFor="let s of servicios" [value]="s.asignacion_id">
            {{ s.codigo_solicitud }} · {{ s.cliente_nombre || 'Cliente' }} · {{ s.estado_servicio }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button (click)="iniciarSeguimiento()" [disabled]="sharing || !asignacionSeleccionadaId">
          Compartir ubicación
        </button>
        <button class="ghost" (click)="detenerSeguimiento()" [disabled]="!sharing">
          Detener seguimiento
        </button>
      </div>

      <p *ngIf="sharing" class="ok">Compartiendo ubicación en tiempo real...</p>
      <p *ngIf="ultimaUbicacion" class="muted">Última ubicación enviada: {{ ultimaUbicacion }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !servicios.length" class="muted">
        No tienes servicios en estado en_camino o en_proceso para compartir ubicación.
      </p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; margin-top: 8px; }
    .actions { display:flex; gap:8px; margin-top:12px; flex-wrap: wrap; }
    .ghost { background:#fff; color:#1f3a7a; border:1px solid #cfd8ef; }
    .ok { color:#027a48; margin-top: 10px; }
    .error { color:#b42318; margin-top: 10px; }
    .muted { color:#6d7890; margin-top: 8px; }
    @media (max-width: 900px) {
      .card { padding:12px; }
      .actions button { width:100%; }
    }
  `],
})
export class SeguimientoTecnicoPageComponent implements OnInit, OnDestroy {
  loading = false;
  sending = false;
  sharing = false;
  error = '';
  ultimaUbicacion = '';

  servicios: TecnicoServicioAsignado[] = [];
  asignacionSeleccionadaId = '';

  private watchId: number | null = null;
  private ultimaMarcaMs = 0;

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  ngOnDestroy(): void {
    this.detenerSeguimiento();
  }

  cargarServicios(): void {
    this.loading = true;
    this.error = '';
    this.tallerService.listarMisServiciosAsignadosTecnico().subscribe({
      next: (rows) => {
        this.loading = false;
        this.servicios = rows || [];
        if (!this.asignacionSeleccionadaId && this.servicios.length) {
          this.asignacionSeleccionadaId = this.servicios[0].asignacion_id;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudieron cargar tus servicios asignados';
      },
    });
  }

  iniciarSeguimiento(): void {
    if (this.sharing || !this.asignacionSeleccionadaId) return;
    if (!('geolocation' in navigator)) {
      this.error = 'Tu navegador no soporta geolocalización';
      return;
    }

    this.error = '';
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - this.ultimaMarcaMs < 10000) return;
        this.ultimaMarcaMs = now;
        this.enviarUbicacion(pos.coords.latitude, pos.coords.longitude);
      },
      (geoErr) => {
        this.error =
          geoErr.code === geoErr.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado'
            : 'No se pudo obtener ubicación GPS';
        this.detenerSeguimiento();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );

    this.sharing = true;
  }

  detenerSeguimiento(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.sharing = false;
    this.sending = false;
  }

  private enviarUbicacion(latitud: number, longitud: number): void {
    if (this.sending || !this.asignacionSeleccionadaId) return;
    this.sending = true;
    this.tallerService
      .enviarUbicacionTecnico({
        asignacion_id: this.asignacionSeleccionadaId,
        latitud,
        longitud,
      })
      .subscribe({
        next: (res) => {
          this.sending = false;
          this.ultimaUbicacion = `${latitud.toFixed(5)}, ${longitud.toFixed(5)} · ${res.ultima_actualizacion}`;
          this.error = '';
        },
        error: (err) => {
          this.sending = false;
          this.error = err?.error?.detail ?? 'No se pudo enviar ubicación';
        },
      });
  }
}
