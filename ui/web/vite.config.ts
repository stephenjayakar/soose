import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    'process.env.ALPHA': JSON.stringify(false),
    'process.env.GOOSE_TUNNEL': JSON.stringify(false),
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
    // Proxy API calls to goosed server to avoid CORS issues during dev
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
