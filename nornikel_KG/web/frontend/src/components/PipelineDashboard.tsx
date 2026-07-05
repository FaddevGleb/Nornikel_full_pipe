import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Job } from '../api/client';
import { useGraphRefresh } from '../context/GraphRefreshContext';
import { ModeKpiCard } from './ModeIndicator';
import { PageHeader } from './PageHeader';
import { Button, Modal } from './ui';
import type { ConfigStatus } from '../utils/modeLabel';

const PIPELINE_STAGES = ['slicer', 'concepts', 'graph', 'refiner', 'metrics'];

type ConfirmAction = { type: 'full' } | { type: 'stage'; stage: string } | null;

function jobStatusLabel(status: string, t: (key: string) => string): string {
  const key = `pipeline.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function PipelineView({ runRequest = 0 }: { runRequest?: number }) {
  const { t } = useTranslation();
  const { bumpRevision } = useGraphRefresh();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [log, setLog] = useState('');
  const [integrationMode, setIntegrationMode] = useState<'new' | 'incremental'>('new');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const streamCleanup = useRef<(() => void) | null>(null);
  const runRequestRef = useRef(runRequest);

  useEffect(() => {
    api.getConfigStatus().then((cfg) => {
      const mode = cfg.integrationMode as string | undefined;
      if (mode === 'incremental' || mode === 'new') setIntegrationMode(mode);
    }).catch(() => {});

    api.listJobs().then(({ jobs }) => {
      const running = jobs.find((j) => j.status === 'running');
      if (running) attachJob(running.id);
    }).catch(() => {});

    return () => streamCleanup.current?.();
  }, []);

  useEffect(() => {
    if (runRequest > runRequestRef.current) {
      runRequestRef.current = runRequest;
      setConfirmAction({ type: 'full' });
    }
  }, [runRequest]);

  function attachJob(jobId: string) {
    streamCleanup.current?.();
    streamCleanup.current = subscribe(jobId);
  }

  function subscribe(jobId: string) {
    const source = new EventSource(`/api/jobs/${jobId}/stream`);
    source.addEventListener('snapshot', (e) => {
      const job = JSON.parse(e.data) as Job;
      setActiveJob(job);
      setLog(job.logs.map((l) => l.message).join('\n'));
    });
    source.addEventListener('update', (e) => {
      const job = JSON.parse(e.data) as Job;
      setActiveJob(job);
      if (job.status === 'completed') {
        bumpRevision();
      }
    });
    source.addEventListener('log', (e) => {
      const entry = JSON.parse(e.data) as { message: string };
      setLog((prev) => `${prev}${entry.message}\n`);
    });
    return () => source.close();
  }

  async function runStages(stages?: string[]) {
    const incremental = integrationMode === 'incremental';
    const { job } = await api.runPipeline(stages, incremental);
    setActiveJob(job);
    setLog('');
    attachJob(job.id);
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === 'full') runStages();
    else runStages([confirmAction.stage]);
    setConfirmAction(null);
  }

  const isRunning = activeJob?.status === 'running';

  return (
    <>
      <PageHeader title={t('pipeline.title')} description={t('pipeline.page_desc')} />

      <div className="panel pipeline-panel">
        <div className="pipeline-header">
          <h2>{t('pipeline.title')}</h2>
          <div className="pipeline-actions">
            <Button onClick={() => setConfirmAction({ type: 'full' })} disabled={isRunning}>
              {t('pipeline.run_full')}
            </Button>
            {activeJob && ['running', 'paused'].includes(activeJob.status) && (
              <>
                <Button variant="secondary" onClick={() => api.pauseJob(activeJob.id)}>{t('pipeline.pause')}</Button>
                <Button variant="danger" onClick={() => api.cancelJob(activeJob.id)}>{t('pipeline.cancel')}</Button>
              </>
            )}
          </div>
        </div>

        <div className="integration-options">
          <label className={`integration-option${integrationMode === 'new' ? ' selected' : ''}`}>
            <input
              type="radio"
              name="pipeline-integration"
              value="new"
              checked={integrationMode === 'new'}
              onChange={() => setIntegrationMode('new')}
            />
            <span>
              <strong>{t('dashboard.integration_new')}</strong>
              <small>{t('dashboard.integration_new_hint')}</small>
            </span>
          </label>
          <label className={`integration-option${integrationMode === 'incremental' ? ' selected' : ''}`}>
            <input
              type="radio"
              name="pipeline-integration"
              value="incremental"
              checked={integrationMode === 'incremental'}
              onChange={() => setIntegrationMode('incremental')}
            />
            <span>
              <strong>{t('dashboard.integration_append')}</strong>
              <small>{t('dashboard.integration_append_hint')}</small>
            </span>
          </label>
        </div>

        <div className={`integration-banner${integrationMode === 'incremental' ? ' append' : ''}`}>
          <strong>{integrationMode === 'incremental' ? t('dashboard.integration_append') : t('dashboard.integration_new')}</strong>
          <span>{integrationMode === 'incremental' ? t('pipeline.append_hint') : t('pipeline.new_hint')}</span>
        </div>

        <div className="stage-track" aria-label={t('pipeline.title')}>
          {PIPELINE_STAGES.map((stage) => {
            const stageIndex = PIPELINE_STAGES.indexOf(stage);
            const activeIndex = activeJob?.stage ? PIPELINE_STAGES.indexOf(activeJob.stage) : -1;
            const isDone = activeJob && activeIndex > stageIndex;
            const isActive = activeJob?.stage === stage;
            return (
              <div
                key={stage}
                className={`stage-chip${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {t(`pipeline.stages.${stage}`)}
              </div>
            );
          })}
        </div>

        <div className="stage-actions">
          {PIPELINE_STAGES.map((stage) => (
            <Button
              key={stage}
              variant="secondary"
              disabled={isRunning}
              onClick={() => setConfirmAction({ type: 'stage', stage })}
            >
              {t('pipeline.run_stage')}: {t(`pipeline.stages.${stage}`)}
            </Button>
          ))}
        </div>

        {activeJob && (
          <div className="pipeline-status" aria-live="polite">
            <span className="pipeline-status-label">{jobStatusLabel(activeJob.status, t)}</span>
            <div className="progress-bar" role="progressbar" aria-valuenow={activeJob.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${activeJob.progress}%` }} />
            </div>
            <span>{activeJob.progress}%</span>
          </div>
        )}

        <pre className="log-console" aria-label={t('pipeline.log_placeholder')}>{log || t('pipeline.log_placeholder')}</pre>
      </div>

      <Modal
        open={confirmAction !== null}
        title={
          confirmAction?.type === 'full'
            ? t('pipeline.confirm_full_title')
            : t('pipeline.confirm_stage_title', { stage: t(`pipeline.stages.${confirmAction?.type === 'stage' ? confirmAction.stage : ''}`) })
        }
        confirmLabel={t('common.confirm')}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        danger={confirmAction?.type === 'full'}
      >
        <p>
          {confirmAction?.type === 'full'
            ? t('pipeline.confirm_full_body')
            : t('pipeline.confirm_stage_body')}
        </p>
      </Modal>
    </>
  );
}

export function DashboardView({ config, onConfigRefresh }: { config: ConfigStatus; onConfigRefresh?: () => void }) {
  const { t } = useTranslation();
  const { revision } = useGraphRefresh();
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0 });
  const [integrationMode, setIntegrationMode] = useState<'new' | 'incremental'>('new');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = useCallback(async () => {
    try {
      const [f, g, cfg] = await Promise.all([api.listFiles(), api.getGraph(), api.getConfigStatus()]);
      setFiles(f.files);
      setGraphStats({ nodes: g.loadStatus.nodeCount, edges: g.loadStatus.edgeCount });
      const mode = cfg.integrationMode as string | undefined;
      if (mode === 'incremental' || mode === 'new') setIntegrationMode(mode);
      setLoadError(null);
    } catch {
      setLoadError(t('errors.generic'));
    }
  }, [t]);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [revision, refreshData]);

  useEffect(() => {
    onConfigRefresh?.();
  }, [onConfigRefresh]);

  function pickFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const allowed = ['.txt', '.md', '.html'];
    const picked = [...fileList].filter((f) => allowed.some((ext) => f.name.toLowerCase().endsWith(ext)));
    if (picked.length === 0) {
      setUploadMessage({ type: 'err', text: t('dashboard.upload_invalid') });
      return;
    }
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...picked.filter((f) => !names.has(f.name))];
    });
    setUploadMessage(null);
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      setUploadMessage({ type: 'err', text: t('dashboard.upload_empty') });
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      await api.ensureSession();
      const dt = new DataTransfer();
      selectedFiles.forEach((f) => dt.items.add(f));
      await api.uploadFiles(dt.files, integrationMode);
      setSelectedFiles([]);
      await refreshData();
      setUploadMessage({ type: 'ok', text: t('dashboard.upload_success') });
    } catch {
      setUploadMessage({ type: 'err', text: t('dashboard.upload_failed') });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.page_desc')} />

      {loadError && <div className="view-error">{loadError}</div>}

      <div className="kpi-grid">
        <ModeKpiCard config={config} />
        <div className="kpi-card">
          <small>{t('dashboard.kpi_files')}</small>
          <strong>{files.length}</strong>
        </div>
        <div className="kpi-card">
          <small>{t('dashboard.kpi_nodes')}</small>
          <strong>{graphStats.nodes}</strong>
          <small>{t('dashboard.kpi_edges', { count: graphStats.edges })}</small>
        </div>
      </div>

      <div className="panel upload-panel">
        <h2>{t('dashboard.upload_title')}</h2>

        <div
          className={`upload-dropzone${dragOver ? ' drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={t('dashboard.upload_hint')}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <p className="upload-hint">{t('dashboard.upload_hint')}</p>
          <p className="upload-formats">{t('dashboard.upload_formats')}</p>
          <Button variant="secondary" className="upload-browse" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            {t('dashboard.upload_browse')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.html"
            hidden
            onChange={(e) => pickFiles(e.target.files)}
          />
        </div>

        {selectedFiles.length > 0 && (
          <ul className="upload-queue">
            {selectedFiles.map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <span className="upload-size">{(f.size / 1024).toFixed(1)} KB</span>
                <button type="button" className="upload-remove" aria-label={t('common.close')} onClick={() => setSelectedFiles((prev) => prev.filter((x) => x.name !== f.name))}>×</button>
              </li>
            ))}
          </ul>
        )}

        <div className="integration-options">
          <label className={`integration-option${integrationMode === 'new' ? ' selected' : ''}`}>
            <input type="radio" name="integration" value="new" checked={integrationMode === 'new'} onChange={() => setIntegrationMode('new')} />
            <span>
              <strong>{t('dashboard.integration_new')}</strong>
              <small>{t('dashboard.integration_new_hint')}</small>
            </span>
          </label>
          <label className={`integration-option${integrationMode === 'incremental' ? ' selected' : ''}`}>
            <input type="radio" name="integration" value="incremental" checked={integrationMode === 'incremental'} onChange={() => setIntegrationMode('incremental')} />
            <span>
              <strong>{t('dashboard.integration_append')}</strong>
              <small>{t('dashboard.integration_append_hint')}</small>
            </span>
          </label>
        </div>

        <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
          {uploading ? t('common.loading') : t('dashboard.upload_btn')}
        </Button>

        {uploadMessage && (
          <p className={`upload-message ${uploadMessage.type}`}>{uploadMessage.text}</p>
        )}

        {files.length > 0 && (
          <div className="corpus-list">
            <h3>{t('dashboard.corpus_files')}</h3>
            <ul>
              {files.map((f) => (
                <li key={f.name}>
                  <span>{f.name}</span>
                  <span>{(f.size / 1024).toFixed(1)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
