import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { configManager } from './configManager.js';
import { syncDataOutToVizIn } from './graphSyncService.js';
import { loadGraphBundle } from './graphLoader.js';

/**
 * Global event bus for graph update notifications (SSE subscribers).
 */
export const graphEventBus = new EventEmitter();

let watcherStarted = false;
let debounceTimer = null;
let metricsJobPending = false;

const DEBOUNCE_MS = 3000;

export function isMetricsJobPending() {
  return metricsJobPending;
}

export function setMetricsJobPending(value) {
  metricsJobPending = value;
}

/**
 * Notify subscribers that graph data changed.
 */
export async function emitGraphUpdated(reason = 'sync') {
  try {
    const bundle = await loadGraphBundle({ autoSync: false });
    graphEventBus.emit('graph:updated', {
      type: 'graph_updated',
      reason,
      loadStatus: bundle.loadStatus,
      timestamp: new Date().toISOString(),
    });
    return bundle;
  } catch (error) {
    graphEventBus.emit('graph:error', {
      type: 'graph_error',
      reason,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Handle detected change in data/out — sync and optionally queue metrics.
 */
export async function handleDataOutChange({ source = 'watcher', enqueueMetrics } = {}) {
  const pipeline = configManager.settings?.pipeline ?? {};
  const syncResult = await syncDataOutToVizIn({ merge: true, force: true });
  await emitGraphUpdated(source);

  const shouldEnqueueMetrics = enqueueMetrics ?? pipeline.autoMetricsOnExternalChange ?? true;
  if (!shouldEnqueueMetrics || !syncResult.synced) {
    return syncResult;
  }

  if (metricsJobPending) {
    return { ...syncResult, metricsQueued: false, reason: 'metrics_already_pending' };
  }

  const { jobQueue } = await import('./jobQueue.js');
  metricsJobPending = true;
  jobQueue.createJob({
    type: 'pipeline',
    payload: {
      stages: ['metrics'],
      incremental: true,
      source: 'auto_metrics',
    },
  });

  return { ...syncResult, metricsQueued: true };
}

function scheduleDataOutChange(source) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    handleDataOutChange({ source }).catch((error) => {
      console.warn('[graphWatcher] sync failed:', error.message);
    });
  }, DEBOUNCE_MS);
}

/**
 * Watch data/out for CLI pipeline updates.
 */
export function startGraphWatcher() {
  const pipeline = configManager.settings?.pipeline ?? {};
  if (watcherStarted || pipeline.watchDataOut === false) {
    return;
  }

  const outDir = configManager.resolveProjectPath('data/out');
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch {
    // directory may already exist
  }

  try {
    fs.watch(outDir, { persistent: false }, (_eventType, filename) => {
      if (!filename) return;
      if (
        filename.startsWith('LearningChunkGraph_') ||
        filename === 'ConceptDictionary.json'
      ) {
        scheduleDataOutChange('watcher');
      }
    });
    watcherStarted = true;
    console.log(`[graphWatcher] Watching ${outDir}`);
  } catch (error) {
    console.warn('[graphWatcher] Failed to start:', error.message);
  }
}

export function stopGraphWatcher() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  watcherStarted = false;
}
