import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";


// Vite preview (used by Lighthouse CI) does not execute Vercel /api functions.
// Provide only CI-only anonymous fixtures, preserving the real home geometry.
// The live API is separately exercised by production-public-cache-smoke.yml.
const publicCatalogPreviewFixture = {
  name: 'public-catalog-preview-ci-fixture',
  configurePreviewServer(server: import('vite').PreviewServer) {
    if (process.env.CI !== 'true') return;
    server.middlewares.use('/api/public-catalog', (req, res, next) => {
      if (req.method !== 'GET') return next();
      const params = new URL(req.url || '/', 'http://127.0.0.1').searchParams;
      const resource = params.get('resource');
      const names = [
        'stories', 'enquetes', 'search', 'aonde_ir', 'banner',
        'featured_section', 'categories', 'voz_do_povo',
        'featured_products', 'canal_informativo', 'achados_perdidos',
        'producao_local', 'ferramentas', 'viver_saj', 'stats_section',
        'eventos_slider', 'latest_job_coupons', 'jogos',
      ];
      let result: unknown;
      if (resource === 'home-sections') {
        result = names.map((name, index) => ({
          id: 'preview-' + name, section_name: name, display_name: name,
          ordem: index + 1, ativo: true,
        }));
      } else if (resource === 'categories' || resource === 'cities') {
        result = [];
      } else if (resource === 'banners') {
        result = params.get('section') === 'home'
          ? [{ id: 'preview-banner', titulo: 'SAJ TEM', imagem_url: '/Logo.png',
            link_url: '/anuncie-gratis', ativo: true, ordem: 1, secao: 'home' }]
          : [];
      } else {
        return next();
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(result));
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), publicCatalogPreviewFixture],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(moduleId) {
          if (moduleId.includes('@supabase')) return 'supabase';
          // Do not force every Radix primitive into one 93KB initial chunk.
          // Let the bundler split popovers, dialogs and admin-only widgets
          // according to the routes/components that actually use them.
          if (moduleId.includes('@tanstack/react-query')) return 'query';
          if (moduleId.includes('node_modules/react')) return 'vendor';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
  },
}));
