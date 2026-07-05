/**
 * RPC Service — JSON-RPC 2.0 stdio client for MCP Trello server
 */

import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { createInterface } from 'readline';
import type { IRpcClient } from '../interfaces/irpc-client';

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

interface PendingEntry {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface MCPConfig {
  mcp?: {
    trello?: {
      command?: string[];
    };
  };
}

interface ToolResult {
  content?: Array<{ type: string; text?: string }>;
  [key: string]: unknown;
}

function getGlobalMcpServerPath(): string {
  const globalConfig = resolve(homedir(), '.config', 'opencode', 'opencode.json');
  if (existsSync(globalConfig)) {
    try {
      const config: MCPConfig = JSON.parse(readFileSync(globalConfig, 'utf-8'));
      const cmd = config.mcp?.trello?.command;
      if (Array.isArray(cmd) && cmd.length >= 2) return cmd[cmd.length - 1];
    } catch {
      // ignore parse errors
    }
  }
  const kaedeTrello = resolve(process.cwd(), 'packages', 'kaede-trello', 'src', 'mcp-server.ts');
  if (existsSync(kaedeTrello)) return kaedeTrello;
  const upstreamSub = resolve(process.cwd(), 'packages', 'mcp-server-trello', 'build', 'index.js');
  if (existsSync(upstreamSub)) return upstreamSub;
  const globalDir = resolve(homedir(), '.kaede', 'dist', 'mcp-server.js');
  if (existsSync(globalDir)) return globalDir;
  return resolve(process.cwd(), 'dist', 'mcp-server.js');
}

export class RpcService implements IRpcClient {
  serverPath: string;
  rpcId: number;
  pending: Map<number, PendingEntry>;
  process: ChildProcess | null;
  rl: ReturnType<typeof createInterface> | null;
  _exited: boolean;
  requestTimeout: number;

  constructor(serverPath?: string, timeout = REQUEST_TIMEOUT) {
    this.serverPath = serverPath || getGlobalMcpServerPath();
    this.rpcId = 0;
    this.pending = new Map();
    this.process = null;
    this.rl = null;
    this._exited = false;
    this.requestTimeout = timeout;
  }

  async connect(retries = MAX_RETRIES): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this._connectOnce();
      } catch (err) {
        if (attempt === retries) throw err;
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private _connectOnce(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._exited = false;
      this.process = spawn('bun', [this.serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

      this.rl = createInterface({
        input: this.process.stdout!,
        crlfDelay: Infinity,
      });

      this.rl.on('line', (line: string) => {
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const entry = this.pending.get(msg.id)!;
            clearTimeout(entry.timer);
            this.pending.delete(msg.id);
            if (msg.error) {
              entry.reject(new Error(msg.error.message));
            } else {
              entry.resolve(msg.result);
            }
          }
        } catch {
          // non-JSON line — skip silently
        }
      });

      this.process.on('error', reject);

      this.process.on('exit', (code: number | null) => {
        this._exited = true;
        if (this.pending.size > 0) {
          const errMsg = `MCP server exited with code ${code}`;
          for (const [, entry] of this.pending) {
            clearTimeout(entry.timer);
            entry.reject(new Error(errMsg));
          }
          this.pending.clear();
        }
      });

      this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'KAEDE-Orchestrator', version: '1.0.0' },
      })
        .then(() => {
          this.sendNotification('notifications/initialized');
          resolve();
        })
        .catch(reject);
    });
  }

  sendRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.rpcId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout for ${method} (${this.requestTimeout}ms)`));
      }, this.requestTimeout);
      this.pending.set(id, { resolve, reject, timer });
      const msg = { jsonrpc: '2.0', id, method, params };
      this.process!.stdin!.write(JSON.stringify(msg) + '\n');
    });
  }

  sendNotification(method: string, params: Record<string, unknown> = {}): void {
    const msg = { jsonrpc: '2.0', method, params };
    this.process!.stdin!.write(JSON.stringify(msg) + '\n');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = (await this.sendRequest('tools/call', { name, arguments: args })) as ToolResult;
    if (result.content && result.content[0] && result.content[0].type === 'text') {
      try {
        return JSON.parse(result.content[0].text!);
      } catch {
        return result.content[0].text;
      }
    }
    return result;
  }

  close(): void {
    if (this.process) this.process.kill();
    if (this.rl) this.rl.close();
  }
}
