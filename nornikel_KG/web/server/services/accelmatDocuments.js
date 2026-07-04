import fs from 'node:fs/promises';
import path from 'node:path';
import { configManager } from './configManager.js';
import { getAccelmatDir } from './accelmatRunner.js';
import {
  decodeUploadFilename,
  sanitizeUploadFilename,
  uploadFileExtension,
} from '../utils/uploadFilename.js';

const DEFAULT_SETTINGS = {
  maxFiles: 5,
  maxFileSizeMb: 10,
  allowedExtensions: ['.xlsx'],
};

export function getAccelmatDocumentSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...(configManager.settings?.accelmat?.supplementaryDocuments ?? {}),
  };
}

function toPosixRelative(baseDir, absolutePath) {
  return path.relative(baseDir, absolutePath).split(path.sep).join('/');
}

/**
 * Persist uploaded Excel files for an ACCELMAT run.
 * Returns paths relative to the ACCELMAT project root for pipeline_request JSON.
 */
export async function saveAccelmatDocuments(slug, files = []) {
  const settings = getAccelmatDocumentSettings();
  const allowed = new Set(
    (settings.allowedExtensions ?? DEFAULT_SETTINGS.allowedExtensions).map((ext) => ext.toLowerCase()),
  );
  const maxFiles = settings.maxFiles ?? DEFAULT_SETTINGS.maxFiles;
  const maxBytes = (settings.maxFileSizeMb ?? DEFAULT_SETTINGS.maxFileSizeMb) * 1024 * 1024;

  if (!files.length) {
    return { saved: [], relativePaths: [] };
  }

  if (files.length > maxFiles) {
    throw new Error(`Too many Excel files (max ${maxFiles})`);
  }

  const accelmatDir = getAccelmatDir();
  const targetDir = path.join(accelmatDir, 'inputs', 'accelmat_docs', slug);
  await fs.mkdir(targetDir, { recursive: true });

  const saved = [];
  const relativePaths = [];

  for (const file of files) {
    const ext = `.${uploadFileExtension(file.originalname)}`;
    if (!allowed.has(ext)) {
      throw new Error(`Unsupported Excel type: ${ext}`);
    }
    if (file.size > maxBytes) {
      throw new Error(`File too large: ${decodeUploadFilename(file.originalname)} (max ${settings.maxFileSizeMb} MB)`);
    }

    const safeName = sanitizeUploadFilename(file.originalname);
    const destination = path.join(targetDir, safeName);
    await fs.rename(file.path, destination);

    const relativePath = toPosixRelative(accelmatDir, destination);
    saved.push({
      originalName: decodeUploadFilename(file.originalname),
      filename: safeName,
      path: relativePath,
      size: file.size,
    });
    relativePaths.push(relativePath);
  }

  return { saved, relativePaths };
}
