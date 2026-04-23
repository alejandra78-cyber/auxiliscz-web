import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <h1>AuxilioSCZ</h1>
        <p>Inicia sesión para acceder al panel</p>

        <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          />

          <label for="password">Contraseña</label>
          <div class="password-field">
            <input
              id="password"
              [type]="showLoginPassword ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
            />
            <button type="button" class="pass-toggle" (click)="showLoginPassword = !showLoginPassword">
              {{ showLoginPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>

          <button type="submit" [disabled]="loading || form.invalid">
            {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </form>
        <div class="links-row">
          <a routerLink="/recover-password">Recuperar contraseña</a>
          <a routerLink="/registrar-taller" class="register-link">Registrar Taller</a>
        </div>

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
    .password-field {
      display: flex;
      align-items: stretch;
      gap: 8px;
    }
    .pass-toggle {
      margin-top: 0;
      min-width: 88px;
      background: #edf2ff;
      color: #1f3a7a;
      border: 1px solid #d5def5;
      padding: 0 10px;
      font-size: 13px;
    }
    .pass-toggle:hover {
      background: #e1e9ff;
    }
    button {
      margin-top: 6px;
      background: #1f3a7a;
    }
    button:hover {
      background: #163267;
    }
    .links-row {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .register-link {
      color: #0f2f6b;
      text-decoration: none;
      font-weight: 600;
    }
    .register-link:hover {
      color: #0a2452;
      text-decoration: underline;
    }
    .error {
      color: #b42318;
      margin-top: 12px;
    }
    @media (max-width: 600px) {
      .login-shell {
        padding: 12px;
      }
      .login-card {
        padding: 16px;
        border-radius: 12px;
      }
      h1 {
        font-size: 22px;
      }
      .password-field {
        flex-direction: column;
      }
      .pass-toggle {
        width: 100%;
      }
      .links-row {
        justify-content: space-between;
      }
    }
  `],
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  showLoginPassword = false;

  readonly form = this.createLoginForm();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    let resetToken = qp.get('reset_token');
    let mode = qp.get('mode');

    // Fallback robusto para enlaces de correo que alteran query params.
    if (!resetToken) {
      const href = window.location.href;
      const tokenMatch = href.match(/[?&]reset_token=([^&#\s]+)/i);
      const modeMatch = href.match(/[?&]mode=([^&#\s]+)/i);
      if (tokenMatch?.[1]) {
        resetToken = decodeURIComponent(tokenMatch[1]);
      }
      if (modeMatch?.[1]) {
        mode = decodeURIComponent(modeMatch[1]);
      }
    }

    if (resetToken) {
      const query = new URLSearchParams();
      query.set('reset_token', resetToken);
      if (mode) query.set('mode', mode);
      // Usamos redirección dura para evitar quedarse en /login por estados de router/cache.
      window.location.replace(`/recover-password?${query.toString()}`);
      return;
    }
    this.form.reset({ email: '', password: '' });
  }

  private createLoginForm() {
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
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'No se pudo iniciar sesión';
      },
    });
  }
}
