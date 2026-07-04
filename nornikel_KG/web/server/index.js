import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';
import { configManager } from './services/configManager.js';
import { jobQueue } from './services/jobQueue.js';
import { auditLog } from './services/auditLog.js';
import { sessionManager } from './services/sessionManager.js';
import { stateStore } from './services/stateStore.js';
import { warnIfApiKeyMissing } from './middleware/security.js';
import { startGraphWatcher } from './services/graphWatcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(WEB_ROOT, 'dist');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');
const VIZ_VENDOR_DIR = path.resolve(WEB_ROOT, '..', 'viz', 'vendor');
const VIZ_STATIC_DIR = path.resolve(WEB_ROOT, '..', 'viz', 'static');
const PROJECT_ROOT = path.resolve(WEB_ROOT, '..');

const app = express();

app.use(express.json({ limit: '4mb' }));
app.use('/vendor', express.static(VIZ_VENDOR_DIR));
app.use('/viz-static', express.static(VIZ_STATIC_DIR));

app.use('/generated/viewer', express.static(path.join(PROJECT_ROOT, 'viz/data/out'), {
  index: 'knowledge_graph_viewer.html',
}));

app.use('/generated/graph', express.static(path.join(PROJECT_ROOT, 'viz/data/out'), {
  index: 'knowledge_graph.html',
}));

app.use('/api', apiRouter);

async function resolveStaticDir() {
  try {
    await fs.access(path.join(DIST_DIR, 'index.html'));
    return DIST_DIR;
  } catch {
    return PUBLIC_DIR;
  }
}

function isSpaDocumentPath(reqPath) {
  if (
    reqPath.startsWith('/api')
    || reqPath.startsWith('/vendor')
    || reqPath.startsWith('/viz-static')
    || reqPath.startsWith('/generated')
  ) {
    return false;
  }
  const ext = path.extname(reqPath);
  return ext === '' || ext === '.html';
}

async function bootstrap() {
  await configManager.init();
  await stateStore.init();
  await jobQueue.init();
  await auditLog.init();
  await sessionManager.init();

  const staticDir = await resolveStaticDir();
  app.use(express.static(staticDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  app.get('*', (req, res, next) => {
    if (!isSpaDocumentPath(req.path)) {
      res.status(404).type('text/plain').send('Not found');
      return;
    }
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(staticDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  app.use((error, req, res, _next) => {
    const message = error?.message ?? 'Internal server error';
    const status = error?.message?.includes('Unsupported file type') ? 400 : 500;
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, message);
    if (req.path.startsWith('/api')) {
      res.status(status).json({ error: message });
      return;
    }
    res.status(status).type('text/plain').send(message);
  });

  warnIfApiKeyMissing();
  startGraphWatcher();

  const port = configManager.settings?.port ?? 3847;
  const server = app.listen(port, () => {
    console.log(`K2-18 web dashboard running at http://localhost:${port}`);
    console.log(`Project root: ${configManager.getProjectRoot()}`);
    console.log(`Mode: ${configManager.getMode()} (${configManager.getProviderForMode()})`);
    console.log(`Static dir: ${staticDir}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other process first:`);
      console.error(`  Get-NetTCPConnection -LocalPort ${port} | Select OwningProcess`);
      console.error(`  Stop-Process -Id <PID> -Force`);
      process.exit(1);
    }
    console.error('Failed to start K2-18 web server:', error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start K2-18 web server:', error);
  process.exit(1);
});
