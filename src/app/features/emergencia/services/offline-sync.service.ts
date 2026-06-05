import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type OfflineSyncState =
  | 'pendiente_sincronizacion'
  | 'sincronizando'
  | 'sincronizado'
  | 'error_sincronizacion'
  | 'conflicto';

export interface OfflineOperation {
  offline_sync_id: string;
  tipo_operacion: string;
  fecha_local: string;
  estado_sync: OfflineSyncState;
  payload: Record<string, unknown>;
  resultado?: unknown;
  error?: string;
  sincronizado_en?: string;
}

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly storageKey = 'cu30_offline_actions';
  private readonly solicitudesCacheKey = 'cu30_taller_solicitudes_cache';
  private readonly detallesCacheKey = 'cu30_taller_solicitudes_detalle_cache';
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;

  readonly online$ = new BehaviorSubject<boolean>(navigator.onLine);
  readonly pending$ = new BehaviorSubject<number>(this.pendingCount());

  private started = false;
  private syncing = false;

  constructor(private readonly http: HttpClient) {}

  startAutoSync(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener('online', () => {
      this.online$.next(true);
      this.syncPending();
    });
    window.addEventListener('offline', () => this.online$.next(false));
    if (navigator.onLine) this.syncPending();
  }

  queueOperation(tipoOperacion: string, payload: Record<string, unknown>): OfflineOperation {
    const op: OfflineOperation = {
      offline_sync_id: `OFF-ACT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tipo_operacion: tipoOperacion,
      fecha_local: new Date().toISOString(),
      estado_sync: 'pendiente_sincronizacion',
      payload,
    };
    const rows = this.readAll();
    rows.push(op);
    this.writeAll(rows);
    return op;
  }

  pendingCount(): number {
    return this.readAll().filter((op) =>
      ['pendiente_sincronizacion', 'error_sincronizacion', 'conflicto'].includes(op.estado_sync),
    ).length;
  }

  readAll(): OfflineOperation[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  cacheSolicitudes<T>(rows: T[]): void {
    try {
      localStorage.setItem(this.solicitudesCacheKey, JSON.stringify(rows || []));
    } catch {
      // Si el navegador no permite escribir cache, el flujo online sigue funcionando.
    }
  }

  readCachedSolicitudes<T>(): T[] {
    try {
      const raw = localStorage.getItem(this.solicitudesCacheKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  cacheSolicitudDetalle<T extends { id?: string | null; incidente_id?: string | null }>(detalle: T): void {
    const keys = [detalle?.id, detalle?.incidente_id].filter(Boolean).map(String);
    if (!keys.length) return;
    try {
      const raw = localStorage.getItem(this.detallesCacheKey);
      const cache = raw ? JSON.parse(raw) : {};
      for (const key of keys) cache[key] = detalle;
      localStorage.setItem(this.detallesCacheKey, JSON.stringify(cache));
    } catch {
      // Cache opcional para CU30 web offline.
    }
  }

  readCachedSolicitudDetalle<T>(id: string): T | null {
    try {
      const raw = localStorage.getItem(this.detallesCacheKey);
      const cache = raw ? JSON.parse(raw) : {};
      return cache?.[id] ?? null;
    } catch {
      return null;
    }
  }

  async syncPending(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    const rows = this.readAll();
    const pending = rows.filter((op) =>
      ['pendiente_sincronizacion', 'error_sincronizacion'].includes(op.estado_sync),
    );
    if (!pending.length) {
      this.pending$.next(this.pendingCount());
      return;
    }

    this.syncing = true;
    pending.forEach((op) => (op.estado_sync = 'sincronizando'));
    this.writeAll(rows);

    try {
      const response = await firstValueFrom(
        this.http.post<{ resultados: Array<Partial<OfflineOperation>> }>(`${this.apiBase}/emergencias/sync/offline`, {
          operaciones: pending.map((op) => ({
            offline_sync_id: op.offline_sync_id,
            tipo_operacion: op.tipo_operacion,
            fecha_local: op.fecha_local,
            payload: op.payload,
          })),
        }),
      );

      const resultados = response?.resultados || [];
      for (const item of resultados) {
        const row = rows.find((op) => op.offline_sync_id === item.offline_sync_id);
        if (!row) continue;
        row.estado_sync = (item.estado_sync as OfflineSyncState) || 'error_sincronizacion';
        row.resultado = item.resultado;
        row.error = item.error;
        if (row.estado_sync === 'sincronizado') row.sincronizado_en = new Date().toISOString();
      }
    } catch (err: any) {
      for (const op of rows) {
        if (op.estado_sync === 'sincronizando') {
          op.estado_sync = 'error_sincronizacion';
          op.error = err?.error?.detail || err?.message || 'No se pudo sincronizar la accion';
        }
      }
    } finally {
      this.syncing = false;
      this.writeAll(rows);
      if (navigator.onLine && this.readAll().some((op) => op.estado_sync === 'pendiente_sincronizacion')) {
        setTimeout(() => void this.syncPending(), 300);
      }
    }
  }

  private writeAll(rows: OfflineOperation[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(rows));
    this.pending$.next(this.pendingCount());
  }
}
