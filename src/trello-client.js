/**
 * Trello MCP Client â€” Wrapper untuk komunikasi dengan Trello MCP Server
 *
 * Menggunakan stdio JSON-RPC 2.0 untuk berkomunikasi dengan MCP Trello server
 * Prioritas: 1) global opencode.json → 2) packages/kaede-trello/src/mcp-server.js
 *           → 3) packages/mcp-server-trello/build/index.js → 4) dist/mcp-server.js
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { createInterface } from 'readline';

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

function getGlobalMcpServerPath() {
  const globalConfig = resolve(homedir(), '.config', 'opencode', 'opencode.json');
  if (existsSync(globalConfig)) {
    try {
      const config = JSON.parse(readFileSync(globalConfig, 'utf-8'));
      const cmd = config.mcp?.trello?.command;
      if (Array.isArray(cmd) && cmd.length >= 2) return cmd[cmd.length - 1];
    } catch {}
  }
  const kaedeTrello = resolve(process.cwd(), 'packages', 'kaede-trello', 'src', 'mcp-server.js');
  if (existsSync(kaedeTrello)) return kaedeTrello;
  const upstreamSub = resolve(process.cwd(), 'packages', 'mcp-server-trello', 'build', 'index.js');
  if (existsSync(upstreamSub)) return upstreamSub;
  const globalDir = resolve(homedir(), '.kaede', 'dist', 'mcp-server.js');
  if (existsSync(globalDir)) return globalDir;
  return resolve(process.cwd(), 'dist', 'mcp-server.js');
}

export class TrelloMCPClient {
  constructor(serverPath, timeout = REQUEST_TIMEOUT) {
    this.serverPath = serverPath || getGlobalMcpServerPath();
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
        await new Promise((r) => setTimeout(r, delay));
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
          // non-JSON line â€” skip silently
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
      })
        .then(() => {
          this.sendNotification('notifications/initialized');
          resolve();
        })
        .catch(reject);
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

  // â”€â”€ Boards â”€â”€

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

  // â”€â”€ Lists â”€â”€

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

  // â”€â”€ Cards â”€â”€

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

  // â”€â”€ Members â”€â”€

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

  // â”€â”€ Labels â”€â”€

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

  // â”€â”€ Labels (composite operations) â”€â”€

  async addLabelToCard(cardId, labelId) {
    const card = await this.getCard(cardId);
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.map((l) => l.id);
    if (!labelIds.includes(labelId)) {
      labelIds.push(labelId);
      await this.updateCard(cardId, { labels: labelIds });
    }
  }

  async removeLabelFromCard(cardId, labelId) {
    const card = await this.getCard(cardId);
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.filter((l) => l.id !== labelId).map((l) => l.id);
    await this.updateCard(cardId, { labels: labelIds });
  }

  // â”€â”€ Checklists â”€â”€

  async createChecklist(cardId, name) {
    return this.callTool('create_checklist', { cardId, name });
  }

  async addChecklistItem(checklistId, name, checked) {
    const args = { checklistId, name };
    if (checked !== undefined) args.checked = checked;
    return this.callTool('add_checklist_item', args);
  }

  // â”€â”€ Comments â”€â”€

  async addComment(cardId, text) {
    return this.callTool('add_comment', { cardId, text });
  }

  async getCardComments(cardId, limit) {
    const r = await this.callTool('get_card_comments', { cardId, limit });
    return r.comments || [];
  }
  // ─── Attachments ──

  async attachFileToCard(cardId, fileUrl, name, mimeType) {
    return this.callTool('attach_file_to_card', { cardId, fileUrl, name, mimeType });
  }

  async attachImageToCard(cardId, imageUrl, name) {
    return this.callTool('attach_image_to_card', { cardId, imageUrl, name });
  }

  async getCardAttachments(cardId) {
    const r = await this.callTool('get_card_attachments', { cardId });
    return r.attachments || [];
  }
  async attachDataToCard(cardId, data, name, mimeType) {
    return this.callTool('attach_data_to_card', { cardId, data, name, mimeType });
  }

  async attachImageDataToCard(cardId, imageData, name) {
    return this.callTool('attach_image_data_to_card', { cardId, imageData, name });
  }
  async copyCard(options) {
    const { sourceCardId, listId, name, description, keepFromSource, pos } = options;
    return this.callTool('copy_card', { sourceCardId, listId, name, description, keepFromSource, pos });
  }

  // ─── Checklist Management (NEW) ──
  async deleteChecklist(checklistId) {
    return this.callTool('delete_checklist', { checklistId });
  }

  async deleteChecklistItem(checklistId, checkItemId) {
    return this.callTool('delete_checklist_item', { checklistId, checkItemId });
  }

  async updateChecklistItem(options) {
    const { checklistId, checkItemId, name, checked } = options;
    return this.callTool('update_checklist_item', { checklistId, checkItemId, name, checked });
  }

  async getCardChecklists(cardId) {
    return this.callTool('get_card_checklists', { cardId });
  }

  // ─── Watch & Activity (Phase 3) ──
  async watchCard(cardId, add = true) {
    return this.callTool('watch_card', { cardId, add, remove: !add });
  }

  async unwatchCard(cardId) {
    return this.callTool('watch_card', { cardId, add: false, remove: true });
  }

  async watchList(listId, add = true) {
    return this.callTool('watch_list', { listId, add, remove: !add });
  }

  async unwatchList(listId) {
    return this.callTool('watch_list', { listId, add: false, remove: true });
  }

  async getCardActivity(cardId, options = {}) {
    const { filter, limit } = options;
    return this.callTool('get_card_activity', { cardId, filter, limit });
  }

  async searchLabels(boardId, query = '') {
    return this.callTool('search_labels', { boardId, query });
  }

  async removeLabelFromCard(cardId, labelId) {
    return this.callTool('remove_label_from_card', { cardId, labelId });
  }

  // ─── Sort & Advanced List Management (Phase 4) ──
  async copyChecklist(sourceChecklistId, cardId) {
    return this.callTool('copy_checklist', { sourceChecklistId, cardId });
  }

  async sortListCards(listId, sort) {
    return this.callTool('sort_list_cards', { listId, sort });
  }

  async updateList(options) {
    const { listId, name, closed, pos, subscribed } = options;
    return this.callTool('update_list', { listId, name, closed, pos, subscribed });
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
