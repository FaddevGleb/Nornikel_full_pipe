import cytoscape from 'cytoscape';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Hypothesis } from '../api/client';
import { PageHeader } from './PageHeader';
import { Badge, Button, EmptyState, Input, Spinner } from './ui';

function MiniGraph({ hypothesis }: { hypothesis: Hypothesis }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !hypothesis.subgraph?.nodes?.length) return;
    const cy = cytoscape({
      container: ref.current,
      elements: [
        ...hypothesis.subgraph.nodes.map((n) => ({
          data: { id: n.id, label: (n.name ?? n.text ?? n.id).slice(0, 12) },
        })),
        ...(hypothesis.subgraph.edges ?? []).map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.source ?? e.from,
            target: e.target ?? e.to,
          },
        })),
      ],
      style: [
        { selector: 'node', style: { label: 'data(label)', 'font-size': 7, width: 18, height: 18, 'background-color': '#0077C8' } },
        { selector: 'edge', style: { width: 1, 'line-color': '#004C97', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#004C97', 'curve-style': 'bezier' } },
      ],
      layout: { name: 'circle', fit: true, padding: 10 },
      userZoomingEnabled: false,
      userPanningEnabled: false,
    });
    return () => cy.destroy();
  }, [hypothesis]);

  if (!hypothesis.subgraph?.nodes?.length) return null;
  return <div ref={ref} className="mini-graph" />;
}

export function HypothesesView() {
  const { t } = useTranslation();
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [targetProperty, setTargetProperty] = useState('');
  const [minConfidence, setMinConfidence] = useState(0.4);
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const report = await api.generateHypotheses({ targetProperty, minConfidence, maxResults });
      setHypotheses(report.hypotheses);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function exportFile(format: 'markdown' | 'pdf') {
    const labels = {
      title: t('hypotheses.export_title'),
      generated: t('hypotheses.export_generated'),
      category: t('hypotheses.export_category'),
      confidence: t('hypotheses.confidence'),
      summary: t('hypotheses.export_summary'),
      reasoning: t('hypotheses.export_reasoning'),
      experiments: t('hypotheses.export_experiments_label'),
    };
    const blob = await api.exportHypotheses(format, { targetProperty, minConfidence, maxResults }, labels);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'pdf' ? 'nornikel-hypotheses.pdf' : 'nornikel-hypotheses.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title={t('hypotheses.title')}
        description={t('hypotheses.page_desc')}
        actions={(
          <>
            <Button onClick={generate} disabled={loading}>{t('hypotheses.generate')}</Button>
            <Button variant="secondary" onClick={() => exportFile('markdown')}>{t('hypotheses.export_md')}</Button>
            <Button variant="secondary" onClick={() => exportFile('pdf')}>{t('hypotheses.export_pdf')}</Button>
          </>
        )}
      />

      {error && <div className="view-error">{error}</div>}

      <div className="panel">
        <div className="form-grid">
          <Input label={t('hypotheses.target_property')} value={targetProperty} onChange={(e) => setTargetProperty(e.target.value)} />
          <Input label={t('hypotheses.min_confidence')} type="number" min={0} max={1} step={0.05} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} />
          <Input label={t('hypotheses.max_results')} type="number" min={1} max={50} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} />
        </div>

        {loading && <Spinner />}

        {!loading && hypotheses.length === 0 && (
          <EmptyState title={t('hypotheses.empty')} />
        )}

        {hypotheses.map((item) => (
          <article key={item.id} className="hypothesis-card">
            <Badge variant="primary">
              {(item.confidence * 100).toFixed(0)}% {t('hypotheses.confidence').toLowerCase()}
            </Badge>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <p><strong>{t('hypotheses.experiments')}:</strong></p>
            <ul>{item.suggestedExperiments.map((exp, i) => <li key={i}>{exp}</li>)}</ul>
            {item.relatedConcepts && item.relatedConcepts.length > 0 && (
              <p><strong>{t('hypotheses.related')}:</strong> {item.relatedConcepts.join(', ')}</p>
            )}
            <MiniGraph hypothesis={item} />
          </article>
        ))}
      </div>
    </>
  );
}
