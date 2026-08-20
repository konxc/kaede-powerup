/**
 * KAEDE Prompt Builder & Smart Defaults
 *
 * Context-aware resolution: auto-fills board, list, and card fields
 * from playbook context when user omits them.
 */

import type { PlaybookResult, BoardSpec, ResolvedContext, BatchCard } from './types';

export type PromptContext = {
  goal: string;
  playbook?: PlaybookResult;
  boards?: BoardSpec[];
  cards?: BatchCard[];
};

export type ResolveBoardResult = {
  boardId: string;
  boardName: string;
  confidence: 'exact' | 'fuzzy' | 'fallback';
};

export type ResolveListResult = {
  listName: string;
  confidence: 'exact' | 'fuzzy' | 'fallback';
};

// ── Board Resolution ──

export function resolveBoard(
  input: string | undefined,
  boards?: BoardSpec[],
): ResolveBoardResult {
  if (!boards || boards.length === 0) {
    return { boardId: '', boardName: input || '', confidence: 'fallback' };
  }

  if (!input) {
    return {
      boardId: boards[0].boardId,
      boardName: boards[0].boardName,
      confidence: 'fallback',
    };
  }

  const lower = input.toLowerCase();

  // Exact match
  const exact = boards.find(
    (b) => b.boardName.toLowerCase() === lower || b.boardId === input,
  );
  if (exact) return { boardId: exact.boardId, boardName: exact.boardName, confidence: 'exact' };

  // Fuzzy match (includes)
  const fuzzy = boards.find((b) => b.boardName.toLowerCase().includes(lower));
  if (fuzzy) return { boardId: fuzzy.boardId, boardName: fuzzy.boardName, confidence: 'fuzzy' };

  // Fallback to first board
  return {
    boardId: boards[0].boardId,
    boardName: boards[0].boardName,
    confidence: 'fallback',
  };
}

// ── List Resolution ──

export function resolveList(
  input: string | undefined,
  playbook?: PlaybookResult,
): ResolveListResult {
  if (input) return { listName: input, confidence: 'exact' };

  if (playbook?.workflow?.lists && playbook.workflow.lists.length > 0) {
    return { listName: playbook.workflow.lists[0], confidence: 'fallback' };
  }

  return { listName: 'Sprint', confidence: 'fallback' };
}

// ── Context-Based Inference ──

export function inferFromGoal(goal: string): Partial<{
  templateName: string;
  suggestedBoards: string[];
  priority: string;
  taskHint: string;
}> {
  const lower = goal.toLowerCase();

  const result: ReturnType<typeof inferFromGoal> = {};

  if (
    lower.includes('feature') || lower.includes('fitur') ||
    lower.includes('user story') || lower.includes('implement')
  ) {
    result.templateName = 'feature';
  } else if (
    lower.includes('bug') || lower.includes('error') ||
    lower.includes('fix') || lower.includes('issue')
  ) {
    result.templateName = 'bug';
    } else if (
      lower.includes('task') || lower.includes('tugas') ||
      lower.includes('create') || lower.includes('bikin') || lower.includes('buat')
    ) {
    result.templateName = 'task';
  } else if (
    lower.includes('chore') || lower.includes('maintenance') ||
    lower.includes('update') || lower.includes('upgrade')
  ) {
    result.templateName = 'chore';
  } else if (
    lower.includes('onboarding') || lower.includes('welcome') ||
    lower.includes('new member') || lower.includes('anggota baru')
  ) {
    result.templateName = 'onboarding';
  }

  // Priority inference
  if (
    lower.includes('critical') || lower.includes('urgent') ||
    lower.includes('p0') || lower.includes('blocking')
  ) {
    result.priority = 'Critical';
  } else if (
    lower.includes('high') || lower.includes('p1') ||
    lower.includes('important')
  ) {
    result.priority = 'High';
  } else if (lower.includes('low') || lower.includes('p3') || lower.includes('minor')) {
    result.priority = 'Low';
  }

  // Extract board hints
  const boardKeywords = ['backend', 'frontend', 'entry', 'api', 'admin', 'mobile'];
  const found: string[] = [];
  for (const kw of boardKeywords) {
    if (lower.includes(kw)) found.push(kw);
  }
  if (found.length > 0) result.suggestedBoards = found;

  // Extract first noun phrase as task hint
  const afterTask = lower.match(/(?:buat|bikin|create|add|implement)\s+(.+?)(?:\s+(di|pada|untuk|with|using)|$)/i);
  if (afterTask) result.taskHint = afterTask[1].trim();

  return result;
}

// ── Resolve Full Context ──

export function resolveContext(args: Record<string, unknown>, context: PromptContext): ResolvedContext {
  const warnings: string[] = [];

  // Board
  const boardInput = (args.boardName as string) || (args.board as string) || '';
  const boardResult = resolveBoard(boardInput || undefined, context.boards);
  if (boardResult.confidence === 'fallback' && boardInput) {
    warnings.push(`Board "${boardInput}" not found, using "${boardResult.boardName}"`);
  } else if (boardResult.confidence === 'fuzzy') {
    warnings.push(`Board "${boardInput}" fuzzy-matched to "${boardResult.boardName}"`);
  }

  // List
  const listInput = (args.list as string) || (args.listName as string) || '';
  const listResult = resolveList(listInput || undefined, context.playbook);
  if (listResult.confidence === 'fallback' && listInput) {
    warnings.push(`List "${listInput}" not found, using "${listResult.listName}"`);
  }

  // Intent inference
  const inference = inferFromGoal(context.goal);
  if (inference.templateName && !args.template) {
    warnings.push(`Auto-inferred template: "${inference.templateName}" from goal`);
  }

  return {
    boardId: boardResult.boardId,
    boardName: boardResult.boardName,
    listName: listResult.listName,
    confidence: boardResult.confidence === 'exact' && listResult.confidence === 'exact'
      ? 'exact'
      : boardResult.confidence === 'fallback' ? 'fallback' : 'fuzzy',
    warnings,
  };
}

// ── Fill Missing Card Fields ──

export function fillCardDefaults(
  card: BatchCard,
  defaults: { listName: string; boardName: string },
  inference: ReturnType<typeof inferFromGoal>,
): BatchCard {
  return {
    task: card.task || inference.taskHint || 'New Task',
    desc: card.desc || '',
    list: card.list || defaults.listName,
    start: card.start || '',
    due: card.due || '',
    checklist: card.checklist || [],
    comment: card.comment || '',
    labels: card.labels || [],
  };
}
