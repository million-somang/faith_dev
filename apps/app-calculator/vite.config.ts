import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()] as any,
  server: {
    port: 5019,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4200',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react'],
    exclude: ['@faithportal/mini-app-sdk']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  base: '/app/calculator/'
})
