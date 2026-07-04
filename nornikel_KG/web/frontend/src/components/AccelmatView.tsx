import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, subscribeJob, type AccelmatResult, type AccelmatResultSummary, type Job } from '../api/client';
import { PageHeader } from './PageHeader';
import { Badge, Button, EmptyState, Input, Select, Spinner, Textarea } from './ui';

export interface AccelmatViewProps {
  onDiscussHypothesis?: (context: { slug: string; suggestionKey: string; goal: string }) => void;
}

function sortedSuggestionKeys(result: AccelmatResult): string[] {
  const keys = Object.keys(result.hypotheses ?? {});
  const scores = result.evaluation?.scores ?? {};
  return keys.slice().sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
}

function relatedKgContext(result: AccelmatResult, materials: string): [string, unknown][] {
  const entries = Object.entries(result.kg_context ?? {});
  const matched = entries.filter(([key]) => materials.toLowerCase().includes(key.toLowerCase()));
  return matched.length > 0 ? matched : entries;
}

function formatKgDetails(entries: [string, unknown][]): string {
  return entries.map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n');
}

function feedbackKeyForSuggestion(suggestionKey: string): string | null {
  const match = suggestionKey.match(/Suggestion_(\d+)/i);
  return match ? `Feedback_for_suggestion_${match[1]}` : null;
}

function stageLabel(stage: string | null | undefined, t: (key: string) => string): string | null {
  if (!stage) return null;
  const key = `accelmat.stage_${stage}`;
  const translated = t(key);
  return translated !== key ? translated : stage;
}

function getFeynmanFeedback(result: AccelmatResult, suggestionKey: string) {
  const feedbackKey = feedbackKeyForSuggestion(suggestionKey);
  if (!feedbackKey) return null;
  const entry = result.feynman_enrichment?.critic?.[feedbackKey];
  return entry && typeof entry === 'object' ? entry : null;
}

export function AccelmatView({ onDiscussHypothesis }: AccelmatViewProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState('');
  const [constraints, setConstraints] = useState<string[]>(['']);
  const [graphPath, setGraphPath] = useState('');
  const [graphs, setGraphs] = useState<string[]>([]);
  const [numHypotheses, setNumHypotheses] = useState(5);
  const [maxRefinementIterations, setMaxRefinementIterations] = useState(1);
  const [feynmanEnrichment, setFeynmanEnrichment] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [log, setLog] = useState('');
  const [pastResults, setPastResults] = useState<AccelmatResultSummary[]>([]);
  const [selectedResult, setSelectedResult] = useState<AccelmatResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedExcelFiles, setSelectedExcelFiles] = useState<File[]>([]);
  const [excelDragOver, setExcelDragOver] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const streamCleanup = useRef<(() => void) | null>(null);

  const EXCEL_ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function pickExcelFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const valid = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith('.xlsx'));
    if (valid.length !== fileList.length) {
      setError(t('accelmat.excel_upload_invalid'));
    }
    if (valid.length > 0) {
      setSelectedExcelFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
        const merged = [...prev];
        for (const file of valid) {
          const key = `${file.name}:${file.size}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(file);
          }
        }
        return merged.slice(0, 5);
      });
    }
  }

  useEffect(() => {
    api.getAccelmatDefaults().then(({ defaults }) => {
      setNumHypotheses(defaults.numHypotheses);
      setMaxRefinementIterations(defaults.maxRefinementIterations);
      if (defaults.feynmanEnrichment !== undefined) {
        setFeynmanEnrichment(defaults.feynmanEnrichment);
      }
    }).catch(() => setError(t('errors.generic')));
    api.listAccelmatGraphs().then(({ graphs: list }) => {
      setGraphs(list);
      if (list.length > 0) setGraphPath((prev) => prev || list[0]);
    }).catch(() => setError(t('errors.generic')));
    refreshResults();
    api.listJobs().then(({ jobs }) => {
      const running = jobs.find((j) => j.type === 'accelmat' && j.status === 'running');
      if (running) attachJob(running.id);
    }).catch(() => {});

    return () => streamCleanup.current?.();
  }, [t]);

  async function refreshResults() {
    setLoadingList(true);
    try {
      const { results } = await api.listAccelmatResults();
      setPastResults(results);
    } catch {
      setPastResults([]);
    } finally {
      setLoadingList(false);
    }
  }

  function attachJob(jobId: string) {
    streamCleanup.current?.();
    streamCleanup.current = subscribeJob(jobId, {
      onUpdate: (job) => {
        setActiveJob(job);
        if (job.status === 'completed' && job.result) {
          setSelectedResult(job.result);
          const payload = job.payload as { slug?: string; _rerunSlug?: string } | undefined;
          setSelectedSlug(payload?._rerunSlug ?? payload?.slug ?? null);
          refreshResults();
        }
        if (job.status === 'failed') {
          setError(job.error ?? t('errors.generic'));
        }
      },
      onLog: (entry) => {
        const prefix = entry.stage ? `[${entry.stage}] ` : '';
        setLog((prev) => `${prev}${prefix}${entry.message}\n`);
      },
    });
  }

  function updateConstraint(index: number, value: string) {
    setConstraints((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function addConstraint() {
    setConstraints((prev) => [...prev, '']);
  }

  function removeConstraint(index: number) {
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  }

  async function runAccelmat() {
    setError(null);
    if (!goal.trim() || !graphPath) {
      setError(t('accelmat.validation_error'));
      return;
    }
    try {
      const { job } = await api.runAccelmat({
        goal: goal.trim(),
        constraints: constraints.map((c) => c.trim()).filter(Boolean),
        graphPath,
        numHypotheses,
        maxRefinementIterations,
        feynmanEnrichment,
        documents: selectedExcelFiles,
      });
      setActiveJob(job);
      setLog('');
      setSelectedResult(null);
      attachJob(job.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  }

  async function loadPastResult(slug: string) {
    const { result } = await api.getAccelmatResult(slug);
    setSelectedResult(result);
    setSelectedSlug(slug);
    setActiveJob(null);
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const isRunning = activeJob ? ['queued', 'running'].includes(activeJob.status) : false;

  return (
    <>
      <PageHeader title={t('accelmat.title')} description={t('accelmat.page_desc')} />

      <div className="panel accelmat-panel">
        <div className="form-stack">
          <Textarea label={t('accelmat.goal')} value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} />

          <div>
            <strong>{t('accelmat.constraints')}</strong>
            {constraints.map((c, i) => (
              <div key={i} className="constraint-row">
                <input className="form-input" value={c} onChange={(e) => updateConstraint(i, e.target.value)} aria-label={`${t('accelmat.constraints')} ${i + 1}`} />
                <button type="button" className="upload-remove" aria-label={t('common.close')} onClick={() => removeConstraint(i)}>×</button>
              </div>
            ))}
            <Button variant="secondary" onClick={addConstraint}>{t('accelmat.add_constraint')}</Button>
          </div>

          <div className="form-grid">
            <Select label={t('accelmat.graph_path')} value={graphPath} onChange={(e) => setGraphPath(e.target.value)}>
              {graphs.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Input label={t('accelmat.num_hypotheses')} type="number" min={1} max={20} value={numHypotheses} onChange={(e) => setNumHypotheses(Number(e.target.value))} />
            <Input label={t('accelmat.max_refinement_iterations')} type="number" min={0} max={5} value={maxRefinementIterations} onChange={(e) => setMaxRefinementIterations(Number(e.target.value))} />
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={feynmanEnrichment}
              onChange={(e) => setFeynmanEnrichment(e.target.checked)}
            />
            {t('accelmat.feynman_enrichment')}
          </label>

          <div className="panel upload-panel">
            <h2>{t('accelmat.excel_upload_title')}</h2>
            <div
              className={`upload-dropzone${excelDragOver ? ' drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setExcelDragOver(true); }}
              onDragLeave={() => setExcelDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setExcelDragOver(false);
                pickExcelFiles(e.dataTransfer.files);
              }}
              onClick={() => excelInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') excelInputRef.current?.click(); }}
              aria-label={t('accelmat.excel_upload_hint')}
            >
              <p className="upload-hint">{t('accelmat.excel_upload_hint')}</p>
              <p className="upload-formats">{t('accelmat.excel_upload_formats')}</p>
              <Button variant="secondary" className="upload-browse" onClick={(e) => { e.stopPropagation(); excelInputRef.current?.click(); }}>
                {t('accelmat.excel_upload_browse')}
              </Button>
              <input
                ref={excelInputRef}
                type="file"
                accept={EXCEL_ACCEPT}
                multiple
                hidden
                onChange={(e) => pickExcelFiles(e.target.files)}
              />
            </div>
            {selectedExcelFiles.length > 0 && (
              <ul className="upload-queue">
                {selectedExcelFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    <span>{file.name}</span>
                    <span className="upload-size">{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      type="button"
                      className="upload-remove"
                      aria-label={t('common.close')}
                      onClick={() => setSelectedExcelFiles((prev) => prev.filter((f) => f !== file))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button onClick={runAccelmat} disabled={isRunning}>
            {isRunning ? t('accelmat.running') : t('accelmat.run')}
          </Button>
          {error && <p className="upload-message err">{error}</p>}
        </div>

        {loadingList ? (
          <Spinner />
        ) : pastResults.length > 0 ? (
          <div className="corpus-list">
            <h3>{t('accelmat.past_runs')}</h3>
            <ul>
              {pastResults.map((r) => (
                <li key={r.slug}>
                  <span>{r.goal?.slice(0, 60) ?? r.slug}</span>
                  <Button variant="secondary" onClick={() => loadPastResult(r.slug)}>{t('accelmat.load')}</Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState title={t('chat.no_runs')} />
        )}

        {activeJob && (
          <div className="pipeline-status" aria-live="polite">
            <span className="pipeline-status-label">{t(`pipeline.status.${activeJob.status}`, { defaultValue: activeJob.status })}</span>
            {activeJob.stage && (
              <span className="accelmat-stage-badge">{stageLabel(activeJob.stage, t) ?? activeJob.stage}</span>
            )}
            <div className="progress-bar" role="progressbar" aria-valuenow={activeJob.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${activeJob.progress}%` }} />
            </div>
            <span>{activeJob.progress}%</span>
          </div>
        )}
        {(isRunning || log) && (
          <pre className="log-console accelmat-log-console">{log || t('pipeline.log_placeholder')}</pre>
        )}

        {selectedResult && (
          <div>
            <h3>{t('accelmat.results_title')}</h3>
            <p>{selectedResult.evaluation?.summary}</p>
            {selectedResult.metadata?.feynman_rerun_slug && (
              <p className="accelmat-rerun-note">
                {t('accelmat.rerun_note', { slug: selectedResult.metadata.feynman_rerun_slug })}
              </p>
            )}
            {selectedResult.feynman_enrichment && (
              <p>
                <Badge variant={selectedResult.feynman_enrichment.verdict === 'YES' ? 'success' : 'warn'}>
                  {t('accelmat.feynman_verdict')}: {selectedResult.feynman_enrichment.verdict}
                </Badge>
              </p>
            )}
            {selectedResult.supplementary_context?.documents?.length ? (
              <p>
                <Badge variant="primary">
                  {t('accelmat.excel_documents_badge', {
                    count: selectedResult.supplementary_context.documents.length,
                  })}
                </Badge>
              </p>
            ) : null}
            {selectedResult.supplementary_context?.formatted_text ? (
              <details>
                <summary>{t('accelmat.excel_context_title')}</summary>
                <pre className="log-console">{selectedResult.supplementary_context.formatted_text}</pre>
              </details>
            ) : null}
            {sortedSuggestionKeys(selectedResult).map((key) => {
              const hypothesis = selectedResult.hypotheses[key];
              const score = selectedResult.evaluation?.scores?.[key];
              const feynmanFeedback = getFeynmanFeedback(selectedResult, key);
              const isOpen = expanded.has(key);
              const kgEntries = relatedKgContext(selectedResult, hypothesis.Materials);
              return (
                <article key={key} className="hypothesis-card">
                  <div className="hypothesis-actions">
                    <Badge variant="primary">{t('accelmat.score')}: {score ?? '—'}/10</Badge>
                    {feynmanFeedback && (
                      <Badge variant={feynmanFeedback.Meets_the_goal_statement_and_satisfies_all_constraints_strictly === 'YES' ? 'success' : 'warn'}>
                        {t('accelmat.feynman_verdict')}: {feynmanFeedback.Meets_the_goal_statement_and_satisfies_all_constraints_strictly ?? '—'}
                      </Badge>
                    )}
                    <Button variant="secondary" onClick={() => toggleExpanded(key)}>
                      {isOpen ? t('accelmat.collapse') : t('accelmat.expand')}
                    </Button>
                  </div>
                  <h3>{hypothesis.Materials}</h3>
                  {isOpen && (
                    <>
                      <p><strong>{t('accelmat.methods')}:</strong> {hypothesis.Methods_to_develop_the_materials_suggested}</p>
                      <p><strong>{t('accelmat.reasoning')}:</strong> {hypothesis.Reasoning}</p>
                      {kgEntries.length > 0 && (
                        <details>
                          <summary>{t('accelmat.kg_context')}</summary>
                          <pre className="log-console">{formatKgDetails(kgEntries)}</pre>
                        </details>
                      )}
                      {feynmanFeedback && (
                        <details>
                          <summary>{t('accelmat.literature_review')}</summary>
                          <p>{feynmanFeedback.Reasoning}</p>
                          {feynmanFeedback.web_sources && feynmanFeedback.web_sources.length > 0 && (
                            <ul>
                              {feynmanFeedback.web_sources.map((url) => (
                                <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
                              ))}
                            </ul>
                          )}
                        </details>
                      )}
                    </>
                  )}
                  <Button onClick={() => onDiscussHypothesis?.({ slug: selectedSlug ?? '', suggestionKey: key, goal: selectedResult.goal })}>
                    {t('accelmat.discuss')}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
