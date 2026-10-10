import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// vitest/config re-exports Vite's defineConfig, extended to also type-check
// the `test` option below.
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin /api/* path, proxied to the backend — mirrors
    // frontend-chats/vite.config.ts and nginx.conf, which avoids needing
    // CORS on the backend. The target is overridden by
    // docker-compose.override.yml to the backend's service name, since
    // "localhost" inside that container means this container itself.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
