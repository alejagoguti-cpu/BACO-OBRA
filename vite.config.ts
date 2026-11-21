import { defineConfig, type Plugin } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// solo en desarrollo: sirve el runtime de Cesium (en el build lo copia tools/copy-cesium.mjs a docs/cesium)
const cesiumDev = (): Plugin => ({
  name: 'cesium-dev', apply: 'serve',
  configureServer(server) {
    const raiz = 'node_modules/cesium/Build/Cesium';
    const tipos: Record<string, string> = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.svg': 'image/svg+xml' };
    const servir = (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => {
      const f = join(raiz, decodeURIComponent((req.url ?? '').split('?')[0]));
      if (!f.startsWith(join(raiz)) || !existsSync(f) || !statSync(f).isFile()) return next();
      res.setHeader('Content-Type', tipos[extname(f)] ?? 'application/octet-stream'); createReadStream(f).pipe(res);
    };
    server.middlewares.use('/BACO-OBRA/cesium', servir);
    server.middlewares.use('/node_modules/cesium/Build/Cesium', servir);
  },
});

export default defineConfig({
  base: '/BACO-OBRA/',
  plugins: [cesiumDev()],
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  build: {
    outDir: 'docs',
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks: { cesium: ['cesium'] },
      },
    },
  },
  server: { port: 5173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1' },
});
