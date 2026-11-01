import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── dev server proxy ─────────────────────────────────────────────────────
  // Routes /api/yahoo/* → Yahoo Finance to avoid CORS in browser.
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        secure: true,
      },
    },
  },

  // ── test configuration ───────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/hooks/**', 'src/components/**'],
      exclude: ['src/__tests__/**'],
    },
  },
})
