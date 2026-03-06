import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5011,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react', '@faithportal/mini-app-sdk']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  base: '/app/text-checker/'
})
