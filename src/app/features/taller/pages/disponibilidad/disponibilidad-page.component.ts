import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Taller, TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-disponibilidad-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h2>Gestionar Disponibilidad del Taller</h2>

      <div class="header" *ngIf="taller">
        <p><strong>Taller:</strong> {{ taller.nombre }}</p>
        <span class="badge" [class.active]="disponible" [class.inactive]="!disponible">
          {{ disponible ? 'Disponible' : 'No disponible' }}
        </span>
      </div>

      <label class="switch-row" for="switch-disponible">
        <span>Cambiar estado</span>
        <input
          id="switch-disponible"
          class="switch-input"
          type="checkbox"
          [(ngModel)]="disponible"
        />
        <span class="switch-ui" [class.on]="disponible" aria-hidden="true"></span>
      </label>

      <button (click)="guardar()">Guardar disponibilidad</button>

      <p *ngIf="mensaje" class="ok">{{ mensaje }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 680px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; }
    .header p { margin:0; }
    .badge { padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; }
    .badge.active { background:#e8f7ef; color:#027a48; border:1px solid #9adbb8; }
    .badge.inactive { background:#fff1f0; color:#b42318; border:1px solid #f7b4ad; }
    .switch-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:12px;
      border:1px solid #e8ebf3;
      border-radius:10px;
      margin-bottom:12px;
      cursor:pointer;
      user-select:none;
    }
    .switch-input {
      position:absolute;
      opacity:0;
      width:1px;
      height:1px;
    }
    .switch-ui {
      width:56px;
      height:32px;
      border-radius:999px;
      background:#c7cfdf;
      position:relative;
      transition:all .2s ease;
      flex: 0 0 auto;
    }
    .switch-ui::after {
      content:'';
      position:absolute;
      top:4px;
      left:4px;
      width:24px;
      height:24px;
      border-radius:50%;
      background:#fff;
      box-shadow:0 1px 4px rgba(0,0,0,.2);
      transition:all .2s ease;
    }
    .switch-ui.on {
      background:#1f3a7a;
    }
    .switch-ui.on::after {
      left:28px;
    }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class DisponibilidadPageComponent implements OnInit {
  taller: Taller | null = null;
  disponible = false;
  mensaje = '';
  error = '';

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.tallerService.obtenerMiTaller().subscribe({
      next: (res) => {
        this.taller = res;
        this.disponible = !!res.disponible;
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar taller';
        this.taller = null;
      },
    });
  }

  guardar(): void {
    this.tallerService.cambiarDisponibilidad(this.disponible).subscribe({
      next: (res) => {
        this.taller = res;
        this.mensaje = 'Disponibilidad actualizada';
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo actualizar disponibilidad';
      },
    });
  }
}
