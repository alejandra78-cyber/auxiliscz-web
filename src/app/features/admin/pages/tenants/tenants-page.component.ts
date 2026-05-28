import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService, TenantItem } from '../../services/admin.service';

type OrdenTenant = 'actividad' | 'creacion' | 'nombre';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="tenant-page">
      <header class="hero-card">
        <div>
          <p class="eyebrow">Arquitectura SaaS multi-tenant</p>
          <h2>Gestionar tenants</h2>
          <p>
            Cada tenant representa un taller aprobado. Los clientes son externos; los tecnicos,
            cotizaciones, pagos e indicadores operan dentro del tenant del taller.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn secondary" (click)="irAprobarTalleres()">Crear tenant</button>
        </div>
      </header>

      <div class="feedback" *ngIf="error || ok">
        <p *ngIf="error" class="alert error">{{ error }}</p>
        <p *ngIf="ok" class="alert ok">{{ ok }}</p>
      </div>

      <section class="summary-grid">
        <article class="metric"><strong>{{ tenants.length }}</strong><span>Tenants activos o registrados</span></article>
        <article class="metric"><strong>{{ totalTalleres }}</strong><span>Talleres con tenant</span></article>
        <article class="metric"><strong>{{ totalTecnicos }}</strong><span>Tecnicos asociados</span></article>
        <article class="metric"><strong>{{ totalIncidentes }}</strong><span>Incidentes del taller</span></article>
      </section>

      <section class="panel">
        <div class="section-title stacked">
          <div>
            <h3>Talleres convertidos en tenant</h3>
            <p>Busca, filtra y administra los talleres aprobados que ya tienen aislamiento operativo.</p>
          </div>
          <div class="toolbar">
            <input [(ngModel)]="busqueda" name="busquedaTenant" placeholder="Buscar taller o codigo" />
            <select [(ngModel)]="filtroEstado" name="filtroEstado">
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
            </select>
            <select [(ngModel)]="orden" name="ordenTenant">
              <option value="actividad">Ordenar por actividad</option>
              <option value="creacion">Ordenar por creacion</option>
              <option value="nombre">Ordenar por nombre</option>
            </select>
          </div>
        </div>

        <div class="tenant-grid" *ngIf="tenantsFiltrados.length">
          <article class="tenant-card" *ngFor="let tenant of tenantsFiltrados" [class.selected]="editando?.id === tenant.id">
            <header>
              <div>
                <h4>{{ tenant.taller_nombre || tenant.nombre }}</h4>
                <span class="code">{{ tenant.codigo }}</span>
              </div>
              <span class="status" [ngClass]="estadoClass(tenant.estado)">{{ estadoLabel(tenant.estado) }}</span>
            </header>

            <p class="description">{{ tenant.descripcion || 'Tenant operativo generado al aprobar el taller.' }}</p>

            <div class="mini-kpis">
              <span><strong>{{ tenant.taller_estado || 'sin estado' }}</strong> estado taller</span>
              <span><strong>{{ tenant.tecnicos || 0 }}</strong> tecnicos</span>
              <span><strong>{{ tenant.incidentes || 0 }}</strong> incidentes</span>
              <span><strong>{{ tenant.incidentes_atendidos || 0 }}</strong> atendidos</span>
            </div>

            <dl class="meta">
              <div><dt>Responsable</dt><dd>{{ tenant.administrador_principal || 'No definido' }}</dd></div>
              <div><dt>Creado</dt><dd>{{ formatearFecha(tenant.creado_en) }}</dd></div>
              <div><dt>Ultima actividad</dt><dd>{{ formatearFecha(tenant.ultima_actividad) }}</dd></div>
            </dl>

            <button type="button" class="btn ghost" (click)="editar(tenant)">Administrar tenant</button>
          </article>
        </div>
        <p *ngIf="!tenantsFiltrados.length && !error" class="empty">No hay tenants que coincidan con la busqueda.</p>
      </section>

      <section class="panel form-panel" *ngIf="editando">
        <div class="section-title">
          <div>
            <h3>Cambiar estado del tenant</h3>
            <p>El tenant sigue asociado al taller {{ editando.taller_nombre || editando.nombre }}.</p>
          </div>
          <span class="mode-chip">{{ editando.codigo }}</span>
        </div>

        <form class="tenant-form" (ngSubmit)="guardar()">
          <label>Estado
            <select [(ngModel)]="form.estado" name="estado">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </label>
          <div class="actions wide">
            <button type="submit" class="btn primary">Guardar estado</button>
            <button type="button" class="btn ghost" (click)="cancelarEdicion()">Cancelar</button>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: [`
    :host{display:block}.tenant-page{display:grid;gap:16px}h2,h3,h4,p{margin:0}h2{font-size:26px;color:#0f1d36}h3,h4{color:#12213d}p{color:#5b6880;line-height:1.45}.hero-card,.panel,.metric{background:#fff;border:1px solid #dfe7f3;border-radius:16px}.hero-card{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;background:#f7fbff}.hero-actions{display:flex;gap:10px;flex-wrap:wrap}.eyebrow{margin:0 0 6px;color:#24458f;font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:11px}.feedback{display:grid;gap:8px}.alert{border-radius:10px;padding:10px 12px;font-weight:700}.alert.error{background:#fff1f1;color:#b42318;border:1px solid #fecaca}.alert.ok{background:#effdf5;color:#047857;border:1px solid #bbf7d0}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:12px}.metric,.panel{padding:16px}.metric strong{display:block;color:#1f3a7a;font-size:28px}.metric span,.code,.empty{color:#64748b}.section-title{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}.section-title.stacked{align-items:flex-end}.mode-chip,.status{border-radius:999px;padding:5px 10px;font-size:12px;font-weight:800;white-space:nowrap}.mode-chip,.btn.ghost{background:#eef4ff;color:#24458f;border:1px solid #d7e3fb}.status.activo{background:#dcfce7;color:#166534}.status.inactivo{background:#e5e7eb;color:#374151}.status.suspendido{background:#fee2e2;color:#991b1b}.form-panel{max-width:620px}.tenant-form{display:grid;gap:12px}.wide{grid-column:1/-1}label{display:grid;gap:6px;color:#24324c;font-weight:800;font-size:13px}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid #cfd9ea;border-radius:10px;padding:10px 12px;font:inherit;background:#fff;color:#14213d;outline:none}input:focus,select:focus,textarea:focus{border-color:#24458f}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn{border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}.btn.primary{background:#24458f;color:#fff}.btn.secondary{background:#12213d;color:#fff}.btn.ghost{background:#eef4ff}.toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 170px 210px;gap:10px;width:min(100%,720px)}.tenant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:14px}.tenant-card{border:1px solid #dfe7f3;border-radius:14px;padding:14px;background:#fff;display:grid;gap:12px}.tenant-card.selected{border-color:#24458f}.tenant-card header,.meta div{display:flex;justify-content:space-between;gap:12px}.mini-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mini-kpis span{background:#f5f8fc;border:1px solid #e1e8f2;border-radius:10px;padding:8px;color:#4a5b75;font-size:12px}.meta{display:grid;gap:6px;margin:0}.meta dt{color:#64748b;font-size:12px}.meta dd{margin:0;font-size:12px;text-align:right}.empty{border:1px dashed #cbd5e1;border-radius:12px;padding:18px;text-align:center}@media(max-width:980px){.summary-grid{grid-template-columns:repeat(2,1fr)}.section-title.stacked{align-items:stretch;flex-direction:column}.toolbar{grid-template-columns:1fr;width:100%}}@media(max-width:640px){.hero-card{flex-direction:column}.summary-grid,.mini-kpis{grid-template-columns:1fr}.actions,.hero-actions{flex-direction:column}.btn{width:100%}}
  `],
})
export class TenantsPageComponent implements OnInit {
  tenants: TenantItem[] = [];
  error = '';
  ok = '';
  editando: TenantItem | null = null;
  form: Partial<TenantItem> = { estado: 'activo' };
  busqueda = '';
  filtroEstado = '';
  orden: OrdenTenant = 'actividad';

  constructor(private readonly adminService: AdminService, private readonly router: Router) {}

  ngOnInit(): void { this.cargar(); }

  get totalTalleres(): number { return this.tenants.reduce((acc, t) => acc + Number(t.talleres || 0), 0); }
  get totalTecnicos(): number { return this.tenants.reduce((acc, t) => acc + Number(t.tecnicos || 0), 0); }
  get totalIncidentes(): number { return this.tenants.reduce((acc, t) => acc + Number(t.incidentes || 0), 0); }

  get tenantsFiltrados(): TenantItem[] {
    const term = this.busqueda.trim().toLowerCase();
    const estado = this.filtroEstado.trim().toLowerCase();
    const rows = this.tenants.filter((tenant) => {
      const text = `${tenant.nombre} ${tenant.codigo} ${tenant.taller_nombre || ''}`.toLowerCase();
      return (!term || text.includes(term)) && (!estado || (tenant.estado || '').toLowerCase() === estado);
    });
    return rows.sort((a, b) => {
      if (this.orden === 'nombre') return (a.taller_nombre || a.nombre).localeCompare(b.taller_nombre || b.nombre);
      if (this.orden === 'creacion') return this.fechaMs(b.creado_en) - this.fechaMs(a.creado_en);
      return this.fechaMs(b.ultima_actividad) - this.fechaMs(a.ultima_actividad);
    });
  }

  cargar(): void {
    this.error = '';
    this.ok = '';
    this.adminService.listarTenants().subscribe({
      next: (rows) => (this.tenants = rows || []),
      error: (err) => (this.error = err?.error?.detail ?? 'No se pudo cargar tenants'),
    });
  }

  irAprobarTalleres(): void { this.router.navigate(['/admin-reportes/aprobar-talleres']); }

  guardar(): void {
    if (!this.editando) return;
    this.error = '';
    this.ok = '';
    this.adminService.actualizarTenant(this.editando.id, this.form).subscribe({
      next: () => { this.ok = 'Tenant actualizado correctamente'; this.cancelarEdicion(); this.cargar(); },
      error: (err) => (this.error = err?.error?.detail ?? 'No se pudo guardar el tenant'),
    });
  }

  editar(tenant: TenantItem): void {
    this.editando = tenant;
    this.form = { estado: tenant.estado || 'activo' };
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  cancelarEdicion(): void { this.editando = null; this.form = { estado: 'activo' }; }

  estadoClass(estado: string): string {
    const value = (estado || '').toLowerCase();
    if (value === 'suspendido') return 'suspendido';
    if (value === 'inactivo') return 'inactivo';
    return 'activo';
  }

  estadoLabel(estado: string): string {
    const value = (estado || 'activo').toLowerCase();
    if (value === 'suspendido') return 'Suspendido';
    if (value === 'inactivo') return 'Inactivo';
    return 'Activo';
  }

  formatearFecha(value?: string | null): string {
    if (!value) return 'Sin datos';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin datos';
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private fechaMs(value?: string | null): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}
