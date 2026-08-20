/**
 * KAEDE MCP — Plan Execution Tool Handlers
 *
 * Menangani: generate_plan, execute_plan, undo_last_plan,
 *            get_execution_history, clear_execution_history
 */

import * as orch from '../orchestrator';
import { TrelloMCPClient } from '../trello-client';
import { withTrelloClient } from '../mcp-helpers';
import type { BoardSnapshot } from '../types';

export function handleGeneratePlan(args: Record<string, unknown>): Record<string, unknown> {
  let context: orch.PlaybookResult = {
    title: '',
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };
  if (args.playbook as string) {
    context = orch.parsePlaybook(args.playbook as string);
  }

  const extraArgs: Record<string, unknown> = {};
  for (const key of [
    'task', 'name', 'desc', 'list', 'member', 'memberId',
    'color', 'cardId', 'text', 'from', 'to', 'items',
    'cards', 'boardNames', 'labels',
    'template', 'role', 'want', 'benefit', 'feature',
    'techStack', 'convention', 'reference', 'priority', 'assignee',
  ]) {
    if (args[key] !== undefined) extraArgs[key] = args[key];
  }
  extraArgs.goal = args.goal as string;

  let boards: BoardSnapshot[] | undefined;
  if (args.boards) {
    boards = (args.boards as Array<Record<string, unknown>>).map((b) => ({
      boardId: b.boardId as string,
      boardName: b.boardName as string,
      lists: (b.lists as Array<Record<string, unknown>>).map((l) => ({
        listId: l.listId as string,
        listName: l.listName as string,
        cards: (l.cards as Array<Record<string, unknown>>).map((c) => ({
          id: c.id as string,
          name: c.name as string,
          desc: c.desc as string | undefined,
          listName: c.listName as string | undefined,
          boardName: c.boardName as string | undefined,
        })),
      })),
    }));
  }

  const plan = orch.generatePlan(args.goal as string, context, extraArgs, boards);
  return { plan };
}

export async function handleExecutePlan(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rawPlan = (args.plan as Array<Record<string, unknown>>) || [];
  const rawBoards = (args.boards as Array<Record<string, unknown>>) || [];

  const plan = rawPlan.map((s) => ({
    action: s.action as string,
    params: (s.params as Record<string, unknown>) || {},
    description: (s.description as string) || '',
    ref: s.ref as string | undefined,
    dependsOn: s.dependsOn as string[] | undefined,
  }));

  const boards = rawBoards.map((b) => ({
    boardId: b.boardId as string,
    boardName: (b.boardName as string) || '',
  }));

  const result = await withTrelloClient((client) => orch.executePlan(client as unknown as TrelloMCPClient, plan, boards));
  return result as Record<string, unknown>;
}

export async function handleUndoLastPlan(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await withTrelloClient((client) => orch.undoLastPlan(client as unknown as TrelloMCPClient));
  return result as Record<string, unknown>;
}

export function handleGetExecutionHistory(_args: Record<string, unknown>): Record<string, unknown> {
  const history = orch.getExecutionHistory();
  return { history } as Record<string, unknown>;
}

export function handleClearExecutionHistory(_args: Record<string, unknown>): Record<string, unknown> {
  orch.clearExecutionHistory();
  return { success: true } as Record<string, unknown>;
}
