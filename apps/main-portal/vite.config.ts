import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react() as any] as any,
    server: {
        port: 5000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4200',
                changeOrigin: true,
            },
            '^/admin.*': {
                target: 'http://localhost:4200',
                changeOrigin: true,
            },
            '^/app/comboy.*': {
                target: 'http://localhost:5023',
                changeOrigin: true
            },
            '^/app/calculator.*': {
                target: 'http://localhost:5019',
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
            '^/app/sudoku.*': {
                target: 'http://localhost:5013',
                changeOrigin: true
            },
            '^/app/pyeong-calc.*': {
                target: 'http://localhost:5014',
                changeOrigin: true
            },
            '^/app/2048.*': {
                target: 'http://localhost:5015',
                changeOrigin: true
            },
            '^/app/minesweeper.*': {
                target: 'http://localhost:5016',
                changeOrigin: true
            },
            '^/app/age-calc.*': {
                target: 'http://localhost:5017',
                changeOrigin: true
            },
            '^/app/dday-calc.*': {
                target: 'http://localhost:5018',
                changeOrigin: true
            },
            '^/app/json-formatter.*': {
                target: 'http://localhost:5020',
                changeOrigin: true
            },
            '^/app/base64-converter.*': {
                target: 'http://localhost:5021',
                changeOrigin: true
            },
            '^/app/svg-converter.*': {
                target: 'http://localhost:5022',
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
