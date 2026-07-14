import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react() as any, tailwindcss()] as any,
  server: {
    port: 5023,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4200',
        changeOrigin: true,
        cookiePathRewrite: '/',
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react', '@faithportal/mini-app-sdk', 'jsnes']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  base: '/app/comboy/'
})
