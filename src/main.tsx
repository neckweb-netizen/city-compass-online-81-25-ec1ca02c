import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 0 : 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      networkMode: 'offlineFirst',
      refetchOnReconnect: true,
      retryOnMount: false,
    },
    mutations: {
      networkMode: 'online',
    },
  },
})

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  let refreshingForNewWorker = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingForNewWorker) return;
    refreshingForNewWorker = true;
    // Assim que a nova versão assumir o controle, recarrega uma única vez para
    // buscar o index.html que aponta para os bundles atuais da publicação.
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => undefined);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('obs: Erro ao registrar SW:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <App />
    </Suspense>
  </QueryClientProvider>
);
