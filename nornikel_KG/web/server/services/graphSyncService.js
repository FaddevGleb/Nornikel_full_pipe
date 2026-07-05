import fs from 'node:fs/promises';
import path from 'node:path';
import { configManager } from './configManager.js';
import { parseJsonText } from '../utils/readJson.js';

export const GRAPH_CANDIDATES = [
  'LearningChunkGraph_longrange.json',
  'LearningChunkGraph_dedup.json',
  'LearningChunkGraph_raw.json',
];

const WOW_GRAPH = 'viz/data/out/LearningChunkGraph_wow.json';
const WOW_CONCEPTS = 'viz/data/out/ConceptDictionary_wow.json';
const VIZ_IN_GRAPH = 'viz/data/in/LearningChunkGraph.json';
const VIZ_IN_CONCEPTS = 'viz/data/in/ConceptDictionary.json';
const OUT_CONCEPTS = 'data/out/ConceptDictionary.json';

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getMtime(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Pick the best graph artifact from data/out (longrange > dedup legacy > raw).
 */
export async function findBestGraphArtifact(outDir = configManager.resolveProjectPath('data/out')) {
  for (const candidate of GRAPH_CANDIDATES) {
    const candidatePath = path.join(outDir, candidate);
    if (await fileExists(candidatePath)) {
      return { path: candidatePath, name: candidate };
    }
  }
  return null;
}

/**
 * Return mtime map for graph-related artifacts.
 */
export async function getArtifactTimestamps() {
  const outDir = configManager.resolveProjectPath('data/out');
  const best = await findBestGraphArtifact(outDir);

  const paths = {
    dataOutGraph: best?.path ?? null,
    dataOutConcepts: configManager.resolveProjectPath(OUT_CONCEPTS),
    vizInGraph: configManager.resolveProjectPath(VIZ_IN_GRAPH),
    vizInConcepts: configManager.resolveProjectPath(VIZ_IN_CONCEPTS),
    wowGraph: configManager.resolveProjectPath(WOW_GRAPH),
    wowConcepts: configManager.resolveProjectPath(WOW_CONCEPTS),
  };

  const timestamps = {};
  for (const [key, filePath] of Object.entries(paths)) {
    timestamps[key] = filePath ? await getMtime(filePath) : null;
  }
  return { paths, timestamps };
}

/**
 * True when data/out graph is newer than viz/in or wow artifacts.
 */
export async function isDataOutNewerThanViz() {
  const { paths, timestamps } = await getArtifactTimestamps();
  const outGraphMtime = timestamps.dataOutGraph;
  if (outGraphMtime == null) return false;

  const compareTargets = [
    timestamps.vizInGraph,
    timestamps.wowGraph,
  ].filter((value) => value != null);

  if (compareTargets.length === 0) return true;
  return compareTargets.some((mtime) => outGraphMtime > mtime);
}

/**
 * True when wow pair exists but is older than the best data/out graph.
 */
export async function isWowStale() {
  const { timestamps } = await getArtifactTimestamps();
  const outGraphMtime = timestamps.dataOutGraph;
  const wowGraphMtime = timestamps.wowGraph;
  if (outGraphMtime == null || wowGraphMtime == null) return false;
  return outGraphMtime > wowGraphMtime;
}

/**
 * Remove stale _wow.json files when data/out has been updated.
 */
export async function invalidateWowIfStale() {
  if (!(await isWowStale())) {
    return { invalidated: false };
  }

  const wowGraph = configManager.resolveProjectPath(WOW_GRAPH);
  const wowConcepts = configManager.resolveProjectPath(WOW_CONCEPTS);
  const removed = [];

  for (const filePath of [wowGraph, wowConcepts]) {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
      removed.push(filePath);
    }
  }

  return { invalidated: true, removed };
}

async function mergeGraphFiles(newGraphPath, targetPath, onLog = () => {}) {
  const newRaw = await fs.readFile(newGraphPath, 'utf-8');
  const newData = parseJsonText(newRaw);
  const newNodes = newData.nodes || [];
  const newEdges = newData.edges || [];
  const newMeta = newData._meta || {};

  let existingNodes = [];
  let existingEdges = [];
  let existingMeta = {};

  try {
    const existingRaw = await fs.readFile(targetPath, 'utf-8');
    const existingData = parseJsonText(existingRaw);
    existingNodes = existingData.nodes || [];
    existingEdges = existingData.edges || [];
    existingMeta = existingData._meta || {};
  } catch {
    // target does not exist yet
  }

  const nodeMap = new Map();
  for (const node of existingNodes) {
    nodeMap.set(node.id, node);
  }
  let nodesAdded = 0;
  let nodesUpdated = 0;
  for (const node of newNodes) {
    if (nodeMap.has(node.id)) {
      nodesUpdated += 1;
    } else {
      nodesAdded += 1;
    }
    nodeMap.set(node.id, node);
  }
  const mergedNodes = Array.from(nodeMap.values());

  const edgeMap = new Map();
  for (const edge of existingEdges) {
    const key = `${edge.source}|${edge.target}|${edge.type}`;
    edgeMap.set(key, edge);
  }
  let edgesAdded = 0;
  let edgesUpdated = 0;
  for (const edge of newEdges) {
    const key = `${edge.source}|${edge.target}|${edge.type}`;
    if (edgeMap.has(key)) {
      edgesUpdated += 1;
    } else {
      edgesAdded += 1;
    }
    edgeMap.set(key, edge);
  }
  const mergedEdges = Array.from(edgeMap.values());

  const mergeHistory = existingMeta._merge_history || [];
  mergeHistory.push({
    timestamp: new Date().toISOString(),
    source: path.basename(newGraphPath),
    nodes_added: nodesAdded,
    nodes_updated: nodesUpdated,
    edges_added: edgesAdded,
    edges_updated: edgesUpdated,
    total_nodes: mergedNodes.length,
    total_edges: mergedEdges.length,
  });

  const mergedData = {
    _meta: {
      ...existingMeta,
      ...newMeta,
      _merge_history: mergeHistory,
      _merged_at: new Date().toISOString(),
      _total_sources: mergeHistory.length,
    },
    nodes: mergedNodes,
    edges: mergedEdges,
  };

  await fs.writeFile(targetPath, JSON.stringify(mergedData, null, 2), 'utf-8');

  onLog({
    level: 'info',
    message:
      `Graph merge stats: +${nodesAdded} nodes, ~${nodesUpdated} updated, ` +
      `+${edgesAdded} edges, ~${edgesUpdated} updated → ` +
      `${mergedNodes.length} nodes, ${mergedEdges.length} edges total`,
  });

  return {
    graphSource: newGraphPath,
    nodesAdded,
    nodesUpdated,
    edgesAdded,
    edgesUpdated,
    totalNodes: mergedNodes.length,
    totalEdges: mergedEdges.length,
  };
}

async function mergeConceptFiles(newConceptsPath, targetPath, onLog = () => {}) {
  const newRaw = await fs.readFile(newConceptsPath, 'utf-8');
  const newData = parseJsonText(newRaw);
  const newConcepts = newData.concepts || [];
  const newMeta = newData._meta || {};

  let existingConcepts = [];
  let existingMeta = {};

  try {
    const existingRaw = await fs.readFile(targetPath, 'utf-8');
    const existingData = parseJsonText(existingRaw);
    existingConcepts = existingData.concepts || [];
    existingMeta = existingData._meta || {};
  } catch {
    // target does not exist yet
  }

  const conceptMap = new Map();
  for (const concept of existingConcepts) {
    conceptMap.set(concept.concept_id, concept);
  }
  let added = 0;
  let updated = 0;
  for (const concept of newConcepts) {
    if (conceptMap.has(concept.concept_id)) {
      updated += 1;
    } else {
      added += 1;
    }
    conceptMap.set(concept.concept_id, concept);
  }
  const mergedConcepts = Array.from(conceptMap.values());

  const mergeHistory = existingMeta._merge_history || [];
  mergeHistory.push({
    timestamp: new Date().toISOString(),
    source: path.basename(newConceptsPath),
    concepts_added: added,
    concepts_updated: updated,
    total_concepts: mergedConcepts.length,
  });

  const mergedData = {
    _meta: {
      ...existingMeta,
      ...newMeta,
      _merge_history: mergeHistory,
      _merged_at: new Date().toISOString(),
    },
    concepts: mergedConcepts,
  };

  await fs.writeFile(targetPath, JSON.stringify(mergedData, null, 2), 'utf-8');

  onLog({
    level: 'info',
    message:
      `Concepts merge stats: +${added} new, ~${updated} updated → ` +
      `${mergedConcepts.length} concepts total`,
  });

  return { conceptsSource: newConceptsPath, added, updated, totalConcepts: mergedConcepts.length };
}

/**
 * Sync data/out graph + concepts into viz/data/in (with optional merge).
 */
export async function syncDataOutToVizIn({ merge = true, force = false, onLog = () => {} } = {}) {
  const outDir = configManager.resolveProjectPath('data/out');
  const vizInDir = configManager.resolveProjectPath('viz/data/in');
  await fs.mkdir(vizInDir, { recursive: true });

  const shouldSync = force || (await isDataOutNewerThanViz());
  if (!shouldSync) {
    const best = await findBestGraphArtifact(outDir);
    if (!best) {
      return { synced: false, reason: 'no_graph_in_data_out' };
    }
    const vizGraphExists = await fileExists(configManager.resolveProjectPath(VIZ_IN_GRAPH));
    if (!vizGraphExists) {
      // fall through to sync even if not newer
    } else {
      return { synced: false, reason: 'already_up_to_date' };
    }
  }

  await invalidateWowIfStale();

  const best = await findBestGraphArtifact(outDir);
  const result = {
    synced: false,
    syncedAt: new Date().toISOString(),
    graph: null,
    concepts: null,
  };

  if (best) {
    const vizGraphPath = configManager.resolveProjectPath(VIZ_IN_GRAPH);
    if (merge) {
      result.graph = await mergeGraphFiles(best.path, vizGraphPath, onLog);
    } else {
      await fs.copyFile(best.path, vizGraphPath);
      result.graph = { graphSource: best.path, copied: true };
    }
    onLog({
      level: 'info',
      message: `Graph synced: ${path.basename(best.path)} → viz/data/in/LearningChunkGraph.json`,
    });
    result.synced = true;
  }

  const conceptSource = configManager.resolveProjectPath(OUT_CONCEPTS);
  if (await fileExists(conceptSource)) {
    const vizConceptsPath = configManager.resolveProjectPath(VIZ_IN_CONCEPTS);
    if (merge) {
      result.concepts = await mergeConceptFiles(conceptSource, vizConceptsPath, onLog);
    } else {
      await fs.copyFile(conceptSource, vizConceptsPath);
      result.concepts = { conceptsSource: conceptSource, copied: true };
    }
    onLog({
      level: 'info',
      message: 'Concepts synced → viz/data/in/ConceptDictionary.json',
    });
    result.synced = true;
  } else {
    onLog({
      level: 'warn',
      message: 'ConceptDictionary.json not found in data/out',
    });
  }

  const { timestamps } = await getArtifactTimestamps();
  result.graphModifiedAt = timestamps.dataOutGraph
    ? new Date(timestamps.dataOutGraph).toISOString()
    : null;

  return result;
}

export { fileExists };
