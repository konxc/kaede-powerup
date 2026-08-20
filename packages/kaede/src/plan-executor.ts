/**
 * KAEDE Plan Executor
 *
 * Menjalankan rencana multi-langkah (PlanStep[]), melacak referensi
 * antar langkah, dan menyediakan undo/rollback.
 * Action executors terpisah di plan-executors/{domain}.ts.
 */

import { TrelloMCPClient } from './trello-client';
import { getErrorMessage } from './types';
import type { ExecStepResult, ExecutedStep, ExecPlanResult, PlanStep, BoardSpec } from './types';
import { addExecutionHistory, getLastExecutionHistory, removeLastExecutionHistory } from './history-store';
import { EXECUTORS } from './plan-executors/index';

async function executePlanStep(
  client: TrelloMCPClient,
  action: string,
  params: Record<string, unknown>,
  boardId: string,
  cache: { lists?: Array<Record<string, unknown>> },
): Promise<{ id?: string; name?: string; error?: string }> {
  const p = { ...params };
  const executor = EXECUTORS[action];
  if (!executor) return { error: `Unknown action: ${action}` };
  return executor(client, p, boardId, cache);
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
        executedSteps.push({ action: step.action, params: originalParams, ref: step.ref, success: false, error: result.error });
      } else {
        if (step.ref && result.id) {
          refMap.set(step.ref, { id: result.id, type: step.action });
        }
        const stepResult: ExecStepResult = { ref: step.ref, action: step.action, success: true, resultId: result.id, resultName: result.name };
        steps.push(stepResult);

        const executedStep: ExecutedStep = { action: step.action, params: originalParams, ref: step.ref, success: true, resultId: result.id };

        const inverse = buildInverseStep(stepResult, step.action, { ...originalParams, _sourceListId: resolvedParams._sourceListId });
        if (inverse) {
          executedStep.inverseAction = inverse.inverseAction;
          executedStep.inverseParams = inverse.inverseParams;
        }

        executedSteps.push(executedStep);
      }
    } catch (err: unknown) {
      steps.push({ ref: step.ref, action: step.action, success: false, error: getErrorMessage(err) });
      executedSteps.push({ action: step.action, params: originalParams, ref: step.ref, success: false, error: getErrorMessage(err) });
    }
  }

  const refMapObj: Record<string, string> = {};
  for (const [k, v] of refMap) refMapObj[k] = v.id;

  const succeeded = steps.filter((s) => s.success).length;
  const failed = steps.filter((s) => !s.success).length;

  addExecutionHistory({ steps: executedSteps, boardIds: boardIdsUsed });

  return { success: failed === 0, steps, refMap: refMapObj, totalSteps: plan.length, succeeded, failed };
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

  return { success: errors.length === 0, undoneSteps, errors };
}
