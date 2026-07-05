/**
 * Card action executors — create_card, update_card, archive_card, move_card
 */

import type { ExecutorFn } from './types';

export const execCreateCard: ExecutorFn = async (client, p, boardId, cache) => {
  if (!cache.lists) cache.lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const listName = (p.listName as string) || (p.list as string) || '';
  let listId = p.listId as string;
  if (!listId && listName) {
    const target = cache.lists.find(
      (l: Record<string, unknown>) => (l.name as string).toLowerCase() === listName.toLowerCase(),
    );
    if (!target) return { error: `List "${listName}" not found on board ${boardId}` };
    listId = target.id as string;
  }
  if (!listId) return { error: 'listId or listName required' };

  const labels = (p.labels as string[]) || [];
  const r = await client.createCard(listId, p.name as string, (p.desc as string) || '', labels);
  const rr = r as Record<string, unknown>;

  if (p.start || p.due) {
    const updates: Record<string, unknown> = {};
    if (p.start) updates.start = p.start;
    if (p.due) updates.due = p.due;
    try { await client.updateCard(rr.id as string, updates); } catch {}
  }

  return { id: rr.id as string, name: p.name as string };
};

export const execUpdateCard: ExecutorFn = async (client, p) => {
  const updates: Record<string, unknown> = {};
  if (p.name) updates.name = p.name;
  if (p.description || p.desc) updates.description = p.description || p.desc;
  if (p.due) updates.due = p.due;
  if (p.start) updates.start = p.start;
  if (p.closed !== undefined) updates.closed = p.closed;
  await client.updateCard(p.cardId as string, updates);
  return { id: p.cardId as string };
};

export const execArchiveCard: ExecutorFn = async (client, p) => {
  await client.archiveCard(p.cardId as string);
  return { id: p.cardId as string };
};

export const execMoveCard: ExecutorFn = async (client, p, boardId, cache) => {
  if (!cache.lists) cache.lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const listName = p.listName as string;
  let listId = p.listId as string;
  if (!listId && listName) {
    const target = cache.lists.find(
      (l: Record<string, unknown>) => (l.name as string).toLowerCase() === listName.toLowerCase(),
    );
    if (!target) return { error: `Target list "${listName}" not found` };
    listId = target.id as string;
  }

  try {
    const card = await client.getCard(p.cardId as string) as Record<string, unknown>;
    if (card && card.listId) {
      p._sourceListId = card.listId as string;
    }
  } catch {}

  await client.moveCard(p.cardId as string, listId, boardId);
  return { id: p.cardId as string };
};
