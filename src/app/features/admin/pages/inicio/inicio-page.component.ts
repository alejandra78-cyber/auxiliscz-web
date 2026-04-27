import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="welcome-card">
      <h2>Inicio</h2>
      <p>Usa el menú lateral para desplegar paquetes y acceder a los casos de uso disponibles según tu rol.</p>
    </section>
  `,
  styles: [`
    .welcome-card {
      background: #fff;
      border: 1px solid #e1e7f3;
      border-radius: 14px;
      padding: 18px;
      color: #1f2b45;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    p {
      margin: 0;
      color: #657392;
      line-height: 1.5;
    }
  `],
})
export class InicioPageComponent {}

