import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const NKG_ROOT = path.resolve(import.meta.dirname, '../..');
const PYTHON = process.env.PYTHON ?? 'python';

test('resolve_refiner_input_path prefers LearningChunkGraph_raw.json', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'refiner-input-'));
  const outDir = path.join(tmp, 'data', 'out');
  await fs.mkdir(outDir, { recursive: true });

  const rawGraph = { nodes: [{ id: 'n1', type: 'Chunk', text: 'test' }], edges: [] };
  await fs.writeFile(path.join(outDir, 'LearningChunkGraph_raw.json'), JSON.stringify(rawGraph));
  await fs.writeFile(path.join(outDir, 'LearningChunkGraph_dedup.json'), JSON.stringify({ nodes: [], edges: [] }));

  const script = `
import sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(NKG_ROOT)})
from src.refiner_longrange import resolve_refiner_input_path
resolved = resolve_refiner_input_path()
assert resolved.name == "LearningChunkGraph_raw.json", resolved
print("ok")
`;

  const result = spawnSync(PYTHON, ['-c', script], {
    cwd: tmp,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ok/);

  await fs.rm(tmp, { recursive: true, force: true });
});
