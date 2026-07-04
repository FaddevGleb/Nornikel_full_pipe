import fs from 'node:fs';
import path from 'node:path';
import { getNornikelKgRoot, getVizConfig } from '../../../../config/loader.mjs';

const DEFAULT_NODE_SHAPES = {
  Material: 'round-rectangle',
  Property: 'diamond',
  SynthesisMethod: 'hexagon',
  CharacterizationMethod: 'triangle',
  Mechanism: 'ellipse',
  FailureMode: 'octagon',
  Condition: 'barrel',
  Application: 'vee',
  KPI_Target: 'star',
  Source: 'tag',
  Concept: 'ellipse',
  Chunk: 'rectangle',
  Assessment: 'round-rectangle',
  Equipment: 'barrel',
  BusinessMetric: 'rhomboid',
  Constraint: 'concave-hexagon',
  InternalExperiment: 'cut-rectangle',
  HypothesisRecord: 'round-heptagon',
};

let cachedTheme = null;

function loadOntologyTheme() {
  if (cachedTheme) return cachedTheme;
  const themePath = path.join(getNornikelKgRoot(), 'viz', 'shared', 'ontology_theme.json');
  cachedTheme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  return cachedTheme;
}

function mapNodeShapes(viz) {
  const shapes = viz.node_shapes ?? {};
  return { ...DEFAULT_NODE_SHAPES, ...shapes };
}

function mapNodeColors(viz) {
  const theme = loadOntologyTheme();
  const colors = viz.colors ?? {};
  const merged = { ...theme.nodeColors };
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string' && key in merged) {
      merged[key] = value;
    }
  }
  return merged;
}

export async function loadVizConfig() {
  try {
    const viz = getVizConfig();
    return {
      nodeShapes: mapNodeShapes(viz),
      nodeColors: mapNodeColors(viz),
      visualization: viz.visualization ?? {},
      graph2html: viz.graph2html ?? {},
    };
  } catch {
    const theme = loadOntologyTheme();
    return {
      nodeShapes: DEFAULT_NODE_SHAPES,
      nodeColors: theme.nodeColors,
      visualization: {},
    };
  }
}

export { DEFAULT_NODE_SHAPES };
