import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { HistorialAtencion, TallerService } from './taller.service';

@Component({
  selector: 'app-historial-atenciones-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="header">
        <h2>Historial de Atenciones</h2>
        <button type="button" (click)="cargar()" [disabled]="loading">
          {{ loading ? 'Cargando...' : 'Recargar' }}
        </button>
      </div>

      <p *ngIf="loading" class="muted">Cargando historial...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !error && !historial.length" class="muted">
        No hay atenciones registradas.
      </p>

      <div class="table-wrap" *ngIf="!loading && !error && historial.length">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Incidente</th>
              <th>Estado final</th>
              <th>Técnico</th>
              <th>Ubicación</th>
              <th>Costo</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of historial">
              <td>{{ formatearFecha(item.fecha) }}</td>
              <td>{{ item.cliente || '-' }}</td>
              <td>{{ item.vehiculo || '-' }}</td>
              <td>{{ item.tipo_incidente }}</td>
              <td>{{ item.estado_final }}</td>
              <td>{{ item.tecnico_asignado || '-' }}</td>
              <td>{{ item.ubicacion || '-' }}</td>
              <td>{{ formatearMonto(item.costo) }}</td>
              <td>{{ item.pago_estado ? (item.pago_estado + ' (' + formatearMonto(item.pago_monto) + ')') : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: #fff;
      border: 1px solid #e2e6ef;
      border-radius: 12px;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }
    h2 {
      margin: 0;
      font-size: 20px;
      color: #1f2b45;
    }
    .muted {
      color: #6d7890;
    }
    .error {
      color: #b42318;
    }
    .table-wrap {
      overflow: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }
    th, td {
      border-bottom: 1px solid #e7ebf3;
      padding: 10px;
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      color: #344054;
      background: #f8f9fc;
      white-space: nowrap;
    }
    button {
      background: #1f3a7a;
      color: #fff;
      border: 0;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `],
})
export class HistorialAtencionesPageComponent implements OnInit {
  loading = false;
  error = '';
  historial: HistorialAtencion[] = [];

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.tallerService.obtenerHistorialAtenciones().subscribe({
      next: (res) => {
        this.historial = res ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar el historial de atenciones.';
        this.historial = [];
        this.loading = false;
      },
    });
  }

  formatearFecha(valor: string): string {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }
    return fecha.toLocaleString();
  }

  formatearMonto(monto: number | null): string {
    if (monto === null || monto === undefined) {
      return '-';
    }
    return `Bs ${monto.toFixed(2)}`;
  }
}
