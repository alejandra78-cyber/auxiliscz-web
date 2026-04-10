import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TallerService } from '../../../taller/taller.service';

@Component({
  selector: 'app-registrar-taller-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Registrar Taller (Admin)</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
        <label>ID usuario del taller</label>
        <input type="text" formControlName="usuario_id" />

        <label>Nombre de taller</label>
        <input type="text" formControlName="nombre" />

        <label>Dirección</label>
        <input type="text" formControlName="direccion" />

        <label>Latitud</label>
        <input type="number" formControlName="latitud" />

        <label>Longitud</label>
        <input type="number" formControlName="longitud" />

        <label>Servicios (coma separado)</label>
        <input type="text" formControlName="servicios" />

        <label class="inline">
          <input type="checkbox" formControlName="disponible" /> Disponible
        </label>

        <button type="submit" [disabled]="loading || form.invalid">{{ loading ? 'Guardando...' : 'Registrar taller' }}</button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 760px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; }
    .inline { display:flex; align-items:center; gap:8px; margin: 6px 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
  `],
})
export class RegistrarTallerPageComponent {
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    usuario_id: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: [''],
    latitud: [0],
    longitud: [0],
    servicios: ['llanta,motor,bateria'],
    disponible: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';

    const v = this.form.getRawValue();
    const payload = {
      usuario_id: v.usuario_id,
      nombre: v.nombre,
      direccion: v.direccion || undefined,
      latitud: Number(v.latitud),
      longitud: Number(v.longitud),
      servicios: v.servicios.split(',').map((s) => s.trim()).filter(Boolean),
      disponible: v.disponible,
    };

    this.tallerService.registrarTaller(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.ok = `Taller registrado: ${res.nombre}`;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo registrar taller';
      },
    });
  }
}
