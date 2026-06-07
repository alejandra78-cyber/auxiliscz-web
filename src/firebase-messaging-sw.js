importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyANItXkZQhmlFaOGr4Fn0Rb9VtQ83_oCfY",
  authDomain: "auxiliscz.firebaseapp.com",
  projectId: "auxiliscz",
  storageBucket: "auxiliscz.firebasestorage.app",
  messagingSenderId: "805488032813",
  appId: "1:805488032813:web:308c3ee1f1e0aecb2c4ca4"
};

const hasConfig = firebaseConfig.apiKey
  && firebaseConfig.projectId
  && firebaseConfig.messagingSenderId
  && firebaseConfig.appId;

if (hasConfig) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    self.registration.showNotification(notification.title || data.titulo || 'AuxilioSCZ', {
      body: notification.body || data.cuerpo || 'Tienes una nueva actualización',
      icon: '/assets/icons/icon-192.png',
      data
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const solicitudId = data.solicitud_id || data.incidente_id || '';
  const tipo = data.tipo || '';
  let url = '/inicio';
  if (solicitudId && tipo.includes('cotizacion')) {
    url = `/pagos/gestionar-cotizacion?incidente_id=${encodeURIComponent(solicitudId)}`;
  } else if (solicitudId && tipo.includes('seguimiento')) {
    url = `/clientes-vehiculos/ubicacion-tecnico?incidente_id=${encodeURIComponent(solicitudId)}`;
  } else if (solicitudId) {
    url = `/registro-emergencias/comunicacion-notificaciones?incidente_id=${encodeURIComponent(solicitudId)}`;
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
