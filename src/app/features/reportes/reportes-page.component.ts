import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Reportes</h2>
      <p class="muted">Datos de referencia para visualización inicial.</p>
      <ul>
        <li *ngFor="let r of reportes">{{ r }}</li>
      </ul>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin: 4px 0 12px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 8px; }
  `],
})
export class ReportesPageComponent {
  reportes = [
    'Incidentes por zona (últimos 30 días)',
    'Tiempo promedio de atención por taller',
    'Ranking de talleres por satisfacción',
  ];
}
