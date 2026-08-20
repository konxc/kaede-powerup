/**
 * Comment action executors — add_comment
 */

import type { ExecutorFn } from './types';

export const execAddComment: ExecutorFn = async (client, p) => {
  const cardId = p.cardId as string;
  if (!cardId) return { error: 'cardId required for add_comment' };
  await client.addComment(cardId, p.text as string);
  return { id: cardId };
};
