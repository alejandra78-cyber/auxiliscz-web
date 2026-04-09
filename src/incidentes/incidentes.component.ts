import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IncidenteService, Incidente } from '../incidente.service';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <div class="header">
        <h2>Incidentes</h2>
        <button (click)="loadIncidentes()">Recargar</button>
      </div>

      <div class="filters">
        <input type="text" placeholder="Buscar por ID..." [(ngModel)]="searchTerm" />
        <select [(ngModel)]="filterStatus">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="atendido">Atendido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <p *ngIf="loading">Cargando incidentes...</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <div *ngIf="!loading && incidentesFiltrados.length === 0" class="empty">
        No hay incidentes para mostrar.
      </div>

      <div class="grid">
        <article *ngFor="let incidente of incidentesFiltrados" class="incident-card">
          <div class="row">
            <h3>#{{ incidente.id }}</h3>
            <span class="status">{{ incidente.estado }}</span>
          </div>
          <p><strong>Tipo:</strong> {{ incidente.tipo }}</p>
          <p><strong>Prioridad:</strong> {{ incidente.prioridad }}</p>
          <p><strong>Fecha:</strong> {{ incidente.creado_en | date:'short' }}</p>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .header h2 { margin:0; color:#1f3a7a; }
    .filters { display:flex; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
    .incident-card { border:1px solid #edf0f6; border-radius:10px; padding:12px; background:#fafcff; }
    .row { display:flex; justify-content:space-between; align-items:center; }
    h3 { margin:0; font-size:14px; color:#1f2b45; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:170px; }
    .status { background:#e8edf9; color:#1f3a7a; padding:4px 8px; border-radius:99px; font-size:12px; }
    .error { color:#b42318; }
    .empty { color:#6c778f; padding:8px 0; }
  `],
})
export class IncidentesComponent implements OnInit {
  incidentes: any[] = [];
  searchTerm = '';
  filterStatus = '';
  loading = false;
  error = '';

  constructor(private readonly incidenteService: IncidenteService) {}

  ngOnInit(): void {
    this.loadIncidentes();
  }

  loadIncidentes(): void {
    this.loading = true;
    this.error = '';
    this.incidenteService.solicitudesPendientes().subscribe({
      next: (res) => {
        this.incidentes = res.length > 0 ? res : this.demoIncidentes();
        if (res.length === 0) {
          this.error = ' ';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar incidentes. Mostrando datos de ejemplo.';
        this.incidentes = this.demoIncidentes();
        this.loading = false;
      },
    });
  }

  get incidentesFiltrados(): Incidente[] {
    return this.incidentes.filter((item) => {
      const statusOk = this.filterStatus ? item.estado === this.filterStatus : true;
      const searchOk = this.searchTerm
        ? item.id.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return statusOk && searchOk;
    });
  }

  private demoIncidentes(): Incidente[] {
    return [
      {
        id: 'INC-1001',
        tipo: 'llanta',
        estado: 'pendiente',
        prioridad: 2,
        lat_incidente: -17.7833,
        lng_incidente: -63.1821,
        creado_en: new Date('2026-04-08T10:30:00').toISOString(),
      },
      {
        id: 'INC-1002',
        tipo: 'motor',
        estado: 'en_proceso',
        prioridad: 1,
        lat_incidente: -17.7921,
        lng_incidente: -63.1767,
        creado_en: new Date('2026-04-08T09:15:00').toISOString(),
      },
      {
        id: 'INC-1003',
        tipo: 'choque',
        estado: 'atendido',
        prioridad: 1,
        lat_incidente: -17.7714,
        lng_incidente: -63.1671,
        creado_en: new Date('2026-04-07T15:45:00').toISOString(),
      },
    ];
  }
}
