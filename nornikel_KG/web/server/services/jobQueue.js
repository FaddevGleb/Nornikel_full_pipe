import fs from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { configManager } from './configManager.js';
import { PipelineRunner, STAGE_LABELS } from './pipelineRunner.js';
import { runOfflineDiagnostics } from './diagnosticsService.js';
import { stateStore } from './stateStore.js';
import { syncDataOutToVizIn } from './graphSyncService.js';
import { emitGraphUpdated, setMetricsJobPending, isMetricsJobPending } from './graphWatcher.js';
import {
  writeRequest as writeAccelmatRequest,
  runAccelmat,
  readResult as readAccelmatResult,
  writeResult as writeAccelmatResult,
} from './accelmatRunner.js';
import { enrichAccelmatResult } from './feynmanEnrichment.js';
import { getFeynmanEnrichmentSettings } from './feynmanShared.js';
import { createAccelmatFeynmanLogger, getFeynmanAccelmatLogPath } from './feynmanAccelmatLogger.js';

const JOBS_DIR = path.join(configManager.getWebRoot(), 'runtime', 'jobs');
const CHECKPOINTS_DIR = path.join(configManager.getWebRoot(), 'runtime', 'checkpoints');
// Paths resolved via configManager after init

/**
 * In-memory task queue with disk persistence for recovery.
 */
export class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.runningJobId = null;
    this.runner = null;
  }

  async init() {
    await fs.mkdir(JOBS_DIR, { recursive: true });
    await fs.mkdir(CHECKPOINTS_DIR, { recursive: true });
    await this.loadPersistedJobs();
  }

  async loadPersistedJobs() {
    const files = await fs.readdir(JOBS_DIR).catch(() => []);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(JOBS_DIR, file), 'utf8');
      const job = JSON.parse(raw);
      if (['running', 'paused'].includes(job.status)) {
        job.status = 'interrupted';
        job.error = 'Recovered after server restart';
      }
      this.jobs.set(job.id, job);
    }
  }

  async persistJob(job) {
    const target = path.join(JOBS_DIR, `${job.id}.json`);
    await fs.writeFile(target, JSON.stringify(job, null, 2), 'utf8');
  }

  listJobs() {
    return [...this.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getJob(jobId) {
    return this.jobs.get(jobId) ?? null;
  }

  createJob({ type, payload }) {
    const job = {
      id: uuidv4(),
      type,
      payload,
      status: 'queued',
      progress: 0,
      stage: null,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      checkpoint: null,
      result: null,
    };
    this.jobs.set(job.id, job);
    this.persistJob(job);
    this.emit('job:created', job);
    this.processNext();
    return job;
  }

  pauseJob(jobId) {
    const job = this.getJob(jobId);
    if (!job || job.status !== 'running') return null;
    job.status = 'paused';
    job.updatedAt = new Date().toISOString();
    this.runner?.requestCancel();
    this.persistJob(job);
    this.emit('job:updated', job);
    return job;
  }

  cancelJob(jobId) {
    const job = this.getJob(jobId);
    if (!job) return null;
    if (job.status === 'running') {
      this.runner?.requestCancel();
    }
    job.status = 'cancelled';
    job.updatedAt = new Date().toISOString();
    job.completedAt = new Date().toISOString();
    this.persistJob(job);
    this.emit('job:updated', job);
    return job;
  }

  resumeJob(jobId) {
    const job = this.getJob(jobId);
    if (!job || !['paused', 'interrupted', 'failed'].includes(job.status)) return null;
    job.status = 'queued';
    job.error = null;
    job.updatedAt = new Date().toISOString();
    this.persistJob(job);
    this.emit('job:updated', job);
    this.processNext();
    return job;
  }

  enqueueMetricsJob(source = 'auto_metrics') {
    const pipeline = configManager.settings?.pipeline ?? {};
    if (!pipeline.autoRunMetrics) return null;

    const activeMetricsJob = [...this.jobs.values()].find(
      (j) => (j.status === 'queued' || j.status === 'running')
        && j.type === 'pipeline'
        && (j.payload?.stages?.includes('metrics') || j.payload?.source === 'auto_metrics'),
    );
    if (activeMetricsJob || isMetricsJobPending()) {
      return null;
    }

    setMetricsJobPending(true);
    const job = this.createJob({
      type: 'pipeline',
      payload: {
        stages: ['metrics'],
        incremental: true,
        source,
      },
    });
    return job;
  }

  async syncAfterGraphStage(job, stage) {
    const syncStages = configManager.settings?.pipeline?.syncOnGraphStages
      ?? ['graph', 'dedup', 'refiner'];
    if (!syncStages.includes(stage)) return;

    await syncDataOutToVizIn({
      merge: true,
      force: true,
      onLog: (entry) => this.appendLog(job, entry),
    });
    await emitGraphUpdated(`stage_${stage}`);

    const stages = job.payload?.stages ?? configManager.settings.pipeline.stages;
    if (!stages.includes('metrics')) {
      this.enqueueMetricsJob();
    }
  }

  appendLog(job, entry) {
    job.logs.push({ ...entry, timestamp: new Date().toISOString() });
    if (job.logs.length > 500) {
      job.logs = job.logs.slice(-500);
    }
    job.updatedAt = new Date().toISOString();
    this.persistJob(job);
    this.emit('job:log', job, entry);
  }

  async saveCheckpoint(job, stage) {
    const checkpoint = {
      jobId: job.id,
      stage,
      savedAt: new Date().toISOString(),
    };
    job.checkpoint = checkpoint;
    const target = path.join(CHECKPOINTS_DIR, `${job.id}.json`);
    await fs.writeFile(target, JSON.stringify(checkpoint, null, 2), 'utf8');
  }

  async processNext() {
    if (this.runningJobId) return;

    const nextJob = this.listJobs().find((job) => job.status === 'queued');
    if (!nextJob) return;

    this.runningJobId = nextJob.id;
    nextJob.status = 'running';
    nextJob.updatedAt = new Date().toISOString();
    await this.persistJob(nextJob);
    this.emit('job:updated', nextJob);

    this.runner = new PipelineRunner((entry) => this.appendLog(nextJob, entry));

    try {
      if (nextJob.type === 'pipeline') {
        await this.runPipelineJob(nextJob);
      } else if (nextJob.type === 'accelmat') {
        await this.runAccelmatJob(nextJob);
      } else {
        throw new Error(`Unsupported job type: ${nextJob.type}`);
      }

      nextJob.status = 'completed';
      nextJob.progress = 100;
      nextJob.completedAt = new Date().toISOString();
      if (nextJob.type === 'pipeline') {
        await stateStore.recordPipelineComplete(nextJob);
        try {
          await syncDataOutToVizIn({ merge: true, force: true });
          await emitGraphUpdated('pipeline_complete');
        } catch (syncError) {
          this.appendLog(nextJob, { level: 'warn', message: `Graph sync failed: ${syncError.message}` });
        }
        if (configManager.getMode() === 'offline') {
          try {
            const diagReport = await runOfflineDiagnostics();
            nextJob.diagnosticsReportPath = diagReport.reportPath;
            await stateStore.update({ lastDiagnosticsReportId: diagReport.reportPath });
          } catch (diagError) {
            this.appendLog(nextJob, { level: 'warn', message: `Diagnostics failed: ${diagError.message}` });
          }
        }
      }
    } catch (error) {
      nextJob.status = nextJob.status === 'paused' ? 'paused' : 'failed';
      nextJob.error = error.message;
    } finally {
      if (nextJob.type === 'pipeline' && nextJob.payload?.source === 'auto_metrics') {
        setMetricsJobPending(false);
      }
      nextJob.updatedAt = new Date().toISOString();
      await this.persistJob(nextJob);
      this.emit('job:updated', nextJob);
      this.runningJobId = null;
      this.runner = null;
      this.processNext();
    }
  }

  async runPipelineJob(job) {
    const incremental = job.payload?.incremental ?? false;
    const defaultStages = configManager.settings.pipeline.stages;
    const stages = job.payload?.stages ?? defaultStages;
    const startIndex = job.checkpoint?.stage
      ? Math.max(0, stages.indexOf(job.checkpoint.stage) + 1)
      : 0;

    const isMetricsOnly = stages.length === 1 && stages[0] === 'metrics';

    if (startIndex === 0 && !incremental && !isMetricsOnly) {
      await this.runner.clearPipelineArtifacts();
      this.appendLog(job, {
        level: 'info',
        message: 'Full rebuild: cleared staging and output directories',
      });
    } else if (startIndex === 0 && incremental) {
      this.appendLog(job, {
        level: 'info',
        message: 'Incremental mode: preserving existing graph artifacts',
      });
    }

    const remaining = stages.slice(startIndex);

    for (let index = 0; index < remaining.length; index += 1) {
      if (job.status === 'paused' || job.status === 'cancelled') {
        break;
      }

      const stage = remaining[index];
      job.stage = stage;
      job.progress = Math.round(((startIndex + index) / stages.length) * 100);
      this.appendLog(job, {
        level: 'info',
        stage,
        message: `Stage queued: ${STAGE_LABELS[stage] ?? stage}`,
      });

      if (stage === 'metrics') {
        await this.runner.copyArtifactsForViz();
      }

      await this.runner.runStage(stage);
      await this.syncAfterGraphStage(job, stage);
      await this.saveCheckpoint(job, stage);
      job.progress = Math.round(((startIndex + index + 1) / stages.length) * 100);
      await this.persistJob(job);
    }

    if (
      !stages.includes('metrics') &&
      configManager.settings.pipeline.autoRunMetrics &&
      job.status === 'running'
    ) {
      await this.runner.copyArtifactsForViz();
      await this.runner.runStage('metrics');
    }
  }

  async runAccelmatJob(job) {
    const {
      slug,
      graphPath,
      goal,
      constraints,
      maxRefinementIterations,
      numHypotheses,
      feynmanEnrichment,
      supplementaryDocumentPaths,
    } = job.payload ?? {};
    if (!slug) {
      throw new Error('accelmat job payload is missing "slug"');
    }

    job.progress = 5;
    job.stage = 'accelmat';
    this.appendLog(job, { level: 'info', message: `Writing ACCELMAT request for slug "${slug}"` });
    await writeAccelmatRequest(slug, {
      graphPath,
      goal,
      constraints,
      maxRefinementIterations,
      numHypotheses,
      supplementaryDocumentPaths,
    });
    await this.persistJob(job);

    job.progress = 10;
    await this.persistJob(job);
    await runAccelmat(slug, (entry) => this.appendLog(job, entry));

    job.progress = 50;
    this.appendLog(job, { level: 'info', message: 'ACCELMAT run finished, reading result JSON' });
    let result = await readAccelmatResult(slug);

    const enrichmentSettings = getFeynmanEnrichmentSettings();
    const shouldEnrich = feynmanEnrichment === true;

    if (!shouldEnrich) {
      this.appendLog(job, {
        level: 'info',
        stage: 'accelmat',
        message: 'Feynman enrichment skipped (checkbox off)',
      });
    }

    if (shouldEnrich) {
      job.stage = 'feynman_critic';
      job.progress = 60;
      await this.persistJob(job);
      const feynmanLog = createAccelmatFeynmanLogger(slug, (entry) => this.appendLog(job, entry));
      feynmanLog({
        level: 'info',
        stage: 'feynman_critic',
        message: `Feynman enrichment enabled — log file: ${getFeynmanAccelmatLogPath(slug)}`,
      });
      result = await enrichAccelmatResult(result, {
        slug,
        sessionId: `accelmat-${slug}`,
        onLog: feynmanLog,
      });
      await writeAccelmatResult(slug, result);
      feynmanLog({
        level: 'info',
        stage: 'feynman_critic',
        message: `Enrichment saved to output/hypotheses_${slug}.json`,
        meta: { verdict: result.feynman_enrichment?.verdict },
      });

      const autoRerun = enrichmentSettings.autoRerunOnReject !== false;
      if (
        autoRerun
        && result.feynman_enrichment?.verdict === 'NO'
        && !job.payload._isRerun
      ) {
        const rerunSlug = `${slug}-r1`;
        const firstPassEnrichment = result.feynman_enrichment;
        const feedback = firstPassEnrichment.critic
          ?.Overall_Feedback_for_improvement_for_future_suggestion_generation ?? '';
        const augmentedGoal = `${result.goal}\n\nLiterature-backed critic feedback (Feynman+web_search):\n${feedback}`;

        job.stage = 'accelmat_rerun';
        job.progress = 75;
        this.appendLog(job, {
          level: 'info',
          stage: 'accelmat_rerun',
          message: `Feynman critic returned NO — re-running ACCELMAT as "${rerunSlug}" with feedback in goal`,
          meta: { parentSlug: slug, rerunSlug, feedbackPreview: feedback.slice(0, 200) },
        });
        await this.persistJob(job);

        await writeAccelmatRequest(rerunSlug, {
          graphPath,
          goal: augmentedGoal,
          constraints,
          maxRefinementIterations,
          numHypotheses,
        });
        await runAccelmat(rerunSlug, (entry) => this.appendLog(job, entry));
        result = await readAccelmatResult(rerunSlug);
        result.feynman_enrichment = firstPassEnrichment;
        result.metadata = {
          ...(result.metadata ?? {}),
          feynman_enriched: true,
          feynman_rerun_slug: rerunSlug,
          feynman_parent_slug: slug,
        };
        await writeAccelmatResult(rerunSlug, result);
        job.payload._rerunSlug = rerunSlug;
        this.appendLog(job, {
          level: 'info',
          stage: 'accelmat_rerun',
          message: `Re-run complete — final result: output/hypotheses_${rerunSlug}.json (Feynman verdict preserved from first pass)`,
          meta: { feynmanVerdict: firstPassEnrichment.verdict },
        });
      }
    }

    job.progress = 95;
    if (shouldEnrich && result.feynman_enrichment) {
      this.appendLog(job, {
        level: 'info',
        stage: job.stage ?? 'accelmat',
        message: `[Summary] Feynman verdict=${result.feynman_enrichment.verdict}, web_searches=${result.feynman_enrichment.tool_calls?.length ?? 0}${job.payload._rerunSlug ? `, rerun=${job.payload._rerunSlug}` : ''}`,
      });
    }
    job.result = result;
    await this.persistJob(job);
  }
}

export const jobQueue = new JobQueue();
