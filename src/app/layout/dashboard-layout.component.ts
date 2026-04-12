import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../features/auth/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">AuxilioSCZ</div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Inicio</a>
          <a routerLink="/taller/registrar" routerLinkActive="active" *ngIf="role === 'admin'">Registrar taller</a>
          <a routerLink="/taller/tecnicos" routerLinkActive="active" *ngIf="role === 'taller' || role === 'admin'">Técnicos</a>
          <a routerLink="/admin/roles-permisos" routerLinkActive="active" *ngIf="role === 'admin'">Roles y permisos</a>
          <a routerLink="/taller/disponibilidad" routerLinkActive="active" *ngIf="role === 'taller' || role === 'admin'">Disponibilidad</a>
          <a routerLink="/taller/desempeno" routerLinkActive="active" *ngIf="role === 'taller' || role === 'admin'">Desempeño</a>
          <a routerLink="/recover-password" routerLinkActive="active">Recuperar contraseña</a>
        </nav>
        <button class="logout" (click)="logout()">Cerrar sesión</button>
      </aside>

      <section class="content">
        <header class="topbar">
          <h1>Panel de Gestión de Emergencias</h1>
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
      grid-template-columns: 260px 1fr;
      background: #f5f4f0;
    }
    .sidebar {
      background: #1f3a7a;
      color: #fff;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .brand {
      font-weight: 800;
      font-size: 24px;
      letter-spacing: 0.4px;
    }
    nav {
      display: grid;
      gap: 6px;
    }
    nav a {
      color: #dfe8ff;
      text-decoration: none;
      padding: 10px 12px;
      border-radius: 8px;
      transition: all .2s ease;
      font-weight: 500;
    }
    nav a:hover,
    nav a.active {
      background: rgba(255,255,255,.16);
      color: #fff;
    }
    .logout {
      margin-top: auto;
      background: #E24B4A;
      width: 100%;
    }
    .content {
      min-width: 0;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .topbar {
      background: #fff;
      border-bottom: 1px solid #e6e8ef;
      padding: 16px 24px;
    }
    .topbar h1 {
      margin: 0;
      font-size: 22px;
      color: #1f2b45;
    }
    .panel {
      padding: 20px 24px;
      overflow: auto;
    }
    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: sticky;
        top: 0;
        z-index: 10;
      }
      nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
})
export class DashboardLayoutComponent {
  role = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.role = this.authService.getCurrentRole();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
