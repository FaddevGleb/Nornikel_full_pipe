import { getFeynmanConfig, getWebConfig, getNornikelKgRoot, getWorkspaceRoot, decodeSecret } from '../../../../config/loader.mjs';
import path from 'node:path';
import os from 'node:os';
import { accessSync, chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { StringDecoder } from 'node:string_decoder';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ROUTERAI_PROVIDER_ID = 'routerai';
const DEFAULT_ROUTERAI_BASE_URL = 'https://routerai.ru/api/v1';
const FEYNMAN_KNOWN_PROVIDERS = new Set([
  ROUTERAI_PROVIDER_ID,
  'openrouter',
  'yandex-ai-studio',
  'litellm',
  'lm-studio',
]);

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

export function getFeynmanBaseUrl() {
  const feynman = getFeynmanConfig();
  return feynman.base_url ?? feynman.routerai_base_url ?? DEFAULT_ROUTERAI_BASE_URL;
}

function parseFeynmanModelSpec(model) {
  const trimmed = String(model ?? '').trim();
  if (!trimmed) {
    return { provider: ROUTERAI_PROVIDER_ID, modelId: 'qwen/qwen3.6-flash' };
  }
  const slash = trimmed.indexOf('/');
  if (slash === -1) {
    return { provider: ROUTERAI_PROVIDER_ID, modelId: trimmed };
  }
  const prefix = trimmed.slice(0, slash);
  if (FEYNMAN_KNOWN_PROVIDERS.has(prefix)) {
    return { provider: prefix, modelId: trimmed.slice(slash + 1) };
  }
  return { provider: ROUTERAI_PROVIDER_ID, modelId: trimmed };
}

export function getFeynmanModel() {
  const { provider, modelId } = parseFeynmanModelSpec(getFeynmanConfig().model);
  return `${provider}/${modelId}`;
}

function upsertModelsJsonProvider(modelsJsonPath, providerId, patch) {
  let value = { providers: {} };
  if (existsSync(modelsJsonPath)) {
    try {
      const raw = readFileSync(modelsJsonPath, 'utf8').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') value = parsed;
      }
    } catch {
      // overwrite broken models.json on next write
    }
  }

  const providers = value.providers && typeof value.providers === 'object' ? { ...value.providers } : {};
  const current = providers[providerId] && typeof providers[providerId] === 'object'
    ? { ...providers[providerId] }
    : {};
  providers[providerId] = { ...current, ...patch };
  const next = { ...value, providers };

  mkdirSync(path.dirname(modelsJsonPath), { recursive: true });
  writeFileSync(modelsJsonPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  try {
    chmodSync(modelsJsonPath, 0o600);
  } catch {
    // best-effort
  }
}

function resolveFeynmanRouterAiApiKey() {
  const feynman = getFeynmanConfig();
  const fromConfig = feynman.env?.ROUTERAI_API_KEY;
  if (fromConfig != null && String(fromConfig).trim()) {
    return decodeSecret(fromConfig);
  }
  return process.env.ROUTERAI_API_KEY ?? '';
}

export function ensureRouterAiProvider() {
  const { modelId } = parseFeynmanModelSpec(getFeynmanConfig().model);
  const modelsJsonPath = path.join(getFeynmanAgentDir(), 'models.json');
  const apiKey = resolveFeynmanRouterAiApiKey();
  upsertModelsJsonProvider(modelsJsonPath, ROUTERAI_PROVIDER_ID, {
    baseUrl: getFeynmanBaseUrl(),
    apiKey: apiKey || 'ROUTERAI_API_KEY',
    api: 'openai-completions',
    authHeader: true,
    models: [{ id: modelId }],
  });
}

export function getFeynmanSpawnEnv() {
  const feynman = getFeynmanConfig();
  const env = { ...process.env };
  const extra = feynman.env ?? {};
  for (const [key, value] of Object.entries(extra)) {
    if (value != null) env[key] = decodeSecret(value);
  }
  env.ROUTERAI_BASE_URL = getFeynmanBaseUrl();
  delete env.OPENROUTER_API_KEY;
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
    ensureRouterAiProvider();
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
