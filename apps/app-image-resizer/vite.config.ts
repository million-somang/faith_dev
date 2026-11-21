import { existsSync, mkdirSync, cpSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);

function resolveEsrganModelsDir(): string {
  let cursor = dirname(require.resolve('@upscalerjs/esrgan-slim'));
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(cursor, 'models');
    if (existsSync(join(candidate, 'x2', 'model.json'))) {
      return candidate;
    }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return '';
}

function esrganModelsPlugin(): Plugin {
  const scales = ['x2', 'x3', 'x4'] as const;
  let modelsDir = '';
  let outDir = 'dist';

  return {
    name: 'veranex-esrgan-models',
    configResolved(config) {
      modelsDir = resolveEsrganModelsDir();
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url || '').split('?')[0] ?? '';
        const marker = 'models/esrgan-slim/';
        const markerIdx = reqPath.indexOf(marker);
        if (markerIdx === -1) {
          next();
          return;
        }
        const relPath = reqPath.slice(markerIdx + marker.length);
        const parts = relPath.split('/').filter(Boolean);
        if (parts.length !== 2 || !scales.includes(parts[0] as (typeof scales)[number])) {
          next();
          return;
        }
        const safeFile = parts[1]!;
        if (safeFile.includes('..')) {
          res.statusCode = 400;
          res.end();
          return;
        }
        const absFile = join(modelsDir, parts[0]!, safeFile);
        if (!existsSync(absFile)) {
          next();
          return;
        }
        const ext = extname(absFile);
        res.setHeader(
          'Content-Type',
          ext === '.json' ? 'application/json; charset=utf-8' : 'application/octet-stream'
        );
        res.end(readFileSync(absFile));
      });
    },
    closeBundle() {
      if (!modelsDir || !existsSync(modelsDir)) return;
      for (const scale of scales) {
        const srcScaleDir = join(modelsDir, scale);
        const dstScaleDir = join(outDir, 'models', 'esrgan-slim', scale);
        if (existsSync(srcScaleDir)) {
          mkdirSync(dstScaleDir, { recursive: true });
          cpSync(srcScaleDir, dstScaleDir, { recursive: true });
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), esrganModelsPlugin()],
  base: '/app/image-resizer/',
  worker: {
    format: 'es',
  },
  server: {
    port: 5028,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4200',
        changeOrigin: true,
      },
    },
  },
});
