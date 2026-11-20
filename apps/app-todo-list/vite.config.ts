import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  const isStandalone = process.env.BUILD_TARGET === 'standalone';
  const plugins: PluginOption[] = [
    react() as unknown as PluginOption,
    tailwindcss() as unknown as PluginOption,
  ];

  return {
    plugins,
    base: isStandalone ? '/' : '/app/todo-list/',
    build: {
      outDir: isStandalone ? 'dist-standalone' : 'dist',
    },
    server: {
      port: 5043,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4200',
          changeOrigin: true,
        },
      },
    },
  };
});
