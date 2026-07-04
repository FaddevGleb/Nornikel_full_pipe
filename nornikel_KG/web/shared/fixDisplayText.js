const CYRILLIC_RE = /[\u0400-\u04FF]/;
const LATIN_MOJIBAKE_RE = /[\u00C0-\u00FF]{2}|Ð.|Ñ.|â€|Ã.|Â./;
const CP866_MOJIBAKE_RE = /[\u2500-\u259F]/;

const CP866_CHARS =
  'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■\u00A0';

const UNICODE_TO_CP866 = new Map();
for (let i = 0; i < CP866_CHARS.length; i += 1) {
  UNICODE_TO_CP866.set(CP866_CHARS[i], i + 0x80);
}

function encodeCp866(text) {
  const bytes = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0x80) {
      bytes.push(code);
      continue;
    }
    const mapped = UNICODE_TO_CP866.get(ch);
    bytes.push(mapped ?? 0x3f);
  }
  return Uint8Array.from(bytes);
}

function looksLikeMojibakeCyrillic(text) {
  const chunks = text.match(/Р./g) ?? [];
  return chunks.length >= 2 && chunks.length / Math.max(text.length, 1) > 0.12;
}

function decodeFromLatin1Bytes(text) {
  try {
    const bytes = Uint8Array.from(text, (ch) => ch.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8').decode(bytes);
    if (decoded.includes('\uFFFD')) return null;
    if (!CYRILLIC_RE.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function decodeFromCp866Mojibake(text) {
  try {
    const bytes = encodeCp866(text);
    const decoded = new TextDecoder('utf-8').decode(bytes);
    if (decoded.includes('\uFFFD')) return null;
    if (!CYRILLIC_RE.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function scoreCyrillicText(text) {
  if (!text) return 0;
  const cyrillic = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
  const mojibake = (text.match(CP866_MOJIBAKE_RE) ?? []).length;
  const latinMojibake = (text.match(LATIN_MOJIBAKE_RE) ?? []).length;
  return cyrillic - mojibake * 3 - latinMojibake * 2;
}

/**
 * Repair common UTF-8 mojibake found in graph JSON (CP866 box-drawing and Latin-1 forms).
 */
export function fixDisplayText(value) {
  if (value == null) return '';
  const text = String(value);
  if (!text) return text;

  const candidates = [text];

  if (CP866_MOJIBAKE_RE.test(text)) {
    const cp866 = decodeFromCp866Mojibake(text);
    if (cp866) candidates.push(cp866);
  }

  if (LATIN_MOJIBAKE_RE.test(text) || looksLikeMojibakeCyrillic(text)) {
    const latin1 = decodeFromLatin1Bytes(text);
    if (latin1) candidates.push(latin1);
  }

  let best = text;
  let bestScore = scoreCyrillicText(text);
  for (const candidate of candidates) {
    const score = scoreCyrillicText(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

export function sanitizeDeep(value) {
  if (typeof value === 'string') return fixDisplayText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = sanitizeDeep(child);
    }
    return out;
  }
  return value;
}

export function sanitizeGraphBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') return bundle;
  return {
    ...bundle,
    graph: sanitizeDeep(bundle.graph ?? {}),
    concepts: sanitizeDeep(bundle.concepts ?? {}),
  };
}

export function nodeDisplayName(node) {
  return fixDisplayText(node?.name ?? node?.text ?? node?.id ?? '');
}

export function nodeDisplayDefinition(node) {
  return fixDisplayText(node?.definition ?? '');
}
