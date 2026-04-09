import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Incidente, TallerService } from './taller.service';

@Component({
  selector: 'app-servicios-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Actualizar Estado del Servicio</h2>

    <button (click)="cargar()">Recargar solicitudes</button>

    <p *ngIf="mensaje">{{ mensaje }}</p>
    <p *ngIf="error" style="color: #b42318">{{ error }}</p>

    <div *ngFor="let i of incidentes" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 12px 0;">
      <p><strong>ID:</strong> {{ i.id }}</p>
      <p><strong>Estado actual:</strong> {{ i.estado }}</p>
      <p><strong>Tipo:</strong> {{ i.tipo }}</p>
      <p><strong>Prioridad:</strong> {{ i.prioridad }}</p>

      <select [(ngModel)]="estadoSeleccionado[i.id]">
        <option value="pendiente">pendiente</option>
        <option value="en_proceso">en_proceso</option>
        <option value="atendido">atendido</option>
        <option value="cancelado">cancelado</option>
      </select>

      <input
        type="number"
        placeholder="Costo (si atendido)"
        [(ngModel)]="costoSeleccionado[i.id]"
      />
      <button (click)="actualizar(i.id)">Actualizar</button>
    </div>
  `,
})
export class ServiciosPageComponent implements OnInit {
  incidentes: Incidente[] = [];
  estadoSeleccionado: Record<string, string> = {};
  costoSeleccionado: Record<string, number> = {};
  mensaje = '';
  error = '';

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.tallerService.listarSolicitudesPendientes().subscribe({
      next: (res) => {
        this.incidentes = res.length ? res : this.demoIncidentes();
        const fuente = this.incidentes;
        for (const i of fuente) {
          this.estadoSeleccionado[i.id] = i.estado ?? 'pendiente';
        }
        this.error = !res.length ? 'Sin solicitudes desde API. Mostrando datos de ejemplo.' : '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar solicitudes. Mostrando datos de ejemplo.';
        this.incidentes = this.demoIncidentes();
        for (const i of this.incidentes) {
          this.estadoSeleccionado[i.id] = i.estado ?? 'pendiente';
        }
      },
    });
  }

  actualizar(id: string): void {
    const estado = this.estadoSeleccionado[id] ?? 'en_proceso';
    const costo = this.costoSeleccionado[id];
    this.tallerService.actualizarEstadoServicio(id, estado, costo).subscribe({
      next: () => {
        this.mensaje = `Estado actualizado para incidente ${id}`;
        this.error = '';
        this.cargar();
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo actualizar estado';
      },
    });
  }

  private demoIncidentes(): Incidente[] {
    return [
      {
        id: 'INC-TAL-01',
        estado: 'pendiente',
        tipo: 'llanta',
        prioridad: 2,
        creado_en: new Date('2026-04-09T09:30:00').toISOString(),
      },
      {
        id: 'INC-TAL-02',
        estado: 'en_proceso',
        tipo: 'motor',
        prioridad: 1,
        creado_en: new Date('2026-04-09T08:10:00').toISOString(),
      },
    ];
  }
}
