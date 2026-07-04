import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { configManager } from './configManager.js';
import {
  attachJsonlReader,
  ensureWorkspaceTrusted,
  getEnrichmentTimeoutMs,
  getFeynmanBinPath,
  getFeynmanCwd,
  getFeynmanModel,
  getFeynmanRoot,
} from './feynmanShared.js';

function getTurnSessionsDir() {
  return path.join(configManager.getWebRoot(), 'runtime', 'feynman-turn-sessions');
}

/**
 * Extract a JSON object from agent prose (strip markdown fences, find first { ... }).
 */
export function extractJsonFromAgentText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty agent response');
  }

  let candidate = text.trim();

  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    candidate = fenced[1].trim();
  }

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Could not parse JSON from agent response');
  }
}

/**
 * Compute consolidated YES/NO verdict from ACCELMAT-compatible critic JSON.
 * Mirrors process_feedback_extract_final_answer in agent_framework_materials_discovery.py.
 */
export function computeVerdict(critic) {
  if (!critic || typeof critic !== 'object') {
    return 'NO';
  }

  let finalAnswer = 'YES';
  for (const [key, value] of Object.entries(critic)) {
    if (!key.startsWith('Feedback_for_suggestion') || typeof value !== 'object' || value === null) {
      continue;
    }
    const meets = value.Meets_the_goal_statement_and_satisfies_all_constraints_strictly;
    if (meets === 'NO' || meets === 'no') {
      finalAnswer = 'NO';
      break;
    }
  }
  return finalAnswer;
}

function extractTextFromAssistantMessage(message) {
  if (!message?.content) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part) => part?.type === 'text' && part.text)
      .map((part) => part.text)
      .join('');
  }
  return '';
}

function formatToolArgsPreview(toolName, args) {
  if (!args || typeof args !== 'object') return '';
  if (toolName === 'web_search' && args.query) {
    const q = String(args.query);
    return q.length > 120 ? `${q.slice(0, 120)}…` : q;
  }
  if (toolName === 'fetch_content' && args.url) {
    return String(args.url);
  }
  if (toolName === 'alpha_search' && args.query) {
    return String(args.query).slice(0, 120);
  }
  return '';
}

/**
 * Run one Feynman RPC turn in an ephemeral subprocess.
 * Returns accumulated assistant text and tool call metadata.
 */
export function runFeynmanTurn({ message, sessionId, onLog = () => {}, timeoutMs }) {
  const effectiveTimeout = timeoutMs ?? getEnrichmentTimeoutMs();
  const model = getFeynmanModel();
  const startedAt = Date.now();

  return new Promise(async (resolve, reject) => {
    await ensureWorkspaceTrusted();

    const binPath = getFeynmanBinPath();
    const cwd = getFeynmanCwd();
    const turnSessionId = sessionId ?? `turn-${uuidv4()}`;
    const sessionDir = path.join(getTurnSessionsDir(), turnSessionId);
    mkdirSync(sessionDir, { recursive: true });

    const args = [binPath, '--mode', 'rpc', '--session-dir', sessionDir, '--cwd', cwd];
    if (model) args.push('--model', model);

    onLog({
      level: 'info',
      stage: 'feynman_rpc',
      message: `[Feynman RPC] Starting ephemeral session ${turnSessionId}`,
      meta: { model: model || '(default)', cwd, timeoutMs: effectiveTimeout, promptChars: message?.length ?? 0 },
    });

    const child = spawn(process.execPath, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let text = '';
    let turnEnded = false;
    let pendingRequestId = 0;
    const toolCalls = [];
    const pendingTools = new Map();
    let settled = false;

    const finish = (result, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      child.kill();
      if (error) reject(error);
      else resolve(result);
    };

    const timeoutHandle = setTimeout(() => {
      onLog({
        level: 'error',
        stage: 'feynman_rpc',
        message: `[Feynman RPC] Turn timed out after ${effectiveTimeout}ms`,
        meta: { sessionId: turnSessionId, elapsedMs: Date.now() - startedAt, toolCalls: toolCalls.length },
      });
      finish(null, new Error(`Feynman turn timed out after ${effectiveTimeout}ms`));
    }, effectiveTimeout);
    timeoutHandle.unref?.();

    const send = (command) => {
      child.stdin.write(`${JSON.stringify(command)}\n`);
    };

    const handleLine = (line) => {
      if (!line.trim()) return;

      let event;
      try {
        event = JSON.parse(line);
      } catch {
        onLog({ level: 'info', message: line.trim() });
        return;
      }

      switch (event.type) {
        case 'response':
          if (event.success === false) {
            onLog({
              level: 'error',
              stage: 'feynman_rpc',
              message: `[Feynman RPC] Command failed: ${event.error ?? event.command}`,
            });
            finish(null, new Error(event.error ?? `${event.command} failed`));
          }
          break;
        case 'agent_start':
          onLog({ level: 'info', stage: 'feynman_rpc', message: '[Feynman RPC] Agent turn started' });
          break;
        case 'message_update': {
          const delta = event.assistantMessageEvent;
          if (delta?.type === 'text_delta' && delta.delta) {
            text += delta.delta;
          } else if (delta?.type === 'error') {
            onLog({ level: 'error', stage: 'feynman_rpc', message: '[Feynman RPC] Model request failed during streaming' });
            finish(null, new Error('Model request failed during turn'));
          }
          break;
        }
        case 'turn_end': {
          const messageText = extractTextFromAssistantMessage(event.message);
          if (messageText && !text.includes(messageText)) {
            text = messageText;
          }
          if (event.message?.role === 'assistant' && event.message.stopReason === 'error') {
            onLog({
              level: 'error',
              stage: 'feynman_rpc',
              message: `[Feynman RPC] Turn ended with error: ${event.message.errorMessage ?? 'unknown'}`,
            });
            finish(null, new Error(event.message.errorMessage ?? 'Model request failed with no response'));
            return;
          }
          onLog({
            level: 'info',
            stage: 'feynman_rpc',
            message: `[Feynman RPC] Turn ended (stopReason=${event.message?.stopReason ?? 'unknown'}, ${text.length} chars)`,
          });
          turnEnded = true;
          break;
        }
        case 'agent_end':
          if (turnEnded) {
            onLog({
              level: 'info',
              stage: 'feynman_rpc',
              message: `[Feynman RPC] Session complete in ${Math.round((Date.now() - startedAt) / 1000)}s — ${toolCalls.length} tool call(s), response ${text.length} chars`,
              meta: { toolCalls: toolCalls.map((t) => t.query ?? t.tool) },
            });
            finish({
              text,
              toolCalls,
              model: model || undefined,
            });
          }
          break;
        case 'tool_execution_start': {
          const entry = {
            tool: event.toolName,
            toolCallId: event.toolCallId,
            args: event.args,
          };
          pendingTools.set(event.toolCallId, entry);
          const argsPreview = formatToolArgsPreview(event.toolName, event.args);
          onLog({
            level: 'info',
            stage: 'feynman_rpc',
            message: `[Feynman RPC] Tool start: ${event.toolName}${argsPreview ? ` — ${argsPreview}` : ''}`,
          });
          if (event.toolName === 'web_search' && event.args?.query) {
            toolCalls.push({ tool: 'web_search', query: String(event.args.query) });
          } else if (event.toolName === 'fetch_content' && event.args?.url) {
            toolCalls.push({ tool: 'fetch_content', url: String(event.args.url) });
          }
          break;
        }
        case 'tool_execution_end': {
          const pending = pendingTools.get(event.toolCallId);
          if (pending) {
            onLog({
              level: event.isError ? 'warn' : 'info',
              stage: 'feynman_rpc',
              message: `[Feynman RPC] Tool ${event.isError ? 'failed' : 'done'}: ${pending.tool}`,
            });
          }
          pendingTools.delete(event.toolCallId);
          break;
        }
        case 'extension_error':
          onLog({ level: 'warn', stage: 'feynman_rpc', message: `[Feynman RPC] Extension error: ${event.error}` });
          break;
        default:
          break;
      }
    };

    attachJsonlReader(child.stdout, handleLine);
    attachJsonlReader(child.stderr, (line) => {
      if (line.trim()) onLog({ level: 'warn', message: line.trim() });
    });

    child.on('error', (error) => {
      finish(null, new Error(`Failed to launch Feynman: ${error.message}`));
    });

    child.on('close', (code) => {
      if (!settled) {
        if (text.trim()) {
          finish({ text, toolCalls, model: model || undefined });
        } else {
          finish(null, new Error(`Feynman process exited with code ${code} before completing turn`));
        }
      }
    });

    // Brief delay so RPC subprocess is ready before first prompt.
    setTimeout(() => {
      send({ id: String(++pendingRequestId), type: 'prompt', message });
    }, 1500);
  });
}

/**
 * Run a turn and parse JSON from the response, with one retry on parse failure.
 */
export async function runFeynmanTurnForJson({ message, sessionId, onLog, timeoutMs }) {
  let lastError;
  let turnResult = await runFeynmanTurn({ message, sessionId, onLog, timeoutMs });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const parsed = extractJsonFromAgentText(turnResult.text);
      return { ...turnResult, json: parsed };
    } catch (error) {
      lastError = error;
      if (attempt >= 2) break;
      onLog({ level: 'warn', stage: 'feynman_rpc', message: `[Feynman RPC] JSON parse failed (attempt ${attempt}), retrying` });
      turnResult = await runFeynmanTurn({
        message: 'Your previous response was not valid JSON. Return ONLY a single JSON object with no markdown fences or extra text.',
        sessionId: `${sessionId ?? 'turn'}-retry-${attempt}`,
        onLog,
        timeoutMs,
      });
    }
  }

  throw lastError ?? new Error('Failed to parse JSON from Feynman response');
}

export { getFeynmanRoot, getFeynmanModel };
