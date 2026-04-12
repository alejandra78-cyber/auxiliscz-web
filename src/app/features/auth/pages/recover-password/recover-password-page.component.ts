import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recover-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Recuperar Contraseña</h2>
      <p class="muted">Solicita un token de recuperación y luego restablece tu contraseña.</p>

      <form [formGroup]="requestForm" (ngSubmit)="requestToken()" class="form-block">
        <label>Email</label>
        <input type="email" formControlName="email" />
        <button type="submit" [disabled]="loadingRequest || requestForm.invalid">
          {{ loadingRequest ? 'Enviando...' : 'Solicitar token' }}
        </button>
      </form>

      <p *ngIf="requestMessage" class="ok">{{ requestMessage }}</p>
      <p *ngIf="requestError" class="error">{{ requestError }}</p>
      <p *ngIf="tokenSugerido" class="token">Token recibido: {{ tokenSugerido }}</p>

      <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="form-block">
        <label>Token de recuperación</label>
        <input type="text" formControlName="reset_token" />

        <label>Nueva contraseña</label>
        <input type="password" formControlName="nueva_password" />

        <button type="submit" [disabled]="loadingReset || resetForm.invalid">
          {{ loadingReset ? 'Restableciendo...' : 'Restablecer contraseña' }}
        </button>
      </form>

      <p *ngIf="resetMessage" class="ok">{{ resetMessage }}</p>
      <p *ngIf="resetError" class="error">{{ resetError }}</p>
    </section>
  `,
  styles: [`
    .card { max-width: 680px; background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin-bottom: 12px; }
    .form-block { display:grid; gap:8px; margin: 12px 0 16px; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    .token { background:#f7f9ff; border:1px dashed #98a2b3; border-radius:8px; padding:8px; word-break:break-all; }
  `],
})
export class RecoverPasswordPageComponent {
  loadingRequest = false;
  loadingReset = false;

  requestMessage = '';
  requestError = '';
  tokenSugerido = '';

  resetMessage = '';
  resetError = '';

  readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    reset_token: ['', [Validators.required]],
    nueva_password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
  ) {}

  requestToken(): void {
    if (this.requestForm.invalid) return;
    this.loadingRequest = true;
    this.requestMessage = '';
    this.requestError = '';
    this.tokenSugerido = '';

    this.authService.requestPasswordRecovery(this.requestForm.getRawValue()).subscribe({
      next: (res) => {
        this.loadingRequest = false;
        this.requestMessage = res.mensaje;
        this.tokenSugerido = res.reset_token ?? '';
      },
      error: (err) => {
        this.loadingRequest = false;
        this.requestError = err?.error?.detail ?? 'No se pudo solicitar recuperación';
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;
    this.loadingReset = true;
    this.resetMessage = '';
    this.resetError = '';

    this.authService.resetPassword(this.resetForm.getRawValue()).subscribe({
      next: (res) => {
        this.loadingReset = false;
        this.resetMessage = res.mensaje;
        this.resetForm.reset();
      },
      error: (err) => {
        this.loadingReset = false;
        this.resetError = err?.error?.detail ?? 'No se pudo restablecer contraseña';
      },
    });
  }
}
