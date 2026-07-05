import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  findBestGraphArtifact,
  GRAPH_CANDIDATES,
} from '../server/services/graphSyncService.js';

test('findBestGraphArtifact prefers longrange over dedup over raw', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'graph-sync-'));
  try {
    await fs.writeFile(path.join(tmp, 'LearningChunkGraph_raw.json'), '{"nodes":[],"edges":[]}');
    await fs.writeFile(path.join(tmp, 'LearningChunkGraph_dedup.json'), '{"nodes":[],"edges":[]}');
    await fs.writeFile(path.join(tmp, 'LearningChunkGraph_longrange.json'), '{"nodes":[],"edges":[]}');

    const best = await findBestGraphArtifact(tmp);
    assert.equal(best.name, 'LearningChunkGraph_longrange.json');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('findBestGraphArtifact uses raw when only graph stage has run', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'graph-sync-raw-'));
  try {
    await fs.writeFile(path.join(tmp, 'LearningChunkGraph_raw.json'), '{"nodes":[],"edges":[]}');

    const best = await findBestGraphArtifact(tmp);
    assert.equal(best.name, 'LearningChunkGraph_raw.json');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('findBestGraphArtifact returns null when data/out is empty', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'graph-sync-empty-'));
  try {
    const best = await findBestGraphArtifact(tmp);
    assert.equal(best, null);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('GRAPH_CANDIDATES order is longrange, dedup legacy, raw', () => {
  assert.deepEqual(GRAPH_CANDIDATES, [
    'LearningChunkGraph_longrange.json',
    'LearningChunkGraph_dedup.json',
    'LearningChunkGraph_raw.json',
  ]);
});
