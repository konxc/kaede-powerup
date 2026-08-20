export interface IChecklistClient {
  createChecklist(cardId: string, name: string): Promise<unknown>;
  addChecklistItem(checklistId: string, name: string, checked?: boolean): Promise<unknown>;
  deleteChecklist(checklistId: string): Promise<unknown>;
  deleteChecklistItem(checklistId: string, checkItemId: string): Promise<unknown>;
  updateChecklistItem(options: { checklistId: string; checkItemId: string; name?: string; checked?: boolean }): Promise<unknown>;
  getCardChecklists(cardId: string): Promise<unknown>;
  copyChecklist(sourceChecklistId: string, cardId: string): Promise<unknown>;
}
