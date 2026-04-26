import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DisponibilidadTaller, TallerAdminOption, TallerService } from '../../services/taller.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-ubicacion-taller-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <header class="hero">
        <p class="eyebrow">CU07 · Taller</p>
        <h2>Ubicación del Taller</h2>
        <p class="sub">Actualiza la ubicación operativa para asignación inteligente y cobertura.</p>
      </header>

      <p *ngIf="isSupervision" class="readonly">Modo supervisión: solo lectura</p>
      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <label *ngIf="isSupervision">
        Taller a visualizar
        <select (change)="onSelectTaller($any($event.target).value)">
          <option value="">Selecciona un taller</option>
          <option *ngFor="let t of talleresAdmin" [value]="t.id">{{ t.nombre }}</option>
        </select>
      </label>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid">
        <label>
          Latitud
          <input type="number" step="0.000001" formControlName="latitud" />
        </label>
        <label>
          Longitud
          <input type="number" step="0.000001" formControlName="longitud" />
        </label>

        <div class="actions">
          <button type="button" class="ghost" (click)="usarUbicacionActual()" [disabled]="loadingGps || isSupervision">
            {{ loadingGps ? 'Obteniendo GPS...' : 'Usar mi ubicación actual' }}
          </button>
          <button type="submit" [disabled]="loadingSave || form.invalid || isSupervision">
            {{ loadingSave ? 'Guardando...' : 'Cambiar ubicación del taller' }}
          </button>
        </div>
      </form>

      <div class="preview" *ngIf="snapshot">
        <p><strong>Taller:</strong> {{ snapshot.nombre_taller }}</p>
        <p><strong>Ubicación guardada:</strong> {{ snapshot.latitud ?? '-' }}, {{ snapshot.longitud ?? '-' }}</p>
        <a
          *ngIf="snapshot.latitud != null && snapshot.longitud != null"
          [href]="'https://www.google.com/maps?q=' + snapshot.latitud + ',' + snapshot.longitud"
          target="_blank"
          rel="noopener"
        >
          Ver en mapa
        </a>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; display:grid; gap:12px; }
    .hero { background: linear-gradient(135deg,#eef6ff,#f1f7ef); border:1px solid #dce7fa; border-radius:12px; padding:12px; }
    .eyebrow { margin:0 0 4px; font-size:12px; font-weight:700; color:#1f3a7a; text-transform:uppercase; }
    .hero h2 { margin:0; color:#1f2b45; }
    .sub { margin:6px 0 0; color:#5b6881; }
    .grid { display:grid; gap:10px; }
    label { display:grid; gap:6px; font-size:13px; font-weight:600; color:#213454; }
    .actions { display:flex; gap:8px; flex-wrap: wrap; }
    .ghost { background:#fff; color:#1f3a7a; border:1px solid #cfd8ef; }
    .preview { border:1px solid #e4e9f6; border-radius:10px; padding:10px; background:#fbfcff; }
    .ok { color:#027a48; margin:0; }
    .error { color:#b42318; margin:0; }
    .readonly { color:#8b5a00; background:#fff1d1; border:1px solid #f1d08a; border-radius:8px; padding:8px; margin:0; font-weight:600; }
    @media (max-width: 700px) {
      .card { padding:12px; }
      .actions button { width:100%; }
    }
  `],
})
export class UbicacionTallerPageComponent implements OnInit {
  loadingGps = false;
  loadingSave = false;
  ok = '';
  error = '';
  isSupervision = false;
  selectedTallerId = '';
  talleresAdmin: TallerAdminOption[] = [];
  snapshot: DisponibilidadTaller | null = null;

  readonly form = this.fb.group({
    latitud: [null as number | null, [Validators.required]],
    longitud: [null as number | null, [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const role = this.authService.getCurrentRole();
    const modo = this.route.snapshot.queryParamMap.get('modo');
    this.isSupervision = role === 'admin' && modo === 'supervision';
    if (this.isSupervision) {
      this.form.disable({ emitEvent: false });
      this.cargarTalleresAdmin();
      return;
    }
    this.cargar();
  }

  cargarTalleresAdmin(): void {
    this.tallerService.listarTalleresAdmin().subscribe({
      next: (rows) => {
        this.talleresAdmin = rows ?? [];
        const pre = this.route.snapshot.queryParamMap.get('tallerId');
        if (pre) this.selectedTallerId = pre;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar talleres';
      },
    });
  }

  onSelectTaller(tallerId: string): void {
    this.selectedTallerId = (tallerId || '').trim();
    this.cargar();
  }

  cargar(): void {
    const request$ = this.isSupervision
      ? (this.selectedTallerId ? this.tallerService.obtenerDisponibilidadTallerAdmin(this.selectedTallerId) : null)
      : this.tallerService.obtenerDisponibilidadMiTaller();
    if (!request$) {
      this.snapshot = null;
      return;
    }

    request$.subscribe({
      next: (res) => {
        this.snapshot = res;
        this.form.patchValue({
          latitud: res.latitud ?? null,
          longitud: res.longitud ?? null,
        });
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar ubicación actual';
        this.snapshot = null;
      },
    });
  }

  usarUbicacionActual(): void {
    if (this.isSupervision) return;
    if (!navigator.geolocation) {
      this.error = 'Tu navegador no soporta geolocalización';
      return;
    }
    this.loadingGps = true;
    this.ok = '';
    this.error = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.loadingGps = false;
        this.form.patchValue({
          latitud: Number(position.coords.latitude.toFixed(6)),
          longitud: Number(position.coords.longitude.toFixed(6)),
        });
        this.ok = 'Ubicación GPS obtenida. Ahora presiona "Cambiar ubicación del taller".';
      },
      () => {
        this.loadingGps = false;
        this.error = 'No se pudo obtener GPS. Revisa permisos de ubicación.';
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  guardar(): void {
    if (this.isSupervision || this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.loadingSave = true;
    this.ok = '';
    this.error = '';
    this.tallerService.actualizarUbicacionMiTaller(Number(raw.latitud), Number(raw.longitud)).subscribe({
      next: () => {
        this.loadingSave = false;
        this.ok = 'Ubicación del taller actualizada correctamente.';
        this.cargar();
      },
      error: (err) => {
        this.loadingSave = false;
        this.error = err?.error?.detail ?? 'No se pudo actualizar ubicación del taller';
      },
    });
  }
}

