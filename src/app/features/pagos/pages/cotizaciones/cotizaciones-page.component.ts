import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-cotizaciones-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Cotizaciones y Pagos</h2>
      <p class="muted">Módulo conectado al paquete pagos.</p>
      <p *ngIf="estado">{{ estado }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; }
    .error { color:#b42318; }
  `],
})
export class CotizacionesPageComponent implements OnInit {
  estado = '';
  error = '';

  constructor(private readonly pagosService: PagosService) {}

  ngOnInit(): void {
    this.pagosService.estado().subscribe({
      next: (res) => {
        this.estado = res.mensaje;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo conectar con pagos';
      },
    });
  }
}

