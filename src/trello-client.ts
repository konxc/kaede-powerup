/**
 * Trello MCP Client — Wrapper untuk komunikasi dengan Trello MCP Server
 *
 * Menggunakan stdio JSON-RPC 2.0 untuk berkomunikasi dengan MCP Trello server
 * Prioritas: 1) global opencode.json → 2) packages/kaede-trello/src/mcp-server.ts
 *           → 3) packages/mcp-server-trello/build/index.js → 4) dist/mcp-server.js
 */

import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { createInterface } from 'readline';

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
  content?: Array<{
    type: string;
    text?: string;
  }>;
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

export class TrelloMCPClient {
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

  _connectOnce(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._exited = false;
      this.process = spawn('bun', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

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

  // ─── Boards ───

  async listBoards(): Promise<unknown[]> {
    const r = (await this.callTool('list_boards', {})) as { boards?: unknown[] };
    return r.boards || [];
  }

  async listWorkspaces(): Promise<unknown[]> {
    const r = (await this.callTool('list_workspaces', {})) as { workspaces?: unknown[] };
    return r.workspaces || [];
  }

  async createBoard(name: string, opts: Record<string, unknown> = {}): Promise<unknown> {
    return this.callTool('create_board', { name, ...opts });
  }

  // ─── Lists ───

  async getLists(boardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_lists', { boardId })) as { lists?: unknown[] };
    return r.lists || [];
  }

  async createList(boardId: string, name: string): Promise<unknown> {
    return this.callTool('add_list_to_board', { boardId, name });
  }

  async archiveList(listId: string): Promise<unknown> {
    return this.callTool('archive_list', { listId });
  }

  // ─── Cards ───

  async getMyCards(): Promise<unknown[]> {
    const r = (await this.callTool('get_my_cards', {})) as { cards?: unknown[] };
    return r.cards || [];
  }

  async getCardsByListId(listId: string, boardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_cards_by_list_id', { listId, boardId })) as { cards?: unknown[] };
    return r.cards || [];
  }

  async getCard(cardId: string, includeMarkdown?: boolean): Promise<unknown> {
    return this.callTool('get_card', { cardId, includeMarkdown });
  }

  async createCard(listId: string, name: string, description = '', labels: string[] = []): Promise<unknown> {
    return this.callTool('add_card_to_list', { listId, name, description, labels });
  }

  async updateCard(cardId: string, updates: Record<string, unknown>): Promise<unknown> {
    return this.callTool('update_card_details', { cardId, ...updates });
  }

  async moveCard(cardId: string, listId: string, boardId?: string): Promise<unknown> {
    return this.callTool('move_card', { cardId, listId, boardId });
  }

  async archiveCard(cardId: string): Promise<unknown> {
    return this.callTool('archive_card', { cardId });
  }

  // ─── Members ───

  async getBoardMembers(boardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_board_members', { boardId })) as { members?: unknown[] };
    return r.members || [];
  }

  async assignMember(cardId: string, memberId: string): Promise<unknown> {
    return this.callTool('assign_member_to_card', { cardId, memberId });
  }

  async removeMember(cardId: string, memberId: string): Promise<unknown> {
    return this.callTool('remove_member_from_card', { cardId, memberId });
  }

  // ─── Labels ───

  async getBoardLabels(boardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_board_labels', { boardId })) as { labels?: unknown[] };
    return r.labels || [];
  }

  async createLabel(boardId: string, name: string, color: string): Promise<unknown> {
    return this.callTool('create_label', { boardId, name, color });
  }

  async updateLabel(labelId: string, name: string, color: string): Promise<unknown> {
    return this.callTool('update_label', { labelId, name, color });
  }

  async deleteLabel(labelId: string): Promise<unknown> {
    return this.callTool('delete_label', { labelId });
  }

  // ─── Labels (composite operations) ───

  async addLabelToCard(cardId: string, labelId: string): Promise<void> {
    const card = (await this.getCard(cardId)) as { labels?: Array<{ id: string }> };
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.map((l) => l.id);
    if (!labelIds.includes(labelId)) {
      labelIds.push(labelId);
      await this.updateCard(cardId, { labels: labelIds });
    }
  }

  // ─── Checklists ───

  async createChecklist(cardId: string, name: string): Promise<unknown> {
    return this.callTool('create_checklist', { cardId, name });
  }

  async addChecklistItem(checklistId: string, name: string, checked?: boolean): Promise<unknown> {
    const args: Record<string, unknown> = { checklistId, name };
    if (checked !== undefined) args.checked = checked;
    return this.callTool('add_checklist_item', args);
  }

  // ─── Comments ───

  async addComment(cardId: string, text: string): Promise<unknown> {
    return this.callTool('add_comment', { cardId, text });
  }

  async getCardComments(cardId: string, limit?: number): Promise<unknown[]> {
    const r = (await this.callTool('get_card_comments', { cardId, limit })) as { comments?: unknown[] };
    return r.comments || [];
  }

  // ─── Attachments ───

  async attachFileToCard(cardId: string, fileUrl: string, name?: string, mimeType?: string): Promise<unknown> {
    return this.callTool('attach_file_to_card', { cardId, fileUrl, name, mimeType });
  }

  async attachImageToCard(cardId: string, imageUrl: string, name?: string): Promise<unknown> {
    return this.callTool('attach_image_to_card', { cardId, imageUrl, name });
  }

  async getCardAttachments(cardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_card_attachments', { cardId })) as { attachments?: unknown[] };
    return r.attachments || [];
  }

  async attachDataToCard(cardId: string, data: string, name?: string, mimeType?: string): Promise<unknown> {
    return this.callTool('attach_data_to_card', { cardId, data, name, mimeType });
  }

  async attachImageDataToCard(cardId: string, imageData: string, name?: string): Promise<unknown> {
    return this.callTool('attach_image_data_to_card', { cardId, imageData, name });
  }

  async copyCard(options: {
    sourceCardId: string;
    listId: string;
    name?: string;
    description?: string;
    keepFromSource?: string;
    pos?: string;
  }): Promise<unknown> {
    const { sourceCardId, listId, name, description, keepFromSource, pos } = options;
    return this.callTool('copy_card', { sourceCardId, listId, name, description, keepFromSource, pos });
  }

  // ─── Checklist Management ───

  async deleteChecklist(checklistId: string): Promise<unknown> {
    return this.callTool('delete_checklist', { checklistId });
  }

  async deleteChecklistItem(checklistId: string, checkItemId: string): Promise<unknown> {
    return this.callTool('delete_checklist_item', { checklistId, checkItemId });
  }

  async updateChecklistItem(options: {
    checklistId: string;
    checkItemId: string;
    name?: string;
    checked?: boolean;
  }): Promise<unknown> {
    const { checklistId, checkItemId, name, checked } = options;
    return this.callTool('update_checklist_item', { checklistId, checkItemId, name, checked });
  }

  async getCardChecklists(cardId: string): Promise<unknown> {
    return this.callTool('get_card_checklists', { cardId });
  }

  // ─── Watch & Activity ───

  async watchCard(cardId: string, add = true): Promise<unknown> {
    return this.callTool('watch_card', { cardId, add, remove: !add });
  }

  async unwatchCard(cardId: string): Promise<unknown> {
    return this.callTool('watch_card', { cardId, add: false, remove: true });
  }

  async watchList(listId: string, add = true): Promise<unknown> {
    return this.callTool('watch_list', { listId, add, remove: !add });
  }

  async unwatchList(listId: string): Promise<unknown> {
    return this.callTool('watch_list', { listId, add: false, remove: true });
  }

  async getCardActivity(cardId: string, options: { filter?: string; limit?: number } = {}): Promise<unknown> {
    const { filter, limit } = options;
    return this.callTool('get_card_activity', { cardId, filter, limit });
  }

  async searchLabels(boardId: string, query = ''): Promise<unknown> {
    return this.callTool('search_labels', { boardId, query });
  }

  async removeLabelFromCard(cardId: string, labelId: string): Promise<unknown> {
    return this.callTool('remove_label_from_card', { cardId, labelId });
  }

  // ─── Sort & Advanced List Management ───

  async copyChecklist(sourceChecklistId: string, cardId: string): Promise<unknown> {
    return this.callTool('copy_checklist', { sourceChecklistId, cardId });
  }

  async sortListCards(listId: string, sort: string): Promise<unknown> {
    return this.callTool('sort_list_cards', { listId, sort });
  }

  async updateList(options: {
    listId: string;
    name?: string;
    closed?: boolean;
    pos?: number;
    subscribed?: boolean;
  }): Promise<unknown> {
    const { listId, name, closed, pos, subscribed } = options;
    return this.callTool('update_list', { listId, name, closed, pos, subscribed });
  }

  close(): void {
    if (this.process) {
      this.process.kill();
    }
    if (this.rl) {
      this.rl.close();
    }
  }
}
