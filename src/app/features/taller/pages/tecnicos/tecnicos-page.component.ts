import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Tecnico, TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-tecnicos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Gestionar Técnicos</h2>

      <form [formGroup]="form" (ngSubmit)="registrar()" class="row">
        <input type="text" formControlName="nombre" placeholder="Nombre del técnico" />
        <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Guardando...' : 'Registrar técnico' }}</button>
      </form>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <table *ngIf="tecnicos.length">
        <thead>
          <tr><th>Nombre</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tecnicos">
            <td>{{ t.nombre }}</td>
            <td>{{ t.disponible ? 'Disponible' : 'No disponible' }}</td>
          </tr>
        </tbody>
      </table>
      <p *ngIf="!tecnicos.length && !loading" class="muted">Aún no hay técnicos registrados.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .row { display:flex; gap:8px; margin-bottom:12px; }
    .row input { flex:1; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    .muted { color:#6d7890; }
    table { width:100%; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; }
  `],
})
export class TecnicosPageComponent implements OnInit {
  tecnicos: Tecnico[] = [];
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tallerService: TallerService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.tallerService.listarTecnicos().subscribe({
      next: (res) => {
        this.tecnicos = res;
        this.error = '';
      },
      error: (err) => {
        this.tecnicos = [];
        this.error = err?.error?.detail ?? 'No se pudo cargar técnicos';
      },
    });
  }

  registrar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';

    this.tallerService.registrarTecnico(this.form.getRawValue().nombre).subscribe({
      next: () => {
        this.loading = false;
        this.ok = 'Técnico registrado correctamente';
        this.form.reset();
        this.cargar();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo registrar técnico';
      },
    });
  }
}

