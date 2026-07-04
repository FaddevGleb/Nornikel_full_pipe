import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { configManager } from './configManager.js';
import { loadGraphBundle } from './graphLoader.js';
import { syncDataOutToVizIn } from './graphSyncService.js';

const STAGE_LABELS = {
  slicer: 'Text slicing',
  concepts: 'Concept extraction',
  graph: 'Graph construction',
  dedup: 'Semantic deduplication',
  refiner: 'Long-range refinement',
  metrics: 'Metrics computation',
  fix: 'Graph enrichment',         // ← НОВОЕ
  split: 'Cluster splitting',       // ← НОВОЕ
  graph2html: 'HTML graph generation',
  graph2viewer: 'Viewer HTML production',
};

const STAGE_MODULES = {
  slicer: 'slicer',
  concepts: 'concepts',
  graph: 'graph',
  dedup: 'dedup',
  refiner: 'refiner',
  metrics: 'metrics',
  fix: 'fix',                       // ← НОВОЕ
  split: 'split',                   // ← НОВОЕ
  graph2html: 'graph2html',
  graph2viewer: 'graph2viewer',
};

/**
 * Executes Python pipeline stages via web/run_with_config.py.
 */
export class PipelineRunner {
  constructor(onLog) {
    this.onLog = onLog ?? (() => {});
    this.activeProcess = null;
    this.cancelRequested = false;
    this.incrementalMode = false;
  }

  async ensureDirectories() {
    const dirs = ['data/raw', 'data/staging', 'data/out', 'logs', 'viz/data/in', 'viz/data/out'];
    for (const dir of dirs) {
      await fs.mkdir(configManager.resolveProjectPath(dir), { recursive: true });
    }
  }

  async listRawFiles() {
    const rawDir = configManager.resolveProjectPath('data/raw');
    try {
      const entries = await fs.readdir(rawDir, { withFileTypes: true });
      const allowed = new Set(['txt', 'md', 'html']);
      const files = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (allowed.has(ext)) {
          const fullPath = path.join(rawDir, entry.name);
          const stat = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString(),
          });
        }
      }
      return files.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  requestCancel() {
    this.cancelRequested = true;
    if (this.activeProcess) {
      this.activeProcess.kill('SIGTERM');
    }
  }

runStage(stage) {
  return new Promise((resolve, reject) => {
    const python = configManager.getPythonExecutable();
    const launcher = path.join(configManager.getWebRoot(), 'run_with_config.py');
    const moduleStage = STAGE_MODULES[stage];
    
    if (!moduleStage) {
      reject(new Error(`Unknown pipeline stage: ${stage}`));
      return;
    }
    
    this.cancelRequested = false;
    
    // === INCREMENTAL FIX: Pass --incremental flag ===
    const args = [launcher, moduleStage];
    if (this.incrementalMode && (stage === 'slicer' || stage === 'graph')) {
      args.push('--incremental');
      this.onLog({
        level: 'info',
        stage,
        message: `Running ${stage} in incremental mode`,
      });
    }
    
    this.onLog({
      level: 'info',
      stage,
      message: `Starting ${STAGE_LABELS[stage] ?? stage}`,
    });
    
    const child = spawn(python, args, {  // ← используем args вместо [launcher, moduleStage]
      cwd: configManager.getProjectRoot(),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
      shell: false,
    });

      this.activeProcess = child;
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        stdout += text;
        for (const line of text.split(/\r?\n/)) {
          if (line.trim()) {
            this.onLog({ level: 'info', stage, message: line.trim() });
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        stderr += text;
        for (const line of text.split(/\r?\n/)) {
          if (line.trim()) {
            this.onLog({ level: 'warn', stage, message: line.trim() });
          }
        }
      });

      child.on('error', (error) => {
        this.activeProcess = null;
        reject(error);
      });

      child.on('close', (code) => {
        this.activeProcess = null;
        if (this.cancelRequested) {
          reject(new Error('Pipeline cancelled by user'));
          return;
        }
        if (code === 0) {
          resolve({ stage, stdout, stderr });
        } else {
          reject(new Error(`${STAGE_LABELS[stage] ?? stage} failed with exit code ${code}`));
        }
      });
    });
  }

  async copyArtifactsForViz() {
    return syncDataOutToVizIn({ merge: true, force: true, onLog: this.onLog.bind(this) });
  }

  async clearPipelineArtifacts() {
  const dirs = ['data/staging', 'data/out'];
  const results = [];
  
  for (const rel of dirs) {
    const dir = configManager.resolveProjectPath(rel);
    try {
      // Проверяем существование директории
      try {
        await fs.access(dir);
      } catch {
        results.push(`Directory ${rel} does not exist, skipping`);
        continue;
      }
      
      // Читаем содержимое
      const entries = await fs.readdir(dir);
      let removed = 0;
      let failed = 0;
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true, maxRetries: 3 });
          } else {
            await fs.unlink(fullPath);
          }
          removed++;
        } catch (err) {
          failed++;
          this.onLog({
            level: 'warn',
            message: `Failed to remove ${fullPath}: ${err.message}`,
          });
        }
      }
      
      results.push(`Cleared ${rel}: ${removed} removed, ${failed} failed`);
    } catch (err) {
      results.push(`Error processing ${rel}: ${err.message}`);
    }
  }
  
  // Логируем результат очистки
  for (const result of results) {
    this.onLog({ level: 'info', message: result });
  }
}

async runPipeline(stages, { incremental = false } = {}) {
  await this.ensureDirectories();
  
  // === INCREMENTAL FIX: Store flag for runStage ===
  this.incrementalMode = incremental;
  
  if (!incremental) {
    await this.clearPipelineArtifacts();
  } else {
    this.onLog({ level: 'info', message: 'Incremental mode: preserving existing artifacts' });
  }

    const selectedStages = stages?.length ? stages : configManager.settings.pipeline.stages;
    const results = [];

    for (const stage of selectedStages) {
      if (stage === 'metrics') {
        await this.copyArtifactsForViz();
      }
      const result = await this.runStage(stage);
      results.push(result);
    }

    if (!selectedStages.includes('metrics') && configManager.settings.pipeline.autoRunMetrics) {
      await this.copyArtifactsForViz();
      results.push(await this.runStage('metrics'));
    }

    return results;
  }

  async getGraphBundle() {
    return loadGraphBundle();
  }
}

export { STAGE_LABELS };
