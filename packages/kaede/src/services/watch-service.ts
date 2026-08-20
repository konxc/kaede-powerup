/**
 * Watch Service — Trello watch/subscription operations
 */

import type { IWatchClient } from '../interfaces/iwatch-client';

export class WatchService implements IWatchClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

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
}
