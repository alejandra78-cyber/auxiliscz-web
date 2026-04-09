import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CambiarPasswordService } from '../service/cambiar-password.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section style="max-width: 420px; margin: 0 auto; padding: 24px;">
      <h2>Cambiar contraseña</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="actual">Contraseña actual</label>
        <input id="actual" type="password" formControlName="password_actual" />

        <label for="nueva">Nueva contraseña</label>
        <input id="nueva" type="password" formControlName="password_nueva" />

        <label for="confirmacion">Confirmación nueva contraseña</label>
        <input
          id="confirmacion"
          type="password"
          formControlName="password_nueva_confirmacion"
        />

        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Guardando...' : 'Actualizar contraseña' }}
        </button>
      </form>

      <p *ngIf="message">{{ message }}</p>
      <p *ngIf="error" style="color: #b42318">{{ error }}</p>
    </section>
  `,
})
export class CambiarPasswordComponent {
  loading = false;
  message = '';
  error = '';

  readonly form = this.fb.nonNullable.group({
    password_actual: ['', [Validators.required, Validators.minLength(6)]],
    password_nueva: ['', [Validators.required, Validators.minLength(6)]],
    password_nueva_confirmacion: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly cambiarPasswordService: CambiarPasswordService,
  ) {}

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.message = '';
    this.error = '';

    this.cambiarPasswordService.ejecutar(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.message = res.mensaje ?? 'Contraseña actualizada correctamente';
        this.loading = false;
        this.form.reset();
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo actualizar la contraseña';
        this.loading = false;
      },
    });
  }
}
