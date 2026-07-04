import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const API_TARGET = 'http://127.0.0.1:3847';

/** Dev proxy tuned for long-lived SSE job streams. */
function devProxy() {
  return {
    target: API_TARGET,
    changeOrigin: true,
    timeout: 0,
    proxyTimeout: 0,
    configure: (proxy: { on: (event: string, handler: (...args: unknown[]) => void) => void }) => {
      proxy.on('error', (err, req, res) => {
        const code = (err as NodeJS.ErrnoException).code;
        const url = String((req as { url?: string }).url ?? '');
        // Server restart (--watch) drops open SSE connections; client reconnects.
        if (code === 'ECONNRESET' && url.includes('/stream')) {
          const response = res as { writableEnded?: boolean; end?: () => void };
          if (response && !response.writableEnded) {
            try {
              response.end?.();
            } catch {
              /* ignore */
            }
          }
          return;
        }
        console.error('[vite proxy]', err);
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': devProxy(),
      '/vendor': { target: API_TARGET, changeOrigin: true },
      '/viz-static': { target: API_TARGET, changeOrigin: true },
      '/generated': { target: API_TARGET, changeOrigin: true },
    },
  },
});
