export interface IAttachmentClient {
  attachFileToCard(cardId: string, fileUrl: string, name?: string, mimeType?: string): Promise<unknown>;
  attachImageToCard(cardId: string, imageUrl: string, name?: string): Promise<unknown>;
  getCardAttachments(cardId: string): Promise<unknown[]>;
  attachDataToCard(cardId: string, data: string, name?: string, mimeType?: string): Promise<unknown>;
  attachImageDataToCard(cardId: string, imageData: string, name?: string): Promise<unknown>;
}
