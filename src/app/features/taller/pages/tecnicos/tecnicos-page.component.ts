import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Tecnico, TecnicoCandidato, TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-tecnicos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Gestionar Técnicos</h2>

      <form [formGroup]="form" (ngSubmit)="registrar()" class="row">
        <select formControlName="usuarioId">
          <option value="" disabled>Selecciona un usuario con rol técnico</option>
          <option *ngFor="let c of candidatos" [value]="c.id">
            {{ c.nombre }} ({{ c.email }})
          </option>
        </select>
        <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Guardando...' : 'Registrar técnico' }}</button>
      </form>
      <p class="muted" *ngIf="!candidatos.length && !loading">No hay usuarios con rol técnico disponibles para vincular.</p>

      <p *ngIf="ok" class="ok">{{ ok }}</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <div class="table-wrap" *ngIf="tecnicos.length">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tecnicos">
              <td>{{ t.nombre }}</td>
              <td>{{ t.email || '-' }}</td>
              <td>{{ t.disponible ? 'Disponible' : 'No disponible' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p *ngIf="!tecnicos.length && !loading" class="muted">Aún no hay técnicos registrados.</p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; min-width: 0; }
    .row { display:flex; gap:8px; margin-bottom:12px; }
    .row select { flex:1; min-width: 0; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    .muted { color:#6d7890; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width:100%; min-width: 520px; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eef1f6; padding:8px; text-align:left; }
    @media (max-width: 900px) {
      .card { padding: 12px; }
      .row { flex-direction: column; }
      .row button { width: 100%; }
    }
  `],
})
export class TecnicosPageComponent implements OnInit {
  tecnicos: Tecnico[] = [];
  candidatos: TecnicoCandidato[] = [];
  loading = false;
  ok = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    usuarioId: ['', [Validators.required]],
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
    this.tallerService.listarCandidatosTecnico().subscribe({
      next: (res) => {
        this.candidatos = res ?? [];
      },
      error: () => {
        this.candidatos = [];
      },
    });
  }

  registrar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.ok = '';
    this.error = '';

    this.tallerService.registrarTecnico(this.form.getRawValue().usuarioId).subscribe({
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
