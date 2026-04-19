import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EmergenciaService,
  IncidenteResumen,
  MensajeSolicitud,
  NotificacionSolicitud,
} from '../../services/emergencia.service';

@Component({
  selector: 'app-comunicacion-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h2>Comunicación y Notificaciones</h2>
      <p class="muted">Selecciona una solicitud y gestiona los mensajes/notificaciones del flujo operativo.</p>
      <p *ngIf="error" class="error">{{ error }}</p>

      <div class="grid">
        <label>Solicitud</label>
        <select [value]="selectedIncidenteId" (change)="onSelectIncidente($any($event.target).value)">
          <option value="">Selecciona una solicitud</option>
          <option *ngFor="let i of incidentes" [value]="i.id">
            {{ i.codigo_solicitud || ('SOL-' + i.id.substring(0, 8).toUpperCase()) }} · {{ i.cliente_nombre || 'Cliente' }} · {{ i.tipo }} · {{ i.estado }}
          </option>
        </select>
      </div>

      <div class="cols">
        <div class="panel">
          <h3>Mensajes</h3>
          <form [formGroup]="msgForm" (ngSubmit)="enviarMensaje()" class="grid">
            <textarea rows="3" formControlName="texto" placeholder="Escribe un mensaje para el cliente"></textarea>
            <button type="submit" [disabled]="sending || msgForm.invalid || !selectedIncidenteId">
              {{ sending ? 'Enviando...' : 'Enviar mensaje' }}
            </button>
          </form>
          <ul *ngIf="mensajes.length" class="list">
            <li *ngFor="let m of mensajes">
              <strong>{{ m.autor_rol }}</strong>
              <span class="muted">{{ m.creado_en || '' }}</span>
              <div>{{ m.texto }}</div>
            </li>
          </ul>
          <p *ngIf="!mensajes.length" class="muted">Sin mensajes para esta solicitud.</p>
        </div>

        <div class="panel">
          <h3>Notificaciones</h3>
          <button type="button" (click)="cargarNotificaciones()" [disabled]="loadingNotificaciones || !selectedIncidenteId">
            {{ loadingNotificaciones ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <ul *ngIf="notificaciones.length" class="list">
            <li *ngFor="let n of notificaciones">
              <strong>{{ n.titulo }}</strong>
              <span class="muted">{{ n.creada_en || '' }}</span>
              <div>{{ n.mensaje }}</div>
              <small class="muted">{{ n.tipo }} · {{ n.estado }}</small>
            </li>
          </ul>
          <p *ngIf="!notificaciones.length" class="muted">Sin notificaciones para esta solicitud.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; margin-bottom:12px; }
    .cols { display:grid; gap:16px; grid-template-columns:1fr 1fr; }
    .panel { border:1px solid #e9edf5; border-radius:10px; padding:12px; background:#fbfcff; }
    .list { margin:8px 0 0; padding-left:16px; display:grid; gap:10px; }
    .muted { color:#6d7890; }
    .error { color:#b42318; }
    h3 { margin:0 0 8px; }
    @media (max-width: 900px) { .cols { grid-template-columns:1fr; } }
  `],
})
export class ComunicacionPageComponent implements OnInit {
  incidentes: IncidenteResumen[] = [];
  mensajes: MensajeSolicitud[] = [];
  notificaciones: NotificacionSolicitud[] = [];
  selectedIncidenteId = '';
  error = '';
  sending = false;
  loadingNotificaciones = false;

  readonly msgForm = this.fb.nonNullable.group({
    texto: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly emergenciaService: EmergenciaService,
  ) {}

  ngOnInit(): void {
    this.emergenciaService.listarIncidentesParaTaller().subscribe({
      next: (res) => {
        this.incidentes = res;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudo cargar solicitudes';
      },
    });
  }

  onSelectIncidente(incidenteId: string): void {
    this.selectedIncidenteId = incidenteId;
    this.mensajes = [];
    this.notificaciones = [];
    if (!incidenteId) return;
    this.cargarMensajes();
    this.cargarNotificaciones();
  }

  cargarMensajes(): void {
    if (!this.selectedIncidenteId) return;
    this.emergenciaService.listarMensajes(this.selectedIncidenteId).subscribe({
      next: (rows) => {
        this.mensajes = rows;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'No se pudieron cargar mensajes';
      },
    });
  }

  cargarNotificaciones(): void {
    if (!this.selectedIncidenteId) return;
    this.loadingNotificaciones = true;
    this.emergenciaService.listarNotificaciones(this.selectedIncidenteId).subscribe({
      next: (rows) => {
        this.loadingNotificaciones = false;
        this.notificaciones = rows;
      },
      error: (err) => {
        this.loadingNotificaciones = false;
        this.error = err?.error?.detail ?? 'No se pudieron cargar notificaciones';
      },
    });
  }

  enviarMensaje(): void {
    if (this.msgForm.invalid || !this.selectedIncidenteId) return;
    this.sending = true;
    const { texto } = this.msgForm.getRawValue();
    this.emergenciaService.enviarMensaje(this.selectedIncidenteId, texto).subscribe({
      next: () => {
        this.sending = false;
        this.msgForm.reset({ texto: '' });
        this.cargarMensajes();
        this.cargarNotificaciones();
      },
      error: (err) => {
        this.sending = false;
        this.error = err?.error?.detail ?? 'No se pudo enviar el mensaje';
      },
    });
  }
}
