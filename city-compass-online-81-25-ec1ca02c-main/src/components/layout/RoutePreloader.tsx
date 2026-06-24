import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Componente que precarrega rotas baseado na navegação do usuário
export const RoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
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
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    // Delay to not interfere with current page load
    const timer = setTimeout(preloadRoutes, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null; // This component doesn't render anything
};