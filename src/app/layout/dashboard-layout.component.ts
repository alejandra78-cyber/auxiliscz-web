import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../features/auth/services/auth.service';

type UserRole = 'admin' | 'taller' | 'tecnico' | 'cliente' | 'conductor' | '';

interface MenuItem {
  label: string;
  path: string;
  roles: UserRole[];
}

interface MenuSection {
  key: string;
  title: string;
  roles: UserRole[];
  items: MenuItem[];
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar" [class.mobile-open]="mobileMenuOpen">
        <div class="brand-wrap">
          <div class="brand">AuxilioSCZ</div>
          <div class="brand-sub">Panel operativo</div>
        </div>

        <a class="home-link" routerLink="/inicio" routerLinkActive="active" (click)="onMenuItemClick()">Inicio</a>

        <section *ngFor="let section of visibleSections" class="menu-section">
          <button class="section-toggle" (click)="toggleSection(section.key)" [attr.aria-expanded]="isOpen(section.key)">
            <span>{{ section.title }}</span>
            <span class="chevron" [class.open]="isOpen(section.key)">▾</span>
          </button>
          <nav *ngIf="isOpen(section.key)" class="section-items">
            <a
              *ngFor="let item of section.items"
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="onMenuItemClick()"
            >
              {{ item.label }}
            </a>
          </nav>
        </section>

        <div class="quick-actions">
          <a routerLink="/auth/recuperar-password" routerLinkActive="active" (click)="onMenuItemClick()">Recuperar contraseña</a>
        </div>

        <button class="logout" (click)="logout()">Cerrar sesión</button>
      </aside>
      <button
        class="mobile-overlay"
        *ngIf="mobileMenuOpen"
        aria-label="Cerrar menú"
        (click)="closeMobileMenu()"
      ></button>

      <section class="content">
        <header class="topbar">
          <div class="top-left">
            <button
              type="button"
              class="menu-btn"
              aria-label="Abrir menú"
              (click)="toggleMobileMenu()"
            >
              ☰
            </button>
            <h1>Panel de Gestión de Emergencias</h1>
          </div>
          <span class="role-pill">{{ role || 'usuario' }}</span>
        </header>
        <main class="panel">
          <router-outlet></router-outlet>
        </main>
      </section>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 300px 1fr;
      background: #f4f6fb;
      position: relative;
    }
    .sidebar {
      background: linear-gradient(180deg, #1f3a7a 0%, #163267 100%);
      color: #fff;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: auto;
      border-right: 1px solid rgba(255, 255, 255, 0.14);
    }
    .brand-wrap { padding: 4px 8px 10px; }
    .brand {
      font-weight: 800;
      font-size: 28px;
      letter-spacing: 0.2px;
      line-height: 1;
    }
    .brand-sub {
      margin-top: 6px;
      color: #cad8ff;
      font-size: 12px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .home-link {
      color: #dfe8ff;
      text-decoration: none;
      padding: 10px 12px;
      border-radius: 10px;
      transition: all .2s ease;
      font-weight: 600;
      display: block;
      background: rgba(255, 255, 255, 0.08);
    }
    .home-link:hover,
    .home-link.active {
      background: rgba(255,255,255,.18);
      color: #fff;
    }
    .menu-section {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
    }
    .section-toggle {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: transparent;
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .section-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .chevron {
      transition: transform .2s ease;
      display: inline-block;
    }
    .chevron.open {
      transform: rotate(180deg);
    }
    .section-items {
      display: grid;
      gap: 4px;
      padding: 0 8px 8px;
    }
    .section-items a {
      color: #dfe8ff;
      text-decoration: none;
      padding: 8px 10px;
      border-radius: 8px;
      transition: all .2s ease;
      font-size: 13px;
    }
    .section-items a:hover,
    .section-items a.active {
      background: rgba(255,255,255,.18);
      color: #fff;
    }
    .quick-actions {
      margin-top: auto;
      border-top: 1px solid rgba(255,255,255,.16);
      padding-top: 8px;
    }
    .quick-actions a {
      color: #dfe8ff;
      text-decoration: none;
      padding: 9px 12px;
      border-radius: 8px;
      display: block;
    }
    .quick-actions a:hover,
    .quick-actions a.active {
      background: rgba(255,255,255,.16);
      color: #fff;
    }
    .logout {
      background: #e24b4a;
      width: 100%;
      margin-top: 4px;
    }
    .content {
      min-width: 0;
      display: grid;
      grid-template-rows: auto 1fr;
      background: #f4f6fb;
    }
    .topbar {
      background: #fff;
      border-bottom: 1px solid #e6e8ef;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .top-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .menu-btn {
      display: none;
      background: #eef3ff;
      color: #1f3a7a;
      border: 1px solid #d6e0fa;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 18px;
      line-height: 1;
    }
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 39;
      background: rgba(9, 18, 33, 0.35);
      border: none;
      border-radius: 0;
      padding: 0;
    }
    .topbar h1 {
      margin: 0;
      font-size: 22px;
      color: #1f2b45;
      line-height: 1.2;
    }
    .topbar-sub {
      margin: 4px 0 0;
      font-size: 12px;
      color: #74819a;
    }
    .role-pill {
      font-size: 12px;
      font-weight: 700;
      color: #1f3a7a;
      background: #dfe8ff;
      border-radius: 999px;
      padding: 6px 10px;
      text-transform: uppercase;
      align-self: flex-start;
    }
    .panel {
      padding: 20px 24px;
      overflow: auto;
    }
    @media (max-width: 1200px) {
      .layout { grid-template-columns: 260px 1fr; }
      .panel { padding: 16px; }
      .topbar h1 { font-size: 20px; }
    }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .menu-btn { display: inline-flex; }
      .mobile-overlay { display: block; }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: min(84vw, 320px);
        max-height: 100vh;
        z-index: 40;
        transform: translateX(-105%);
        transition: transform .25s ease;
        border-right: none;
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        padding: 12px 14px;
      }
      .topbar h1 {
        font-size: 18px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .role-pill {
        font-size: 11px;
        padding: 5px 8px;
      }
      .panel {
        padding: 12px;
      }
    }
    @media (max-width: 560px) {
      .topbar {
        padding: 10px 10px;
      }
      .topbar h1 {
        font-size: 16px;
      }
      .role-pill {
        display: none;
      }
    }
  `],
})
export class DashboardLayoutComponent {
  role: UserRole = '';
  visibleSections: MenuSection[] = [];
  mobileMenuOpen = false;
  private readonly openSections = new Set<string>();

  private readonly sections: MenuSection[] = [
    {
      key: 'clientes-vehiculos',
      title: 'Gestión de Clientes y Vehículos',
      roles: ['cliente', 'conductor', 'admin'],
      items: [
        { label: 'Registrar vehículos', path: '/clientes-vehiculos/registrar-vehiculo', roles: ['cliente', 'conductor', 'admin'] },
        { label: 'Estado de solicitud', path: '/clientes-vehiculos/estado-solicitud', roles: ['cliente', 'conductor', 'admin'] },
        { label: 'Ubicación del técnico', path: '/clientes-vehiculos/ubicacion-tecnico', roles: ['cliente', 'conductor', 'admin'] },
      ],
    },
    {
      key: 'talleres-operacion',
      title: 'Gestión de Talleres y Operación',
      roles: ['taller', 'tecnico', 'admin'],
      items: [
        { label: 'Disponibilidad', path: '/talleres-operacion/disponibilidad', roles: ['taller', 'admin'] },
        { label: 'Técnicos', path: '/talleres-operacion/tecnicos', roles: ['taller', 'admin'] },
        { label: 'Trabajo completado', path: '/talleres-operacion/trabajo-completado', roles: ['taller', 'tecnico', 'admin'] },
      ],
    },
    {
      key: 'registro-emergencias',
      title: 'Registro de Emergencias',
      roles: ['cliente', 'conductor', 'taller', 'admin'],
      items: [
        { label: 'Reportar emergencia', path: '/registro-emergencias/reportar-emergencia', roles: ['cliente', 'conductor', 'admin'] },
        { label: 'Cancelar solicitud', path: '/registro-emergencias/cancelar-solicitud', roles: ['cliente', 'conductor', 'admin'] },
        { label: 'Comunicación y notificaciones', path: '/registro-emergencias/comunicacion-notificaciones', roles: ['taller', 'admin'] },
      ],
    },
    {
      key: 'atencion-asignacion',
      title: 'Atención y Asignación de Solicitudes',
      roles: ['taller', 'admin'],
      items: [
        { label: 'Consultar solicitudes', path: '/atencion-solicitudes/consultar-solicitudes', roles: ['taller', 'admin'] },
        { label: 'Evaluar solicitud', path: '/atencion-solicitudes/evaluar-solicitud', roles: ['taller', 'admin'] },
        { label: 'Asignar servicio', path: '/atencion-solicitudes/asignar-servicio', roles: ['taller', 'admin'] },
        { label: 'Actualizar estado', path: '/atencion-solicitudes/actualizar-estado', roles: ['taller', 'admin'] },
      ],
    },
    // Paquete pagos oculto temporalmente (ciclo 3)
    {
      key: 'admin-reportes',
      title: 'Administración y Reportes',
      roles: ['admin'],
      items: [
        { label: 'Aprobar talleres', path: '/admin-reportes/aprobar-talleres', roles: ['admin'] },
        { label: 'Roles y permisos', path: '/admin-reportes/roles-permisos', roles: ['admin'] },
      ],
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.role = (this.authService.getCurrentRole() as UserRole) || '';
    this.visibleSections = this.buildVisibleSections();
    for (const s of this.visibleSections) {
      this.openSections.add(s.key);
    }
  }

  isOpen(sectionKey: string): boolean {
    return this.openSections.has(sectionKey);
  }

  toggleSection(sectionKey: string): void {
    if (this.openSections.has(sectionKey)) {
      this.openSections.delete(sectionKey);
    } else {
      this.openSections.add(sectionKey);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onMenuItemClick(): void {
    if (window.innerWidth <= 980) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 980 && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  private matchesRole(roles: UserRole[]): boolean {
    if (!this.role) return false;
    return roles.includes(this.role);
  }

  private buildVisibleSections(): MenuSection[] {
    return this.sections
      .filter((s) => this.matchesRole(s.roles))
      .map((s) => ({
        ...s,
        items: s.items.filter((item) => this.matchesRole(item.roles)),
      }))
      .filter((s) => s.items.length > 0);
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }
}
