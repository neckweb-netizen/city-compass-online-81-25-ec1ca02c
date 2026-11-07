import { useEffect } from 'react';

// Fetch the actual lazy route module only when the visitor shows intent to
// navigate. Prefetching /locais or /eventos as HTML wastes bandwidth in a SPA.
const routeImports: Record<string, () => Promise<unknown>> = {
  '/locais': () => import('../../pages/Locais'),
  '/eventos': () => import('../../pages/Eventos'),
  '/categorias': () => import('../../pages/Categorias'),
  '/canal-informativo': () => import('../../pages/CanalInformativo'),
};

const started = new Set<string>();

function shouldSaveData(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return Boolean(connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType || ''));
}

export const RoutePreloader = () => {
  useEffect(() => {
    if (shouldSaveData()) return;

    const handleNavigationIntent = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      // Do not load other origins, files or non-HTTP links.
      if (anchor.origin !== window.location.origin) return;
      const path = anchor.pathname.replace(/\/$/, '') || '/';
      const importRoute = routeImports[path];
      if (!importRoute || started.has(path)) return;
      started.add(path);
      // Navigating normally still works if speculative loading fails.
      void importRoute().catch(() => { started.delete(path); });
    };

    document.addEventListener('pointerover', handleNavigationIntent, { passive: true });
    document.addEventListener('focusin', handleNavigationIntent);
    return () => {
      document.removeEventListener('pointerover', handleNavigationIntent);
      document.removeEventListener('focusin', handleNavigationIntent);
    };
  }, []);

  return null;
};
