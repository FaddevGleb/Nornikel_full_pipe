import { configManager } from './configManager.js';
import { readJsonFile } from '../utils/readJson.js';
import { sanitizeGraphBundle } from '../../shared/fixDisplayText.js';
import {
  findBestGraphArtifact,
  getArtifactTimestamps,
  isDataOutNewerThanViz,
  isWowStale,
  syncDataOutToVizIn,
  fileExists,
} from './graphSyncService.js';

function countNodeTypes(nodes) {
  const counts = {};
  for (const node of nodes ?? []) {
    const type = node.type ?? 'Unknown';
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

function buildLoadStatus({
  graphPath,
  conceptsPath,
  source,
  graph,
  concepts,
  warnings,
  syncedAt,
  graphModifiedAt,
  isStale,
}) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  return {
    graphPath,
    conceptsPath,
    source,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypes: countNodeTypes(nodes),
    hasChunkNodes: nodes.some((n) => n.type === 'Chunk'),
    hasAssessmentNodes: nodes.some((n) => n.type === 'Assessment'),
    warnings,
    syncedAt: syncedAt ?? null,
    graphModifiedAt: graphModifiedAt ?? null,
    isStale: isStale ?? false,
  };
}

/**
 * Load graph + concepts with freshness-aware sync from data/out.
 */
export async function loadGraphBundle({ autoSync = true } = {}) {
  const wowGraph = configManager.resolveProjectPath('viz/data/out/LearningChunkGraph_wow.json');
  const wowConcepts = configManager.resolveProjectPath('viz/data/out/ConceptDictionary_wow.json');
  const fallbackGraph = configManager.resolveProjectPath('viz/data/in/LearningChunkGraph.json');
  const fallbackConcepts = configManager.resolveProjectPath('viz/data/in/ConceptDictionary.json');
  const testGraph = configManager.resolveProjectPath('viz/data/test/tiny_html_data.json');
  const testConcepts = configManager.resolveProjectPath('viz/data/test/tiny_html_concepts.json');

  let syncedAt = null;
  if (autoSync && (await isDataOutNewerThanViz())) {
    const syncResult = await syncDataOutToVizIn({ merge: true });
    if (syncResult.synced) {
      syncedAt = syncResult.syncedAt;
    }
  }

  const { timestamps } = await getArtifactTimestamps();
  const graphModifiedAt = timestamps.dataOutGraph
    ? new Date(timestamps.dataOutGraph).toISOString()
    : null;

  const warnings = [];
  const wowGraphExists = await fileExists(wowGraph);
  const wowConceptsExists = await fileExists(wowConcepts);
  const wowStale = await isWowStale();

  if (wowGraphExists && wowConceptsExists && !wowStale) {
    const [graph, concepts] = await Promise.all([
      readJsonFile(wowGraph),
      readJsonFile(wowConcepts),
    ]);
    if ((graph.nodes ?? []).length === 0) {
      warnings.push('empty_wow_graph');
    }
    const missingMetrics = (graph.nodes ?? []).some(
      (n) => n.pagerank === undefined && n.cluster_id === undefined,
    );
    if (missingMetrics) {
      warnings.push('missing_metrics');
    }
    return sanitizeGraphBundle({
      graph,
      concepts,
      loadStatus: buildLoadStatus({
        graphPath: wowGraph,
        conceptsPath: wowConcepts,
        source: 'wow',
        graph,
        concepts,
        warnings,
        syncedAt,
        graphModifiedAt,
        isStale: false,
      }),
    });
  }

  if (wowStale) {
    warnings.push('stale_wow_overridden');
  }
  if (wowGraphExists && !wowConceptsExists) {
    warnings.push('wow_concepts_missing');
  }
  if (!wowGraphExists && wowConceptsExists) {
    warnings.push('wow_graph_missing');
  }
  if (!wowGraphExists) {
    warnings.push('missing_wow_files');
  }

  const inGraphExists = await fileExists(fallbackGraph);
  const inConceptsExists = await fileExists(fallbackConcepts);
  if (inGraphExists && inConceptsExists) {
    warnings.push('fallback_to_in_data');
    const [graph, concepts] = await Promise.all([
      readJsonFile(fallbackGraph),
      readJsonFile(fallbackConcepts),
    ]);
    return sanitizeGraphBundle({
      graph,
      concepts,
      loadStatus: buildLoadStatus({
        graphPath: fallbackGraph,
        conceptsPath: fallbackConcepts,
        source: 'in',
        graph,
        concepts,
        warnings,
        syncedAt,
        graphModifiedAt,
        isStale: wowStale,
      }),
    });
  }

  const outDir = configManager.resolveProjectPath('data/out');
  const best = await findBestGraphArtifact(outDir);
  const outConcepts = configManager.resolveProjectPath('data/out/ConceptDictionary.json');
  if (best && (await fileExists(outConcepts))) {
    warnings.push('fallback_to_data_out');
    const [graph, concepts] = await Promise.all([
      readJsonFile(best.path),
      readJsonFile(outConcepts),
    ]);
    return sanitizeGraphBundle({
      graph,
      concepts,
      loadStatus: buildLoadStatus({
        graphPath: best.path,
        conceptsPath: outConcepts,
        source: 'out',
        graph,
        concepts,
        warnings,
        syncedAt,
        graphModifiedAt,
        isStale: true,
      }),
    });
  }

  warnings.push('fallback_to_test_data');
  const [graph, concepts] = await Promise.all([
    readJsonFile(testGraph),
    readJsonFile(testConcepts),
  ]);
  return sanitizeGraphBundle({
    graph,
    concepts,
    loadStatus: buildLoadStatus({
      graphPath: testGraph,
      conceptsPath: testConcepts,
      source: 'test',
      graph,
      concepts,
      warnings,
      syncedAt,
      graphModifiedAt,
      isStale: true,
    }),
  });
}

export { countNodeTypes, fileExists };
