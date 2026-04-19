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
        <div class="panel chat-panel">
          <div class="panel-header">
            <h3>Chat de solicitud</h3>
            <small class="muted" *ngIf="selectedIncidenteId">Solicitud activa: {{ selectedIncidenteId.substring(0, 8).toUpperCase() }}</small>
          </div>

          <div class="chat-box" *ngIf="mensajes.length; else emptyChat">
            <div
              *ngFor="let m of mensajes"
              class="msg-row"
              [class.from-cliente]="(m.autor_rol || '').toLowerCase() === 'conductor'"
              [class.from-taller]="(m.autor_rol || '').toLowerCase() === 'taller'"
            >
              <div class="msg-bubble">
                <div class="msg-meta">
                  <strong>{{ m.autor_rol }}</strong>
                  <span>{{ m.creado_en || '' }}</span>
                </div>
                <div class="msg-text">{{ m.texto }}</div>
              </div>
            </div>
          </div>
          <ng-template #emptyChat>
            <p class="muted empty-text">Aún no hay mensajes para esta solicitud.</p>
          </ng-template>

          <form [formGroup]="msgForm" (ngSubmit)="enviarMensaje()" class="chat-input">
            <textarea rows="2" formControlName="texto" placeholder="Escribe un mensaje"></textarea>
            <button type="submit" [disabled]="sending || msgForm.invalid || !selectedIncidenteId">
              {{ sending ? 'Enviando...' : 'Enviar' }}
            </button>
          </form>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Notificaciones del sistema</h3>
            <button type="button" (click)="cargarNotificaciones()" [disabled]="loadingNotificaciones || !selectedIncidenteId">
              {{ loadingNotificaciones ? 'Actualizando...' : 'Actualizar' }}
            </button>
          </div>

          <div class="notif-list" *ngIf="notificaciones.length; else emptyNotif">
            <article *ngFor="let n of notificaciones" class="notif-item">
              <div class="notif-title">{{ n.titulo }}</div>
              <div class="muted notif-time">{{ n.creada_en || '' }}</div>
              <div>{{ n.mensaje }}</div>
              <small class="muted">{{ n.tipo }} · {{ n.estado }}</small>
            </article>
          </div>
          <ng-template #emptyNotif>
            <p class="muted empty-text">Sin notificaciones para esta solicitud.</p>
          </ng-template>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e6ef; border-radius:12px; padding:16px; }
    .grid { display:grid; gap:8px; margin-bottom:12px; }
    .cols { display:grid; gap:16px; grid-template-columns:1.2fr .8fr; }
    .panel { border:1px solid #e9edf5; border-radius:10px; padding:12px; background:#fbfcff; min-height: 420px; }
    .panel-header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; }
    .chat-panel { display:grid; grid-template-rows:auto 1fr auto; }
    .chat-box {
      border:1px solid #e8edf8;
      background:#fff;
      border-radius:10px;
      padding:10px;
      overflow:auto;
      max-height:360px;
      display:grid;
      gap:8px;
    }
    .msg-row { display:flex; }
    .msg-row.from-cliente { justify-content:flex-start; }
    .msg-row.from-taller { justify-content:flex-end; }
    .msg-bubble {
      max-width:78%;
      border-radius:12px;
      padding:8px 10px;
      background:#eaf0ff;
      border:1px solid #d8e3ff;
    }
    .msg-row.from-taller .msg-bubble {
      background:#1f3a7a;
      color:#fff;
      border-color:#1f3a7a;
    }
    .msg-row.from-taller .msg-meta span { color:#dbe5ff; }
    .msg-meta { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px; font-size:12px; }
    .msg-meta span { color:#667085; }
    .msg-text { white-space:pre-wrap; word-break:break-word; }
    .chat-input {
      display:grid;
      grid-template-columns:1fr auto;
      gap:8px;
      margin-top:10px;
      align-items:end;
    }
    .chat-input textarea { resize:vertical; min-height:52px; }
    .notif-list { display:grid; gap:10px; max-height:380px; overflow:auto; }
    .notif-item {
      background:#fff;
      border:1px solid #e8edf8;
      border-radius:10px;
      padding:10px;
      display:grid;
      gap:4px;
    }
    .notif-title { font-weight:700; color:#1f3a7a; }
    .notif-time { font-size:12px; }
    .empty-text { margin-top:8px; }
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
