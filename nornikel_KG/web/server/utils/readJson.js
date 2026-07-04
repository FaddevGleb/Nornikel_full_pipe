import fs from 'node:fs/promises';

/** Strip UTF-8 BOM and other leading whitespace before JSON.parse. */
export function parseJsonText(raw) {
  const text = typeof raw === 'string' ? raw.replace(/^\uFEFF/, '').trimStart() : raw;
  return JSON.parse(text);
}

export async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return parseJsonText(raw);
}
