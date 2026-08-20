/**
 * Comment Service — Trello comment operations
 */

import type { ICommentClient } from '../interfaces/icomment-client';

export class CommentService implements ICommentClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

  async addComment(cardId: string, text: string): Promise<unknown> {
    return this.callTool('add_comment', { cardId, text });
  }

  async getCardComments(cardId: string, limit?: number): Promise<unknown[]> {
    const r = (await this.callTool('get_card_comments', { cardId, limit })) as { comments?: unknown[] };
    return r.comments || [];
  }
}
