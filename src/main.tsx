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
      // Ajustado para 0 em desenvolvimento para que você veja as alterações do banco na hora.
      // Em produção, você pode voltar para 5 * 60 * 1000 se desejar.
      staleTime: 0, 
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true, // Atualiza os dados se você mudar de aba e voltar
      refetchOnMount: true, // Força a busca de dados novos sempre que o componente renderizar
      retry: 1,
      networkMode: 'always', // Mudado de 'offlineFirst' para garantir que ele priorize a rede ao testar
      // Reduce initial request latency
      refetchOnReconnect: true,
      retryOnMount: true,
    },
    mutations: {
      networkMode: 'always',
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
