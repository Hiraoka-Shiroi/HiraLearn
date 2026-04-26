/* HiraLearn — Firebase Cloud Messaging service worker.
 * This file MUST be served from the site root for FCM to work.
 *
 * Configuration is provided at runtime by the app via postMessage so we don't
 * have to bake build-time secrets into a static file. The app calls
 *   navigator.serviceWorker.controller?.postMessage({ type: 'FCM_CONFIG', config })
 * after registration. Until config arrives, the SW just installs and waits.
 */
/* global importScripts, firebase, self */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

let messaging = null;

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'FCM_CONFIG') return;
  const config = event.data.config || {};
  if (!config.apiKey || !config.projectId || messaging) return;
  try {
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || 'HiraLearn';
      const body = (payload.notification && payload.notification.body) || '';
      const link = (payload.fcmOptions && payload.fcmOptions.link) || (payload.data && payload.data.link) || '/';
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { link },
      });
    });
  } catch (e) {
    // Init failed — fall back to manual handling below.
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    }),
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
