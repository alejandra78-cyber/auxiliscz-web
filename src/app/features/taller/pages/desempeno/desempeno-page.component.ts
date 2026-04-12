import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { HistorialAtencion, TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-desempeno-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Desempeño del Taller</h2>

      <div class="kpis">
        <article><strong>{{ total }}</strong><span>Atenciones históricas</span></article>
        <article><strong>{{ atendidos }}</strong><span>Atendidos</span></article>
        <article><strong>{{ cancelados }}</strong><span>Cancelados</span></article>
      </div>

      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .kpis { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
    article { background:#f8faff; border:1px solid #e6ebf8; border-radius:10px; padding:12px; }
    strong { display:block; font-size:24px; color:#1f3a7a; }
    span { color:#6d7890; font-size:13px; }
    .error { color:#b42318; }
  `],
})
export class DesempenoPageComponent implements OnInit {
  total = 0;
  atendidos = 0;
  cancelados = 0;
  error = '';

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.tallerService.obtenerHistorialAtenciones().subscribe({
      next: (rows: HistorialAtencion[]) => {
        this.total = rows.length;
        this.atendidos = rows.filter((r) => r.estado_final === 'atendido').length;
        this.cancelados = rows.filter((r) => r.estado_final === 'cancelado').length;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar desempeño';
      },
    });
  }
}

