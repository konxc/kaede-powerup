/**
 * Label Service — Trello label operations
 */

import type { ILabelClient } from '../interfaces/ilabel-client';

export class LabelService implements ILabelClient {
  constructor(
    private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
    private getCard: (cardId: string, includeMarkdown?: boolean) => Promise<unknown>,
    private updateCard: (cardId: string, updates: Record<string, unknown>) => Promise<unknown>,
  ) {}

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

  async addLabelToCard(cardId: string, labelId: string): Promise<void> {
    const card = (await this.getCard(cardId)) as { labels?: Array<{ id: string }> };
    const existingLabels = card.labels || [];
    const labelIds = existingLabels.map((l) => l.id);
    if (!labelIds.includes(labelId)) {
      labelIds.push(labelId);
      await this.updateCard(cardId, { labels: labelIds });
    }
  }

  async removeLabelFromCard(cardId: string, labelId: string): Promise<unknown> {
    return this.callTool('remove_label_from_card', { cardId, labelId });
  }

  async searchLabels(boardId: string, query = ''): Promise<unknown> {
    return this.callTool('search_labels', { boardId, query });
  }
}
