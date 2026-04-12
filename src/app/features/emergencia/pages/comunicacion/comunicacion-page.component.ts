import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { EmergenciaService, IncidenteResumen } from '../../services/emergencia.service';

@Component({
  selector: 'app-comunicacion-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Comunicación y Notificaciones</h2>
      <p class="muted">Visualización operativa de incidentes para coordinación con taller/técnicos.</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <ul *ngIf="incidentes.length">
        <li *ngFor="let i of incidentes">
          <strong>{{ i.id }}</strong> · {{ i.tipo }} · prioridad {{ i.prioridad }} · {{ i.estado }}
        </li>
      </ul>
      <p *ngIf="!incidentes.length && !error" class="muted">No hay incidentes pendientes para comunicar.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; }
    .error { color:#b42318; }
    ul { margin:0; padding-left:18px; }
  `],
})
export class ComunicacionPageComponent implements OnInit {
  incidentes: IncidenteResumen[] = [];
  error = '';

  constructor(private readonly emergenciaService: EmergenciaService) {}

  ngOnInit(): void {
    this.emergenciaService.listarIncidentesParaTaller().subscribe({
      next: (res) => {
        this.incidentes = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar incidentes';
      },
    });
  }
}

