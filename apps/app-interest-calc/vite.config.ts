import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5029,
    strictPort: true,
    cors: true,
  },
  base: '/app/interest-calc/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
