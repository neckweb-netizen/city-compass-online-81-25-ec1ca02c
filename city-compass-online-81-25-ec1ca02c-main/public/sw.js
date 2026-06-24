const CACHE_NAME = 'sajtem-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/lovable-uploads/e4435ab0-198f-4ab7-b4d2-83024c9490fc.png',
  '/lovable-uploads/3a6befc6-3f37-42ce-b0d8-6749951f797c.png'
];

// Instalar o service worker e cachear recursos essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Recursos cacheados com sucesso');
        return self.skipWaiting();
      })
  );
});

// Estratégia Network First para APIs, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requests que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requests do Supabase para evitar cache de dados dinâmicos
  if (url.hostname.includes('supabase.co')) return;
  
  // Para assets estáticos (imagens, CSS, JS) - Cache First
  if (event.request.url.includes('/assets/') || 
      event.request.url.includes('/lovable-uploads/') ||
      event.request.url.includes('.css') ||
      event.request.url.includes('.js') ||
      event.request.url.includes('.png') ||
      event.request.url.includes('.jpg') ||
      event.request.url.includes('.ico')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return networkResponse;
            });
        })
    );
  } 
  // Para páginas HTML - Network First com fallback para cache
  else {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
        })
    );
  }
});

// Limpar caches antigos quando ativar
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativo e gerenciando todas as páginas');
        return self.clients.claim();
      })
  );
});

// Mensagens do cliente para o service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});