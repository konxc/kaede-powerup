/**
 * Board Service — Trello board operations
 */

import type { IBoardClient } from '../interfaces/iboard-client';

export class BoardService implements IBoardClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

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
}
