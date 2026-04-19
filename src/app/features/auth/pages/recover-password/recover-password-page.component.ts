import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recover-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <div class="header-row">
        <button type="button" class="back-btn" (click)="goBack()">Volver</button>
        <span class="badge">Seguridad</span>
      </div>

      <h2>Recuperar Contraseña</h2>
      <p class="muted">Solicita un token de recuperación y luego restablece tu contraseña.</p>
      <p class="info-banner">
        Por el momento, la recuperación de contraseña se está realizando mediante token manual.
      </p>

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
        <div class="password-field">
          <input [type]="showNewPassword ? 'text' : 'password'" formControlName="nueva_password" />
          <button type="button" class="pass-toggle" (click)="showNewPassword = !showNewPassword">
            {{ showNewPassword ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>

        <button type="submit" [disabled]="loadingReset || resetForm.invalid">
          {{ loadingReset ? 'Restableciendo...' : 'Restablecer contraseña' }}
        </button>
      </form>

      <p *ngIf="resetMessage" class="ok">{{ resetMessage }}</p>
      <p *ngIf="resetError" class="error">{{ resetError }}</p>
    </section>
  `,
  styles: [`
    .card {
      max-width: 680px;
      background:#fff;
      border:1px solid #d6def0;
      border-radius:14px;
      padding:18px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
    }
    .header-row {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:8px;
    }
    .back-btn {
      background:#1f3a7a;
      color:#fff;
      border:1px solid #1f3a7a;
      padding:6px 12px;
      border-radius:8px;
      cursor:pointer;
      font-weight:600;
      transition: background 0.2s ease, transform 0.15s ease;
    }
    .back-btn:hover {
      background:#244896;
      transform: translateY(-1px);
    }
    .badge {
      font-size:12px;
      font-weight:700;
      color:#1f3a7a;
      background:#eef4ff;
      border:1px solid #c9dafc;
      border-radius:999px;
      padding:4px 10px;
    }
    h2 { margin: 4px 0 8px; color:#17326f; }
    .muted { color:#5f6f8f; margin-bottom: 12px; }
    .form-block { display:grid; gap:8px; margin: 12px 0 16px; }
    label { color:#2c3b5f; font-weight:600; }
    input {
      border:1px solid #c8d3ea;
      border-radius:10px;
      padding:10px 12px;
      outline:none;
    }
    input:focus {
      border-color:#4f72bf;
      box-shadow: 0 0 0 3px rgba(79, 114, 191, 0.15);
    }
    button[type='submit'] {
      background:#244896;
      color:#fff;
      border:1px solid #244896;
      border-radius:10px;
      padding:10px 12px;
      font-weight:600;
      cursor:pointer;
    }
    button[type='submit']:disabled {
      opacity:0.65;
      cursor:not-allowed;
    }
    .password-field { display:flex; align-items:stretch; gap:8px; }
    .pass-toggle {
      min-width:88px;
      background:#edf2ff;
      color:#1f3a7a;
      border:1px solid #d5def5;
      margin-top:0;
    }
    .pass-toggle:hover { background:#e1e9ff; }
    .ok { color:#027a48; }
    .error { color:#b42318; }
    .info-banner {
      background:#eef4ff;
      color:#1f3a7a;
      border:1px solid #c9dafc;
      border-radius:8px;
      padding:10px 12px;
      margin: 0 0 12px;
      line-height:1.35;
    }
    .token {
      background:#f7f9ff;
      border:1px dashed #98a2b3;
      border-radius:8px;
      padding:10px;
      word-break:break-all;
    }
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
  showNewPassword = false;

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
    private readonly location: Location,
  ) {}

  goBack(): void {
    this.location.back();
  }

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
