import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Taller, TallerService } from './taller.service';

@Component({
  selector: 'app-disponibilidad-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Disponibilidad del Taller</h2>

    <p *ngIf="taller">Taller: {{ taller.nombre }}</p>
    <p *ngIf="taller">Estado actual: {{ taller.disponible ? 'Disponible' : 'No disponible' }}</p>

    <label>
      <input type="checkbox" [(ngModel)]="disponible" />
      Disponible
    </label>
    <button (click)="guardar()">Actualizar disponibilidad</button>

    <p *ngIf="mensaje">{{ mensaje }}</p>
    <p *ngIf="error" style="color: #b42318">{{ error }}</p>
  `,
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
        this.taller = res ?? this.demoTaller();
        this.disponible = !!res.disponible;
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar taller. Mostrando datos de ejemplo.';
        this.taller = this.demoTaller();
        this.disponible = this.taller.disponible;
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

  private demoTaller(): Taller {
    return {
      id: 'TAL-01',
      nombre: 'Taller Central SCZ',
      disponible: true,
      servicios: ['motor', 'llanta', 'bateria'],
    };
  }
}
