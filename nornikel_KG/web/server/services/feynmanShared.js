import { getFeynmanConfig, getWebConfig, getNornikelKgRoot, getWorkspaceRoot } from '../../../../config/loader.mjs';
import path from 'node:path';
import os from 'node:os';
import { accessSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { StringDecoder } from 'node:string_decoder';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function getFeynmanSettings() {
  return getFeynmanConfig();
}

export function getFeynmanEnrichmentSettings() {
  const web = getWebConfig();
  return web.feynmanEnrichment ?? getFeynmanConfig().enrichment ?? {};
}

export function getFeynmanRoot() {
  const feynman = getFeynmanConfig();
  if (feynman.root) return feynman.root;
  const config = getFeynmanConfig();
  return path.join(getWorkspaceRoot(), 'Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/feynman');
}

export function getFeynmanBinPath() {
  return path.join(getFeynmanRoot(), 'bin', 'feynman.js');
}

export function getFeynmanAgentDir() {
  const feynmanHome = path.resolve(process.env.FEYNMAN_HOME ?? os.homedir(), '.feynman');
  return path.join(feynmanHome, 'agent');
}

export function getFeynmanCwd() {
  const feynman = getFeynmanConfig();
  if (feynman.cwd) return feynman.cwd;
  return path.dirname(getNornikelKgRoot());
}

export function getIdleTimeoutMs() {
  const feynman = getFeynmanConfig();
  return feynman.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
}

export function getFeynmanModel() {
  const feynman = getFeynmanConfig();
  return feynman.model || '';
}

export function getFeynmanSpawnEnv() {
  const feynman = getFeynmanConfig();
  const env = { ...process.env };
  const extra = feynman.env ?? {};
  for (const [key, value] of Object.entries(extra)) {
    if (value != null) env[key] = String(value);
  }
  return env;
}

export function getEnrichmentTimeoutMs() {
  return getFeynmanEnrichmentSettings().timeoutMs ?? getIdleTimeoutMs();
}

let trustEnsured = false;

function resolvePiCodingAgentEntry() {
  const feynmanRoot = getFeynmanRoot();
  const candidates = [
    path.join(feynmanRoot, 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist', 'index.js'),
    path.join(feynmanRoot, 'node_modules', '@mariozechner', 'pi-coding-agent', 'dist', 'index.js'),
    path.join(feynmanRoot, '.feynman', 'npm', 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist', 'index.js'),
    path.join(feynmanRoot, '.feynman', 'npm', 'node_modules', '@mariozechner', 'pi-coding-agent', 'dist', 'index.js'),
  ];
  for (const candidate of candidates) {
    try {
      accessSync(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function ensureWorkspaceTrusted() {
  if (trustEnsured) return;
  try {
    const entryPath = resolvePiCodingAgentEntry();
    if (!entryPath) {
      throw new Error(
        `pi-coding-agent not found under ${getFeynmanRoot()}. Run: cd feynman && npm ci && npm run build`,
      );
    }
    const { ProjectTrustStore } = await import(pathToFileURL(entryPath).href);
    const store = new ProjectTrustStore(getFeynmanAgentDir());
    store.set(getFeynmanCwd(), true);
    trustEnsured = true;
  } catch (error) {
    console.warn(`[feynmanShared] could not pre-trust workspace: ${error.message}`);
  }
}

export function attachJsonlReader(stream, onLine) {
  const decoder = new StringDecoder('utf8');
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += typeof chunk === 'string' ? chunk : decoder.write(chunk);
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      onLine(line);
    }
  });

  stream.on('end', () => {
    buffer += decoder.end();
    if (buffer.length > 0) {
      onLine(buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer);
    }
  });
}
