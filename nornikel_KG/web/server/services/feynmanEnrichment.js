import { computeVerdict, runFeynmanTurnForJson } from './feynmanTurnClient.js';
import { getFeynmanEnrichmentSettings, getFeynmanModel } from './feynmanShared.js';
import { writeResult as writeAccelmatResult } from './accelmatRunner.js';
import {
  getFeynmanAccelmatLogPath,
  summarizeCriticVerdicts,
  truncateForLog,
} from './feynmanAccelmatLogger.js';

function asText(value) {
  if (Array.isArray(value)) return value.join('');
  return String(value ?? '');
}

function hypothesesToText(hypotheses) {
  let output = '';
  for (const [key, value] of Object.entries(hypotheses ?? {})) {
    output += `${key.replace(/_/g, ' ')}:\n`;
    output += `Materials:${asText(value?.Materials)}\n`;
    output += `Methods_to_develop_the_materials_suggested:${asText(value?.Methods_to_develop_the_materials_suggested)}\n`;
    output += `Reasoning:${value?.Reasoning ?? ''}\n\n`;
  }
  return output;
}

function formatConstraints(constraints) {
  return (constraints ?? [])
    .map((constraint, index) => ` ${index + 1}) ${constraint}`)
    .join('\n');
}

/**
 * Build the user prompt for the Feynman web critic pass (ACCELMAT-compatible schema).
 */
export function buildCriticPrompt(result) {
  const maxSearches = getFeynmanEnrichmentSettings().maxSearchesPerHypothesis ?? 2;
  const constraintText = formatConstraints(result.constraints);
  const suggestionsText = hypothesesToText(result.hypotheses);
  const suggestionCount = Object.keys(result.hypotheses ?? {}).length;
  const supplementaryText = result.supplementary_context?.formatted_text?.trim() ?? '';
  const supplementarySection = supplementaryText
    ? `\nДополнительные Excel-документы (операционные данные пользователя):\n${supplementaryText}\n`
    : '';

  return `[accelmat-web-critic skill]

Ты проверяешь ${suggestionCount} гипотез ACCELMAT с опорой на поиск по литературе в интернете.

Формулировка цели:
${result.goal}

Ограничения:
${constraintText}
${supplementarySection}
Гипотезы:
${suggestionsText}

Инструкции:
1. Следуй навыку accelmat-web-critic: используй web_search (не более ${maxSearches} запросов на каждый Suggestion_N) для проверки материалов, методов, затрат, оборудования и нормативных утверждений. Если приложены Excel-таблицы, считай их цифры приоритетными; web_search дополняет, но не отменяет явные значения из таблиц.
2. НЕ используй bash, read, write или run_pipeline.
3. Верни ТОЛЬКО JSON-объект по схеме ACCELMAT:
   - Feedback_for_suggestion_1 … Feedback_for_suggestion_${suggestionCount}
   - В каждом объекте: Meets_the_goal_statement_and_satisfies_all_constraints_strictly ("YES" или "NO"), Reasoning (на русском), web_sources (массив URL)
   - Overall_Feedback_for_improvement_for_future_suggestion_generation (на русском)

Без markdown-ограждений. Без текста вне JSON-объекта.`;
}

/**
 * Run Feynman web-search critic pass and merge feynman_enrichment into the result.
 */
export async function enrichAccelmatResult(result, { onLog = () => {}, sessionId = 'accelmat-critic', slug } = {}) {
  const settings = getFeynmanEnrichmentSettings();
  const hypothesisCount = Object.keys(result.hypotheses ?? {}).length;
  const model = getFeynmanModel();

  onLog({
    level: 'info',
    stage: 'feynman_critic',
    message: '[Feynman enrichment] Starting literature-backed critic pass',
    meta: {
      slug,
      sessionId,
      hypothesisCount,
      maxSearchesPerHypothesis: settings.maxSearchesPerHypothesis ?? 2,
      timeoutMs: settings.timeoutMs,
      model: model || '(default)',
      logFile: slug ? getFeynmanAccelmatLogPath(slug) : undefined,
    },
  });

  const startedAt = Date.now();
  const prompt = buildCriticPrompt(result);
  onLog({
    level: 'info',
    stage: 'feynman_critic',
    message: `[Feynman enrichment] Prompt prepared (${prompt.length} chars, ${hypothesisCount} hypotheses)`,
  });

  const turn = await runFeynmanTurnForJson({
    message: prompt,
    sessionId,
    onLog: (entry) => onLog({ ...entry, stage: entry.stage ?? 'feynman_critic' }),
  });

  const critic = turn.json;
  const verdict = computeVerdict(critic);
  const perSuggestion = summarizeCriticVerdicts(critic);
  const yesCount = perSuggestion.filter((s) => s.verdict === 'YES').length;
  const noCount = perSuggestion.filter((s) => s.verdict === 'NO').length;
  const overallFeedback = critic?.Overall_Feedback_for_improvement_for_future_suggestion_generation;
  const elapsedMs = Date.now() - startedAt;

  onLog({
    level: 'info',
    stage: 'feynman_critic',
    message: `[Feynman enrichment] Critic finished: verdict=${verdict}, YES=${yesCount}, NO=${noCount}, web_searches=${turn.toolCalls?.length ?? 0}, elapsed=${Math.round(elapsedMs / 1000)}s`,
    meta: { perSuggestion, elapsedMs },
  });

  if (overallFeedback) {
    onLog({
      level: 'info',
      stage: 'feynman_critic',
      message: `[Feynman enrichment] Overall feedback: ${truncateForLog(String(overallFeedback), 320)}`,
    });
  }

  for (const row of perSuggestion) {
    onLog({
      level: row.verdict === 'NO' ? 'warn' : 'info',
      stage: 'feynman_critic',
      message: `[Feynman enrichment] Suggestion_${row.suggestion}: ${row.verdict} (${row.webSources} sources)`,
    });
  }

  const enriched = {
    ...result,
    feynman_enrichment: {
      verdict,
      critic,
      tool_calls: turn.toolCalls ?? [],
      model: turn.model ?? getFeynmanModel() ?? undefined,
      completed_at: new Date().toISOString(),
    },
    metadata: {
      ...(result.metadata ?? {}),
      feynman_enriched: true,
    },
  };

  return enriched;
}

/**
 * Merge enrichment into result and persist to output/hypotheses_<slug>.json.
 */
export async function mergeAndSaveResult(slug, result) {
  await writeAccelmatResult(slug, result);
  return result;
}

export { computeVerdict };
