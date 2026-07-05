import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { configManager } from './configManager.js';
import {
  attachJsonlReader,
  ensureWorkspaceTrusted,
  getFeynmanBinPath,
  getFeynmanCwd,
  getFeynmanModel,
  getFeynmanSpawnEnv,
  getIdleTimeoutMs,
} from './feynmanShared.js';

function getSessionsDir() {
  return path.join(configManager.getWebRoot(), 'runtime', 'feynman-sessions');
}

class FeynmanSession extends EventEmitter {
  constructor(conversationId) {
    super();
    this.conversationId = conversationId;
    this.isStreaming = false;
    this.idleTimer = null;
    this.child = null;
    this.pendingRequestId = 0;
    this.startupComplete = false;
  }

  async start() {
    await ensureWorkspaceTrusted();

    const binPath = getFeynmanBinPath();
    const cwd = getFeynmanCwd();
    const sessionDir = path.join(getSessionsDir(), this.conversationId);
    mkdirSync(sessionDir, { recursive: true });

    const model = getFeynmanModel();
    const args = [binPath, '--mode', 'rpc', '--session-dir', sessionDir, '--cwd', cwd];
    if (model) args.push('--model', model);

    const stderrLines = [];

    await new Promise((resolve, reject) => {
      let settled = false;
      let readyTimer = null;
      const finish = (error, session) => {
        if (settled) return;
        settled = true;
        if (readyTimer) clearTimeout(readyTimer);
        if (error) reject(error);
        else resolve(session);
      };

      this.child = spawn(process.execPath, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: getFeynmanSpawnEnv(),
      });

      attachJsonlReader(this.child.stdout, (line) => this.handleLine(line));
      attachJsonlReader(this.child.stderr, (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        stderrLines.push(trimmed);
        this.emit('log', { level: 'warn', message: trimmed });
        if (/Unknown model|Pro-class model disabled/i.test(trimmed)) {
          if (this.startupComplete) {
            this.emit('error', { message: trimmed });
            this.stop();
          } else {
            finish(new Error(trimmed));
            this.child?.kill();
          }
        }
      });

      this.child.on('error', (error) => {
        finish(new Error(`Failed to launch Feynman: ${error.message}`));
      });

      const onStartupExit = (code) => {
        const detail = stderrLines.join('\n').trim() || `Feynman exited during startup (code ${code})`;
        finish(new Error(detail));
      };

      this.child.once('exit', onStartupExit);

      readyTimer = setTimeout(() => {
        this.child?.off('exit', onStartupExit);
        if (this.child?.exitCode !== null) {
          finish(new Error(stderrLines.at(-1) ?? `Feynman exited with code ${this.child.exitCode}`));
          return;
        }

        this.child.on('close', (code) => {
          this.clearIdleTimer();
          this.emit('closed', { code });
        });

        this.resetIdleTimer();
        this.startupComplete = true;
        finish(null, this);
      }, 2000);
    });

    return this;
  }

  handleLine(line) {
    if (!line.trim()) return;
    this.resetIdleTimer();

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      this.emit('log', { level: 'info', message: line.trim() });
      return;
    }

    switch (event.type) {
      case 'response': {
        if (event.success === false) {
          this.emit('error', { message: event.error ?? `${event.command} failed` });
        }
        break;
      }
      case 'agent_start': {
        this.isStreaming = true;
        break;
      }
      case 'agent_end': {
        this.isStreaming = false;
        const last = Array.isArray(event.messages) ? event.messages.at(-1) : null;
        if (last?.role === 'assistant' && last.stopReason === 'error') {
          this.emit('error', { message: last.errorMessage ?? 'Model request failed with no response.' });
        }
        this.emit('turn_end', {});
        break;
      }
      case 'message_update': {
        const delta = event.assistantMessageEvent;
        if (delta?.type === 'text_delta' && delta.delta) {
          this.emit('delta', { text: delta.delta });
        } else if (delta?.type === 'thinking_delta' && delta.delta) {
          this.emit('thinking', { text: delta.delta });
        } else if (delta?.type === 'error') {
          this.emit('error', { message: 'Model request failed (see server logs for details).' });
        }
        break;
      }
      case 'turn_end': {
        const message = event.message;
        if (message?.role === 'assistant' && message.stopReason === 'error') {
          this.emit('error', { message: message.errorMessage ?? 'Model request failed with no response.' });
        }
        break;
      }
      case 'tool_execution_start': {
        this.emit('tool', { phase: 'start', toolName: event.toolName, toolCallId: event.toolCallId, args: event.args });
        break;
      }
      case 'tool_execution_end': {
        this.emit('tool', { phase: 'end', toolName: event.toolName, toolCallId: event.toolCallId, isError: event.isError });
        break;
      }
      case 'extension_error': {
        this.emit('log', { level: 'warn', message: `Extension error (${event.extensionPath}): ${event.error}` });
        break;
      }
      default:
        break;
    }
  }

  send(command) {
    if (!this.child || this.child.exitCode !== null) {
      throw new Error('Feynman session is not running');
    }
    this.resetIdleTimer();
    this.child.stdin.write(`${JSON.stringify(command)}\n`);
  }

  prompt(message) {
    if (this.isStreaming) {
      this.send({ id: String(++this.pendingRequestId), type: 'prompt', message, streamingBehavior: 'steer' });
      return;
    }
    this.send({ id: String(++this.pendingRequestId), type: 'prompt', message });
  }

  resetIdleTimer() {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.emit('log', { level: 'info', message: 'Feynman session idle timeout reached; closing.' });
      this.stop();
    }, getIdleTimeoutMs());
    this.idleTimer.unref?.();
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  stop() {
    this.clearIdleTimer();
    this.child?.kill();
  }
}

class FeynmanBridge {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(conversationId) {
    if (this.sessions.has(conversationId)) {
      return this.sessions.get(conversationId);
    }
    const session = new FeynmanSession(conversationId);
    await session.start();
    session.once('closed', () => this.sessions.delete(conversationId));
    this.sessions.set(conversationId, session);
    return session;
  }

  getSession(conversationId) {
    return this.sessions.get(conversationId) ?? null;
  }

  sendMessage(conversationId, message) {
    const session = this.getSession(conversationId);
    if (!session) {
      throw new Error('Feynman session not found');
    }
    session.prompt(message);
  }

  endSession(conversationId) {
    const session = this.sessions.get(conversationId);
    if (!session) return;
    session.stop();
    this.sessions.delete(conversationId);
  }
}

export const feynmanBridge = new FeynmanBridge();
export { FeynmanSession };
