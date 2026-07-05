/**
 * Checklist Service — Trello checklist operations
 */

import type { IChecklistClient } from '../interfaces/ichecklist-client';

export class ChecklistService implements IChecklistClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

  async createChecklist(cardId: string, name: string): Promise<unknown> {
    return this.callTool('create_checklist', { cardId, name });
  }

  async addChecklistItem(checklistId: string, name: string, checked?: boolean): Promise<unknown> {
    const args: Record<string, unknown> = { checklistId, name };
    if (checked !== undefined) args.checked = checked;
    return this.callTool('add_checklist_item', args);
  }

  async deleteChecklist(checklistId: string): Promise<unknown> {
    return this.callTool('delete_checklist', { checklistId });
  }

  async deleteChecklistItem(checklistId: string, checkItemId: string): Promise<unknown> {
    return this.callTool('delete_checklist_item', { checklistId, checkItemId });
  }

  async updateChecklistItem(options: {
    checklistId: string;
    checkItemId: string;
    name?: string;
    checked?: boolean;
  }): Promise<unknown> {
    const { checklistId, checkItemId, name, checked } = options;
    return this.callTool('update_checklist_item', { checklistId, checkItemId, name, checked });
  }

  async getCardChecklists(cardId: string): Promise<unknown> {
    return this.callTool('get_card_checklists', { cardId });
  }

  async copyChecklist(sourceChecklistId: string, cardId: string): Promise<unknown> {
    return this.callTool('copy_checklist', { sourceChecklistId, cardId });
  }
}
