import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'stub-workbox',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.includes('workbox-precaching') || req.url.includes('/sw.js') || req.url.includes('/service-worker.js'))) {
            res.setHeader('Content-Type', 'application/javascript');
            res.end('export default {}; export const precacheAndRoute = () => {};');
            return;
          }
          next();
        });
      },
      resolveId(id) {
        if (id.includes('workbox-')) {
          return '\0' + id;
        }
      },
      load(id) {
        if (id.startsWith('\0workbox-')) {
          return 'export default {}; export const precacheAndRoute = () => {};';
        }
      },
    },
  ],
  optimizeDeps: {
    exclude: ['workbox-precaching'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query:  ['@tanstack/react-query'],
          http:   ['axios'],
        },
      },
    },
  },
});
