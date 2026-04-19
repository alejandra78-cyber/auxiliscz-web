import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-package-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>{{ title }}</h2>
      <p class="muted">{{ description }}</p>
      <p class="hint">
        Esta vista está preparada dentro del paquete correcto y lista para conectarse con su endpoint específico.
      </p>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .muted { color:#6d7890; margin:0 0 8px; }
    .hint { color:#1f3a7a; margin:0; font-weight:500; }
  `],
})
export class PackagePlaceholderPageComponent {
  readonly title: string;
  readonly description: string;

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Módulo';
    this.description = this.route.snapshot.data['description'] ?? 'Vista en preparación';
  }
}
