import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mirrors nginx.conf's /api/ -> backend proxy, so the app can always call
    // a same-origin /api/* path (avoids CORS) whether run via `vite dev` or
    // through the built, containerized frontend. The target is overridden by
    // docker-compose.override.yml to the backend's service name, since
    // "localhost" inside that container means the frontend container itself.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
