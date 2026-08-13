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
          if (moduleId.includes('@radix-ui')) return 'ui';
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
