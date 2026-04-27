import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { divIcon, latLng, LeafletMouseEvent, Map, marker, Marker, tileLayer } from 'leaflet';

import {
  DisponibilidadTaller,
  TallerAdminOption,
  TallerService,
} from '../../services/taller.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-disponibilidad-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <section class="card">
      <header class="hero">
        <p class="eyebrow">Taller</p>
        <h2>Disponibilidad Operativa</h2>
        <p class="sub">Configura estado, capacidad, cobertura y servicios para que el motor de asignación use datos reales.</p>
      </header>

      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="mensaje" class="ok">{{ mensaje }}</p>
      <p *ngIf="isSupervision" class="readonly-banner">Modo supervisión Admin: solo lectura</p>

      <label *ngIf="isSupervision">
        Taller a visualizar
        <select [(ngModel)]="selectedTallerId" (change)="cargar()">
          <option value="">Selecciona un taller</option>
          <option *ngFor="let t of talleresAdmin" [value]="t.id">{{ t.nombre }}</option>
        </select>
      </label>

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

        <label class="check-row">
          <input type="checkbox" formControlName="disponible" [disabled]="isSupervision" />
          Disponible para asignación
        </label>

        <fieldset class="location-box full">
          <legend>Ubicación del taller</legend>
          <div class="map-head">
            <label class="search-input">
              Buscar dirección
              <input
                type="text"
                [(ngModel)]="direccionBusqueda"
                [ngModelOptions]="{standalone: true}"
                placeholder="Ej: Av. Banzer, Santa Cruz"
                [disabled]="isSupervision || buscandoDireccion"
              />
            </label>
            <button type="button" class="ghost" (click)="buscarEnMapa()" [disabled]="isSupervision || buscandoDireccion">
              {{ buscandoDireccion ? 'Buscando...' : 'Buscar en mapa' }}
            </button>
          </div>
          <div class="coords">
            <label>
              Latitud
              <input type="number" step="0.000001" formControlName="latitud" readonly />
            </label>
            <label>
              Longitud
              <input type="number" step="0.000001" formControlName="longitud" readonly />
            </label>
          </div>
          <div class="map-wrap"><div id="disponibilidad-map" class="map"></div></div>
          <p class="hint">Haz clic en el mapa o mueve el pin para ajustar la ubicación.</p>
          <div class="location-actions">
            <button type="button" class="ghost" (click)="usarUbicacionActual()" [disabled]="isSupervision || loadingGps">
              {{ loadingGps ? 'Obteniendo GPS...' : 'Usar mi ubicación actual' }}
            </button>
            <button type="button" (click)="guardarUbicacion()" [disabled]="isSupervision || loadingLocation || !tieneLatLong()">
              {{ loadingLocation ? 'Guardando ubicación...' : 'Cambiar ubicación' }}
            </button>
          </div>
        </fieldset>

        <fieldset class="services">
          <legend>Servicios atendidos</legend>
          <label *ngFor="let s of serviciosCatalogo" class="check-row">
            <input
              type="checkbox"
              [checked]="selectedServicios.has(s)"
              [disabled]="isSupervision"
              (change)="toggleServicio(s, $any($event.target).checked)"
            />
            {{ s }}
          </label>
        </fieldset>

        <label class="full">
          Observaciones operativas
          <textarea rows="3" formControlName="observaciones_operativas" placeholder="Ej: horario reducido por mantenimiento"></textarea>
        </label>

        <button type="submit" [disabled]="loading || form.invalid || isSupervision">
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
    .location-box { grid-column: 1 / -1; border:1px solid #e4e9f6; border-radius:10px; padding:10px; display:grid; gap:8px; }
    .location-box legend { padding:0 6px; color:#38527a; font-size:13px; font-weight:700; }
    .map-head { display:flex; justify-content: space-between; align-items: end; gap: 8px; }
    .search-input { flex: 1; }
    .coords { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
    .map-wrap { border-radius: 10px; overflow: hidden; border: 1px solid #d7e2f5; }
    .map { height: 280px; width: 100%; background: #eef2fb; cursor: crosshair; }
    :host ::ng-deep .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e24b4a;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px #e24b4a;
    }
    .hint { margin: 0; font-size: 12px; color: #67758f; }
    .check-row { display:flex; align-items:center; gap:8px; font-weight:500; }
    .check-row input[type='checkbox'] { width:16px; height:16px; }
    .location-actions { grid-column: 1 / -1; display:flex; gap:8px; flex-wrap: wrap; }
    .ghost { background:#fff; color:#1f3a7a; border:1px solid #cfd8ef; }
    .table-wrap { overflow-x:auto; -webkit-overflow-scrolling: touch; }
    table { width:100%; min-width:700px; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; font-size:13px; }
    th { color:#2f4a73; background:#f8faff; text-transform:uppercase; font-size:11px; letter-spacing:.4px; }
    .ok { color:#027a48; margin:0; }
    .error { color:#b42318; margin:0; }
    .readonly-banner { margin:0; color:#8b5a00; background:#fff1d1; border:1px solid #f1d08a; border-radius:8px; padding:8px 10px; font-weight:600; }
    .turnos h3 { margin:0 0 6px; color:#1f2b45; }
    @media (max-width: 980px) {
      .summary { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .services { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 700px) {
      .card { padding:12px; }
      .form-grid { grid-template-columns: 1fr; }
      .map-head { flex-direction: column; align-items: stretch; }
      .coords { grid-template-columns: 1fr; }
      .services { grid-template-columns: 1fr; }
      .map { height: 240px; }
      .location-actions button { width:100%; }
      button[type='submit'] { width:100%; }
      .summary { grid-template-columns: 1fr; }
    }
  `],
})
export class DisponibilidadPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly serviciosCatalogo = ['bateria', 'llanta', 'motor', 'choque', 'remolque', 'otros'];
  readonly selectedServicios = new Set<string>();

  snapshot: DisponibilidadTaller | null = null;
  isSupervision = false;
  selectedTallerId = '';
  talleresAdmin: TallerAdminOption[] = [];
  loading = false;
  loadingGps = false;
  loadingLocation = false;
  buscandoDireccion = false;
  mensaje = '';
  error = '';
  direccionBusqueda = '';
  private map: Map | null = null;
  private pointMarker: Marker | null = null;
  private readonly defaultLat = -17.7833;
  private readonly defaultLng = -63.1821;

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
    private readonly http: HttpClient,
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

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.map?.remove();
  }

  cargarTalleresAdmin(): void {
    this.tallerService.listarTalleresAdmin().subscribe({
      next: (rows) => {
        this.talleresAdmin = rows ?? [];
        if (!this.selectedTallerId && this.talleresAdmin.length) {
          this.selectedTallerId = this.route.snapshot.queryParamMap.get('tallerId') || this.talleresAdmin[0].id;
        }
        this.cargar();
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar talleres';
      },
    });
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
        this.selectedServicios.clear();
        for (const s of res.servicios || []) this.selectedServicios.add(s);
        const lat = res.latitud ?? this.defaultLat;
        const lng = res.longitud ?? this.defaultLng;
        this.form.patchValue({
          disponible: !!res.disponible,
          estado_operativo: res.estado_operativo,
          capacidad_maxima: res.capacidad_maxima || 1,
          radio_cobertura_km: res.radio_cobertura_km || 10,
          latitud: lat,
          longitud: lng,
          observaciones_operativas: res.observaciones_operativas ?? '',
        });
        this.actualizarCoordenadas(lat, lng, true);
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

  tieneLatLong(): boolean {
    const raw = this.form.getRawValue();
    return raw.latitud != null && raw.longitud != null;
  }

  usarUbicacionActual(): void {
    if (this.isSupervision) return;
    if (!navigator.geolocation) {
      this.error = 'Tu navegador no soporta geolocalización';
      return;
    }
    this.loadingGps = true;
    this.error = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.loadingGps = false;
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        this.form.patchValue({
          latitud: lat,
          longitud: lng,
        });
        this.actualizarCoordenadas(lat, lng, true);
        this.mensaje = 'Ubicación GPS obtenida. Presiona "Cambiar ubicación" para guardar.';
      },
      () => {
        this.loadingGps = false;
        this.error = 'No se pudo obtener GPS. Revisa permisos del navegador.';
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  guardarUbicacion(): void {
    if (this.isSupervision) return;
    const raw = this.form.getRawValue();
    if (raw.latitud == null || raw.longitud == null) {
      this.error = 'Debes completar latitud y longitud';
      return;
    }
    this.loadingLocation = true;
    this.error = '';
    this.mensaje = '';
    this.tallerService.actualizarUbicacionMiTaller(Number(raw.latitud), Number(raw.longitud)).subscribe({
      next: () => {
        this.loadingLocation = false;
        this.mensaje = 'Ubicación del taller actualizada correctamente';
        this.cargar();
      },
      error: (err) => {
        this.loadingLocation = false;
        this.error = err?.error?.detail ?? 'No se pudo actualizar ubicación del taller';
      },
    });
  }

  buscarEnMapa(): void {
    if (this.isSupervision) return;
    const direccion = this.direccionBusqueda.trim();
    if (!direccion) {
      this.error = 'Ingresa una dirección para buscar en el mapa';
      return;
    }
    this.buscandoDireccion = true;
    this.error = '';
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(direccion)}`;
    this.http.get<Array<{ lat: string; lon: string }>>(url).subscribe({
      next: (rows) => {
        this.buscandoDireccion = false;
        if (!rows.length) {
          this.error = 'No se encontró la dirección en el mapa';
          return;
        }
        const lat = Number(rows[0].lat);
        const lng = Number(rows[0].lon);
        this.actualizarCoordenadas(lat, lng, true);
        this.mensaje = 'Dirección encontrada. Presiona "Cambiar ubicación" para guardar.';
      },
      error: () => {
        this.buscandoDireccion = false;
        this.error = 'No se pudo buscar la dirección en este momento';
      },
    });
  }

  private initMap(): void {
    if (this.map) return;
    const lat = this.form.controls.latitud.value ?? this.defaultLat;
    const lng = this.form.controls.longitud.value ?? this.defaultLng;
    this.map = new Map('disponibilidad-map', { zoomControl: true, preferCanvas: true }).setView([lat, lng], 13);
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
    this.pointMarker = marker([lat, lng], { draggable: !this.isSupervision, icon: defaultIcon }).addTo(this.map);
    this.pointMarker.on('dragend', () => {
      if (this.isSupervision) return;
      const pos = this.pointMarker?.getLatLng();
      if (pos) this.actualizarCoordenadas(pos.lat, pos.lng, false);
    });
    this.map.on('click', (e: LeafletMouseEvent) => {
      if (this.isSupervision) return;
      this.actualizarCoordenadas(e.latlng.lat, e.latlng.lng, true);
    });
    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
      setTimeout(() => this.map?.invalidateSize(), 250);
      setTimeout(() => this.map?.invalidateSize(), 800);
    });
    window.addEventListener('resize', this.onResize);
  }

  private actualizarCoordenadas(lat: number, lng: number, centrar: boolean): void {
    this.form.patchValue({
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6)),
    });
    if (this.pointMarker) {
      this.pointMarker.setLatLng(latLng(lat, lng));
    }
    if (centrar && this.map) {
      this.map.setView([lat, lng], 15);
      this.map.invalidateSize();
    }
  }

  private readonly onResize = () => this.map?.invalidateSize();

  guardar(): void {
    if (this.isSupervision) return;
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
