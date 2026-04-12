import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { divIcon, latLng, LeafletMouseEvent, Map, marker, Marker, tileLayer } from 'leaflet';

import { TallerService } from '../../services/taller.service';
import { AdminUserListItem, AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-registrar-taller-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Registrar Taller (Admin)</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
        <label>Usuario del taller (rol taller, sin perfil)</label>
        <select formControlName="usuario_id">
          <option value="" disabled>Selecciona un usuario</option>
          <option *ngFor="let u of usuarios" [value]="u.id">
            {{ u.nombre }} ({{ u.email }}) - {{ u.rol }}
          </option>
        </select>
        <p class="hint" *ngIf="cargandoUsuarios">Cargando usuarios...</p>
        <p class="hint" *ngIf="!cargandoUsuarios && !usuarios.length">
          No hay usuarios candidatos. Primero cambia el rol a "taller" en Roles y permisos.
        </p>

        <label>Nombre de taller</label>
        <input type="text" formControlName="nombre" />

        <label>Dirección</label>
        <input type="text" formControlName="direccion" />
        <button type="button" class="secondary" (click)="buscarEnMapa()" [disabled]="buscandoDireccion">
          {{ buscandoDireccion ? 'Buscando...' : 'Buscar en mapa' }}
        </button>

        <label>Latitud</label>
        <input type="number" formControlName="latitud" readonly />

        <label>Longitud</label>
        <input type="number" formControlName="longitud" readonly />

        <label>Servicios (coma separado)</label>
        <input type="text" formControlName="servicios" />

        <label class="inline">
          <input type="checkbox" formControlName="disponible" /> Disponible
        </label>

        <button type="submit" [disabled]="loading || form.invalid">{{ loading ? 'Guardando...' : 'Registrar taller' }}</button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <div class="map-section">
        <h3>Ubicación del taller</h3>
        <div class="map-wrapper">
          <div id="taller-map" class="map"></div>
        </div>
        <p class="hint">Tip: busca por dirección y luego ajusta con clic o arrastrando el marcador.</p>
        <p class="coords" *ngIf="coordenadasSeleccionadas">
          Punto seleccionado: {{ coordenadasSeleccionadas }}
        </p>
      </div>
    </section>
  `,
  styles: [`
    .card { max-width: 760px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .map-section { margin: 8px 0 14px; }
    .map-section h3 { margin: 0 0 8px; font-size: 16px; color:#1f3a7a; }
    .grid { display:grid; gap:8px; }
    .map-wrapper { margin: 6px 0 2px; border:1px solid #e2e6ef; border-radius:10px; overflow:hidden; }
    .map { height: 460px; width: 100%; background:#eef2fb; cursor: crosshair; }
    .hint { margin: 0 0 6px; color:#6d7890; font-size: 13px; }
    .coords { margin: 0; color:#1f3a7a; font-size:13px; font-weight:600; }
    :host ::ng-deep .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e24b4a;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px #e24b4a;
    }
    .secondary { background:#f0f4ff; color:#1f3a7a; border:1px solid #ccd8f5; }
    .inline { display:flex; align-items:center; gap:8px; margin: 6px 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class RegistrarTallerPageComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false;
  buscandoDireccion = false;
  cargandoUsuarios = false;
  ok = '';
  error = '';
  coordenadasSeleccionadas = '';
  usuarios: AdminUserListItem[] = [];
  private map: Map | null = null;
  private pointMarker: Marker | null = null;
  private readonly subs = new Subscription();

  readonly form = this.fb.nonNullable.group({
    usuario_id: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', [Validators.required]],
    latitud: [-17.7833],
    longitud: [-63.1821],
    servicios: ['llanta,motor,bateria'],
    disponible: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly tallerService: TallerService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('resize', this.onResize);
    this.map?.remove();
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    const sub = this.authService.listTallerCandidates().subscribe({
      next: (res) => {
        this.cargandoUsuarios = false;
        this.usuarios = res ?? [];
      },
      error: () => {
        this.cargandoUsuarios = false;
      },
    });
    this.subs.add(sub);
  }

  private initMap(): void {
    if (this.map) return;

    this.map = new Map('taller-map', {
      zoomControl: true,
      preferCanvas: true,
    }).setView(
      [this.form.controls.latitud.value, this.form.controls.longitud.value],
      13,
    );

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      updateWhenIdle: true,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const defaultIcon = divIcon({
      className: '',
      html: '<div class="pin-dot"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    this.pointMarker = marker(
      [this.form.controls.latitud.value, this.form.controls.longitud.value],
      { draggable: true, icon: defaultIcon },
    ).addTo(this.map);

    this.pointMarker.on('dragend', () => {
      const pos = this.pointMarker?.getLatLng();
      if (pos) this.actualizarCoordenadas(pos.lat, pos.lng, false);
    });

    this.map.on('click', (e: LeafletMouseEvent) => {
      this.actualizarCoordenadas(e.latlng.lat, e.latlng.lng, true);
    });

    // En layouts con sidebar/panel, Leaflet puede renderizarse "cortado"
    // hasta que se invalida tamaño después del primer paint.
    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
      setTimeout(() => this.map?.invalidateSize(), 250);
      setTimeout(() => this.map?.invalidateSize(), 800);
    });

    window.addEventListener('resize', this.onResize);
  }

  buscarEnMapa(): void {
    const direccion = this.form.controls.direccion.value.trim();
    if (!direccion) {
      this.error = 'Ingresa una dirección para buscar en el mapa';
      return;
    }

    this.buscandoDireccion = true;
    this.error = '';
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(direccion)}`;
    const req = this.http.get<Array<{ lat: string; lon: string }>>(url);
    const sub = req.subscribe({
      next: (rows) => {
        this.buscandoDireccion = false;
        if (!rows.length) {
          this.error = 'No se encontró esa dirección. Intenta con más detalle.';
          return;
        }
        const lat = Number(rows[0].lat);
        const lng = Number(rows[0].lon);
        this.actualizarCoordenadas(lat, lng, true);
      },
      error: () => {
        this.buscandoDireccion = false;
        this.error = 'No se pudo buscar la dirección en el mapa';
      },
    });
    this.subs.add(sub);
  }

  private actualizarCoordenadas(lat: number, lng: number, centrar: boolean): void {
    this.form.patchValue({ latitud: lat, longitud: lng });
    this.coordenadasSeleccionadas = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (this.pointMarker) {
      this.pointMarker.setLatLng(latLng(lat, lng));
      this.pointMarker.bindTooltip('Ubicación seleccionada', {
        direction: 'top',
        offset: [0, -10],
        permanent: true,
      }).openTooltip();
    }
    if (centrar && this.map) {
      this.map.setView([lat, lng], 15);
      this.map.invalidateSize();
    }
  }

  private readonly onResize = () => {
    this.map?.invalidateSize();
  };

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';

    const v = this.form.getRawValue();
    const payload = {
      usuario_id: v.usuario_id,
      nombre: v.nombre,
      direccion: v.direccion || undefined,
      latitud: Number(v.latitud),
      longitud: Number(v.longitud),
      servicios: v.servicios.split(',').map((s) => s.trim()).filter(Boolean),
      disponible: v.disponible,
    };

    this.tallerService.registrarTaller(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.ok = `Taller registrado: ${res.nombre}`;
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getBackendError(err, 'No se pudo registrar taller');
      },
    });
  }

  private getBackendError(err: any, fallback: string): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === 'string') return first.msg;
    }
    if (typeof err?.error === 'string' && err.error.trim()) return err.error;
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    if (typeof err?.status === 'number') return `${fallback} (HTTP ${err.status})`;
    return fallback;
  }
}
