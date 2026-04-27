import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { divIcon, latLng, LeafletMouseEvent, Map, marker, Marker, tileLayer } from 'leaflet';

import { TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-registrar-taller-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="shell">
      <section class="card">
        <header class="head">
          <p class="eyebrow">Afiliación de Taller</p>
          <h1>Solicitar Registro del Taller</h1>
          <p>
            Completa el formulario para registrar tu solicitud. Un administrador revisará y te notificará el resultado.
          </p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
          <label>Nombre del taller <input type="text" formControlName="nombre_taller" /></label>
          <label>Nombre del responsable <input type="text" formControlName="responsable_nombre" /></label>
          <label>Email <input type="email" formControlName="responsable_email" /></label>
          <label>Teléfono <input type="text" formControlName="responsable_telefono" /></label>
          <label class="span-2">Dirección <input type="text" formControlName="direccion" /></label>
          <div class="span-2 service-box">
            <label class="service-label">Servicios que ofrece</label>
            <div class="service-grid">
              <label class="check" *ngFor="let s of serviciosCatalogo">
                <input type="checkbox" [checked]="serviciosSeleccionados.has(s)" (change)="toggleServicio(s, $any($event.target).checked)" />
                <span>{{ s }}</span>
              </label>
            </div>
            <label>
              Otros servicios (opcional, separados por coma)
              <input type="text" formControlName="servicios_otro" placeholder="Ej: alineación, pintura, escáner" />
            </label>
          </div>
          <label class="span-2">Descripción del negocio <textarea rows="3" formControlName="descripcion"></textarea></label>

          <div class="map-box span-2">
            <div class="map-head">
              <h3>Ubicación</h3>
              <button type="button" class="secondary" (click)="buscarEnMapa()" [disabled]="buscandoDireccion">
                {{ buscandoDireccion ? 'Buscando...' : 'Buscar dirección' }}
              </button>
            </div>
            <div class="coords">
              <label>Latitud <input type="number" formControlName="latitud" readonly /></label>
              <label>Longitud <input type="number" formControlName="longitud" readonly /></label>
            </div>
            <div class="map-wrap"><div id="solicitud-map" class="map"></div></div>
            <p class="hint">Puedes mover el pin o hacer clic para ajustar la ubicación.</p>
          </div>

          <button type="submit" [disabled]="loading || form.invalid">
            {{ loading ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
          <a routerLink="/login" class="link">Volver a iniciar sesión</a>
        </form>

        <p class="ok" *ngIf="ok">{{ ok }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
      </section>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #f4f7ff, #f0f8f3);
      padding: 20px;
    }
    .card {
      width: min(920px, 100%);
      background: #fff;
      border: 1px solid #deE7f8;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 10px 28px rgba(22, 34, 57, 0.08);
      display: grid;
      gap: 12px;
    }
    .head h1 { margin: 0; color: #1f2b45; font-size: 30px; }
    .head p { margin: 6px 0 0; color: #5b6881; }
    .eyebrow { margin: 0; color: #165a90; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .span-2 { grid-column: 1 / -1; }
    label { display:grid; gap: 6px; font-weight: 600; font-size: 13px; color: #213454; }
    textarea { resize: vertical; }
    .service-box {
      background: #f9fbff;
      border: 1px solid #dce5f7;
      border-radius: 12px;
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .service-label {
      font-size: 13px;
      font-weight: 700;
      color: #1f3a7a;
    }
    .service-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #2b3f63;
      background: #fff;
      border: 1px solid #dfe8fa;
      border-radius: 8px;
      padding: 8px;
    }
    .check input {
      width: 16px;
      height: 16px;
    }
    .map-box { background: #f9fbff; border: 1px solid #dce5f7; border-radius: 12px; padding: 10px; display: grid; gap: 8px; }
    .map-head { display:flex; justify-content: space-between; align-items: center; gap: 8px; }
    .map-head h3 { margin: 0; font-size: 16px; color: #1f3a7a; }
    .coords { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .map-wrap { border-radius: 10px; overflow: hidden; border: 1px solid #d7e2f5; }
    .map { height: 320px; width: 100%; background: #eef2fb; cursor: crosshair; }
    :host ::ng-deep .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e24b4a;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px #e24b4a;
    }
    .secondary { background:#edf3ff; color:#1f3a7a; border:1px solid #d2def8; }
    .link { text-align: center; align-self: center; color: #1f3a7a; text-decoration: none; font-weight: 600; }
    .hint { margin: 0; font-size: 12px; color: #67758f; }
    .ok { margin: 0; color: #067647; font-weight: 600; }
    .error { margin: 0; color: #b42318; font-weight: 600; }
    @media (max-width: 860px) {
      .card { padding: 14px; }
      .head h1 { font-size: 24px; }
      .grid { grid-template-columns: 1fr; }
      .coords { grid-template-columns: 1fr; }
      .service-grid { grid-template-columns: 1fr 1fr; }
      .map-head { flex-direction: column; align-items: stretch; }
      .map-head button { width: 100%; }
      .map { height: 270px; }
    }
  `],
})
export class RegistrarTallerPageComponent implements AfterViewInit, OnDestroy {
  loading = false;
  buscandoDireccion = false;
  ok = '';
  error = '';
  private map: Map | null = null;
  private pointMarker: Marker | null = null;
  private readonly subs = new Subscription();

  readonly serviciosCatalogo = [
    'Cambio de llanta',
    'Batería',
    'Remolque / Grúa',
    'Auxilio de combustible',
    'Cerrajería automotriz',
    'Diagnóstico eléctrico',
    'Arranque de emergencia',
    'Mecánica rápida',
    'Frenos',
  ];
  readonly serviciosSeleccionados = new Set<string>(['Cambio de llanta', 'Batería', 'Arranque de emergencia']);

  readonly form = this.fb.nonNullable.group({
    nombre_taller: ['', [Validators.required, Validators.minLength(3)]],
    responsable_nombre: ['', [Validators.required, Validators.minLength(3)]],
    responsable_email: ['', [Validators.required, Validators.email]],
    responsable_telefono: ['', [Validators.required, Validators.minLength(6)]],
    direccion: ['', [Validators.required]],
    latitud: [-17.7833],
    longitud: [-63.1821],
    servicios_otro: [''],
    descripcion: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly tallerService: TallerService,
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('resize', this.onResize);
    this.map?.remove();
  }

  private initMap(): void {
    if (this.map) return;
    this.map = new Map('solicitud-map', { zoomControl: true, preferCanvas: true }).setView(
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
    const sub = this.http.get<Array<{ lat: string; lon: string }>>(url).subscribe({
      next: (rows) => {
        this.buscandoDireccion = false;
        if (!rows.length) {
          this.error = 'No se encontró esa dirección.';
          return;
        }
        this.actualizarCoordenadas(Number(rows[0].lat), Number(rows[0].lon), true);
      },
      error: () => {
        this.buscandoDireccion = false;
        this.error = 'No se pudo buscar la dirección';
      },
    });
    this.subs.add(sub);
  }

  private actualizarCoordenadas(lat: number, lng: number, centrar: boolean): void {
    this.form.patchValue({ latitud: lat, longitud: lng });
    if (this.pointMarker) {
      this.pointMarker.setLatLng(latLng(lat, lng));
    }
    if (centrar && this.map) {
      this.map.setView([lat, lng], 15);
      this.map.invalidateSize();
    }
  }

  private readonly onResize = () => this.map?.invalidateSize();

  toggleServicio(servicio: string, checked: boolean): void {
    if (checked) {
      this.serviciosSeleccionados.add(servicio);
      return;
    }
    this.serviciosSeleccionados.delete(servicio);
  }

  private obtenerServiciosFinales(): string[] {
    const otros = this.form.controls.servicios_otro.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return [...Array.from(this.serviciosSeleccionados), ...otros];
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';
    const v = this.form.getRawValue();
    this.tallerService.registrarSolicitudAfiliacion({
      nombre_taller: v.nombre_taller,
      responsable_nombre: v.responsable_nombre,
      responsable_email: v.responsable_email,
      responsable_telefono: v.responsable_telefono,
      direccion: v.direccion,
      latitud: Number(v.latitud),
      longitud: Number(v.longitud),
      servicios: this.obtenerServiciosFinales(),
      descripcion: v.descripcion || undefined,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Solicitud enviada correctamente. Te contactaremos tras la revisión.';
        this.form.patchValue({ servicios_otro: '', descripcion: '' });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo enviar la solicitud';
      },
    });
  }
}
