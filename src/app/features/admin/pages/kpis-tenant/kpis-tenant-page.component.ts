import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminService, KpiSerieItem, KpisTenant, TenantItem } from '../../services/admin.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-kpis-tenant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpis-tenant-page.component.html',
  styleUrl: './kpis-tenant-page.component.css',
})
export class KpisTenantPageComponent implements OnInit {
  tenants: TenantItem[] = [];
  tenantId = '';
  fechaInicio = '';
  fechaFin = '';
  data: KpisTenant | null = null;
  loading = false;
  loadingTenants = false;
  error = '';
  readonly role = this.authService.getCurrentRole();
  private readonly chartColors = ['#1f3a7a', '#2f80ed', '#27ae60', '#f2994a', '#9b51e0', '#eb5757'];

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadingTenants = true;
      this.adminService.listarTenants().subscribe({
        next: (rows) => {
          this.tenants = rows;
          this.loadingTenants = false;
          this.cargar();
        },
        error: () => {
          this.loadingTenants = false;
          this.cargar();
        },
      });
      return;
    }
    this.cargar();
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get hasData(): boolean {
    if (!this.data) return false;
    return (
      this.hasNumber(this.data.tiempo_promedio_asignacion_min) ||
      this.hasNumber(this.data.tiempo_promedio_llegada_min) ||
      this.data.casos_cancelados > 0 ||
      this.data.nivel_cumplimiento_sla > 0 ||
      this.total(this.data.incidentes_por_tipo) > 0 ||
      this.total(this.data.zonas_con_mas_incidentes) > 0 ||
      this.data.talleres_mas_eficientes.length > 0
    );
  }

  get slaOk(): number {
    return Math.max(0, Math.min(100, this.data?.nivel_cumplimiento_sla ?? 0));
  }

  get slaKo(): number {
    return Math.max(0, 100 - this.slaOk);
  }

  get incidentesVisibles(): KpiSerieItem[] {
    return (this.data?.incidentes_por_tipo ?? []).filter((item) => Number(item.valor || 0) > 0);
  }

  get talleresOrdenados() {
    return [...(this.data?.talleres_mas_eficientes ?? [])].sort((a, b) => {
      const aRespuesta = a.tiempo_promedio_respuesta_min ?? Number.MAX_SAFE_INTEGER;
      const bRespuesta = b.tiempo_promedio_respuesta_min ?? Number.MAX_SAFE_INTEGER;
      const aFinal = a.tiempo_promedio_finalizacion_min ?? Number.MAX_SAFE_INTEGER;
      const bFinal = b.tiempo_promedio_finalizacion_min ?? Number.MAX_SAFE_INTEGER;
      return aRespuesta - bRespuesta || aFinal - bFinal || b.cumplimiento_sla - a.cumplimiento_sla;
    });
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    const filtro = {
      tenant_id: this.isAdmin ? this.tenantId : '',
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin,
    };
    this.adminService.kpisTenant(filtro).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'No se pudieron cargar los KPIs operacionales';
        this.loading = false;
      },
    });
  }

  formatMinutes(value?: number | null): string {
    if (!this.hasNumber(value)) return 'Sin datos';
    const minutes = Number(value);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rest = Math.round(minutes % 60);
      return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
    }
    return `${minutes.toFixed(1)} min`;
  }

  formatPercent(value?: number | null): string {
    if (!this.hasNumber(value)) return '0%';
    return `${Number(value).toFixed(1)}%`;
  }

  total(items?: KpiSerieItem[]): number {
    return (items ?? []).reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }

  barWidth(item: KpiSerieItem, items?: KpiSerieItem[]): string {
    const max = Math.max(...(items ?? []).map((row) => Number(row.valor || 0)), 1);
    return `${Math.max(4, (Number(item.valor || 0) / max) * 100)}%`;
  }

  slaDonutStyle(): string {
    return `conic-gradient(#1f8f5f 0 ${this.slaOk}%, #edf1f7 ${this.slaOk}% 100%)`;
  }

  incidentDonutStyle(): string {
    const items = this.incidentesVisibles;
    const total = this.total(items);
    if (!total) return 'conic-gradient(#edf1f7 0 100%)';
    let cursor = 0;
    const segments = items.map((item, index) => {
      const value = (Number(item.valor || 0) / total) * 100;
      const start = cursor;
      cursor += value;
      return `${this.incidentColor(index)} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  incidentColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  percent(item: KpiSerieItem, items?: KpiSerieItem[]): string {
    const total = this.total(items);
    if (!total) return '0%';
    return `${((Number(item.valor || 0) / total) * 100).toFixed(1)}%`;
  }

  zonaPrincipal(item: KpiSerieItem, index: number): string {
    const label = (item.label || '').trim();
    if (!label || label === 'Sin zona registrada') return 'Sin zona registrada';
    if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(label)) {
      return `Zona aproximada ${index + 1}`;
    }
    return label;
  }

  zonaDetalle(item: KpiSerieItem): string {
    const label = (item.label || '').trim();
    if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(label)) {
      return `Coordenadas agrupadas: ${label}`;
    }
    return '';
  }

  private hasNumber(value?: number | null): boolean {
    return value !== null && value !== undefined && !Number.isNaN(Number(value));
  }
}
