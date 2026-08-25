const VERSION = 'sajtem-v7';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = ['/', OFFLINE_URL, '/manifest.json', '/Logo.png', '/icon-192.png', '/icon-512.png', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith('sajtem-') && ![STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE].includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

const cacheResponse = async (cacheName, request, response) => {
  if (response?.ok && response.type === 'basic') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
};

const navigationResponse = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then((response) => cacheResponse(PAGE_CACHE, request, response)).catch(() => undefined);
    return cached;
  }
  try {
    return await cacheResponse(PAGE_CACHE, request, await fetch(request));
  } catch {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
};

const cacheFirst = async (request, cacheName) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheResponse(cacheName, request, await fetch(request));
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => cacheResponse(cacheName, request, response));
  return cached || network;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }
  if (['style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { data: { body: event.data?.text() || '' } }; }
  const data = payload.data || {};
  const notification = payload.notification || data.notification || {};
  const title = notification.title || data.title || 'Saj Tem';
  const icon = notification.icon || data.icon_url || '/icon-192.png';
  const actionUrl = data.action_url || notification.click_action || '/notificacoes';
  const notificationId = data.notification_id || payload.messageId || `sajtem-${Date.now()}`;
  event.waitUntil(self.registration.showNotification(title, {
    body: notification.body || data.body || 'Você recebeu uma nova notificação.',
    icon,
    badge: notification.badge || '/favicon.png',
    image: notification.image || data.image_url,
    tag: notification.tag || notificationId,
    renotify: notification.renotify === true || data.priority === 'urgent',
    requireInteraction: notification.requireInteraction === true || data.priority === 'urgent',
    vibrate: notification.vibrate || [200, 100, 200],
    data: { ...data, action_url: actionUrl, notification_id: notificationId },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.action_url || '/notificacoes', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if ('navigate' in client) return client.navigate(target).then(() => client.focus());
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
