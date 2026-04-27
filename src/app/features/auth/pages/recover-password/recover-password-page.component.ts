import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
      <p class="muted" *ngIf="!activationMode">Solicita un token de recuperación y luego restablece tu contraseña.</p>
      <p class="muted" *ngIf="activationMode">Tu taller fue aprobado. Crea tu contraseña para activar acceso al panel.</p>
      <p class="info-banner" *ngIf="!activationMode">
        Se enviará un enlace seguro al correo si la cuenta existe.
      </p>

      <form [formGroup]="requestForm" (ngSubmit)="requestToken()" class="form-block" *ngIf="!activationMode && !tokenPresenteEnUrl">
        <label>Email</label>
        <input type="email" formControlName="email" />
        <button type="submit" [disabled]="loadingRequest || requestForm.invalid">
          {{ loadingRequest ? 'Enviando...' : 'Solicitar token' }}
        </button>
      </form>

      <p *ngIf="requestMessage" class="ok">{{ requestMessage }}</p>
      <p *ngIf="requestError" class="error">{{ requestError }}</p>

      <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="form-block" *ngIf="tokenValido">
        <label>Nueva contraseña</label>
        <div class="password-field">
          <input [type]="showNewPassword ? 'text' : 'password'" formControlName="nueva_password" />
          <button type="button" class="pass-toggle" (click)="showNewPassword = !showNewPassword">
            {{ showNewPassword ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>

        <label>Confirmar nueva contraseña</label>
        <input [type]="showNewPassword ? 'text' : 'password'" formControlName="nueva_password_confirmacion" />

        <button type="submit" [disabled]="loadingReset || resetForm.invalid">
          {{ loadingReset ? 'Restableciendo...' : 'Restablecer contraseña' }}
        </button>
      </form>

      <p *ngIf="resetMessage" class="ok">{{ resetMessage }}</p>
      <p *ngIf="resetError" class="error">{{ resetError }}</p>
      <p *ngIf="!tokenValido && tokenEvaluado && !activationMode" class="muted">
        Para cambiar contraseña, abre el enlace que recibiste en tu correo.
      </p>
      <p *ngIf="activationMode && !tokenValido && !resetError" class="error">
        El enlace de activación no es válido o ya expiró.
      </p>
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
    @media (max-width: 640px) {
      .card {
        padding: 14px;
        border-radius: 12px;
      }
      .header-row {
        align-items: flex-start;
      }
      .password-field {
        flex-direction: column;
      }
      .pass-toggle {
        width: 100%;
      }
      .badge {
        font-size: 11px;
      }
      h2 {
        font-size: 28px;
      }
    }
  `],
})
export class RecoverPasswordPageComponent implements OnInit {
  loadingRequest = false;
  loadingReset = false;

  requestMessage = '';
  requestError = '';

  resetMessage = '';
  resetError = '';
  showNewPassword = false;
  activationMode = false;
  tokenValido = false;
  tokenEvaluado = false;
  tokenPresenteEnUrl = false;

  readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    reset_token: ['', [Validators.required]],
    nueva_password: ['', [Validators.required, Validators.minLength(6)]],
    nueva_password_confirmacion: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly location: Location,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const token = qp.get('reset_token');
    const mode = qp.get('mode');
    if (mode === 'activation') {
      this.activationMode = true;
    }
    if (token) {
      this.tokenPresenteEnUrl = true;
      this.resetForm.patchValue({ reset_token: token });
      this.validarToken(token);
    }
  }

  private validarToken(token: string): void {
    this.authService.validateResetToken({ reset_token: token }).subscribe({
      next: () => {
        this.tokenValido = true;
        this.tokenEvaluado = true;
      },
      error: () => {
        this.tokenValido = false;
        this.tokenEvaluado = true;
        this.resetError = 'El enlace no es válido o ya expiró';
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  requestToken(): void {
    if (this.requestForm.invalid) return;
    this.loadingRequest = true;
    this.requestMessage = '';
    this.requestError = '';

    this.authService.requestPasswordRecovery(this.requestForm.getRawValue()).subscribe({
      next: (res) => {
        this.loadingRequest = false;
        this.requestMessage = res.mensaje;
      },
      error: (err) => {
        this.loadingRequest = false;
        this.requestError = err?.error?.detail ?? 'No se pudo solicitar recuperación';
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;
    const raw = this.resetForm.getRawValue();
    const pass = raw.nueva_password.trim();
    const confirm = raw.nueva_password_confirmacion.trim();
    if (pass !== confirm) {
      this.resetError = 'La confirmación de contraseña no coincide';
      return;
    }
    this.loadingReset = true;
    this.resetMessage = '';
    this.resetError = '';

    this.authService.resetPassword({
      reset_token: raw.reset_token,
      nueva_password: pass,
    }).subscribe({
      next: (res) => {
        this.loadingReset = false;
        this.resetMessage = res.mensaje;
        this.resetForm.reset();
        this.tokenValido = false;
      },
      error: (err) => {
        this.loadingReset = false;
        this.resetError = err?.error?.detail ?? 'No se pudo restablecer contraseña';
      },
    });
  }
}
