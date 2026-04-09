import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TallerService, Tecnico } from './taller.service';

@Component({
  selector: 'app-tecnicos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Registrar Técnicos</h2>

    <div style="margin-top: 12px;">
      <input [(ngModel)]="nombreTecnico" placeholder="Nombre técnico" />
      <button (click)="crearTecnico()">Registrar técnico</button>
    </div>

    <p *ngIf="mensaje">{{ mensaje }}</p>
    <p *ngIf="error" style="color: #b42318">{{ error }}</p>

    <ul>
      <li *ngFor="let tecnico of tecnicos">
        {{ tecnico.nombre }} - {{ tecnico.disponible ? 'Disponible' : 'No disponible' }}
      </li>
    </ul>
  `,
})
export class TecnicosPageComponent implements OnInit {
  nombreTecnico = '';
  tecnicos: Tecnico[] = [];
  mensaje = '';
  error = '';

  constructor(private readonly tallerService: TallerService) {}

  ngOnInit(): void {
    this.cargarTecnicos();
  }

  cargarTecnicos(): void {
    this.tallerService.listarTecnicos().subscribe({
      next: (res) => {
        this.tecnicos = res.length ? res : this.demoTecnicos();
        this.error = !res.length ? 'Sin técnicos desde API. Mostrando datos de ejemplo.' : '';
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar técnicos. Mostrando datos de ejemplo.';
        this.tecnicos = this.demoTecnicos();
      },
    });
  }

  crearTecnico(): void {
    const nombre = this.nombreTecnico.trim();
    if (!nombre) return;
    this.tallerService.registrarTecnico(nombre).subscribe({
      next: () => {
        this.nombreTecnico = '';
        this.mensaje = 'Técnico registrado correctamente';
        this.error = '';
        this.cargarTecnicos();
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo registrar técnico';
      },
    });
  }

  private demoTecnicos(): Tecnico[] {
    return [
      { id: 'TEC-01', nombre: 'Carlos Méndez', disponible: true },
      { id: 'TEC-02', nombre: 'Ana Roca', disponible: false },
      { id: 'TEC-03', nombre: 'Luis Salazar', disponible: true },
    ];
  }
}
