import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5015,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4200',
                changeOrigin: true,
                cookieDomainRewrite: 'localhost',
                cookiePathRewrite: '/',
            }
        }
    },
    optimizeDeps: {
        include: ['lucide-react', '@faithportal/mini-app-sdk']
    },
    resolve: {
        dedupe: ['react', 'react-dom']
    },
    base: '/app/2048/'
});
