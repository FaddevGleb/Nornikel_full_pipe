import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findWorkspaceRoot,
  getProviderForMode,
  getVizConfig,
  getWebConfig,
  loadProjectConfig,
} from '../../../config/loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.resolve(__dirname, '../../..');

test('findWorkspaceRoot resolves NORNIKEL workspace', () => {
  process.env.NORNIKEL_PROJECT_ROOT = WORKSPACE;
  const root = findWorkspaceRoot();
  assert.equal(root, WORKSPACE);
});

test('loadProjectConfig exposes kg and viz sections', () => {
  process.env.NORNIKEL_PROJECT_ROOT = WORKSPACE;
  const config = loadProjectConfig(true);
  assert.equal(config.meta?.version, 1);
  assert.ok(config.kg?.slicer);
  assert.ok(config.viz?.graph2metrics);
  assert.ok(config.paths?.nornikel_kg);
});

test('getWebConfig returns mode and providers', () => {
  process.env.NORNIKEL_PROJECT_ROOT = WORKSPACE;
  loadProjectConfig(true);
  const web = getWebConfig();
  assert.ok(['online', 'offline'].includes(web.mode));
  assert.ok(web.providers?.online);
});

test('getProviderForMode maps online/offline', () => {
  process.env.NORNIKEL_PROJECT_ROOT = WORKSPACE;
  loadProjectConfig(true);
  assert.equal(typeof getProviderForMode('online'), 'string');
  assert.equal(typeof getProviderForMode('offline'), 'string');
});

test('getVizConfig includes colors and graph2html', () => {
  process.env.NORNIKEL_PROJECT_ROOT = WORKSPACE;
  loadProjectConfig(true);
  const viz = getVizConfig();
  assert.ok(viz.colors);
  assert.ok(viz.graph2html);
});
