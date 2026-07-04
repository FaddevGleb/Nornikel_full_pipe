/**
 * Fix multipart upload filenames mangled by busboy/multer (UTF-8 read as Latin-1).
 */
import path from 'node:path';

const CYRILLIC_RE = /[\u0400-\u04FF]/;

/**
 * Decode Cyrillic (and other UTF-8) filenames from multipart uploads.
 *
 * Browsers send UTF-8 bytes in Content-Disposition; busboy interprets them as
 * Latin-1, producing mojibake like "ÐÐ¾Ðº..." instead of "Док...".
 */
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

/**
 * Decode and sanitize a client-provided upload filename for disk storage.
 */
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
