import { useTranslation } from 'react-i18next';
import type { GraphSelection } from '../hooks/useCytoscapeGraph';
import { formatNumber } from '../utils/format';
import { nodeDisplayDefinition, nodeDisplayName } from '../utils/fixDisplayText';
import { edgeTypeLabel, nodeTypeLabel } from '../utils/ontologyLabels';

interface Props {
  selection: GraphSelection;
  onClose: () => void;
}

export function GraphInspector({ selection, onClose }: Props) {
  const { t } = useTranslation();

  if (!selection) return null;

  return (
    <aside className="graph-inspector" aria-live="polite">
      <button type="button" className="graph-inspector-close" onClick={onClose} aria-label={t('graph.close_inspector')}>
        ×
      </button>

      {selection.kind === 'node' ? (
        <>
          <h3 className="graph-inspector-title">{nodeDisplayName(selection.data)}</h3>
          <div className="graph-inspector-meta">
            {t('graph.node_type')}: {nodeTypeLabel(selection.data.type)}
          </div>
          <p className="graph-inspector-text">{nodeDisplayDefinition(selection.data) || '—'}</p>
          <div className="graph-inspector-metrics">
            <div>{t('metrics.pagerank')}: {formatNumber(selection.data.pagerank ?? 0)}</div>
            <div>{t('metrics.betweenness')}: {formatNumber(selection.data.betweenness_centrality ?? 0)}</div>
          </div>
        </>
      ) : (
        <>
          <h3 className="graph-inspector-title">{edgeTypeLabel(selection.data.type)}</h3>
          <div className="graph-inspector-meta">{t('graph.edge_type')}</div>
          <div className="graph-inspector-edge-endpoints">
            <div>
              <span className="graph-inspector-label">{t('graph.edge_source')}</span>
              <span>{selection.data.sourceLabel}</span>
            </div>
            <div>
              <span className="graph-inspector-label">{t('graph.edge_target')}</span>
              <span>{selection.data.targetLabel}</span>
            </div>
          </div>
          <div className="graph-inspector-metrics">
            <div>{t('graph.edge_weight')}: {formatNumber(selection.data.weight)}</div>
          </div>
          {selection.data.evidence ? (
            <p className="graph-inspector-text">{selection.data.evidence}</p>
          ) : null}
        </>
      )}
    </aside>
  );
}
