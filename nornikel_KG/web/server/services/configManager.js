import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findWorkspaceRoot,
  getNornikelKgRoot,
  getProviderForMode,
  getPythonExecutable,
  getWebConfig,
  getWorkspaceRoot,
  loadProjectConfig,
} from '../../../../config/loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '../..');

/**
 * Manages web application settings from workspace project.toml [web].
 */
export class ConfigManager {
  constructor() {
    this.settings = null;
  }

  async init() {
    loadProjectConfig();
    this.settings = this.buildSettingsFromProject();
    return this.settings;
  }

  buildSettingsFromProject() {
    const web = getWebConfig();
    return {
      port: web.port ?? 3847,
      mode: web.mode ?? 'online',
      providers: web.providers ?? { online: 'openrouter', offline: 'local_transformers' },
      paths: {
        pythonVenv: web.paths?.pythonVenv ?? '../.venv',
        projectRoot: '..',
        workspaceRoot: getWorkspaceRoot(),
        nornikelKg: getNornikelKgRoot(),
      },
      pipeline: web.pipeline ?? {},
      hypothesis: web.hypothesis ?? {},
      accelmat: web.accelmat ?? {},
      feynman: web.feynman ?? {},
      feynmanEnrichment: web.feynmanEnrichment ?? {},
      security: web.security ?? { apiKey: '' },
      ui: web.ui ?? {},
    };
  }

  async loadSettings() {
    if (!this.settings) {
      loadProjectConfig(true);
      this.settings = this.buildSettingsFromProject();
    }
    return this.settings;
  }

  async saveSettings(nextSettings) {
    this.settings = nextSettings;
    const { saveProjectWebConfig } = await import('../../../../config/loader.mjs');
    await saveProjectWebConfig(nextSettings);
    loadProjectConfig(true);
    return this.settings;
  }

  getWorkspaceRoot() {
    return getWorkspaceRoot();
  }

  getProjectRoot() {
    return getNornikelKgRoot();
  }

  getWebRoot() {
    return WEB_ROOT;
  }

  resolveProjectPath(relativePath) {
    return path.join(getNornikelKgRoot(), relativePath);
  }

  resolveWorkspacePath(relativePath) {
    const root = getWorkspaceRoot();
    return path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  }

  getPythonExecutable() {
    return getPythonExecutable();
  }

  getMode() {
    return this.settings?.mode ?? getWebConfig().mode ?? 'online';
  }

  getProviderForMode(mode = this.getMode()) {
    return getProviderForMode(mode);
  }

  async syncRuntimeConfig() {
    // Runtime config is read directly from project.toml via run_with_config.py
    return true;
  }

  async setMode(mode) {
    if (!['online', 'offline'].includes(mode)) {
      throw new Error(`Unsupported mode: ${mode}`);
    }
    const next = { ...this.settings, mode };
    await this.saveSettings(next);
    return next;
  }

  async getStatus() {
    const config = loadProjectConfig();
    const kgConcepts = config.kg?.itext2kg_concepts ?? {};
    return {
      mode: this.getMode(),
      activeProvider: this.getProviderForMode(),
      sourceProvider: kgConcepts.provider ?? 'unknown',
      pythonExecutable: this.getPythonExecutable(),
      projectRoot: getNornikelKgRoot(),
      workspaceRoot: getWorkspaceRoot(),
      configPath: path.join(getWorkspaceRoot(), 'project.toml'),
    };
  }
}

export const configManager = new ConfigManager();
