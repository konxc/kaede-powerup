/**
 * Trello MCP Client — Wrapper untuk komunikasi dengan Trello MCP Server
 * 
 * Menggunakan stdio JSON-RPC 2.0 untuk berkomunikasi dengan dist/mcp-server.js
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { createInterface } from 'readline';

export class TrelloMCPClient {
  constructor(serverPath) {
    this.serverPath = serverPath || resolve(process.cwd(), 'dist', 'mcp-server.js');
    this.rpcId = 0;
    this.pending = new Map();
    this.process = null;
    this.rl = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
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
            const { resolve: res, reject: rej } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              rej(new Error(msg.error.message));
            } else {
              res(msg.result);
            }
          }
        } catch {
        }
      });

      this.process.on('error', reject);
      
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
      this.pending.set(id, { resolve, reject });
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

  async getBoardMembers(boardId) {
    const result = await this.callTool('get_board_members', { boardId });
    return result.members || [];
  }

  async getBoardLabels(boardId) {
    const result = await this.callTool('get_board_labels', { boardId });
    return result.labels || [];
  }

  async createLabel(boardId, name, color) {
    const result = await this.callTool('create_label', { boardId, name, color });
    return result;
  }

  async getLists(boardId) {
    const result = await this.callTool('get_lists', { boardId });
    return result.lists || [];
  }

  async createList(boardId, name) {
    const result = await this.callTool('add_list_to_board', { boardId, name });
    return result;
  }

  async getCard(cardId) {
    const result = await this.callTool('get_card', { cardId });
    return result;
  }

  async updateCard(cardId, updates) {
    const result = await this.callTool('update_card_details', { cardId, ...updates });
    return result;
  }

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

  async createCard(listId, name, description = '', labels = []) {
    const result = await this.callTool('add_card_to_list', { listId, name, description, labels });
    return result;
  }

  async assignMember(cardId, memberId) {
    const result = await this.callTool('assign_member_to_card', { cardId, memberId });
    return result;
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