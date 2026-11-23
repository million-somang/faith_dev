import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);

function resolveOrtDistDir(): string {
  const entryPath = require.resolve('onnxruntime-web');
  let cursor = dirname(entryPath);
  for (let i = 0; i < 4; i += 1) {
    if (existsSync(join(cursor, 'ort-wasm-simd-threaded.jsep.wasm'))) {
      return cursor;
    }
    const nestedDist = join(cursor, 'dist');
    if (existsSync(join(nestedDist, 'ort-wasm-simd-threaded.jsep.wasm'))) {
      return nestedDist;
    }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return '';
}

function resolveMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.wasm') return 'application/wasm';
  if (ext === '.mjs' || ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function isAllowedOrtRuntimeFile(fileName: string): boolean {
  return (
    fileName === 'ort-wasm-simd-threaded.jsep.wasm' ||
    fileName === 'ort-wasm-simd-threaded.jsep.mjs'
  );
}

function isAllowedOnnxModelFile(fileName: string): boolean {
  return fileName === 'realesr-general-x4v3.onnx' || fileName === 'realesrgan_x4plus_fp16.onnx';
}

function onnxAssetsPlugin(): Plugin {
  let ortDistDir = '';
  let localModelsDir = '';
  let outDir = 'dist';

  return {
    name: 'veranex-onnx-assets',
    configResolved(config) {
      ortDistDir = resolveOrtDistDir();
      localModelsDir = resolve(config.root, 'models');
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url || '').split('?')[0] ?? '';

        const ortMarker = 'ort-wasm/';
        const ortIdx = reqPath.indexOf(ortMarker);
        if (ortIdx !== -1 && ortDistDir) {
          const fileName = reqPath.slice(ortIdx + ortMarker.length);
          if (fileName.includes('..') || fileName.includes('/') || !isAllowedOrtRuntimeFile(fileName)) {
            res.statusCode = 403;
            res.end();
            return;
          }
          const absFile = join(ortDistDir, fileName);
          if (!existsSync(absFile)) {
            next();
            return;
          }
          res.setHeader('Content-Type', resolveMimeType(absFile));
          res.end(readFileSync(absFile));
          return;
        }

        const modelMarker = 'models/';
        const modelIdx = reqPath.indexOf(modelMarker);
        if (modelIdx !== -1 && localModelsDir) {
          const fileName = reqPath.slice(modelIdx + modelMarker.length);
          if (fileName.includes('..') || fileName.includes('/') || !isAllowedOnnxModelFile(fileName)) {
            res.statusCode = 403;
            res.end();
            return;
          }
          const absFile = join(localModelsDir, fileName);
          if (!existsSync(absFile)) {
            next();
            return;
          }
          res.setHeader('Content-Type', resolveMimeType(absFile));
          res.end(readFileSync(absFile));
          return;
        }

        next();
      });
    },
    closeBundle() {
      if (ortDistDir && existsSync(ortDistDir)) {
        const dstOrtDir = join(outDir, 'ort-wasm');
        mkdirSync(dstOrtDir, { recursive: true });
        for (const entry of readdirSync(ortDistDir)) {
          if (isAllowedOrtRuntimeFile(entry)) {
            cpSync(join(ortDistDir, entry), join(dstOrtDir, entry));
          }
        }
      }

      if (localModelsDir && existsSync(localModelsDir)) {
        const dstModelsDir = join(outDir, 'models');
        mkdirSync(dstModelsDir, { recursive: true });
        for (const modelName of ['realesr-general-x4v3.onnx', 'realesrgan_x4plus_fp16.onnx']) {
          const srcPath = join(localModelsDir, modelName);
          if (existsSync(srcPath)) {
            cpSync(srcPath, join(dstModelsDir, modelName));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), onnxAssetsPlugin()],
  base: '/app/image-resizer/',
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
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
