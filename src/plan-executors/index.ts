/**
 * Plan Executors — Registry barrel
 *
 * Map action name → executor function, menggantikan switch(action) statement.
 */

import type { ExecutorFn } from './types';
import { execCreateList, execArchiveList, execCopyList, execMoveList } from './list';
import { execCreateCard, execUpdateCard, execArchiveCard, execMoveCard } from './card';
import { execCreateLabel } from './label';
import { execCreateChecklist, execDeleteChecklist } from './checklist';
import { execAssignMember, execRemoveMember } from './member';
import { execAddComment } from './comment';

export type { ExecutorFn } from './types';

export const EXECUTORS: Record<string, ExecutorFn> = {
  create_list: execCreateList,
  create_card: execCreateCard,
  create_checklist: execCreateChecklist,
  add_comment: execAddComment,
  create_label: execCreateLabel,
  assign_member: execAssignMember,
  move_card: execMoveCard,
  archive_card: execArchiveCard,
  update_card: execUpdateCard,
  archive_list: execArchiveList,
  copy_list: execCopyList,
  move_list: execMoveList,
  delete_checklist: execDeleteChecklist,
  remove_member: execRemoveMember,
};
