/**
 * KAEDE Plan Executor
 *
 * Menjalankan rencana multi-langkah (PlanStep[]), melacak referensi
 * antar langkah, dan menyediakan undo/rollback.
 */

import { TrelloMCPClient } from './trello-client';
import { getErrorMessage } from './types';
import type { ExecStepResult, ExecutedStep, ExecPlanResult, PlanStep, BoardSpec } from './types';
import { addExecutionHistory, getLastExecutionHistory, removeLastExecutionHistory } from './history-store';

async function executePlanStep(
  client: TrelloMCPClient,
  action: string,
  params: Record<string, unknown>,
  boardId: string,
  cache: { lists?: Array<Record<string, unknown>> },
): Promise<{ id?: string; name?: string; error?: string }> {
  const p = { ...params };

  switch (action) {
    case 'create_list': {
      const r = await client.createList(boardId, p.name as string);
      const rr = r as Record<string, unknown>;
      return { id: rr.id as string, name: p.name as string };
    }

    case 'create_card': {
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
    }

    case 'create_checklist': {
      const cardId = p.cardId as string;
      if (!cardId) return { error: 'cardId required for create_checklist' };
      const name = (p.name as string) || 'Checklist';
      const r = await client.createChecklist(cardId, name);
      const rr = r as Record<string, unknown>;

      const items = (p.items as string[]) || [];
      for (const item of items) {
        try { await client.addChecklistItem(rr.id as string, item); } catch {}
      }
      return { id: rr.id as string, name: name };
    }

    case 'add_comment': {
      const cardId = p.cardId as string;
      if (!cardId) return { error: 'cardId required for add_comment' };
      await client.addComment(cardId, p.text as string);
      return { id: cardId };
    }

    case 'create_label': {
      const r = await client.createLabel(boardId, p.name as string, (p.color as string) || 'blue');
      const rr = r as Record<string, unknown>;
      return { id: rr.id as string, name: p.name as string };
    }

    case 'assign_member': {
      await client.assignMember(p.cardId as string, p.memberId as string);
      return { id: p.cardId as string };
    }

    case 'move_card': {
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
    }

    case 'archive_card': {
      await client.archiveCard(p.cardId as string);
      return { id: p.cardId as string };
    }

    case 'update_card': {
      const updates: Record<string, unknown> = {};
      if (p.name) updates.name = p.name;
      if (p.description || p.desc) updates.description = p.description || p.desc;
      if (p.due) updates.due = p.due;
      if (p.start) updates.start = p.start;
      if (p.closed !== undefined) updates.closed = p.closed;
      await client.updateCard(p.cardId as string, updates);
      return { id: p.cardId as string };
    }

    case 'archive_list': {
      await client.archiveList(p.listId as string);
      return { id: p.listId as string };
    }

    case 'delete_checklist': {
      await client.deleteChecklist(p.checklistId as string);
      return { id: p.checklistId as string };
    }

    case 'remove_member': {
      await client.removeMember(p.cardId as string, p.memberId as string);
      return { id: p.cardId as string };
    }

    default:
      return { error: `Unknown action: ${action}` };
  }
}

function resolveRefs(params: Record<string, unknown>, refMap: Map<string, { id: string; type: string }>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string' && val.startsWith('ref:')) {
      const refKey = val.slice(4);
      const entry = refMap.get(refKey);
      resolved[key] = entry ? entry.id : val;
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

function buildInverseStep(step: ExecStepResult, action: string, params: Record<string, unknown>): ExecutedStep | null {
  const inverse: Partial<ExecutedStep> = { action, params, ref: step.ref, resultId: step.resultId };

  switch (action) {
    case 'create_card':
      if (step.resultId) {
        inverse.inverseAction = 'archive_card';
        inverse.inverseParams = { cardId: step.resultId };
      }
      break;
    case 'create_list':
      if (step.resultId) {
        inverse.inverseAction = 'archive_list';
        inverse.inverseParams = { listId: step.resultId };
      }
      break;
    case 'create_label':
      return null;
    case 'move_card':
      if (params._sourceListId) {
        inverse.inverseAction = 'move_card';
        inverse.inverseParams = { cardId: step.resultId, listId: params._sourceListId };
      } else {
        return null;
      }
      break;
    case 'archive_card':
      inverse.inverseAction = 'update_card';
      inverse.inverseParams = { cardId: step.resultId, closed: false };
      break;
    case 'assign_member':
      inverse.inverseAction = 'remove_member';
      inverse.inverseParams = { cardId: params.cardId, memberId: params.memberId };
      break;
    case 'add_comment':
      return null;
    case 'create_checklist':
      if (step.resultId) {
        inverse.inverseAction = 'delete_checklist';
        inverse.inverseParams = { checklistId: step.resultId };
      }
      break;
    case 'update_card':
      return null;
    default:
      return null;
  }

  return inverse as ExecutedStep;
}

export async function executePlan(
  client: TrelloMCPClient,
  plan: PlanStep[],
  boards?: BoardSpec[],
  planId?: string,
): Promise<ExecPlanResult> {
  const refMap: Map<string, { id: string; type: string }> = new Map();
  const steps: ExecStepResult[] = [];
  const boardCache = new Map<string, { lists?: Array<Record<string, unknown>> }>();
  const executedSteps: ExecutedStep[] = [];
  const boardIdsUsed: string[] = [];

  for (let i = 0; i < plan.length; i++) {
    const step = plan[i];

    const resolvedParams = resolveRefs(step.params, refMap);
    const originalParams = { ...step.params };

    const boardName = (resolvedParams.boardName as string) || '';
    let boardId = '';
    if (boards && boardName) {
      const match = boards.find(
        (b) => b.boardName.toLowerCase() === boardName.toLowerCase() || b.boardId === boardName,
      );
      if (match) boardId = match.boardId;
    }
    if (!boardId && boards && boards.length > 0) boardId = boards[0].boardId;

    if (!boardId) {
      steps.push({ ref: step.ref, action: step.action, success: false, error: 'No boardId available' });
      continue;
    }

    if (!boardIdsUsed.includes(boardId)) boardIdsUsed.push(boardId);
    if (!boardCache.has(boardId)) boardCache.set(boardId, {});

    try {
      const result = await executePlanStep(client, step.action, resolvedParams, boardId, boardCache.get(boardId)!);
      if (result.error) {
        steps.push({ ref: step.ref, action: step.action, success: false, error: result.error });
        executedSteps.push({
          action: step.action,
          params: originalParams,
          ref: step.ref,
          success: false,
          error: result.error,
        });
      } else {
        if (step.ref && result.id) {
          refMap.set(step.ref, { id: result.id, type: step.action });
        }
        const stepResult: ExecStepResult = { ref: step.ref, action: step.action, success: true, resultId: result.id, resultName: result.name };
        steps.push(stepResult);

        const executedStep: ExecutedStep = {
          action: step.action,
          params: originalParams,
          ref: step.ref,
          success: true,
          resultId: result.id,
        };

        const inverse = buildInverseStep(stepResult, step.action, { ...originalParams, _sourceListId: resolvedParams._sourceListId });
        if (inverse) {
          executedStep.inverseAction = inverse.inverseAction;
          executedStep.inverseParams = inverse.inverseParams;
        }

        executedSteps.push(executedStep);
      }
    } catch (err: unknown) {
      steps.push({ ref: step.ref, action: step.action, success: false, error: getErrorMessage(err) });
      executedSteps.push({
        action: step.action,
        params: originalParams,
        ref: step.ref,
        success: false,
        error: getErrorMessage(err),
      });
    }
  }

  const refMapObj: Record<string, string> = {};
  for (const [k, v] of refMap) refMapObj[k] = v.id;

  const succeeded = steps.filter((s) => s.success).length;
  const failed = steps.filter((s) => !s.success).length;

  addExecutionHistory({ steps: executedSteps, boardIds: boardIdsUsed });

  return {
    success: failed === 0,
    steps,
    refMap: refMapObj,
    totalSteps: plan.length,
    succeeded,
    failed,
  };
}

export async function undoLastPlan(client: TrelloMCPClient): Promise<{
  success: boolean;
  undoneSteps: number;
  errors: string[];
}> {
  const history = getLastExecutionHistory();
  if (!history) {
    return { success: false, undoneSteps: 0, errors: ['No execution history found'] };
  }

  const errors: string[] = [];
  let undoneSteps = 0;

  for (const step of history.steps) {
    if (!step.inverseAction || !step.inverseParams) continue;
    if (!step.success) continue;

    try {
      await executePlanStep(client, step.inverseAction, step.inverseParams, history.boardIds[0] || '', {});
      undoneSteps++;
    } catch (err) {
      errors.push(`Failed to undo ${step.action} (${step.ref || step.resultId}): ${getErrorMessage(err)}`);
    }
  }

  removeLastExecutionHistory();

  return {
    success: errors.length === 0,
    undoneSteps,
    errors,
  };
}
