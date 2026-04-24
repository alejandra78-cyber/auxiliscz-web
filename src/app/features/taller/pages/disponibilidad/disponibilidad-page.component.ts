import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  DisponibilidadTaller,
  TallerService,
} from '../../services/taller.service';

@Component({
  selector: 'app-disponibilidad-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <header class="hero">
        <p class="eyebrow">CU07 · Taller</p>
        <h2>Disponibilidad Operativa</h2>
        <p class="sub">Configura estado, capacidad, cobertura y servicios para que el motor de asignación use datos reales.</p>
      </header>

      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="mensaje" class="ok">{{ mensaje }}</p>

      <div class="summary" *ngIf="snapshot">
        <article>
          <span>Estado</span>
          <strong class="pill" [class.estado-ok]="snapshot.estado_operativo === 'disponible'" [class.estado-warn]="snapshot.estado_operativo === 'ocupado'" [class.estado-stop]="snapshot.estado_operativo === 'cerrado' || snapshot.estado_operativo === 'fuera_de_servicio'">
            {{ snapshot.estado_operativo }}
          </strong>
        </article>
        <article>
          <span>Capacidad</span>
          <strong>{{ snapshot.capacidad_disponible }}/{{ snapshot.capacidad_maxima }}</strong>
        </article>
        <article>
          <span>Técnicos</span>
          <strong>{{ snapshot.tecnicos_disponibles }}/{{ snapshot.tecnicos_totales }}</strong>
        </article>
        <article>
          <span>Cobertura</span>
          <strong>{{ snapshot.radio_cobertura_km }} km</strong>
        </article>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
        <label>
          Estado operativo
          <select formControlName="estado_operativo">
            <option value="disponible">disponible</option>
            <option value="ocupado">ocupado</option>
            <option value="cerrado">cerrado</option>
            <option value="fuera_de_servicio">fuera_de_servicio</option>
          </select>
        </label>

        <label>
          Capacidad máxima simultánea
          <input type="number" min="1" formControlName="capacidad_maxima" />
        </label>

        <label>
          Radio de cobertura (km)
          <input type="number" min="1" step="0.5" formControlName="radio_cobertura_km" />
        </label>

        <label>
          Latitud
          <input type="number" step="0.000001" formControlName="latitud" />
        </label>

        <label>
          Longitud
          <input type="number" step="0.000001" formControlName="longitud" />
        </label>

        <label class="check-row">
          <input type="checkbox" formControlName="disponible" />
          Disponible para asignación
        </label>

        <fieldset class="services">
          <legend>Servicios atendidos</legend>
          <label *ngFor="let s of serviciosCatalogo" class="check-row">
            <input
              type="checkbox"
              [checked]="selectedServicios.has(s)"
              (change)="toggleServicio(s, $any($event.target).checked)"
            />
            {{ s }}
          </label>
        </fieldset>

        <label class="full">
          Observaciones operativas
          <textarea rows="3" formControlName="observaciones_operativas" placeholder="Ej: horario reducido por mantenimiento"></textarea>
        </label>

        <button type="submit" [disabled]="loading || form.invalid">
          {{ loading ? 'Guardando...' : 'Guardar disponibilidad' }}
        </button>
      </form>

      <section class="turnos" *ngIf="snapshot?.turnos_disponibles?.length">
        <h3>Turnos disponibles</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Técnico</th><th>Turno</th><th>Especialidad</th><th>Inicio</th><th>Fin</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of snapshot?.turnos_disponibles || []">
                <td>{{ t.tecnico_nombre }}</td>
                <td>{{ t.nombre }}</td>
                <td>{{ t.especialidad || '-' }}</td>
                <td>{{ t.inicio || '-' }}</td>
                <td>{{ t.fin || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; display:grid; gap:14px; min-width:0; }
    .hero { background: linear-gradient(135deg, #eef6ff, #eff8f2); border:1px solid #dce7fa; border-radius:12px; padding:12px; }
    .eyebrow { margin:0 0 4px; font-size:12px; font-weight:700; color:#1f3a7a; text-transform: uppercase; letter-spacing: .4px; }
    .hero h2 { margin:0; color:#1f2b45; }
    .sub { margin:6px 0 0; color:#5b6881; }
    .summary { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:10px; }
    .summary article { border:1px solid #e4e9f6; border-radius:10px; padding:10px; display:grid; gap:4px; background:#fbfcff; }
    .summary span { color:#6a7690; font-size:12px; }
    .summary strong { color:#1f2b45; font-size:16px; }
    .pill { border-radius:999px; padding:4px 8px; font-size:12px; width:max-content; text-transform:uppercase; }
    .estado-ok { background:#dff4e8; color:#0f6f40; }
    .estado-warn { background:#fff1d1; color:#8b5a00; }
    .estado-stop { background:#ffe2df; color:#a11a18; }
    .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
    label { display:grid; gap:6px; font-size:13px; font-weight:600; color:#213454; }
    .full { grid-column: 1 / -1; }
    .services { grid-column: 1 / -1; border:1px solid #e4e9f6; border-radius:10px; padding:10px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:8px; }
    .services legend { padding:0 6px; color:#38527a; font-size:13px; font-weight:700; }
    .check-row { display:flex; align-items:center; gap:8px; font-weight:500; }
    .check-row input[type='checkbox'] { width:16px; height:16px; }
    .table-wrap { overflow-x:auto; -webkit-overflow-scrolling: touch; }
    table { width:100%; min-width:700px; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; font-size:13px; }
    th { color:#2f4a73; background:#f8faff; text-transform:uppercase; font-size:11px; letter-spacing:.4px; }
    .ok { color:#027a48; margin:0; }
    .error { color:#b42318; margin:0; }
    .turnos h3 { margin:0 0 6px; color:#1f2b45; }
    @media (max-width: 980px) {
      .summary { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .services { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 700px) {
      .card { padding:12px; }
      .form-grid { grid-template-columns: 1fr; }
      .services { grid-template-columns: 1fr; }
      button[type='submit'] { width:100%; }
      .summary { grid-template-columns: 1fr; }
    }
  `],
})
export class DisponibilidadPageComponent implements OnInit {
  readonly serviciosCatalogo = ['bateria', 'llanta', 'motor', 'choque', 'remolque', 'otros'];
  readonly selectedServicios = new Set<string>();

  snapshot: DisponibilidadTaller | null = null;
  loading = false;
  mensaje = '';
  error = '';

  readonly form = this.fb.group({
    disponible: [true, [Validators.required]],
    estado_operativo: ['disponible', [Validators.required]],
    capacidad_maxima: [1, [Validators.required, Validators.min(1)]],
    radio_cobertura_km: [10, [Validators.required, Validators.min(1)]],
    latitud: [null as number | null],
    longitud: [null as number | null],
    observaciones_operativas: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.tallerService.obtenerDisponibilidadMiTaller().subscribe({
      next: (res) => {
        this.snapshot = res;
        this.selectedServicios.clear();
        for (const s of res.servicios || []) this.selectedServicios.add(s);
        this.form.patchValue({
          disponible: !!res.disponible,
          estado_operativo: res.estado_operativo,
          capacidad_maxima: res.capacidad_maxima || 1,
          radio_cobertura_km: res.radio_cobertura_km || 10,
          latitud: res.latitud ?? null,
          longitud: res.longitud ?? null,
          observaciones_operativas: res.observaciones_operativas ?? '',
        });
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar disponibilidad';
        this.snapshot = null;
      },
    });
  }

  toggleServicio(servicio: string, checked: boolean): void {
    if (checked) this.selectedServicios.add(servicio);
    else this.selectedServicios.delete(servicio);
  }

  guardar(): void {
    if (this.form.invalid) return;
    const servicios = Array.from(this.selectedServicios);
    if (!servicios.length) {
      this.error = 'Debes seleccionar al menos un servicio';
      return;
    }
    this.loading = true;
    this.error = '';
    this.mensaje = '';
    const raw = this.form.getRawValue();
    this.tallerService.actualizarDisponibilidadMiTaller({
      disponible: !!raw.disponible,
      estado_operativo: (raw.estado_operativo || 'disponible') as 'disponible' | 'ocupado' | 'cerrado' | 'fuera_de_servicio',
      capacidad_maxima: Number(raw.capacidad_maxima),
      radio_cobertura_km: Number(raw.radio_cobertura_km),
      servicios,
      latitud: raw.latitud ?? undefined,
      longitud: raw.longitud ?? undefined,
      observaciones_operativas: raw.observaciones_operativas?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.mensaje = 'Se guardaron los cambios';
        this.cargar();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo actualizar disponibilidad';
      },
    });
  }
}
