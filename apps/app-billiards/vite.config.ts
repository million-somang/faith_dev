import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  const isStandalone = process.env.BUILD_TARGET === 'standalone';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5041,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4200',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ['lucide-react', '@faithportal/mini-app-sdk', 'canvas-confetti'],
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    base: isStandalone ? '/' : '/app/billiards/',
    build: {
      outDir: isStandalone ? 'dist-standalone' : 'dist',
    },
  };
});
