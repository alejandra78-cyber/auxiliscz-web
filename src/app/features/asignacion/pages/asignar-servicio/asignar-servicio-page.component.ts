import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  AsignacionService,
  ServicioCatalogo,
  SolicitudServicio,
  TecnicoDisponible,
} from '../../services/asignacion.service';

@Component({
  selector: 'app-asignar-servicio-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>CU16 · Asignar servicio (técnico)</h2>
      <p class="muted">Después de CU15 (aceptada), selecciona un técnico disponible de tu taller y confirma la asignación real.</p>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>Solicitud aceptada</label>
        <select formControlName="solicitudId" (change)="onSolicitudChange()">
          <option value="">Selecciona una solicitud aceptada</option>
          <option *ngFor="let s of solicitudesAsignables" [value]="s.id">
            {{ s.codigo_solicitud || s.id }} · {{ s.cliente_nombre || 'Cliente' }} · {{ s.tipo || 'incierto' }} · {{ estadoActual(s) }}
          </option>
        </select>

        <label>Técnico disponible</label>
        <select formControlName="tecnicoId" [disabled]="loading || !seleccionada">
          <option value="">Selecciona técnico</option>
          <option *ngFor="let t of tecnicos" [value]="t.id">
            {{ t.nombre }}{{ t.especialidad ? (' · ' + t.especialidad) : '' }}
          </option>
        </select>

        <label>Servicio a ejecutar</label>
        <select formControlName="servicio" [disabled]="loading || !seleccionada">
          <option value="">Selecciona servicio</option>
          <option *ngFor="let s of servicios" [value]="s.codigo">
            {{ s.nombre }}
          </option>
        </select>

        <label>Observación (opcional)</label>
        <textarea rows="2" formControlName="observacion" placeholder="Ej. técnico especializado para diagnóstico inicial"></textarea>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Asignando...' : 'Asignar técnico' }}
        </button>
      </form>

      <section class="panel" *ngIf="seleccionada">
        <h3>Detalle de la solicitud</h3>
        <p><strong>Código:</strong> {{ seleccionada.codigo_solicitud || '-' }}</p>
        <p><strong>Cliente:</strong> {{ seleccionada.cliente_nombre || '-' }}</p>
        <p><strong>Tipo:</strong> {{ seleccionada.tipo || 'incierto' }}</p>
        <p><strong>Prioridad:</strong> {{ seleccionada.prioridad }}</p>
        <p><strong>Estado actual:</strong> {{ estadoActual(seleccionada) }}</p>
        <p><strong>Resumen IA:</strong> {{ seleccionada.resumen_ia || '-' }}</p>
      </section>

      <section class="panel ok" *ngIf="resultado">
        <h3>Resultado</h3>
        <p><strong>Solicitud:</strong> {{ resultado.codigo_solicitud || '-' }}</p>
        <p><strong>Técnico:</strong> {{ resultado.tecnico_nombre || '-' }}</p>
        <p><strong>Estado:</strong> {{ resultado.estado_asignacion || resultado.estado || '-' }}</p>
        <p><strong>Mensaje:</strong> {{ ok || 'Técnico asignado correctamente' }}</p>
      </section>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .panel { margin-top:12px; border:1px solid #e2e6ef; border-radius:10px; padding:12px; display:grid; gap:6px; }
    select, textarea { width:100%; border:1px solid #d0d7e6; border-radius:8px; padding:8px; font:inherit; }
    button { border:0; border-radius:10px; background:#1f3a7a; color:#fff; padding:10px 14px; font-weight:600; }
    .muted { color:#6d7890; margin:0 0 10px 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class AsignarServicioPageComponent implements OnInit {
  solicitudesAsignables: SolicitudServicio[] = [];
  seleccionada: SolicitudServicio | null = null;
  tecnicos: TecnicoDisponible[] = [];
  servicios: ServicioCatalogo[] = [];
  resultado: SolicitudServicio | null = null;
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', [Validators.required]],
    tecnicoId: ['', [Validators.required]],
    servicio: ['', [Validators.required]],
    observacion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly asignacionService: AsignacionService,
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarSolicitudes();
  }

  estadoActual(s: SolicitudServicio): string {
    return (s.estado_asignacion || s.estado || '').toLowerCase();
  }

  cargarCatalogos(): void {
    this.asignacionService.listarServiciosCatalogo().subscribe({
      next: (rows) => {
        this.servicios = rows || [];
      },
      error: () => {
        this.servicios = [];
      },
    });
  }

  cargarSolicitudes(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudesAsignables = (rows || []).filter((s) => {
          const st = this.estadoActual(s);
          return ['aceptada'].includes(st);
        });
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes aceptadas';
      },
    });
  }

  onSolicitudChange(): void {
    const solicitudId = this.form.getRawValue().solicitudId;
    this.resultado = null;
    this.ok = '';
    this.error = '';
    this.form.patchValue({ tecnicoId: '', servicio: '', observacion: '' });
    this.seleccionada = this.solicitudesAsignables.find((s) => s.id === solicitudId) || null;
    if (!solicitudId) {
      this.tecnicos = [];
      return;
    }
    this.asignacionService.listarTecnicosDisponibles(solicitudId).subscribe({
      next: (rows) => {
        this.tecnicos = (rows || []).filter((t) => !!t.disponible);
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar técnicos disponibles';
        this.tecnicos = [];
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.loading = true;
    this.ok = '';
    this.error = '';
    this.resultado = null;
    this.asignacionService
      .asignarServicio(
        raw.solicitudId,
        raw.tecnicoId,
        raw.servicio,
        raw.observacion || undefined,
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.resultado = res;
          this.ok = 'Técnico asignado correctamente';
          this.form.patchValue({
            solicitudId: '',
            tecnicoId: '',
            servicio: '',
            observacion: '',
          });
          this.seleccionada = null;
          this.tecnicos = [];
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? 'No se pudo asignar técnico';
        },
      });
  }
}
