import fs from 'node:fs/promises';
import path from 'node:path';
import { configManager } from './configManager.js';

function getLogDir() {
  return path.join(configManager.getWebRoot(), 'runtime', 'feynman-accelmat-logs');
}

/**
 * Builds an onLog callback that forwards to the ACCELMAT job log (SSE),
 * mirrors important lines to the server console, and appends to a per-slug log file.
 */
export function createAccelmatFeynmanLogger(slug, jobAppendLog) {
  const logFile = path.join(getLogDir(), `${slug}.log`);
  let fileReady = fs.mkdir(getLogDir(), { recursive: true }).then(() => {
    const header = `# Feynman ACCELMAT enrichment log — slug=${slug} started=${new Date().toISOString()}\n`;
    return fs.appendFile(logFile, header, 'utf8');
  });

  return (entry) => {
    const payload = {
      level: entry.level ?? 'info',
      message: entry.message ?? '',
      stage: entry.stage,
      meta: entry.meta,
    };

    jobAppendLog(payload);

    const metaSuffix = payload.meta ? ` ${JSON.stringify(payload.meta)}` : '';
    const consoleLine = `[accelmat/feynman/${slug}] ${payload.message}${metaSuffix}`;
    if (payload.level === 'warn' || payload.level === 'error') {
      console.warn(consoleLine);
    } else {
      console.log(consoleLine);
    }

    const fileLine = `[${new Date().toISOString()}] [${payload.level}]${payload.stage ? ` [${payload.stage}]` : ''} ${payload.message}${metaSuffix}\n`;
    fileReady = fileReady
      .then(() => fs.appendFile(logFile, fileLine, 'utf8'))
      .catch(() => {});
  };
}

export function getFeynmanAccelmatLogPath(slug) {
  return path.join(getLogDir(), `${slug}.log`);
}

/**
 * Summarize per-suggestion critic verdicts for logging.
 */
export function summarizeCriticVerdicts(critic) {
  const summary = [];
  for (const [key, value] of Object.entries(critic ?? {})) {
    if (!key.startsWith('Feedback_for_suggestion') || typeof value !== 'object' || value === null) {
      continue;
    }
    const num = key.replace(/Feedback_for_suggestion_/i, '');
    const verdict = value.Meets_the_goal_statement_and_satisfies_all_constraints_strictly ?? '?';
    const sources = Array.isArray(value.web_sources) ? value.web_sources.length : 0;
    summary.push({ suggestion: num, verdict, webSources: sources });
  }
  return summary;
}

export function truncateForLog(text, maxLen = 240) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}…`;
}
