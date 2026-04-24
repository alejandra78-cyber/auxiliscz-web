import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { ServicioCatalogo, TallerAdminOption, TallerService, Tecnico } from '../../services/taller.service';

@Component({
  selector: 'app-tecnicos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <section class="card">
      <header class="hero">
        <p class="eyebrow">Taller</p>
        <h2>Gestionar Técnicos</h2>
        <p class="sub">Registra técnicos, controla su estado operativo y prepara el flujo para asignación y seguimiento.</p>
      </header>

      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="noServiciosConfigurados && !isSupervision" class="warn">Primero configure los servicios que ofrece el taller.</p>
      <p *ngIf="isSupervision" class="readonly-banner">Modo supervisión Admin: solo lectura</p>

      <label *ngIf="isSupervision">
        Taller a visualizar
        <select [(ngModel)]="selectedTallerId" (change)="cargar()">
          <option value="">Selecciona un taller</option>
          <option *ngFor="let t of talleresAdmin" [value]="t.id">{{ t.nombre }}</option>
        </select>
      </label>

      <form *ngIf="!isSupervision" [formGroup]="createForm" (ngSubmit)="registrar()" class="form-grid">
        <label>
          Nombre del técnico
          <input type="text" formControlName="nombre" placeholder="Ej: Carlos Mendoza" />
        </label>
        <label>
          Email
          <input type="email" formControlName="email" placeholder="tecnico@correo.com" />
        </label>
        <label>
          Teléfono
          <input type="text" formControlName="telefono" placeholder="7xxxxxxx" />
        </label>
        <fieldset class="specialties full">
          <legend>Especialidades</legend>
          <label *ngFor="let s of serviciosTallerCatalogo" class="check-row">
            <input
              type="checkbox"
              [checked]="selectedEspecialidadesCreate.has(s.id)"
              (change)="toggleEspecialidadCreate(s.id, $any($event.target).checked)"
            />
            {{ s.nombre_visible }}
          </label>
        </fieldset>
        <label class="check-row full">
          <input type="checkbox" formControlName="disponible" />
          Disponible al registrar
        </label>
        <button type="submit" [disabled]="createForm.invalid || loading">
          {{ loading ? 'Guardando...' : 'Agregar técnico' }}
        </button>
      </form>

      <p *ngIf="!tecnicos.length && !loading" class="muted">Aún no hay técnicos registrados.</p>

      <section class="cards" *ngIf="tecnicos.length">
        <article class="tec-card" *ngFor="let t of tecnicos">
          <div class="head">
            <div>
              <h3>{{ t.nombre }}</h3>
              <p>{{ t.email || '-' }}</p>
            </div>
            <span class="pill" [class.ok-pill]="t.activo" [class.off-pill]="!t.activo">{{ t.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>

          <div class="meta">
            <span><strong>Tel:</strong> {{ t.telefono || '-' }}</span>
            <span><strong>Especialidades:</strong> {{ (t.especialidades_nombres || []).join(', ') || '-' }}</span>
            <span><strong>Estado:</strong> {{ t.estado_operativo || 'disponible' }}</span>
            <span><strong>Disponible:</strong> {{ t.disponible ? 'Sí' : 'No' }}</span>
          </div>

          <div class="actions" *ngIf="!isSupervision">
            <button type="button" class="secondary" (click)="iniciarEdicion(t)">Editar</button>
            <button type="button" class="secondary" *ngIf="t.activo" (click)="cambiarActivo(t, false)">Desactivar</button>
            <button type="button" class="secondary" *ngIf="!t.activo" (click)="cambiarActivo(t, true)">Activar</button>
          </div>

          <form *ngIf="editingId === t.id && !isSupervision" [formGroup]="editForm" (ngSubmit)="guardarEdicion()" class="edit-grid">
            <label>
              Nombre
              <input type="text" formControlName="nombre" />
            </label>
            <label>
              Teléfono
              <input type="text" formControlName="telefono" />
            </label>
            <fieldset class="specialties full">
              <legend>Especialidades</legend>
              <label *ngFor="let s of serviciosTallerCatalogo" class="check-row">
                <input
                  type="checkbox"
                  [checked]="selectedEspecialidadesEdit.has(s.id)"
                  (change)="toggleEspecialidadEdit(s.id, $any($event.target).checked)"
                />
                {{ s.nombre_visible }}
              </label>
            </fieldset>
            <label>
              Estado operativo
              <select formControlName="estado_operativo">
                <option value="disponible">disponible</option>
                <option value="ocupado">ocupado</option>
                <option value="en_camino">en_camino</option>
                <option value="en_proceso">en_proceso</option>
                <option value="fuera_de_servicio">fuera_de_servicio</option>
              </select>
            </label>
            <label class="check-row full">
              <input type="checkbox" formControlName="disponible" />
              Disponible
            </label>
            <div class="actions full">
              <button type="submit" [disabled]="editForm.invalid || loading">Guardar cambios</button>
              <button type="button" class="secondary" (click)="cancelarEdicion()">Cancelar</button>
            </div>
          </form>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; display:grid; gap:14px; min-width: 0; }
    .hero { background: linear-gradient(135deg, #eef6ff, #eff8f2); border:1px solid #dce7fa; border-radius:12px; padding:12px; }
    .eyebrow { margin:0 0 4px; font-size:12px; font-weight:700; color:#1f3a7a; text-transform: uppercase; letter-spacing: .4px; }
    .hero h2 { margin:0; color:#1f2b45; }
    .sub { margin:6px 0 0; color:#5b6881; }
    .form-grid, .edit-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
    label { display:grid; gap:6px; font-size:13px; font-weight:600; color:#213454; }
    .full { grid-column: 1 / -1; }
    .specialties { border:1px solid #e4e9f6; border-radius:10px; padding:10px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:8px; }
    .specialties legend { padding:0 6px; color:#38527a; font-size:13px; font-weight:700; }
    .check-row { display:flex; align-items:center; gap:8px; font-weight:500; }
    .check-row input[type='checkbox'] { width:16px; height:16px; }
    .cards { display:grid; gap:12px; }
    .tec-card { border:1px solid #e4e9f6; border-radius:12px; padding:12px; display:grid; gap:10px; background:#fbfcff; }
    .head { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
    .head h3 { margin:0; color:#1f2b45; }
    .head p { margin:2px 0 0; color:#65738f; }
    .meta { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:6px 12px; font-size:13px; color:#2c4168; }
    .pill { border-radius:999px; padding:4px 8px; font-size:12px; font-weight:700; }
    .ok-pill { background:#dff4e8; color:#0f6f40; }
    .off-pill { background:#ffe2df; color:#a11a18; }
    .actions { display:flex; gap:8px; flex-wrap:wrap; }
    .secondary { background:#fff; color:#27417d; border:1px solid #b8c8ea; }
    .ok { color:#027a48; margin:0; }
    .warn { color:#8b5a00; margin:0; background:#fff1d1; border:1px solid #f1d08a; border-radius:8px; padding:8px 10px; }
    .error { color:#b42318; margin:0; }
    .muted { color:#6d7890; margin:0; }
    .readonly-banner { margin:0; color:#8b5a00; background:#fff1d1; border:1px solid #f1d08a; border-radius:8px; padding:8px 10px; font-weight:600; }
    @media (max-width: 840px) {
      .card { padding:12px; }
      .form-grid, .edit-grid, .meta, .specialties { grid-template-columns: 1fr; }
      .actions button, button[type='submit'] { width:100%; }
    }
  `],
})
export class TecnicosPageComponent implements OnInit {
  serviciosTallerCatalogo: ServicioCatalogo[] = [];
  readonly selectedEspecialidadesCreate = new Set<string>();
  readonly selectedEspecialidadesEdit = new Set<string>();
  noServiciosConfigurados = false;
  tecnicos: Tecnico[] = [];
  talleresAdmin: TallerAdminOption[] = [];
  isSupervision = false;
  selectedTallerId = '';
  loading = false;
  ok = '';
  error = '';
  editingId = '';

  readonly createForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.minLength(6)]],
    disponible: [true],
  });

  readonly editForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.minLength(6)]],
    estado_operativo: ['disponible'],
    disponible: [true],
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
      this.createForm.disable({ emitEvent: false });
      this.cargarTalleresAdmin();
      return;
    }
    this.cargarServiciosMiTaller();
    this.cargar();
  }

  cargarServiciosMiTaller(): void {
    this.tallerService.listarServiciosMiTaller().subscribe({
      next: (res) => {
        const servicios = (res || []).filter((x) => !!x && !!x.id && !!x.codigo);
        this.serviciosTallerCatalogo = servicios;
        this.noServiciosConfigurados = servicios.length === 0;
        if (servicios.length) {
          const ids = new Set(servicios.map((s) => s.id));
          for (const value of Array.from(this.selectedEspecialidadesCreate)) {
            if (!ids.has(value)) this.selectedEspecialidadesCreate.delete(value);
          }
          for (const value of Array.from(this.selectedEspecialidadesEdit)) {
            if (!ids.has(value)) this.selectedEspecialidadesEdit.delete(value);
          }
        }
      },
      error: (err) => {
        this.noServiciosConfigurados = true;
        this.error = err?.error?.detail ?? 'No se pudieron cargar servicios del taller';
      },
    });
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
    this.loading = true;
    this.ok = '';
    this.error = '';
    const request$ = this.isSupervision
      ? (this.selectedTallerId ? this.tallerService.listarTecnicosTallerAdmin(this.selectedTallerId) : null)
      : this.tallerService.listarTecnicos();
    if (!request$) {
      this.loading = false;
      this.tecnicos = [];
      return;
    }
    request$.subscribe({
      next: (res) => {
        this.loading = false;
        this.tecnicos = res ?? [];
      },
      error: (err) => {
        this.loading = false;
        this.tecnicos = [];
        this.error = err?.error?.detail ?? 'No se pudo cargar técnicos';
      },
    });
  }

  registrar(): void {
    if (this.createForm.invalid) return;
    if (!this.selectedEspecialidadesCreate.size) {
      this.error = 'Debes seleccionar al menos una especialidad';
      return;
    }
    this.loading = true;
    this.ok = '';
    this.error = '';
    const raw = this.createForm.getRawValue();
    this.tallerService.registrarTecnico({
      nombre: raw.nombre.trim(),
      email: raw.email.trim().toLowerCase(),
      telefono: raw.telefono.trim(),
      servicio_ids: Array.from(this.selectedEspecialidadesCreate),
      disponible: !!raw.disponible,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Técnico registrado. Se envió correo para activar su contraseña.';
        this.createForm.reset({
          nombre: '',
          email: '',
          telefono: '',
          disponible: true,
        });
        this.selectedEspecialidadesCreate.clear();
        this.cargar();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo registrar técnico';
      },
    });
  }

  iniciarEdicion(t: Tecnico): void {
    this.editingId = t.id;
    this.selectedEspecialidadesEdit.clear();
    for (const id of (t.servicio_ids || [])) {
      this.selectedEspecialidadesEdit.add(id);
    }
    this.editForm.patchValue({
      nombre: t.nombre || '',
      telefono: t.telefono || '',
      estado_operativo: t.estado_operativo || 'disponible',
      disponible: !!t.disponible,
    });
  }

  cancelarEdicion(): void {
    this.editingId = '';
  }

  guardarEdicion(): void {
    if (!this.editingId || this.editForm.invalid) return;
    if (!this.selectedEspecialidadesEdit.size) {
      this.error = 'Debes seleccionar al menos una especialidad';
      return;
    }
    this.loading = true;
    this.ok = '';
    this.error = '';
    const raw = this.editForm.getRawValue();
    this.tallerService.actualizarTecnico(this.editingId, {
      nombre: raw.nombre.trim(),
      telefono: raw.telefono.trim(),
      estado_operativo: raw.estado_operativo as 'disponible' | 'ocupado' | 'en_camino' | 'en_proceso' | 'fuera_de_servicio',
      disponible: !!raw.disponible,
    }).subscribe({
      next: () => {
        this.tallerService.actualizarEspecialidadesTecnico(this.editingId, Array.from(this.selectedEspecialidadesEdit)).subscribe({
          next: () => {
            this.loading = false;
            this.ok = 'Técnico actualizado correctamente';
            this.editingId = '';
            this.cargar();
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.detail ?? 'No se pudieron actualizar especialidades';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo actualizar técnico';
      },
    });
  }

  cambiarActivo(t: Tecnico, activo: boolean): void {
    this.loading = true;
    this.ok = '';
    this.error = '';
    this.tallerService.cambiarEstadoTecnico(t.id, { activo }).subscribe({
      next: () => {
        this.loading = false;
        this.ok = activo ? 'Técnico activado' : 'Técnico desactivado';
        this.cargar();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo cambiar estado del técnico';
      },
    });
  }

  toggleEspecialidadCreate(servicioId: string, checked: boolean): void {
    if (checked) this.selectedEspecialidadesCreate.add(servicioId);
    else this.selectedEspecialidadesCreate.delete(servicioId);
  }

  toggleEspecialidadEdit(servicioId: string, checked: boolean): void {
    if (checked) this.selectedEspecialidadesEdit.add(servicioId);
    else this.selectedEspecialidadesEdit.delete(servicioId);
  }
}
