export interface ILabelClient {
  getBoardLabels(boardId: string): Promise<unknown[]>;
  createLabel(boardId: string, name: string, color: string): Promise<unknown>;
  updateLabel(labelId: string, name: string, color: string): Promise<unknown>;
  deleteLabel(labelId: string): Promise<unknown>;
  addLabelToCard(cardId: string, labelId: string): Promise<void>;
  removeLabelFromCard(cardId: string, labelId: string): Promise<unknown>;
  searchLabels(boardId: string, query?: string): Promise<unknown>;
}
