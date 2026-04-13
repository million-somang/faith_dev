import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react() as any, tailwindcss() as any] as any,
    base: '/app/svg-converter/',
    server: {
        port: 5022,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4200',
                changeOrigin: true,
            },
        },
    },
});
