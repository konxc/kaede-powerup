/**
 * List action executors — create_list, archive_list
 */

import type { ExecutorFn } from './types';

export const execCreateList: ExecutorFn = async (client, p, boardId) => {
  const r = await client.createList(boardId, p.name as string);
  const rr = r as Record<string, unknown>;
  return { id: rr.id as string, name: p.name as string };
};

export const execArchiveList: ExecutorFn = async (client, p) => {
  await client.archiveList(p.listId as string);
  return { id: p.listId as string };
};
