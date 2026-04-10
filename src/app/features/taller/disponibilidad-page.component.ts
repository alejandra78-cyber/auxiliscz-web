import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Taller, TallerService } from './taller.service';

@Component({
  selector: 'app-disponibilidad-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h2>Gestionar Disponibilidad del Taller</h2>

      <p *ngIf="taller"><strong>Taller:</strong> {{ taller.nombre }}</p>
      <p *ngIf="taller"><strong>Estado actual:</strong> {{ taller.disponible ? 'Disponible' : 'No disponible' }}</p>

      <label class="inline">
        <input type="checkbox" [(ngModel)]="disponible" />
        Disponible
      </label>
      <button (click)="guardar()">Actualizar disponibilidad</button>

      <p *ngIf="mensaje" class="ok">{{ mensaje }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 680px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .inline { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
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
