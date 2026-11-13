import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
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
