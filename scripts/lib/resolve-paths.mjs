/**
 * Emit resolved workspace paths as JSON for PowerShell startup scripts.
 * Requires NORNIKEL_PROJECT_ROOT or cwd under workspace root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findWorkspaceRoot,
  getNornikelKgRoot,
  loadProjectConfig,
} from '../../config/loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = findWorkspaceRoot(process.cwd());
const config = loadProjectConfig();
const nornikelKg = getNornikelKgRoot();
const paths = config.paths ?? {};

function pythonExecutable(venvRoot) {
  const win = path.join(venvRoot, 'Scripts', 'python.exe');
  const unix = path.join(venvRoot, 'bin', 'python');
  return process.platform === 'win32' ? win : unix;
}

const venvRoot = paths.python_venv ?? path.join(nornikelKg, '.venv');
const pythonExe = pythonExecutable(venvRoot);
const webDir = path.join(nornikelKg, 'web');
const feynmanRoot = paths.feynman ?? path.join(paths.hypothesis_repo ?? workspaceRoot, 'feynman');
const hypothesisRepo = paths.hypothesis_repo ?? path.dirname(nornikelKg);

const payload = {
  workspaceRoot,
  nornikelKgRoot: nornikelKg,
  hypothesisRepo,
  feynmanRoot,
  pythonVenv: venvRoot,
  pythonExe,
  webDir,
  projectToml: path.join(workspaceRoot, 'project.toml'),
  webDist: path.join(webDir, 'dist', 'index.html'),
  feynmanCli: path.join(feynmanRoot, 'bin', 'feynman.js'),
  hasProjectToml: fs.existsSync(path.join(workspaceRoot, 'project.toml')),
};

process.stdout.write(JSON.stringify(payload, null, 2));
