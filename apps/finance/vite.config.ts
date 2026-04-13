import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react() as any] as any,
    base: process.env.NODE_ENV === 'production' ? '/finance/' : '/',
    server: {
        port: 5010,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4200',
                changeOrigin: true,
            },
        },
    },
});
