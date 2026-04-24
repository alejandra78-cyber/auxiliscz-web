import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../features/auth/services/auth.service';

type UserRole = 'admin' | 'taller' | 'tecnico' | 'cliente' | 'conductor' | '';
type AccessMode = 'allow' | 'readonly' | 'blocked';
type ActorLabel = 'Todos' | 'Cliente' | 'Taller' | 'Taller/Técnico' | 'Cliente/Taller' | 'Admin' | 'Taller/Sistema';

interface MenuItem {
  code: string;
  label: string;
  actor: ActorLabel;
  path: string;
  roles: UserRole[];
  supervision?: boolean;
}

interface MenuSection {
  key: string;
  title: string;
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

        <section *ngFor="let section of menuSections" class="menu-section">
          <button class="section-toggle" (click)="toggleSection(section.key)" [attr.aria-expanded]="isOpen(section.key)">
            <span>{{ section.title }}</span>
            <span class="chevron" [class.open]="isOpen(section.key)">▾</span>
          </button>
          <nav *ngIf="isOpen(section.key)" class="section-items">
            <div *ngFor="let item of section.items" class="item-wrap">
              <a
                *ngIf="accessOf(item) !== 'blocked'"
                [routerLink]="item.path"
                [queryParams]="itemQueryParams(item)"
                routerLinkActive="active"
                (click)="onMenuItemClick()"
              >
                <div class="item-main">
                  <strong>{{ item.code }} · {{ item.label }}</strong>
                  <small>{{ item.actor }}</small>
                </div>
                <small class="tag" [class.readonly]="accessOf(item) === 'readonly'">
                  {{ accessOf(item) === 'readonly' ? 'Solo lectura' : '●' }}
                </small>
              </a>
              <button
                *ngIf="accessOf(item) === 'blocked'"
                type="button"
                class="blocked-item"
                disabled
              >
                <div class="item-main">
                  <strong>{{ item.code }} · {{ item.label }}</strong>
                  <small>{{ item.actor }}</small>
                </div>
                <small class="tag blocked" aria-label="Bloqueado" title="Bloqueado">●</small>
              </button>
            </div>
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
    .section-items a,
    .blocked-item {
      color: #dfe8ff;
      text-decoration: none;
      padding: 8px 10px;
      border-radius: 8px;
      transition: all .2s ease;
      font-size: 13px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      text-align: left;
    }
    .section-items a:hover,
    .section-items a.active {
      background: rgba(255,255,255,.18);
      color: #fff;
    }
    .blocked-item {
      opacity: .75;
      cursor: not-allowed;
    }
    .item-main {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .item-main strong {
      font-size: 12px;
      font-weight: 700;
      color: #f3f7ff;
      line-height: 1.2;
    }
    .item-main small {
      font-size: 10px;
      color: #c7d5f8;
      line-height: 1.2;
    }
    .tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 999px;
      padding: 2px 6px;
      background: rgba(143, 173, 255, 0.25);
      color: #dfe8ff;
      border: 1px solid rgba(199, 216, 255, 0.35);
      margin-left: 8px;
      white-space: nowrap;
    }
    .tag.readonly {
      background: rgba(255, 216, 145, 0.22);
      border-color: rgba(255, 216, 145, 0.45);
      color: #ffe6b5;
    }
    .tag.blocked {
      background: rgba(255, 149, 149, 0.18);
      border-color: rgba(255, 182, 182, 0.35);
      color: #ffd8d8;
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
  menuSections: MenuSection[] = [];
  mobileMenuOpen = false;
  private readonly openSections = new Set<string>();

  private readonly sections: MenuSection[] = [
    {
      key: 'clientes-vehiculos',
      title: 'Gestión de Clientes y Vehículos',
      items: [
        { code: '', label: 'Registrar vehículos', actor: 'Cliente', path: '/clientes-vehiculos/registrar-vehiculo', roles: ['cliente', 'conductor'] },
        { code: '', label: 'Estado de solicitud', actor: 'Cliente', path: '/clientes-vehiculos/estado-solicitud', roles: ['cliente', 'conductor'] },
        { code: '', label: 'Ubicación del técnico', actor: 'Cliente', path: '/clientes-vehiculos/ubicacion-tecnico', roles: ['cliente', 'conductor'] },
      ],
    },
    {
      key: 'talleres-operacion',
      title: 'Gestión de Talleres y Operación',
      items: [
        { code: '', label: 'Disponibilidad', actor: 'Taller', path: '/talleres-operacion/disponibilidad', roles: ['taller'], supervision: true },
        { code: '', label: 'Técnicos', actor: 'Taller', path: '/talleres-operacion/tecnicos', roles: ['taller'], supervision: true },
        { code: '', label: 'Trabajo completado', actor: 'Taller/Técnico', path: '/talleres-operacion/trabajo-completado', roles: ['taller', 'tecnico'], supervision: true },
      ],
    },
    {
      key: 'registro-emergencias',
      title: 'Registro de Emergencias',
      items: [
        { code: '', label: 'Reportar emergencia', actor: 'Cliente', path: '/registro-emergencias/reportar-emergencia', roles: ['cliente', 'conductor'] },
        { code: '', label: 'Cancelar solicitud', actor: 'Cliente', path: '/registro-emergencias/cancelar-solicitud', roles: ['cliente', 'conductor'] },
        { code: '', label: 'Comunicación y notificaciones', actor: 'Cliente/Taller', path: '/registro-emergencias/comunicacion-notificaciones', roles: ['taller'], supervision: true },
      ],
    },
    {
      key: 'atencion-asignacion',
      title: 'Atención y Asignación de Solicitudes',
      items: [
        { code: '', label: 'Consultar solicitudes', actor: 'Taller', path: '/atencion-solicitudes/consultar-solicitudes', roles: ['taller'], supervision: true },
        { code: '', label: 'Evaluar solicitud', actor: 'Taller', path: '/atencion-solicitudes/evaluar-solicitud', roles: ['taller'], supervision: true },
        { code: '', label: 'Asignar servicio', actor: 'Taller/Sistema', path: '/atencion-solicitudes/asignar-servicio', roles: ['taller'], supervision: true },
        { code: '', label: 'Actualizar estado', actor: 'Taller', path: '/atencion-solicitudes/actualizar-estado', roles: ['taller'], supervision: true },
      ],
    },
    {
      key: 'pagos',
      title: 'Pagos',
      items: [
        { code: '', label: 'Generar cotización', actor: 'Taller', path: '/pagos/generar-cotizacion', roles: ['taller'], supervision: true },
        { code: '', label: 'Gestionar cotización', actor: 'Cliente/Taller', path: '/pagos/gestionar-cotizacion', roles: ['taller', 'cliente', 'conductor'], supervision: true },
        { code: '', label: 'Procesar pago', actor: 'Cliente', path: '/pagos/procesar-pago', roles: ['cliente', 'conductor'] },
      ],
    },
    {
      key: 'admin-reportes',
      title: 'Administración y Reportes',
      items: [
        { code: '', label: 'Aprobar talleres', actor: 'Admin', path: '/admin-reportes/aprobar-talleres', roles: ['admin'] },
        { code: '', label: 'Roles y permisos', actor: 'Admin', path: '/admin-reportes/roles-permisos', roles: ['admin'] },
      ],
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.role = (this.authService.getCurrentRole() as UserRole) || '';
    this.menuSections = this.sections;
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

  accessOf(item: MenuItem): AccessMode {
    if (this.role && item.roles.includes(this.role)) return 'allow';
    if (this.role === 'admin' && item.supervision) return 'readonly';
    return 'blocked';
  }

  itemQueryParams(item: MenuItem): Record<string, string> | undefined {
    if (this.accessOf(item) === 'readonly') {
      return { modo: 'supervision' };
    }
    return undefined;
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }
}
