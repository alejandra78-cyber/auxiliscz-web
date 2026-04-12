import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AsignacionService, SolicitudServicio } from '../../services/asignacion.service';

@Component({
  selector: 'app-solicitudes-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Solicitudes de Servicio</h2>
      <p *ngIf="error" class="error">{{ error }}</p>
      <table *ngIf="solicitudes.length">
        <thead><tr><th>ID</th><th>Tipo</th><th>Prioridad</th><th>Estado</th></tr></thead>
        <tbody>
          <tr *ngFor="let s of solicitudes">
            <td>{{ s.id }}</td>
            <td>{{ s.tipo }}</td>
            <td>{{ s.prioridad }}</td>
            <td>{{ s.estado }}</td>
          </tr>
        </tbody>
      </table>
      <p *ngIf="!solicitudes.length && !error" class="muted">No hay solicitudes pendientes.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .error { color:#b42318; }
    .muted { color:#6d7890; }
    table { width:100%; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; }
  `],
})
export class SolicitudesPageComponent implements OnInit {
  solicitudes: SolicitudServicio[] = [];
  error = '';

  constructor(private readonly asignacionService: AsignacionService) {}

  ngOnInit(): void {
    this.asignacionService.listarSolicitudes().subscribe({
      next: (rows) => {
        this.solicitudes = rows;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar solicitudes';
      },
    });
  }
}

