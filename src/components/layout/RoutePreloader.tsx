import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Componente que precarrega rotas baseado na navegação do usuário
export const RoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType || '')) return;

    // Preload routes based on current location
    const preloadRoutes = () => {
      const currentPath = location.pathname;
      let routesToPreload: string[] = [];

      // Define routes to preload based on current location
      switch (currentPath) {
        case '/':
          routesToPreload = ['/locais', '/eventos', '/categorias'];
          break;
        case '/locais':
          routesToPreload = ['/categorias', '/eventos'];
          break;
        case '/eventos':
          routesToPreload = ['/locais', '/canal-informativo'];
          break;
        case '/categorias':
          routesToPreload = ['/locais'];
          break;
        default:
          routesToPreload = ['/'];
      }

      // Preload each route
      routesToPreload.forEach(route => {
        if (document.head.querySelector(`link[data-route-prefetch="${route}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.dataset.routePrefetch = route;
        document.head.appendChild(link);
      });
    };

    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(preloadRoutes, { timeout: 2500 });
      else preloadRoutes();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return null; // This component doesn't render anything
};
