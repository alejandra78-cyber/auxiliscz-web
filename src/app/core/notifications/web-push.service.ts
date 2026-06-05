import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

type FirebaseCompat = {
  apps: unknown[];
  initializeApp: (config: Record<string, string>) => unknown;
  messaging: () => {
    getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string>;
    onMessage: (callback: (payload: unknown) => void) => void;
  };
};

declare global {
  interface Window {
    firebase?: FirebaseCompat;
  }
}

@Injectable({ providedIn: 'root' })
export class WebPushService {
  private readonly apiBase = environment.apiUrl.endsWith('/api')
    ? environment.apiUrl
    : `${environment.apiUrl}/api`;
  private sdkLoaded = false;
  private registering = false;

  constructor(private readonly http: HttpClient) {}

  async registerDevice(): Promise<void> {
    if (this.registering || !this.isAvailable() || !this.hasFirebaseConfig()) return;
    this.registering = true;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      await this.loadFirebaseSdk();
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const firebase = window.firebase;
      if (!firebase) return;
      if (!firebase.apps.length) {
        firebase.initializeApp(environment.firebase);
      }
      const messaging = firebase.messaging();
      messaging.onMessage((payload) => console.debug('Push foreground AuxilioSCZ', payload));
      const token = await messaging.getToken({
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) return;

      await firstValueFrom(
        this.http.post(`${this.apiBase}/auth/device-token`, {
          token,
          plataforma: 'web',
        }),
      );
    } catch (error) {
      console.warn('No se pudo registrar push web', error);
    } finally {
      this.registering = false;
    }
  }

  private isAvailable(): boolean {
    return typeof window !== 'undefined'
      && 'Notification' in window
      && 'serviceWorker' in navigator
      && 'PushManager' in window;
  }

  private hasFirebaseConfig(): boolean {
    const config = environment.firebase;
    return Boolean(
      environment.vapidKey
        && config?.apiKey
        && config?.appId
        && config?.messagingSenderId
        && config?.projectId,
    );
  }

  private async loadFirebaseSdk(): Promise<void> {
    if (this.sdkLoaded || window.firebase) {
      this.sdkLoaded = true;
      return;
    }
    await this.loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
    await this.loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
    this.sdkLoaded = true;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
}
