/**
 * Checklist action executors — create_checklist, delete_checklist
 */

import type { ExecutorFn } from './types';

export const execCreateChecklist: ExecutorFn = async (client, p) => {
  const cardId = p.cardId as string;
  if (!cardId) return { error: 'cardId required for create_checklist' };
  const name = (p.name as string) || 'Checklist';
  const r = await client.createChecklist(cardId, name);
  const rr = r as Record<string, unknown>;

  const items = (p.items as string[]) || [];
  for (const item of items) {
    try { await client.addChecklistItem(rr.id as string, item); } catch {}
  }
  return { id: rr.id as string, name };
};

export const execDeleteChecklist: ExecutorFn = async (client, p) => {
  await client.deleteChecklist(p.checklistId as string);
  return { id: p.checklistId as string };
};
