import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { StringDecoder } from 'node:string_decoder';
import { configManager } from './configManager.js';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function getFeynmanSettings() {
  return configManager.settings?.feynman ?? {};
}

export function getFeynmanEnrichmentSettings() {
  return configManager.settings?.feynmanEnrichment ?? {};
}

export function getFeynmanRoot() {
  const relative = getFeynmanSettings().root ?? '../feynman';
  return path.resolve(configManager.getProjectRoot(), relative);
}

export function getFeynmanBinPath() {
  return path.join(getFeynmanRoot(), 'bin', 'feynman.js');
}

export function getFeynmanAgentDir() {
  const feynmanHome = path.resolve(process.env.FEYNMAN_HOME ?? os.homedir(), '.feynman');
  return path.join(feynmanHome, 'agent');
}

export function getFeynmanCwd() {
  const relative = getFeynmanSettings().cwd ?? '..';
  return path.resolve(configManager.getProjectRoot(), relative);
}

export function getIdleTimeoutMs() {
  return getFeynmanSettings().idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
}

export function getFeynmanModel() {
  return getFeynmanSettings().model || '';
}

export function getEnrichmentTimeoutMs() {
  return getFeynmanEnrichmentSettings().timeoutMs ?? getIdleTimeoutMs();
}

let trustEnsured = false;

export async function ensureWorkspaceTrusted() {
  if (trustEnsured) return;
  try {
    const entryPath = path.join(getFeynmanRoot(), 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist', 'index.js');
    const { ProjectTrustStore } = await import(pathToFileURL(entryPath).href);
    const store = new ProjectTrustStore(getFeynmanAgentDir());
    store.set(getFeynmanCwd(), true);
    trustEnsured = true;
  } catch (error) {
    console.warn(`[feynmanShared] could not pre-trust workspace: ${error.message}`);
  }
}

/**
 * Reads JSONL (one JSON object per LF-delimited line) from a stream.
 */
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
