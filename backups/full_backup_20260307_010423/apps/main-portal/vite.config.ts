import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react() as any],
    server: {
        port: 5000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
            '^/admin.*': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
            '^/app/calculator.*': {
                target: 'http://localhost:5010',
                changeOrigin: true
            },
            '^/app/text-checker.*': {
                target: 'http://localhost:5011',
                changeOrigin: true
            },
            '^/app/tetris.*': {
                target: 'http://localhost:5012',
                changeOrigin: true
            },
            '^/app/news.*': {
                target: 'http://localhost:5001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/app\/news/, ''),
            },
        },
    },
});
