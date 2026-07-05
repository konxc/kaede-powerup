export interface ICommentClient {
  addComment(cardId: string, text: string): Promise<unknown>;
  getCardComments(cardId: string, limit?: number): Promise<unknown[]>;
}
