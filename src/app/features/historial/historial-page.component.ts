import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h2>Historial</h2>
      <p class="muted">Última actividad registrada</p>
      <ul>
        <li *ngFor="let h of historial">{{ h }}</li>
      </ul>
      <a routerLink="/incidentes">Ir a Incidentes</a>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin: 4px 0 12px; }
    ul { padding-left: 18px; margin-bottom: 12px; }
  `],
})
export class HistorialPageComponent {
  historial = [
    'INC-1001 - llanta - atendido',
    'INC-1002 - motor - en_proceso',
    'INC-1003 - choque - pendiente',
  ];
}
