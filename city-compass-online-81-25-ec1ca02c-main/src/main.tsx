
import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initPerformanceOptimizations } from './lib/performanceUtils'

// Initialize performance optimizations
initPerformanceOptimizations();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      networkMode: 'offlineFirst',
      // Reduce initial request latency
      refetchOnReconnect: false,
      retryOnMount: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registrado com sucesso:', registration.scope);
        
        // Verificar updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Novo SW disponível, pode mostrar notificação de atualização
                console.log('Nova versão disponível!');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Erro ao registrar SW:', error);
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
