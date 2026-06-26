/**
 * Trello MCP Client — Wrapper untuk komunikasi dengan Trello MCP Server
 *
 * Menggunakan stdio JSON-RPC 2.0 untuk berkomunikasi dengan dist/mcp-server.js
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { createInterface } from 'readline';

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export class TrelloMCPClient {
  constructor(serverPath, timeout = REQUEST_TIMEOUT) {
    this.serverPath = serverPath || resolve(process.cwd(), 'dist', 'mcp-server.js');
    this.rpcId = 0;
    this.pending = new Map();
    this.process = null;
    this.rl = null;
    this._exited = false;
    this.requestTimeout = timeout;
  }

  async connect(retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this._connectOnce();
      } catch (err) {
        if (attempt === retries) throw err;
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  _connectOnce() {
    return new Promise((resolve, reject) => {
      this._exited = false;
      this.process = spawn('bun', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.rl = createInterface({
        input: this.process.stdout,
        crlfDelay: Infinity,
      });

      this.rl.on('line', (line) => {
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const { resolve: res, reject: rej, timer } = this.pending.get(msg.id);
            clearTimeout(timer);
            this.pending.delete(msg.id);
            if (msg.error) {
              rej(new Error(msg.error.message));
            } else {
              res(msg.result);
            }
          }
        } catch {
          // non-JSON line — skip silently
        }
      });

      this.process.on('error', reject);

      this.process.on('exit', (code) => {
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
      }).then(() => {
        this.sendNotification('notifications/initialized');
        resolve();
      }).catch(reject);
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.rpcId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout for ${method} (${this.requestTimeout}ms)`));
      }, this.requestTimeout);
      this.pending.set(id, { resolve, reject, timer });
      const msg = { jsonrpc: '2.0', id, method, params };
      this.process.stdin.write(JSON.stringify(msg) + '\n');
    });
  }

  sendNotification(method, params = {}) {
    const msg = { jsonrpc: '2.0', method, params };
    this.process.stdin.write(JSON.stringify(msg) + '\n');
  }

  async callTool(name, arguments_) {
    const result = await this.sendRequest('tools/call', { name, arguments: arguments_ });
    if (result.content && result.content[0] && result.content[0].type === 'text') {
      try {
        return JSON.parse(result.content[0].text);
      } catch {
        return result.content[0].text;
      }
    }
    return result;
  }

  // ── Boards ──

  async listBoards() {
    const r = await this.callTool('list_boards', {});
    return r.boards || [];
  }

  async listWorkspaces() {
    const r = await this.callTool('list_workspaces', {});
    return r.workspaces || [];
  }

  async createBoard(name, opts = {}) {
    return this.callTool('create_board', { name, ...opts });
  }

  // ── Lists ──

  async getLists(boardId) {
    const r = await this.callTool('get_lists', { boardId });
    return r.lists || [];
  }

  async createList(boardId, name) {
    return this.callTool('add_list_to_board', { boardId, name });
  }

  async archiveList(listId) {
    return this.callTool('archive_list', { listId });
  }

  // ── Cards ──

  async getMyCards() {
    const r = await this.callTool('get_my_cards', {});
    return r.cards || [];
  }

  async getCardsByListId(listId, boardId) {
    const r = await this.callTool('get_cards_by_list_id', { listId, boardId });
    return r.cards || [];
  }

  async getCard(cardId, includeMarkdown) {
    return this.callTool('get_card', { cardId, includeMarkdown });
  }

  async createCard(listId, name, description = '', labels = []) {
    return this.callTool('add_card_to_list', { listId, name, description, labels });
  }

  async updateCard(cardId, updates) {
    return this.callTool('update_card_details', { cardId, ...updates });
  }

  async moveCard(cardId, listId, boardId) {
    return this.callTool('move_card', { cardId, listId, boardId });
  }

  async archiveCard(cardId) {
    return this.callTool('archive_card', { cardId });
  }

  // ── Members ──

  async getBoardMembers(boardId) {
    const r = await this.callTool('get_board_members', { boardId });
    return r.members || [];
  }

  async assignMember(cardId, memberId) {
    return this.callTool('assign_member_to_card', { cardId, memberId });
  }

  async removeMember(cardId, memberId) {
    return this.callTool('remove_member_from_card', { cardId, memberId });
  }

  // ── Labels ──

  async getBoardLabels(boardId) {
    const r = await this.callTool('get_board_labels', { boardId });
    return r.labels || [];
  }

  async createLabel(boardId, name, color) {
    return this.callTool('create_label', { boardId, name, color });
  }

  async updateLabel(labelId, name, color) {
    return this.callTool('update_label', { labelId, name, color });
  }

  async deleteLabel(labelId) {
    return this.callTool('delete_label', { labelId });
  }

  // ── Labels (composite operations) ──

  async addLabelToCard(cardId, labelId) {
    const card = await this.getCard(cardId);
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.map(l => l.id);
    if (!labelIds.includes(labelId)) {
      labelIds.push(labelId);
      await this.updateCard(cardId, { labels: labelIds });
    }
  }

  async removeLabelFromCard(cardId, labelId) {
    const card = await this.getCard(cardId);
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.filter(l => l.id !== labelId).map(l => l.id);
    await this.updateCard(cardId, { labels: labelIds });
  }

  // ── Checklists ──

  async createChecklist(cardId, name) {
    return this.callTool('create_checklist', { cardId, name });
  }

  async addChecklistItem(checklistId, name, checked) {
    const args = { checklistId, name };
    if (checked !== undefined) args.checked = checked;
    return this.callTool('add_checklist_item', args);
  }

  // ── Comments ──

  async addComment(cardId, text) {
    return this.callTool('add_comment', { cardId, text });
  }

  async getCardComments(cardId, limit) {
    const r = await this.callTool('get_card_comments', { cardId, limit });
    return r.comments || [];
  }

  close() {
    if (this.process) {
      this.process.kill();
    }
    if (this.rl) {
      this.rl.close();
    }
  }
}
