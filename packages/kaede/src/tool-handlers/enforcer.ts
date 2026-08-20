/**
 * KAEDE MCP — Playbook Enforcement Tool Handlers
 *
 * Menangani: enforce_playbook
 */

import { enforcePlaybook } from '../enforcer';
import { parsePlaybook } from '../playbook-parser';
import type { PlaybookResult, BoardSnapshot, PlanStep } from '../types';

export function handleEnforcePlaybook(args: Record<string, unknown>): Record<string, unknown> {
  const plan = (args.plan as Array<Record<string, unknown>>) || [];
  const playbookContent = (args.playbook as string) || '';
  const boardsInput = (args.boards as Array<Record<string, unknown>>) || [];

  if (!playbookContent) {
    return { safe: false, warnings: [], blockers: ['playbook content is required'], summary: 'Missing playbook' };
  }

  const playbook: PlaybookResult = parsePlaybook(playbookContent);

  const typedPlan: PlanStep[] = plan.map((s) => ({
    action: s.action as string,
    params: (s.params as Record<string, unknown>) || {},
    description: (s.description as string) || '',
  }));

  const typedBoards: BoardSnapshot[] = boardsInput.map((b) => ({
    boardId: b.boardId as string,
    boardName: b.boardName as string,
    lists: ((b.lists as Array<Record<string, unknown>>) || []).map((l) => ({
      listId: l.listId as string,
      listName: l.listName as string,
      cards: ((l.cards as Array<Record<string, unknown>>) || []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        listName: c.listName as string | undefined,
        boardName: c.boardName as string | undefined,
      })),
    })),
  }));

  return enforcePlaybook(typedPlan, playbook, typedBoards.length > 0 ? typedBoards : undefined) as Record<string, unknown>;
}
