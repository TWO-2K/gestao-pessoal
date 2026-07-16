import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// Dados financeiros sempre devem vir da rede — não cachear chamadas ao Supabase.
registerRoute(({ url }) => url.hostname.endsWith('.supabase.co'), new NetworkOnly());

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Órbita', body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Órbita', {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: data.data ?? {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/contas';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
