export interface ICardClient {
  getMyCards(): Promise<unknown[]>;
  getCardsByListId(listId: string, boardId: string): Promise<unknown[]>;
  getCard(cardId: string, includeMarkdown?: boolean): Promise<unknown>;
  createCard(listId: string, name: string, description?: string, labels?: string[]): Promise<unknown>;
  updateCard(cardId: string, updates: Record<string, unknown>): Promise<unknown>;
  moveCard(cardId: string, listId: string, boardId?: string): Promise<unknown>;
  archiveCard(cardId: string): Promise<unknown>;
  copyCard(options: { sourceCardId: string; listId: string; name?: string; description?: string; keepFromSource?: string; pos?: string }): Promise<unknown>;
}
