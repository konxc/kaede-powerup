export interface IWatchClient {
  watchCard(cardId: string, add?: boolean): Promise<unknown>;
  unwatchCard(cardId: string): Promise<unknown>;
  watchList(listId: string, add?: boolean): Promise<unknown>;
  unwatchList(listId: string): Promise<unknown>;
  getCardActivity(cardId: string, options?: { filter?: string; limit?: number }): Promise<unknown>;
}
