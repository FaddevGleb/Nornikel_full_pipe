/**
 * Patch project.toml [web.accelmat].pythonExecutable without overwriting secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { findWorkspaceRoot } from '../../config/loader.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getToml() {
  const root = findWorkspaceRoot();
  const candidates = [
    path.join(root, 'Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/nornikel_KG/web/node_modules/@iarna/toml'),
    path.join(root, 'nornikel_KG/web/node_modules/@iarna/toml'),
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // try next
    }
  }
  throw new Error('@iarna/toml not found. Run npm install in canonical web first.');
}

const toml = getToml();
const workspaceRoot = findWorkspaceRoot();
const projectToml = path.join(workspaceRoot, 'project.toml');
const pythonExe = process.argv[2];

if (!pythonExe) {
  console.error('Usage: patch-accelmat-python.mjs <absolute-python-exe>');
  process.exit(1);
}

if (!fs.existsSync(projectToml)) {
  console.error(`project.toml not found: ${projectToml}`);
  process.exit(1);
}

const raw = toml.parse(fs.readFileSync(projectToml, 'utf8'));
raw.web = raw.web ?? {};
raw.web.accelmat = raw.web.accelmat ?? {};
raw.web.accelmat.pythonExecutable = pythonExe.replace(/\\/g, '/');
fs.writeFileSync(projectToml, toml.stringify(raw));
console.log(`Patched [web.accelmat].pythonExecutable -> ${pythonExe}`);
