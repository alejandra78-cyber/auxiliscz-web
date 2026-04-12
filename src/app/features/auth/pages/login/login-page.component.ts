import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
        <button type="button" class="link-btn" (click)="toggleRegister()">
          {{ showRegister ? 'Ocultar registro' : 'Crear usuario' }}
        </button>

        <p class="error" *ngIf="error">{{ error }}</p>

        <section *ngIf="showRegister" class="register-box">
          <h3>Crear usuario</h3>
          <form [formGroup]="registerForm" (ngSubmit)="submitRegister()">
            <label>Nombre</label>
            <input type="text" formControlName="nombre" />

            <label>Email</label>
            <input type="email" formControlName="email" />

            <label>Contraseña</label>
            <input type="password" formControlName="password" />

            <label>Teléfono</label>
            <input type="text" formControlName="telefono" />

            <button type="submit" [disabled]="registerLoading || registerForm.invalid">
              {{ registerLoading ? 'Creando...' : 'Crear usuario' }}
            </button>
          </form>

          <p class="ok" *ngIf="registerOk">{{ registerOk }}</p>
          <p class="error" *ngIf="registerError">{{ registerError }}</p>
        </section>
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
    .link-btn {
      margin-top: 10px;
      width: 100%;
      background: #edf2ff;
      color: #1f3a7a;
      border: 1px solid #d5def5;
    }
    .register-box {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #e5e9f3;
    }
    .register-box h3 {
      margin: 0 0 8px;
      font-size: 16px;
      color: #1f2b45;
    }
    .register-box form {
      display: grid;
      gap: 8px;
    }
    .ok {
      color: #027a48;
      margin-top: 8px;
    }
    .error {
      color: #b42318;
      margin-top: 12px;
    }
  `],
})
export class LoginComponent {
  loading = false;
  registerLoading = false;
  error = '';
  registerError = '';
  registerOk = '';
  showRegister = false;

  readonly form = this.createLoginForm();
  readonly registerForm = this.createRegisterForm();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  private createLoginForm() {
    return this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private createRegisterForm() {
    return this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: [''],
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

  toggleRegister(): void {
    this.showRegister = !this.showRegister;
    this.registerError = '';
    this.registerOk = '';
  }

  submitRegister(): void {
    if (this.registerForm.invalid) return;
    this.registerLoading = true;
    this.registerError = '';
    this.registerOk = '';

    const raw = this.registerForm.getRawValue();
    this.authService.register({
      nombre: raw.nombre,
      email: raw.email,
      password: raw.password,
      telefono: raw.telefono || undefined,
    }).subscribe({
      next: () => {
        this.registerLoading = false;
        this.registerOk = 'Usuario creado".';
        this.registerForm.patchValue({ password: '' });
      },
      error: (err) => {
        this.registerLoading = false;
        const detail = err?.error?.detail;
        this.registerError = Array.isArray(detail) ? (detail[0]?.msg ?? 'No se pudo crear usuario') : (detail ?? 'No se pudo crear usuario');
      },
    });
  }
}
