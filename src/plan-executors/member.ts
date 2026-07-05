/**
 * Member action executors — assign_member, remove_member
 */

import type { ExecutorFn } from './types';

export const execAssignMember: ExecutorFn = async (client, p) => {
  await client.assignMember(p.cardId as string, p.memberId as string);
  return { id: p.cardId as string };
};

export const execRemoveMember: ExecutorFn = async (client, p) => {
  await client.removeMember(p.cardId as string, p.memberId as string);
  return { id: p.cardId as string };
};
