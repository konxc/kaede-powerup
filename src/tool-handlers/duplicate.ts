/**
 * KAEDE MCP — Duplicate Detection Tool Handlers
 *
 * Menangani: find_card, detect_duplicates, validate_context, archive_duplicates
 */

import * as orch from '../orchestrator';

export function handleFindCard(args: Record<string, unknown>): Record<string, unknown> {
  const cards = (args.cards as Array<Record<string, unknown>>) || [];
  const query = args.query as string;
  const typedCards = cards.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    listName: c.listName as string | undefined,
    listId: c.listId as string | undefined,
    boardId: c.boardId as string | undefined,
    boardName: c.boardName as string | undefined,
  }));
  return orch.findCard(typedCards, query) as Record<string, unknown>;
}

export function handleDetectDuplicates(args: Record<string, unknown>): Record<string, unknown> {
  const boards = (args.boards as Array<Record<string, unknown>>) || [];
  const typedBoards = boards.map((b) => ({
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
  return orch.detectDuplicates(typedBoards) as Record<string, unknown>;
}

export function handleValidateContext(args: Record<string, unknown>): Record<string, unknown> {
  const action = args.action as string;
  const params = args.params as Record<string, unknown>;
  const boards = (args.boards as Array<Record<string, unknown>> || []).map((b) => ({
    boardId: b.boardId as string,
    boardName: b.boardName as string,
    lists: (b.lists as Array<Record<string, unknown>> || []).map((l) => ({
      listId: l.listId as string,
      listName: l.listName as string,
      cards: (l.cards as Array<Record<string, unknown>> || []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        listName: c.listName as string | undefined,
        boardName: c.boardName as string | undefined,
      })),
    })),
  }));
  return orch.validateContext(action, params, boards) as Record<string, unknown>;
}

export function handleArchiveDuplicates(args: Record<string, unknown>): Record<string, unknown> {
  const groups = (args.groups as Array<Record<string, unknown>>) || [];
  const keepStrategy = (args.keepStrategy as 'oldest' | 'newest' | 'longest_desc') || 'oldest';
  const typedGroups = groups.map((g) => ({
    name: g.name as string,
    count: g.count as number,
    location: g.location as 'sameList' | 'crossList' | 'crossBoard',
    cards: (g.cards as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      desc: c.desc as string | undefined,
      listName: c.listName as string | undefined,
      boardName: c.boardName as string | undefined,
    })),
  }));
  return orch.archiveDuplicates(typedGroups, keepStrategy) as Record<string, unknown>;
}
