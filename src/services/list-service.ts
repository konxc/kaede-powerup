/**
 * List Service — Trello list operations
 */

import type { IListClient } from '../interfaces/ilist-client';

export class ListService implements IListClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

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

  async sortListCards(listId: string, sort: string): Promise<unknown> {
    return this.callTool('sort_list_cards', { listId, sort });
  }

  async copyList(sourceListId: string, targetBoardId: string, name?: string): Promise<unknown> {
    return this.callTool('copy_list', { sourceListId, targetBoardId, name });
  }

  async moveList(listId: string, targetBoardId: string): Promise<unknown> {
    return this.callTool('move_list', { listId, targetBoardId });
  }
}
