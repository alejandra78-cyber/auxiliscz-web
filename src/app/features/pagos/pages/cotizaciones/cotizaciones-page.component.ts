import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  AsignacionService,
  SolicitudServicio,
} from '../../../asignacion/services/asignacion.service';
import { CotizacionOut, PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-cotizaciones-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card" *ngIf="mode === 'generar'">
      <h2>CU20 · Generar cotización</h2>
      <p class="muted">Selecciona una solicitud ya diagnosticada para emitir cotización.</p>

      <form [formGroup]="form" (ngSubmit)="generar()" class="grid">
        <label>Solicitud</label>
        <select formControlName="incidente_id">
          <option value="">Selecciona solicitud</option>
          <option *ngFor="let s of solicitudesDiagnostico" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} · {{ s.cliente_nombre || 'Cliente' }} · {{ s.tipo || 'incierto' }}
          </option>
        </select>

        <label>Monto total</label>
        <input type="number" formControlName="monto_total" min="1" step="0.01" />

        <label>Detalle</label>
        <textarea rows="3" formControlName="detalle" placeholder="Diagnóstico y trabajos propuestos"></textarea>

        <label>Observaciones (opcional)</label>
        <textarea rows="2" formControlName="observaciones"></textarea>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Generando...' : 'Generar cotización' }}
        </button>
      </form>

      <div *ngIf="resultado" class="result">
        <p><strong>Cotización:</strong> {{ resultado.id }}</p>
        <p><strong>Solicitud:</strong> {{ resultado.codigo_solicitud || '-' }}</p>
        <p><strong>Cliente:</strong> {{ resultado.cliente_nombre || '-' }}</p>
        <p><strong>Monto:</strong> {{ resultado.monto_total }}</p>
        <p><strong>Estado:</strong> {{ resultado.estado }}</p>
      </div>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>

    <section class="card" *ngIf="mode === 'gestionar'">
      <h2>CU21 · Gestionar cotización</h2>
      <p class="muted">Visualiza cotizaciones emitidas con datos de cliente y estado de respuesta.</p>

      <div class="toolbar">
        <select [value]="estadoFiltro" (change)="onCambiarFiltro($event)">
          <option value="">Todos los estados</option>
          <option value="emitida">Emitida</option>
          <option value="aceptada">Aceptada</option>
          <option value="rechazada">Rechazada</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button type="button" (click)="cargarCotizaciones()" [disabled]="loadingCotizaciones">
          {{ loadingCotizaciones ? 'Cargando...' : 'Recargar' }}
        </button>
      </div>

      <div *ngIf="cotizaciones.length === 0" class="muted">
        No hay cotizaciones para mostrar.
      </div>

      <div class="list" *ngIf="cotizaciones.length > 0">
        <article class="item" *ngFor="let c of cotizaciones">
          <header>
            <strong>{{ c.codigo_solicitud || 'Solicitud' }}</strong>
            <span class="chip">{{ c.estado }}</span>
          </header>
          <p><strong>Cliente:</strong> {{ c.cliente_nombre || '-' }}</p>
          <p><strong>Vehículo:</strong> {{ c.vehiculo_placa || '-' }}</p>
          <p><strong>Tipo:</strong> {{ c.tipo_problema || '-' }}</p>
          <p><strong>Monto:</strong> {{ c.monto_total }}</p>
          <p><strong>Emitida:</strong> {{ c.fecha_emision || '-' }}</p>
          <p><strong>Respuesta cliente:</strong> {{ c.fecha_respuesta_cliente || '-' }}</p>
          <p><strong>Detalle:</strong> {{ c.detalle || '-' }}</p>
        </article>
      </div>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; margin-top:8px; }
    input, textarea, select { width:100%; border:1px solid #d0d7e6; border-radius:8px; padding:8px; font: inherit; }
    button { border:0; border-radius:10px; background:#1f3a7a; color:#fff; padding:10px 14px; font-weight:600; }
    .toolbar { display:flex; gap:8px; margin-bottom:12px; }
    .toolbar select { max-width: 260px; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .result { margin-top:12px; background:#f8fbff; border:1px solid #d8e4ff; border-radius:10px; padding:10px; }
    .list { display:grid; gap:10px; }
    .item { border:1px solid #d8e4ff; border-radius:10px; padding:10px; background:#f8fbff; }
    header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .chip { background:#eaf2ff; color:#1f3a7a; border-radius:999px; padding:2px 10px; font-size:12px; font-weight:600; }
    .error { color:#b42318; }
  `],
})
export class CotizacionesPageComponent implements OnInit {
  mode: 'generar' | 'gestionar' = 'generar';
  error = '';
  loading = false;
  loadingCotizaciones = false;
  resultado: CotizacionOut | null = null;
  solicitudesDiagnostico: SolicitudServicio[] = [];
  cotizaciones: CotizacionOut[] = [];
  estadoFiltro = '';

  readonly form = this.fb.nonNullable.group({
    incidente_id: ['', [Validators.required]],
    monto_total: [0, [Validators.required, Validators.min(1)]],
    detalle: ['', [Validators.required, Validators.minLength(3)]],
    observaciones: [''],
  });

  constructor(
    private readonly pagosService: PagosService,
    private readonly asignacionService: AsignacionService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.routeConfig?.path?.includes('gestionar-cotizacion')
      ? 'gestionar'
      : 'generar';
    if (this.mode === 'generar') {
      this.cargarSolicitudesDiagnostico();
      return;
    }
    this.cargarCotizaciones();
  }

  private normalizarEstadoAsignacion(estado?: string | null): string {
    const raw = (estado || '').trim().toLowerCase();
    const aliases: Record<string, string> = {
      asignada: 'tecnico_asignado',
      aceptado: 'aceptada',
      cancelada: 'cancelado',
      completada: 'finalizado',
    };
    return aliases[raw] || raw;
  }

  cargarSolicitudesDiagnostico(): void {
    this.error = '';
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesDiagnostico = (rows || []).filter((s) =>
          ['en_diagnostico', 'diagnostico_completado'].includes(
            this.normalizarEstadoAsignacion(s.estado_asignacion || s.estado),
          ),
        );
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes para cotización';
      },
    });
  }

  cargarCotizaciones(): void {
    this.loadingCotizaciones = true;
    this.error = '';
    this.pagosService.listarCotizacionesTaller(this.estadoFiltro || undefined).subscribe({
      next: (rows) => {
        this.loadingCotizaciones = false;
        this.cotizaciones = rows || [];
      },
      error: (err) => {
        this.loadingCotizaciones = false;
        this.error = err?.error?.detail ?? 'No se pudieron cargar cotizaciones';
      },
    });
  }

  onCambiarFiltro(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.estadoFiltro = (target.value || '').trim();
    this.cargarCotizaciones();
  }

  generar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.resultado = null;
    const raw = this.form.getRawValue();
    this.pagosService
      .generarCotizacion({
        incidente_id: raw.incidente_id.trim(),
        monto_total: Number(raw.monto_total),
        detalle: raw.detalle.trim(),
        observaciones: (raw.observaciones || '').trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.resultado = res;
          this.cargarSolicitudesDiagnostico();
        },
        error: (err) => {
          this.loading = false;
          const detail = err?.error?.detail;
          this.error = Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || String(d)).join(' | ')
            : (detail || 'No se pudo generar cotización');
        },
      });
  }
}
