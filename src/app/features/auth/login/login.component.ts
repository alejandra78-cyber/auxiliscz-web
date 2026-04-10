import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <h1>AuxilioSCZ</h1>
        <p>Inicia sesión para acceder al panel</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />

          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" />

          <button type="submit" [disabled]="loading || form.invalid">
            {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </form>
        <a routerLink="/recover-password">Recuperar contraseña</a>

        <p class="error" *ngIf="error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #f5f4f0, #eaf1ff);
      padding: 24px;
    }
    .login-card {
      width: min(420px, 100%);
      background: #fff;
      border: 1px solid #e3e7ef;
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 8px 28px rgba(25, 36, 58, 0.08);
    }
    h1 {
      margin: 0 0 8px 0;
      color: #1f3a7a;
      font-size: 28px;
    }
    p {
      margin: 0 0 16px 0;
      color: #5e6a80;
    }
    form {
      display: grid;
      gap: 10px;
    }
    label {
      font-weight: 600;
      color: #1f2b45;
      font-size: 14px;
    }
    input {
      width: 100%;
    }
    button {
      margin-top: 6px;
      background: #1f3a7a;
    }
    button:hover {
      background: #163267;
    }
    .error {
      color: #b42318;
      margin-top: 12px;
    }
  `],
})
export class LoginComponent {
  loading = false;
  error = '';

  readonly form = this.createForm();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  private createForm() {
    return this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo iniciar sesión';
      },
    });
  }
}
