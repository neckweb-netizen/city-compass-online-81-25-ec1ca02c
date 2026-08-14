const CACHE_NAME = 'sajtem-v5';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando novo Service Worker...');
  self.skipWaiting(); // Força o novo SW a ativar imediatamente
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições com busca direta na rede primeiro (Network First)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignora requisições do Supabase Realtime, WebSockets e APIs de terceiros
  if (
    requestUrl.origin !== self.location.origin ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('websocket') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se estiver offline, aí sim busca do cache
        return caches.match(event.request);
      })
  );
});

// Firebase Cloud Messaging entrega o payload por meio do evento Push.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { data: { body: event.data?.text() || '' } };
  }

  const data = payload.data || {};
  const notification = payload.notification || data.notification || {};
  const title = notification.title || data.title || 'Saj Tem';
  const body = notification.body || data.body || 'Você recebeu uma nova notificação.';
  const icon = notification.icon || data.icon_url || '/Logo.png';
  const actionUrl = data.action_url || notification.click_action || '/notificacoes';
  const notificationId = data.notification_id || payload.messageId || `sajtem-${Date.now()}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: notification.badge || icon,
      image: notification.image || data.image_url,
      tag: notification.tag || notificationId,
      renotify: notification.renotify === true || data.priority === 'urgent',
      requireInteraction: notification.requireInteraction === true || data.priority === 'urgent',
      vibrate: notification.vibrate || [200, 100, 200],
      data: {
        ...data,
        action_url: actionUrl,
        notification_id: notificationId,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.action_url || '/notificacoes', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if ('navigate' in client) return client.navigate(target).then(() => client.focus());
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
