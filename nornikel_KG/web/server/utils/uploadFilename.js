/**
 * Fix multipart upload filenames mangled by busboy/multer (UTF-8 read as Latin-1).
 */
import path from 'node:path';

const CYRILLIC_RE = /[\u0400-\u04FF]/;

export function decodeUploadFilename(originalname) {
  if (!originalname || typeof originalname !== 'string') {
    return originalname ?? '';
  }

  if (CYRILLIC_RE.test(originalname)) {
    return originalname;
  }

  const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
  if (decoded.includes('\uFFFD')) {
    return originalname;
  }
  if (CYRILLIC_RE.test(decoded)) {
    return decoded;
  }

  return originalname;
}

export function sanitizeUploadFilename(originalname) {
  const decoded = decodeUploadFilename(originalname);
  const basename = path.basename(decoded);
  const safeName = basename
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '')
    .trim()
    .slice(0, 200);

  if (!safeName || safeName.startsWith('.')) {
    return `uploaded_${Date.now()}${path.extname(decoded)}`;
  }
  return safeName;
}

export function uploadFileExtension(originalname) {
  return path.extname(decodeUploadFilename(originalname)).slice(1).toLowerCase();
}
