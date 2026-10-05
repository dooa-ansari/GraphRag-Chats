import react from '@vitejs/plugin-react'
// vitest/config re-exports Vite's defineConfig, extended to also type-check
// the `test` option below.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
