import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Pagos</h2>
      <p class="muted">Resumen visible mientras conectamos el módulo completo.</p>
      <div class="grid">
        <article class="metric" *ngFor="let p of resumen">
          <span>{{ p.label }}</span>
          <strong>{{ p.value }}</strong>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin: 4px 0 12px; }
    .grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .metric { border:1px solid #eef1f6; border-radius:10px; padding:12px; background:#fafcff; }
    .metric span { display:block; color:#6d7890; font-size:12px; }
    .metric strong { font-size:20px; color:#1f3a7a; }
  `],
})
export class PagosPageComponent {
  resumen = [
    { label: 'Pendientes', value: 'Bs 1.250' },
    { label: 'Completados', value: 'Bs 8.450' },
    { label: 'Fallidos', value: 'Bs 320' },
  ];
}
