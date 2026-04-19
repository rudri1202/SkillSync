import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // pdfjs-dist ships its own ESM worker; pre-bundling breaks the worker URL
    exclude: ['pdfjs-dist'],
  },

  server: {
    // Proxy /api/* to the local Express API server during development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
