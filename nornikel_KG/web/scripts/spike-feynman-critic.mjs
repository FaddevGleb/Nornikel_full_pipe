#!/usr/bin/env node
/**
 * Spike: run Feynman web critic on an existing ACCELMAT result JSON.
 *
 * Usage (from nornikel_KG/web):
 *   node scripts/spike-feynman-critic.mjs [path-to-hypotheses.json]
 *
 * Prerequisites:
 *   - feynman configured (~/.feynman/models.json, web-search.json)
 *   - server config loaded via settings.json paths
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeVerdict, extractJsonFromAgentText } from '../server/services/feynmanTurnClient.js';
import { buildCriticPrompt, enrichAccelmatResult } from '../server/services/feynmanEnrichment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');

const defaultResultPath = path.resolve(
  webRoot,
  '../Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/output/hypotheses_nornikel_niw.json',
);

async function runUnitChecks() {
  const sample = 'Here is the result:\n```json\n{"Feedback_for_suggestion_1":{"Meets_the_goal_statement_and_satisfies_all_constraints_strictly":"NO","Reasoning":"test"}}\n```';
  const parsed = extractJsonFromAgentText(sample);
  if (!parsed.Feedback_for_suggestion_1) {
    throw new Error('extractJsonFromAgentText unit check failed');
  }
  const verdict = computeVerdict(parsed);
  if (verdict !== 'NO') {
    throw new Error(`computeVerdict expected NO, got ${verdict}`);
  }
  console.log('[spike] unit checks passed');
}

async function main() {
  process.chdir(webRoot);

  // Bootstrap configManager the same way the server does.
  const { configManager } = await import('../server/services/configManager.js');
  await configManager.init();

  await runUnitChecks();

  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultResultPath;
  const raw = await fs.readFile(inputPath, 'utf8');
  const result = JSON.parse(raw);

  console.log(`[spike] Running Feynman critic on ${inputPath} (${Object.keys(result.hypotheses ?? {}).length} hypotheses)`);
  console.log('[spike] This may take several minutes (web_search)...');

  const enriched = await enrichAccelmatResult(result, {
    sessionId: 'spike-critic',
    onLog: (entry) => console.log(`[${entry.level}] ${entry.message}`),
  });

  const outPath = inputPath.replace(/\.json$/i, '.feynman-enriched.json');
  await fs.writeFile(outPath, JSON.stringify(enriched, null, 2), 'utf8');

  console.log(`[spike] Verdict: ${enriched.feynman_enrichment?.verdict}`);
  console.log(`[spike] Wrote ${outPath}`);
}

main().catch((error) => {
  console.error('[spike] failed:', error);
  process.exit(1);
});
