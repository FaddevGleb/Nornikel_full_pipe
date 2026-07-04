import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type GraphBundle } from '../api/client';
import { useGraphRefresh } from '../context/GraphRefreshContext';
import { mergeNodeColors, resolveEdgeStyle, resolveNodeColor } from '../config/ontologyTheme';
import { useCytoscapeGraph, type GraphSelection } from '../hooks/useCytoscapeGraph';
import { sanitizeGraphBundle } from '../utils/fixDisplayText';
import { edgeTypeLabel, nodeTypeLabel } from '../utils/ontologyLabels';
import { GraphInspector } from './GraphInspector';
import { PageHeader } from './PageHeader';
import { Button, Spinner } from './ui';

interface Props {
  active: boolean;
}

export function GraphView({ active }: Props) {
  const { t } = useTranslation();
  const { revision, refreshGraph } = useGraphRefresh();
  const containerRef = useRef<HTMLDivElement>(null);
  const [bundle, setBundle] = useState<GraphBundle | null>(null);
  const [selection, setSelection] = useState<GraphSelection>(null);
  const [viewMode, setViewMode] = useState('all');
  const [search, setSearch] = useState('');
  const [vizConfig, setVizConfig] = useState<{ nodeColors: Record<string, string> } | null>(null);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, visible: 0, edges: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [graphReady, setGraphReady] = useState(false);

  const colors = mergeNodeColors(vizConfig?.nodeColors);

  const {
    initGraph,
    updateStyles,
    resizeAndFit,
    applyViewMode,
    applyTypeFilter,
    search: doSearch,
    setOnSelect,
    getStats,
    clearSelection,
    destroy,
  } = useCytoscapeGraph(containerRef, colors);

  useEffect(() => {
    setOnSelect(setSelection);
  }, [setOnSelect]);

  useEffect(() => {
    if (!active) return;
    setLoadError(null);
    setLoading(true);
    Promise.all([api.getGraph(), api.getVizConfig()])
      .then(([graphBundle, viz]) => {
        setBundle(sanitizeGraphBundle(graphBundle));
        setVizConfig(viz);
        setEnabledTypes(new Set(Object.keys(graphBundle.loadStatus.nodeTypes)));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'load_failed'))
      .finally(() => setLoading(false));
  }, [active, revision]);

  async function handleRefresh() {
    setRefreshing(true);
    setLoadError(null);
    try {
      await refreshGraph(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!active || !bundle) return;

    const timer = window.setTimeout(() => {
      const ok = initGraph(bundle);
      setGraphReady(ok);
      setStats(getStats());
      if (!ok && (bundle.loadStatus.nodeCount ?? 0) > 0) {
        setLoadError('cytoscape_init_failed');
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [active, bundle, initGraph, getStats]);

  useEffect(() => {
    if (graphReady) updateStyles();
  }, [graphReady, colors, updateStyles]);

  useEffect(() => {
    if (!active || !graphReady) return;
    const onResize = () => resizeAndFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, graphReady, resizeAndFit]);

  useEffect(() => {
    if (!active) {
      destroy();
      setSelection(null);
    }
  }, [active, destroy]);

  useEffect(() => {
    applyViewMode(viewMode);
    setStats(getStats());
  }, [viewMode, applyViewMode, getStats]);

  useEffect(() => {
    if (enabledTypes.size) applyTypeFilter(enabledTypes);
    setStats(getStats());
  }, [enabledTypes, applyTypeFilter, getStats]);

  useEffect(() => {
    doSearch(search);
  }, [search, doSearch]);

  const loadStatus = bundle?.loadStatus;
  const shortPath = loadStatus?.graphPath?.split(/[/\\]/).slice(-3).join('/') ?? '';

  const nodeTypesSorted = Object.keys(loadStatus?.nodeTypes ?? {}).sort((a, b) =>
    nodeTypeLabel(a).localeCompare(nodeTypeLabel(b), 'ru'),
  );

  const edgeTypeCounts = (bundle?.graph.edges ?? []).reduce<Record<string, number>>((acc, edge) => {
    const type = edge.type ?? edge.relationship ?? 'default';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const edgeTypesSorted = Object.keys(edgeTypeCounts).sort((a, b) =>
    edgeTypeLabel(a).localeCompare(edgeTypeLabel(b), 'ru'),
  );

  function handleCloseInspector() {
    setSelection(null);
    clearSelection();
  }

  return (
    <div className="graph-view">
      <PageHeader title={t('graph.title')} description={t('graph.page_desc')} />

      {loadError && (
        <div className="status-banner warn">{t('errors.load_graph')}: {loadError}</div>
      )}

      {loading && <Spinner />}

      <div className="graph-layout">
        <aside className="graph-sidebar">
          <h3>{t('graph.view_mode')}</h3>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="graph-select" aria-label={t('graph.view_mode')}>
            <option value="all">{t('graph.view_all')}</option>
            <option value="materials">{t('graph.view_materials')}</option>
            <option value="properties">{t('graph.view_properties')}</option>
            <option value="synthesis">{t('graph.view_synthesis')}</option>
          </select>

          <h3>{t('graph.node_legend')}</h3>
          <ul className="node-legend type-filters">
            {nodeTypesSorted.map((type) => (
              <li key={type}>
                <label className="type-filter">
                  <input
                    type="checkbox"
                    checked={enabledTypes.has(type)}
                    onChange={(e) => {
                      const next = new Set(enabledTypes);
                      if (e.target.checked) next.add(type);
                      else next.delete(type);
                      setEnabledTypes(next);
                    }}
                  />
                  <span className="type-swatch" style={{ background: resolveNodeColor(type) }} />
                  <span className="legend-label">{nodeTypeLabel(type)}</span>
                  <span className="legend-count">{loadStatus?.nodeTypes[type] ?? 0}</span>
                </label>
              </li>
            ))}
          </ul>

          {edgeTypesSorted.length > 0 && (
            <>
              <h3>{t('graph.edge_legend')}</h3>
              <ul className="edge-legend">
                {edgeTypesSorted.map((type) => {
                  const style = resolveEdgeStyle(type);
                  return (
                    <li key={type}>
                      <span className={`edge-sample${style.dashed ? ' dashed' : ''}`} style={{ borderColor: style.color }} />
                      <span className="legend-label">{edgeTypeLabel(type)}</span>
                      <span className="legend-count">{edgeTypeCounts[type]}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <p className="hint graph-sidebar-hint">{t('graph.select_element_hint')}</p>
        </aside>

        <div className="graph-main">
          {loadStatus && (
            <div className={`status-banner ${loadStatus.nodeCount === 0 ? 'warn' : 'ok'}`}>
              {loadStatus.nodeCount === 0
                ? t('graph.empty_graph')
                : t('graph.loaded_from', { count: loadStatus.nodeCount, path: shortPath })}
              {loadStatus.warnings?.includes('missing_wow_files') && (
                <Button variant="secondary" className="btn-inline" onClick={() => api.runStage('metrics')}>
                  {t('graph.run_metrics')}
                </Button>
              )}
              {loadStatus.source === 'out' && (
                <span className="hint-inline"> {t('graph.fallback_out')}</span>
              )}
              {loadStatus.isStale && loadStatus.source !== 'out' && (
                <span className="hint-inline"> {t('graph.metrics_pending')}</span>
              )}
            </div>
          )}
          <div className="graph-toolbar">
            <Button variant="secondary" onClick={handleRefresh} disabled={refreshing || loading}>
              {refreshing ? t('graph.refreshing') : t('graph.refresh')}
            </Button>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('graph.search_placeholder')}
              className="graph-search"
              aria-label={t('graph.search_placeholder')}
            />
            <span className="graph-stats">
              {t('graph.stats', { visible: stats.visible, total: stats.total, edges: stats.edges })}
            </span>
          </div>
          <div className="graph-canvas-wrap">
            <div ref={containerRef} className="cy-container" />
            <GraphInspector selection={selection} onClose={handleCloseInspector} />
          </div>
        </div>
      </div>
    </div>
  );
}
