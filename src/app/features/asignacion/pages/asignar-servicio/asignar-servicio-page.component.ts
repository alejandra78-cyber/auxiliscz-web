import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  AsignacionService,
  CandidatoAsignacion,
  ResultadoAsignacionAutomatica,
  SolicitudServicio,
} from '../../services/asignacion.service';

@Component({
  selector: 'app-asignar-servicio-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Asignación Inteligente</h2>
      <p class="muted">El sistema genera candidatos por disponibilidad, capacidad, servicio compatible, distancia y prioridad.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud a asignar</label>
        <select formControlName="solicitudId" (change)="onSolicitudChange()">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let s of solicitudesAsignables" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} | {{ s.tipo || 'incierto' }} | prioridad {{ s.prioridad }} | {{ s.estado }}
          </option>
        </select>

        <button type="button" (click)="cargarCandidatos()" [disabled]="!form.getRawValue().solicitudId || loading">
          Ver candidatos
        </button>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Asignando...' : 'Asignar automáticamente' }}
        </button>
      </form>

      <section class="panel" *ngIf="seleccionada">
        <h3>Detalle incidente</h3>
        <p><strong>Tipo:</strong> {{ seleccionada.tipo || 'incierto' }}</p>
        <p><strong>Prioridad:</strong> {{ seleccionada.prioridad }}</p>
        <p><strong>Estado:</strong> {{ seleccionada.estado }}</p>
        <p><strong>Ubicación:</strong> {{ seleccionada.latitud ?? '-' }}, {{ seleccionada.longitud ?? '-' }}</p>
        <p><strong>Resumen IA:</strong> {{ seleccionada.resumen_ia || '-' }}</p>
      </section>

      <section class="panel" *ngIf="candidatos.length">
        <h3>Lista de candidatos</h3>
        <div class="candidato" *ngFor="let c of candidatos">
          <div>
            <strong>{{ c.nombre }}</strong>
            <small>{{ c.estado_operativo || 'disponible' }}</small>
          </div>
          <div class="meta">
            <span>{{ c.distancia_km }} km</span>
            <span>Puntaje: {{ c.puntaje }}</span>
            <span>Capacidad: {{ c.capacidad_disponible ?? '-' }}</span>
            <span>Técnicos: {{ c.tecnicos_disponibles ?? '-' }}</span>
          </div>
          <p class="motivo">{{ c.motivo || '-' }}</p>
        </div>
      </section>

      <section class="panel ok" *ngIf="resultado">
        <h3>Resultado de asignación</h3>
        <p><strong>Taller:</strong> {{ resultado.nombre_taller || '-' }}</p>
        <p><strong>Mensaje:</strong> {{ resultado.mensaje }}</p>
        <p><strong>Distancia:</strong> {{ resultado.distancia_km ?? '-' }}</p>
        <p><strong>Puntaje:</strong> {{ resultado.puntaje ?? '-' }}</p>
      </section>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .panel { margin-top:12px; border:1px solid #e2e6ef; border-radius:10px; padding:12px; display:grid; gap:6px; }
    .candidato { border:1px solid #edf1f8; border-radius:8px; padding:10px; display:grid; gap:6px; }
    .meta { display:flex; flex-wrap:wrap; gap:8px; font-size:13px; color:#475467; }
    .motivo { margin:0; font-size:12px; color:#667085; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class AsignarServicioPageComponent implements OnInit {
  solicitudesAsignables: SolicitudServicio[] = [];
  seleccionada: SolicitudServicio | null = null;
  candidatos: CandidatoAsignacion[] = [];
  resultado: ResultadoAsignacionAutomatica | null = null;
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesAsignables = rows.filter((s) =>
          ['pendiente', 'aprobada', 'sin_taller_disponible'].includes((s.estado || '').toLowerCase()),
        );
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes asignables';
      },
    });
  }

  onSolicitudChange(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    this.candidatos = [];
    this.resultado = null;
    this.seleccionada = this.solicitudesAsignables.find((s) => s.id === solicitudId) || null;
  }

  cargarCandidatos(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    if (!solicitudId) return;
    this.error = '';
    this.asignacionService.listarCandidatosIncidente(solicitudId).subscribe({
      next: (rows) => {
        this.candidatos = rows || [];
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar candidatos';
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const solicitudId = this.form.getRawValue().solicitudId;
    this.loading = true;
    this.ok = '';
    this.error = '';
    this.resultado = null;
    this.asignacionService
      .asignarAutomaticamente(solicitudId)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.resultado = res;
          this.ok = res?.mensaje || 'Asignación ejecutada';
          this.cargarCandidatos();
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo ejecutar asignación inteligente';
        },
      });
  }
}
