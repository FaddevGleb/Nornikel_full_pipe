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

    this.child = spawn(process.execPath, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: getFeynmanSpawnEnv(),
    });

    attachJsonlReader(this.child.stdout, (line) => this.handleLine(line));
    attachJsonlReader(this.child.stderr, (line) => {
      if (line.trim()) this.emit('log', { level: 'warn', message: line.trim() });
    });

    this.child.on('error', (error) => {
      this.emit('error', { message: `Failed to launch Feynman: ${error.message}` });
    });

    this.child.on('close', (code) => {
      this.clearIdleTimer();
      this.emit('closed', { code });
    });

    this.resetIdleTimer();
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
        if (message?.role === 'assistant' && message.stopReason === 'error' && (!message.content || message.content.length === 0)) {
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
