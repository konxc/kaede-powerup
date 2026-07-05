/**
 * Label action executors — create_label
 */

import type { ExecutorFn } from './types';

export const execCreateLabel: ExecutorFn = async (client, p, boardId) => {
  const r = await client.createLabel(boardId, p.name as string, (p.color as string) || 'blue');
  const rr = r as Record<string, unknown>;
  return { id: rr.id as string, name: p.name as string };
};
