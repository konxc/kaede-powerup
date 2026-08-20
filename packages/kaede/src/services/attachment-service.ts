/**
 * Attachment Service — Trello attachment operations
 */

import type { IAttachmentClient } from '../interfaces/iattachment-client';

export class AttachmentService implements IAttachmentClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

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
}
