/**
 * Unified workspace configuration loader (Node ESM).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_FILENAME = 'project.toml';
const EXAMPLE_FILENAME = 'project.example.toml';

let cachedConfig = null;
let cachedRoot = null;

function getTomlParser() {
  const require = createRequire(import.meta.url);
  const candidates = [
    path.join(__dirname, '../nornikel_KG/web/node_modules/@iarna/toml'),
    path.join(__dirname, '../Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/nornikel_KG/web/node_modules/@iarna/toml'),
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // try next
    }
  }
  throw new Error('@iarna/toml not found. Run npm install in nornikel_KG/web');
}

export function findWorkspaceRoot(start = process.cwd()) {
  const envRoot = process.env.NORNIKEL_PROJECT_ROOT;
  if (envRoot) {
    const root = path.resolve(envRoot);
    if (fs.existsSync(path.join(root, PROJECT_FILENAME))) return root;
    throw new Error(`NORNIKEL_PROJECT_ROOT=${envRoot} but ${PROJECT_FILENAME} not found`);
  }

  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, PROJECT_FILENAME))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    `${PROJECT_FILENAME} not found. Copy ${EXAMPLE_FILENAME} to ${PROJECT_FILENAME} in workspace root.`,
  );
}

function resolvePathsTable(paths, workspaceRoot) {
  const resolved = {};
  for (const [key, value] of Object.entries(paths ?? {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolvePathsTable(value, workspaceRoot);
    } else if (typeof value === 'string') {
      resolved[key] = path.isAbsolute(value) ? value : path.resolve(workspaceRoot, value);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

function resolvePlaceholders(value, paths, workspaceRoot) {
  if (typeof value === 'string') {
    let current = value;
    let prev = null;
    const re = /\{paths(?:\.\w+)+\}/g;
    while (prev !== current) {
      prev = current;
      current = current.replace(re, (token) => {
        const parts = token.slice(1, -1).split('.');
        let node = paths;
        for (let i = 1; i < parts.length; i += 1) {
          node = node?.[parts[i]];
        }
        return typeof node === 'string' ? node : token;
      });
    }
    return current;
  }
  if (Array.isArray(value)) return value.map((item) => resolvePlaceholders(item, paths, workspaceRoot));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolvePlaceholders(v, paths, workspaceRoot)]),
    );
  }
  return value;
}

export function loadProjectConfig(forceReload = false) {
  if (cachedConfig && !forceReload) return cachedConfig;

  const root = findWorkspaceRoot();
  const toml = getTomlParser();
  const raw = toml.parse(fs.readFileSync(path.join(root, PROJECT_FILENAME), 'utf8'));
  const resolvedPaths = resolvePathsTable(raw.paths ?? {}, root);
  const config = resolvePlaceholders(raw, resolvedPaths, root);
  config.paths = resolvedPaths;
  config._workspace_root = root;

  cachedConfig = config;
  cachedRoot = root;
  return config;
}

export function getWorkspaceRoot() {
  if (!cachedRoot) loadProjectConfig();
  return cachedRoot;
}

export function getNornikelKgRoot() {
  const config = loadProjectConfig();
  const nkg = config.paths?.nornikel_kg;
  if (!nkg) throw new Error('paths.nornikel_kg is not set in project.toml');
  return nkg;
}

export function getWebConfig() {
  return loadProjectConfig().web ?? {};
}

export function getVizConfig() {
  return loadProjectConfig().viz ?? {};
}

export function getFeynmanConfig() {
  return loadProjectConfig().feynman ?? {};
}

export function getAccelmatConfig() {
  return loadProjectConfig().accelmat ?? {};
}

export function resolveProjectPath(relativePath) {
  const root = getNornikelKgRoot();
  return path.join(root, relativePath);
}

export function resolveWorkspacePath(relativePath) {
  const root = getWorkspaceRoot();
  return path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
}

export function decodeSecret(value) {
  const text = String(value);
  if (text.startsWith('b64:')) {
    return Buffer.from(text.slice(4), 'base64').toString('utf8');
  }
  return text;
}

export function applyEnvFromConfig() {
  const config = loadProjectConfig();
  const llm = config.accelmat?.llm ?? {};
  if (llm.provider) process.env.LLM_PROVIDER = String(llm.provider);

  const mapping = {
    routerai_api_key: 'ROUTERAI_API_KEY',
    routerai_base_url: 'ROUTERAI_BASE_URL',
    yandex_api_key: 'YANDEX_API_KEY',
    yandex_folder_id: 'YANDEX_FOLDER_ID',
    yandex_base_url: 'YANDEX_BASE_URL',
    openrouter_api_key: 'OPENROUTER_API_KEY',
  };
  for (const [src, dst] of Object.entries(mapping)) {
    if (llm[src]) process.env[dst] = decodeSecret(llm[src]);
  }

  const models = llm.models ?? {};
  for (const [role, modelId] of Object.entries(models)) {
    process.env[`MODEL_${role}`] = String(modelId);
    if (llm.provider === 'yandex') {
      process.env[`YANDEX_MODEL_${role}`] = String(modelId);
    } else {
      process.env[`ROUTERAI_MODEL_${role}`] = String(modelId);
    }
  }

  const feynmanEnv = config.feynman?.env ?? {};
  for (const [key, value] of Object.entries(feynmanEnv)) {
    if (value != null && process.env[key] == null) process.env[key] = decodeSecret(value);
  }

  if (process.env.YANDEX_API_KEY_B64 && !process.env.YANDEX_API_KEY) {
    process.env.YANDEX_API_KEY = Buffer.from(process.env.YANDEX_API_KEY_B64, 'base64').toString('utf8');
  }
}

export function getFeynmanEnvForSpawn() {
  applyEnvFromConfig();
  return { ...process.env };
}

export function patchKgProvider(provider) {
  return provider;
}

export function getProviderForMode(mode) {
  const web = getWebConfig();
  const providers = web.providers ?? {};
  return mode === 'offline' ? providers.offline ?? 'local_transformers' : providers.online ?? 'openrouter';
}

export function saveProjectWebConfig(webSettings) {
  const root = getWorkspaceRoot();
  const toml = getTomlParser();
  const current = toml.parse(fs.readFileSync(path.join(root, PROJECT_FILENAME), 'utf8'));
  current.web = { ...(current.web ?? {}), ...webSettings };
  fs.writeFileSync(path.join(root, PROJECT_FILENAME), toml.stringify(current));
  cachedConfig = null;
  cachedRoot = null;
  return loadProjectConfig(true);
}

export function getPythonExecutable() {
  const web = getWebConfig();
  const venvRelative = web.paths?.pythonVenv ?? '../.venv';
  const nkg = getNornikelKgRoot();
  const venvRoot = path.resolve(nkg, 'web', venvRelative.replace(/^\.\.\//, '../'));
  // settings had pythonVenv relative to web root
  const webRoot = path.join(nkg, 'web');
  const resolvedVenv = path.resolve(webRoot, venvRelative);
  const winPython = path.join(resolvedVenv, 'Scripts', 'python.exe');
  const unixPython = path.join(resolvedVenv, 'bin', 'python');
  return process.platform === 'win32' ? winPython : unixPython;
}
