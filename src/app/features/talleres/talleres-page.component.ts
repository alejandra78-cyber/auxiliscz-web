import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-talleres-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Talleres</h2>
      <p class="muted">Datos de ejemplo para mantener la vista operativa.</p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Zona</th><th>Estado</th><th>Calificación</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of talleres">
            <td>{{ t.nombre }}</td>
            <td>{{ t.zona }}</td>
            <td>{{ t.estado }}</td>
            <td>{{ t.calificacion }} ★</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin: 4px 0 12px; }
    table { width:100%; border-collapse: collapse; font-size:14px; }
    th, td { text-align:left; padding:10px; border-bottom:1px solid #eef1f6; }
    th { color:#1f3a7a; font-weight:700; }
  `],
})
export class TalleresPageComponent {
  talleres = [
    { nombre: 'Taller Central SCZ', zona: 'Equipetrol', estado: 'Activo', calificacion: 4.8 },
    { nombre: 'Taller Norte', zona: 'Plan 3000', estado: 'Activo', calificacion: 4.6 },
    { nombre: 'Taller Este', zona: 'Piraí', estado: 'En pausa', calificacion: 4.3 },
  ];
}

