import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Custom middleware: serve index.html for all non-admin, non-asset requests
// so that React Router can handle client-side navigation on hard refresh.
function spaFallback(): { name: string; configureServer: (server: { middlewares: Connect.Server }) => void } {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '/';
        // Let Vite handle assets, the admin entry, and API calls
        if (
          url.startsWith('/admin') ||
          url.startsWith('/src/') ||
          url.startsWith('/@') ||
          url.startsWith('/node_modules/') ||
          url.includes('.')
        ) {
          return next();
        }
        // Rewrite everything else to index.html so React Router takes over
        req.url = '/index.html';
        next();
      });
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), spaFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        admin: resolve(rootDir, 'admin.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
