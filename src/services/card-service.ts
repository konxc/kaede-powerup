/**
 * Card Service — Trello card operations
 */

import type { ICardClient } from '../interfaces/icard-client';

export class CardService implements ICardClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

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
}
