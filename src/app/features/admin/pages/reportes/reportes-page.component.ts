import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AdminResumen, AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Reportes y Métricas</h2>
      <p *ngIf="error" class="error">{{ error }}</p>
      <div class="grid" *ngIf="resumen">
        <article><strong>{{ resumen.incidentes.total }}</strong><span>Incidentes totales</span></article>
        <article><strong>{{ resumen.talleres.total }}</strong><span>Talleres registrados</span></article>
        <article><strong>{{ resumen.talleres.aprobados }}</strong><span>Talleres aprobados</span></article>
        <article><strong>{{ resumen.servicios_completados }}</strong><span>Servicios completados</span></article>
        <article><strong>{{ resumen.pagos.pagados }}</strong><span>Pagos confirmados</span></article>
        <article><strong>{{ resumen.comision_total }}</strong><span>Comisión plataforma (Bs)</span></article>
      </div>
      <div class="grid small" *ngIf="resumen">
        <article><strong>{{ resumen.promedio_calificacion }}</strong><span>Promedio calificación</span></article>
        <article><strong>{{ resumen.incidentes.hoy }}</strong><span>Incidentes hoy</span></article>
        <article><strong>{{ resumen.incidentes.este_mes }}</strong><span>Incidentes este mes</span></article>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .small { margin-top:10px; }
    article { background:#f8faff; border:1px solid #e6ebf8; border-radius:10px; padding:12px; }
    strong { display:block; font-size:22px; color:#1f3a7a; }
    span { color:#6d7890; font-size:13px; }
    .error { color:#b42318; }
  `],
})
export class ReportesPageComponent implements OnInit {
  resumen: AdminResumen | null = null;
  error = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.resumen().subscribe({
      next: (res) => {
        this.resumen = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar reportes';
      },
    });
  }
}

