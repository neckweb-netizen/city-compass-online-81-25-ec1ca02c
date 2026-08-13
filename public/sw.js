const CACHE_NAME = 'sajtem-v4';

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
