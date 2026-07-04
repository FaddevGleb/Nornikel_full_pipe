/**
 * Converts heterogeneous documents in data/incoming/ to Markdown in data/raw/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { configManager } from './configManager.js';

export const CONVERT_EXTENSIONS = new Set([
  'pdf', 'docx', 'xlsx', 'xls', 'png', 'jpg', 'jpeg',
]);

export const RAW_EXTENSIONS = new Set(['txt', 'md', 'html']);

function isConvertExtension(ext) {
  return CONVERT_EXTENSIONS.has(ext.toLowerCase());
}

function isRawExtension(ext) {
  return RAW_EXTENSIONS.has(ext.toLowerCase());
}

async function listFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function mdExistsForStem(rawDir, stem) {
  try {
    await fs.access(path.join(rawDir, `${stem}.md`));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {(entry: {level: string, message: string}) => void} [onLog]
 */
export async function convertPendingIncoming(onLog) {
  const incomingDir = configManager.resolveProjectPath('data/incoming');
  const rawDir = configManager.resolveProjectPath('data/raw');
  await fs.mkdir(incomingDir, { recursive: true });
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(path.join(rawDir, 'media'), { recursive: true });

  const files = await listFiles(incomingDir);
  const pending = [];
  for (const name of files) {
    const ext = path.extname(name).slice(1).toLowerCase();
    if (!isConvertExtension(ext)) continue;
    const stem = path.basename(name, path.extname(name));
    if (!(await mdExistsForStem(rawDir, stem))) {
      pending.push(name);
    }
  }

  if (pending.length === 0) {
    return { converted: [], skipped: [], failed: [] };
  }

  onLog?.({ level: 'info', message: `Converting ${pending.length} file(s) via doc-convert` });
  await runDocConvertBatch(incomingDir, rawDir, onLog);

  const converted = [];
  const failed = [];
  for (const name of pending) {
    const stem = path.basename(name, path.extname(name));
    if (await mdExistsForStem(rawDir, stem)) {
      converted.push(name);
    } else {
      failed.push(name);
    }
  }

  return { converted, skipped: [], failed };
}

function runDocConvertBatch(incomingDir, rawDir, onLog) {
  return new Promise((resolve, reject) => {
    const python = configManager.getPythonExecutable();
    const args = [
      '-m', 'doc_converter.cli', 'batch', incomingDir,
      '--format', 'md',
      '--output-dir', rawDir,
      '--vlm-backend', 'off',
      '--pdf-backend', 'pymupdf4llm',
      '--ocr-lang', 'ru',
    ];

    onLog?.({ level: 'info', message: `Running: ${python} ${args.join(' ')}` });
    const child = spawn(python, args, {
      cwd: configManager.getProjectRoot(),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
      shell: false,
    });

    child.stdout.on('data', (chunk) => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        if (line.trim()) onLog?.({ level: 'info', message: line.trim() });
      }
    });
    child.stderr.on('data', (chunk) => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        if (line.trim()) onLog?.({ level: 'warn', message: line.trim() });
      }
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`doc-convert batch failed with exit code ${code}`));
    });
  });
}

export { isConvertExtension, isRawExtension };
