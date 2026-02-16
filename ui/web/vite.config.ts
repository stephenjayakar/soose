import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.ALPHA': JSON.stringify(false),
    'process.env.GOOSE_TUNNEL': JSON.stringify(false),
  },
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, 'dist'),
  },
  server: {
    port: 5173,
    // Note: Soose connects directly to goosed (no proxy needed)
    // because the API client uses the full serverUrl from config.
    // The proxy below is only for convenience during dev if you 
    // want to use relative /api/ paths.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
