import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { useEffect, useRef, useCallback } from 'react';
import type { GraphBundle, GraphEdge, GraphNode } from '../api/client';
import {
  EDGE_TYPE_STYLES,
  NODE_TYPE_COLORS,
  mergeNodeColors,
  resolveNodeColor,
} from '../config/ontologyTheme';
import { fixDisplayText, nodeDisplayName } from '../utils/fixDisplayText';
import { edgeTypeLabel } from '../utils/ontologyLabels';

cytoscape.use(coseBilkent);

export interface GraphEdgeSelection {
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  type: string;
  weight: number;
  evidence?: string;
  raw: GraphEdge;
}

export type GraphSelection =
  | { kind: 'node'; data: GraphNode }
  | { kind: 'edge'; data: GraphEdgeSelection }
  | null;

const LAYOUT_CONFIG = {
  name: 'cose-bilkent',
  animate: false,
  randomize: false,
  nodeRepulsion: 6500,
  idealEdgeLength: 140,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.2,
  numIter: 2500,
  tile: true,
  tilingPaddingVertical: 30,
  tilingPaddingHorizontal: 30,
  gravityCompound: 1.0,
  gravityRangeCompound: 1.5,
  initialEnergyOnIncremental: 0.25,
};

function buildStyles(colors: Record<string, string>) {
  const rules: cytoscape.StylesheetStyle[] = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 10,
        color: '#fff',
        'text-outline-width': 1,
        'text-outline-color': '#1a2332',
        width: 'mapData(pagerank, 0, 0.05, 28, 56)',
        height: 'mapData(pagerank, 0, 0.05, 28, 56)',
        'background-color': NODE_TYPE_COLORS.default,
        shape: 'ellipse',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'mapData(weight, 0, 1, 1.5, 4)',
        'line-color': EDGE_TYPE_STYLES.default.color,
        'target-arrow-color': EDGE_TYPE_STYLES.default.color,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        opacity: 0.75,
      },
    },
    { selector: '.hidden', style: { display: 'none' } },
    { selector: '.highlighted', style: { 'border-width': 4, 'border-color': '#4a90d9' } },
    { selector: '.dimmed', style: { opacity: 0.12 } },
    { selector: 'node[?isKpi]', style: { 'border-width': 3, 'border-color': '#f1c40f' } },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#0077C8',
        'overlay-opacity': 0.08,
        'overlay-color': '#0077C8',
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#0077C8',
        'target-arrow-color': '#0077C8',
        width: 4,
        opacity: 1,
      },
    },
  ];

  for (const type of Object.keys(NODE_TYPE_COLORS)) {
    if (type === 'default') continue;
    rules.push({
      selector: `node[type = "${type}"]`,
      style: {
        'background-color': colors[type] ?? resolveNodeColor(type),
      },
    });
  }

  for (const [edgeType, style] of Object.entries(EDGE_TYPE_STYLES)) {
    if (edgeType === 'default') continue;
    rules.push({
      selector: `edge[edgeType = "${edgeType}"]`,
      style: {
        'line-color': style.color,
        'target-arrow-color': style.color,
        'line-style': style.dashed ? 'dashed' : 'solid',
      },
    });
  }

  return rules;
}

function seedNodePositions(cy: cytoscape.Core, container: HTMLElement) {
  const width = container.clientWidth || 1200;
  const height = container.clientHeight || 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const clusters = new Map<number, cytoscape.NodeCollection>();

  cy.nodes().forEach((node) => {
    const clusterId = Number(node.data('clusterId') ?? -1);
    const bucket = clusters.get(clusterId) ?? cy.collection();
    clusters.set(clusterId, bucket.union(node));
  });

  const clusterIds = [...clusters.keys()];
  const clusterRadius = Math.min(width, height) * 0.34;

  clusterIds.forEach((clusterId, clusterIndex) => {
    const members = clusters.get(clusterId)!;
    const angle = (2 * Math.PI * clusterIndex) / Math.max(1, clusterIds.length) - Math.PI / 2;
    const cx = centerX + clusterRadius * Math.cos(angle);
    const cyY = centerY + clusterRadius * Math.sin(angle);
    const memberRadius = 50 + members.length * 4;

    members.forEach((node, index) => {
      const nodeAngle = (2 * Math.PI * index) / Math.max(1, members.length);
      node.position({
        x: cx + memberRadius * Math.cos(nodeAngle),
        y: cyY + memberRadius * Math.sin(nodeAngle),
      });
    });
  });
}

function buildElements(bundle: GraphBundle, lodMax: number) {
  let nodes = bundle.graph.nodes ?? [];
  const edges = bundle.graph.edges ?? [];

  if (nodes.length > lodMax) {
    nodes = [...nodes]
      .sort((a, b) => (b.pagerank ?? 0) - (a.pagerank ?? 0))
      .slice(0, lodMax);
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  const cyNodes = nodes.map((node) => ({
    data: {
      id: node.id,
      label: nodeDisplayName(node),
      type: node.type ?? 'Unknown',
      definition: fixDisplayText(node.definition ?? ''),
      pagerank: node.pagerank ?? 0,
      betweenness: node.betweenness_centrality ?? 0,
      eduImportance: node.educational_importance ?? 0,
      clusterId: node.cluster_id ?? -1,
      isKpi: node.metadata?.is_kpi === true,
      raw: node,
    },
  }));

  const cyEdges = edges
    .filter((edge) => {
      const s = edge.source ?? edge.from ?? '';
      const t = edge.target ?? edge.to ?? '';
      return nodeIds.has(s) && nodeIds.has(t);
    })
    .map((edge, index) => {
      const edgeType = edge.type ?? edge.relationship ?? 'default';
      const source = edge.source ?? edge.from ?? '';
      const target = edge.target ?? edge.to ?? '';
      return {
        data: {
          id: edge.id ?? `e_${index}`,
          source,
          target,
          label: edgeTypeLabel(edgeType),
          edgeType,
          edgeTypeRaw: edgeType,
          weight: edge.weight ?? edge.attributes?.confidence_score ?? 0.5,
          evidence: fixDisplayText(edge.attributes?.evidence_quote ?? ''),
          raw: edge,
        },
      };
    });

  return { elements: [...cyNodes, ...cyEdges] };
}

export function useCytoscapeGraph(
  containerRef: React.RefObject<HTMLDivElement | null>,
  colors: Record<string, string> = NODE_TYPE_COLORS,
  lodMax = 2000,
) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const onSelectRef = useRef<(selection: GraphSelection) => void>(() => {});
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  const destroy = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
  }, []);

  const initGraph = useCallback(
    (bundle: GraphBundle) => {
      if (!containerRef.current) return false;

      destroy();
      const { elements } = buildElements(bundle, lodMax);
      if (elements.length === 0) return false;

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: buildStyles(colorsRef.current),
        layout: { name: 'preset' },
        wheelSensitivity: 0.2,
        minZoom: 0.08,
        maxZoom: 4,
        selectionType: 'single',
        boxSelectionEnabled: false,
      });

      const cy = cyRef.current;
      seedNodePositions(cy, containerRef.current);
      cy.layout(LAYOUT_CONFIG).run();

      cy.on('tap', 'node', (evt) => {
        cy.elements().unselect();
        evt.target.select();
        onSelectRef.current({ kind: 'node', data: evt.target.data('raw') as GraphNode });
      });

      cy.on('tap', 'edge', (evt) => {
        cy.elements().unselect();
        evt.target.select();
        const edge = evt.target;
        onSelectRef.current({
          kind: 'edge',
          data: {
            id: edge.id(),
            source: edge.data('source'),
            target: edge.data('target'),
            sourceLabel: edge.source().data('label'),
            targetLabel: edge.target().data('label'),
            type: edge.data('edgeTypeRaw'),
            weight: edge.data('weight'),
            evidence: edge.data('evidence') || undefined,
            raw: edge.data('raw'),
          },
        });
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          cy.elements().unselect();
          onSelectRef.current(null);
        }
      });

      const fitGraph = () => {
        cy.resize();
        cy.fit(undefined, 80);
      };
      requestAnimationFrame(() => requestAnimationFrame(fitGraph));

      return true;
    },
    [containerRef, destroy, lodMax],
  );

  const updateStyles = useCallback(() => {
    if (!cyRef.current) return;
    cyRef.current.style(buildStyles(colorsRef.current));
  }, []);

  const resizeAndFit = useCallback(() => {
    if (!cyRef.current) return;
    cyRef.current.resize();
    cyRef.current.fit(undefined, 80);
  }, []);

  const clearSelection = useCallback(() => {
    if (!cyRef.current) return;
    cyRef.current.elements().unselect();
    onSelectRef.current(null);
  }, []);

  useEffect(() => () => destroy(), [destroy]);

  const applyViewMode = useCallback((mode: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('hidden dimmed highlighted');
    if (mode === 'all') return;

    const showTypes: Record<string, Set<string>> = {
      materials: new Set(['Material', 'Concept', 'KPI_Target']),
      properties: new Set(['Property', 'KPI_Target']),
      synthesis: new Set(['SynthesisMethod', 'CharacterizationMethod']),
    };
    const allowed = showTypes[mode];
    if (!allowed) return;

    cy.nodes().forEach((node) => {
      if (!allowed.has(node.data('type'))) node.addClass('hidden');
    });
    cy.edges().forEach((edge) => {
      if (edge.source().hasClass('hidden') || edge.target().hasClass('hidden')) {
        edge.addClass('hidden');
      }
    });
  }, []);

  const applyTypeFilter = useCallback((enabled: Set<string>) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('hidden');
    if (enabled.size === 0) return;

    cy.nodes().forEach((node) => {
      if (!enabled.has(node.data('type'))) node.addClass('hidden');
    });
    cy.edges().forEach((edge) => {
      if (edge.source().hasClass('hidden') || edge.target().hasClass('hidden')) {
        edge.addClass('hidden');
      }
    });
  }, []);

  const search = useCallback((query: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const q = query.trim().toLowerCase();
    cy.elements().removeClass('highlighted dimmed');
    if (!q) return;

    cy.elements().addClass('dimmed');
    const matches = cy.nodes().filter((n) => String(n.data('label')).toLowerCase().includes(q));
    matches.removeClass('dimmed').addClass('highlighted');
    matches.connectedEdges().removeClass('dimmed');
    if (matches.length) cy.animate({ fit: { eles: matches, padding: 80 } }, { duration: 400 });
  }, []);

  const setOnSelect = useCallback((fn: (selection: GraphSelection) => void) => {
    onSelectRef.current = fn;
  }, []);

  const getStats = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return { total: 0, visible: 0, edges: 0 };
    return {
      total: cy.nodes().length,
      visible: cy.nodes(':visible').length,
      edges: cy.edges().length,
    };
  }, []);

  return {
    initGraph,
    updateStyles,
    resizeAndFit,
    applyViewMode,
    applyTypeFilter,
    search,
    setOnSelect,
    getStats,
    clearSelection,
    destroy,
  };
}

export { NODE_TYPE_COLORS as DEFAULT_COLORS, EDGE_TYPE_STYLES as EDGE_STYLES, mergeNodeColors };
