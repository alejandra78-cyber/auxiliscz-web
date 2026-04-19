import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionService } from '../../../asignacion/services/asignacion.service';
import { TallerService } from '../../../taller/services/taller.service';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero-card">
      <div class="hero-head">
        <h2>{{ displayName }}</h2>
        <span class="role-badge">Rol: {{ roleLabel }}</span>
      </div>
      <p class="hero-sub">{{ subtitle }}</p>

      <div class="stats-grid">
        <article class="stat">
          <h3>Técnicos habilitados</h3>
          <p>{{ tecnicosDisponibles }}</p>
          <small>{{ tecnicosTotal }} técnicos registrados</small>
        </article>
        <article class="stat">
          <h3>Solicitudes activas</h3>
          <p>{{ solicitudesActivas }}</p>
          <small>pendientes, aprobadas, asignadas o en proceso</small>
        </article>
        <article class="stat">
          <h3>Solicitudes cerradas</h3>
          <p>{{ solicitudesCerradas }}</p>
          <small>completadas, canceladas o rechazadas</small>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .hero-card {
      background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
      border: 1px solid #e1e7f3;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 6px 20px rgba(26, 39, 67, 0.06);
    }
    .hero-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      color: #1f2b45;
      font-size: 30px;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .role-badge {
      background: #dfe8ff;
      color: #1f3a7a;
      border-radius: 999px;
      padding: 6px 12px;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
    }
    .hero-sub {
      margin: 10px 0 16px;
      color: #6d7890;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .stat {
      border: 1px solid #e8edf7;
      border-radius: 12px;
      background: #fff;
      padding: 12px;
    }
    .stat h3 {
      margin: 0 0 6px;
      color: #1f2b45;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .stat p {
      margin: 0;
      color: #2f3e5b;
      font-weight: 600;
      font-size: 28px;
      line-height: 1;
    }
    .stat small {
      display: block;
      margin-top: 8px;
      color: #6d7890;
    }
    @media (max-width: 920px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      h2 {
        font-size: 24px;
      }
    }
  `],
})
export class InicioPageComponent implements OnInit {
  role = '';
  displayName = 'AuxilioSCZ';
  subtitle = 'Panel principal listo para operar por paquetes y casos de uso.';
  tecnicosTotal = 0;
  tecnicosDisponibles = 0;
  solicitudesActivas = 0;
  solicitudesCerradas = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly asignacionService: AsignacionService,
    private readonly tallerService: TallerService,
  ) {}

  get roleLabel(): string {
    const map: Record<string, string> = {
      taller: 'Taller',
      admin: 'Administrador',
      tecnico: 'Técnico',
      conductor: 'Cliente',
      cliente: 'Cliente',
    };
    return map[this.role] ?? (this.role || 'Usuario');
  }

  ngOnInit(): void {
    this.role = this.authService.getCurrentRole();

    if (this.role === 'taller') {
      this.tallerService.obtenerMiTaller().subscribe({
        next: (t) => {
          this.displayName = (t.nombre || 'Taller').toUpperCase();
          this.subtitle = 'Gestión operativa activa: disponibilidad, técnicos, solicitudes y cierre de servicio.';
        },
        error: () => {
          this.displayName = 'TALLER';
          this.subtitle = 'Tu perfil de taller no está completo; revisa los datos de registro.';
        },
      });
      this.cargarMetricasInicio();
      return;
    }

    if (this.role === 'admin') {
      this.displayName = 'AUXILIOSCZ';
      this.subtitle = 'Vista de administración, control de roles y supervisión de operación.';
      this.cargarMetricasInicio();
      return;
    }

    this.displayName = 'AUXILIOSCZ';
    this.subtitle = 'Sesión activa con navegación filtrada por rol.';
    this.cargarMetricasInicio();
  }

  private cargarMetricasInicio(): void {
    if (this.role === 'taller' || this.role === 'admin') {
      this.tallerService.listarTecnicos().subscribe({
        next: (rows) => {
          this.tecnicosTotal = rows.length;
          this.tecnicosDisponibles = rows.filter((t) => t.disponible).length;
        },
      });

      this.asignacionService.listarSolicitudes().subscribe({
        next: (rows) => {
          this.solicitudesActivas = rows.filter((s) =>
            ['pendiente', 'aprobada', 'asignada', 'en_proceso'].includes((s.estado || '').toLowerCase()),
          ).length;
          this.solicitudesCerradas = rows.filter((s) =>
            ['completada', 'cancelada', 'rechazada'].includes((s.estado || '').toLowerCase()),
          ).length;
        },
      });
      return;
    }

    this.tecnicosTotal = 0;
    this.tecnicosDisponibles = 0;
    this.solicitudesActivas = 0;
    this.solicitudesCerradas = 0;
  }
}
