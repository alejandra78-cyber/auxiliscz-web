import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminService,
  ReputacionTaller,
  ReputacionTalleresResponse,
} from '../../services/admin.service';

@Component({
  selector: 'app-reputacion-talleres-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reputacion-talleres-page.component.html',
  styleUrl: './reputacion-talleres-page.component.css',
})
export class ReputacionTalleresPageComponent implements OnInit {
  filtro = {
    nombre: '',
    estado: '',
    calificacion_minima: '',
    fecha_inicio: '',
    fecha_fin: '',
  };
  data: ReputacionTalleresResponse | null = null;
  detalle: ReputacionTaller | null = null;
  loading = false;
  actionLoadingId = '';
  error = '';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get talleres(): ReputacionTaller[] {
    return this.data?.talleres ?? [];
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.adminService.reputacionTalleres(this.filtro).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'No se pudo cargar la reputación de talleres';
        this.loading = false;
      },
    });
  }

  verDetalle(row: ReputacionTaller): void {
    this.detalle = row;
  }

  cerrarDetalle(): void {
    this.detalle = null;
  }

  suspender(row: ReputacionTaller): void {
    if (!confirm(`¿Suspender el taller ${row.nombre_taller}?`)) return;
    this.actionLoadingId = row.taller_id;
    this.adminService.suspenderTallerReputacion(row.taller_id).subscribe({
      next: () => {
        this.actionLoadingId = '';
        this.cargar();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'No se pudo suspender el taller';
        this.actionLoadingId = '';
      },
    });
  }

  reactivar(row: ReputacionTaller): void {
    this.actionLoadingId = row.taller_id;
    this.adminService.reactivarTallerReputacion(row.taller_id).subscribe({
      next: () => {
        this.actionLoadingId = '';
        this.cargar();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'No se pudo reactivar el taller';
        this.actionLoadingId = '';
      },
    });
  }

  formatRating(value?: number | null): string {
    return value == null ? 'Sin evaluaciones' : `${Number(value).toFixed(1)} / 5`;
  }

  formatMinutes(value?: number | null): string {
    if (value == null) return 'Sin datos';
    const minutes = Number(value);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return m ? `${h} h ${m} min` : `${h} h`;
    }
    return `${minutes.toFixed(1)} min`;
  }

  formatMoney(value?: number | null): string {
    return `${Number(value || 0).toFixed(2)} Bs`;
  }

  estadoLabel(value: string): string {
    return (value || 'pendiente').replaceAll('_', ' ');
  }

  starCount(row: ReputacionTaller, star: number): number {
    return Number(row.distribucion_estrellas?.[star] ?? row.distribucion_estrellas?.[String(star) as unknown as number] ?? 0);
  }
}
