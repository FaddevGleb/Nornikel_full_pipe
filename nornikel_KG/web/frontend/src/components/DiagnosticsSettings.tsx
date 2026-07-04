import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type DiagnosticStep } from '../api/client';
import { PageHeader } from './PageHeader';
import { Button, EmptyState, Spinner } from './ui';

function formatDiagDetails(details: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(details).map(([key, value]) => ({
    key,
    value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
  }));
}

export function DiagnosticsView() {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    api.getLatestDiagnostics()
      .then(({ report }) => {
        if (report?.steps?.length) {
          setSteps(report.steps);
          setSummary(report.summary ?? {});
          setHasRun(true);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  async function runDiagnostics() {
    setLoading(true);
    setError(null);
    try {
      const report = await api.runDiagnostics();
      setSteps(report.steps ?? []);
      setSummary(report.summary ?? {});
      setHasRun(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('diagnostics.run_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('diagnostics.title')}
        description={t('diagnostics.page_desc')}
        actions={<Button onClick={runDiagnostics} disabled={loading}>{loading ? t('common.loading') : t('diagnostics.run')}</Button>}
      />

      <div className="panel">
        <p className="hint">{t('diagnostics.description')}</p>

        {error && <div className="status-banner warn">{error}</div>}

        {initialLoading && <Spinner />}

        {hasRun && summary.pass !== undefined && (
          <p className="diag-summary">{t('diagnostics.summary', { pass: summary.pass, warn: summary.warn, fail: summary.fail })}</p>
        )}

        {!hasRun && !loading && !initialLoading && (
          <EmptyState title={t('diagnostics.no_report')} />
        )}

        {steps.map((step) => (
          <div key={step.id} className="diag-step">
            <div className={`status-dot ${step.status}`} aria-hidden="true" />
            <div className="diag-step-body">
              <strong>{t(`diagnostics.steps.${step.id}`, { defaultValue: step.id })}</strong>
              <span className="diag-status">{t(`diagnostics.status_${step.status}`)}</span>
              {step.details && Object.keys(step.details).length > 0 && (
                <details className="diag-details">
                  <summary>{t('diagnostics.details')}</summary>
                  <div className="diag-details-card">
                    <dl className="diag-kv">
                      {formatDiagDetails(step.details).map(({ key, value }) => (
                        <div key={`${step.id}-${key}`} className="diag-kv-row">
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatAuditDetails(entry: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(entry)
    .filter(([key]) => !['timestamp', 'event'].includes(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—'),
    }));
}

export function AuditView() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<{ timestamp: string; event: string; [key: string]: unknown }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAudit()
      .then(({ entries: e }) => setEntries(e))
      .catch(() => setError(t('errors.generic')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <>
      <PageHeader title={t('audit.title')} description={t('audit.page_desc')} />

      <div className="panel">
        {error && <div className="view-error">{error}</div>}
        {loading && <Spinner />}
        {!loading && entries.length === 0 && <EmptyState title={t('audit.empty')} />}

        {!loading && entries.length > 0 && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>{t('audit.time')}</th>
                <th>{t('audit.event')}</th>
                <th>{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice().reverse().map((entry, i) => (
                <tr key={i}>
                  <td>{entry.timestamp}</td>
                  <td>{entry.event}</td>
                  <td>
                    <ul className="audit-details-list">
                      {formatAuditDetails(entry).map(({ key, value }) => (
                        <li key={key}><strong>{key}:</strong> {value}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
