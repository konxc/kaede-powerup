/**
 * Query intent handlers — read-only Trello operations
 * 
 * Handles natural language queries like:
 * - "list boards" / "lihat board"
 * - "view cards" / "lihat card"
 * - "my cards" / "kartu saya"
 * - "list labels" / "lihat label"
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';

const queryIntents: IntentHandlerSpec[] = [
  {
    patterns: ['list boards', 'lihat board', 'show boards', 'daftar board', 'semua board', 'list_boards'],
    async fn(client, _pb, _boardId, args = {}) {
      try {
        const boards = await client.listBoards() as Array<Record<string, unknown>>;
        const filter = (args.filter as string) || 'all';
        const filtered = boards.filter((b: Record<string, unknown>) => {
          if (filter === 'all') return true;
          if (filter === 'open') return !(b.closed as boolean);
          if (filter === 'closed') return !(b.closed as boolean) === false;
          return true;
        });
        return [{
          success: true,
          type: 'list_boards',
          name: `Found ${filtered.length} board(s)`,
          detail: filtered.map((b: Record<string, unknown>) => ({
            id: b.id,
            name: b.name,
            url: b.url,
            closed: b.closed,
          })),
        }];
      } catch (err) {
        return [{ success: false, type: 'list_boards', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['my cards', 'kartu saya', 'tugas saya', 'card saya'],
    async fn(client, _pb, _boardId) {
      try {
        const r = await client.callTool('get_my_cards', {}) as { cards?: Array<Record<string, unknown>> };
        const cards = r.cards || [];
        const grouped: Record<string, unknown[]> = {};
        for (const c of cards) {
          const listName = (c.listName as string) || 'Unknown';
          if (!grouped[listName]) grouped[listName] = [];
          grouped[listName].push(c);
        }
        return [{
          success: true,
          type: 'get_my_cards',
          name: `Found ${cards.length} card(s) assigned to you`,
          detail: grouped,
        }];
      } catch (err) {
        return [{ success: false, type: 'get_my_cards', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['view cards', 'lihat card', 'show cards', 'daftar card', 'card di list', 'get_cards_by_list'],
    async fn(client, _pb, _boardId, args = {}) {
      const listId = (args.listId as string) || (args.list as string);
      const listName = (args.listName as string);
      
      if (!listId && !listName) {
        return [{
          success: false,
          type: 'get_cards_by_list',
          name: 'failed',
          error: 'listId or listName required. Example: "lihat card di list To Do"',
        }];
      }

      try {
        let actualListId = listId;
        
        // If only listName provided, need to resolve it
        if (!actualListId && listName) {
          const boardId = (args.boardId as string);
          if (!boardId) {
            return [{
              success: false,
              type: 'get_cards_by_list',
              name: 'failed',
              error: 'boardId required when using listName. Provide boardId or use listId directly.',
            }];
          }
          const lists = await client.getLists(boardId) as Array<Record<string, unknown>>;
          const found = lists.find((l: Record<string, unknown>) => 
            (l.name as string)?.toLowerCase() === listName.toLowerCase()
          );
          if (!found) {
            return [{
              success: false,
              type: 'get_cards_by_list',
              name: 'failed',
              error: `List "${listName}" not found in board ${boardId}`,
            }];
          }
          actualListId = found.id as string;
        }

        const cards = await client.getCardsByListId(actualListId!, _boardId) as Array<Record<string, unknown>>;
        return [{
          success: true,
          type: 'get_cards_by_list',
          name: `Found ${cards.length} card(s) in list`,
          detail: cards.map((c: Record<string, unknown>) => ({
            id: c.id,
            name: c.name,
            due: c.due,
            dueComplete: c.dueComplete,
            idMembers: c.idMembers,
          })),
        }];
      } catch (err) {
        return [{ success: false, type: 'get_cards_by_list', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['list labels', 'lihat label', 'show labels', 'daftar label', 'get_board_labels'],
    async fn(client, _pb, boardId, args = {}) {
      try {
        const actualBoardId = (args.boardId as string) || boardId;
        if (!actualBoardId) {
          return [{
            success: false,
            type: 'get_board_labels',
            name: 'failed',
            error: 'boardId required. Example: "lihat label di board Frontend"',
          }];
        }
        const labels = await client.getBoardLabels(actualBoardId) as Array<Record<string, unknown>>;
        return [{
          success: true,
          type: 'get_board_labels',
          name: `Found ${labels.length} label(s)`,
          detail: labels.map((l: Record<string, unknown>) => ({
            id: l.id,
            name: l.name,
            color: l.color,
          })),
        }];
      } catch (err) {
        return [{ success: false, type: 'get_board_labels', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['list lists', 'lihat list', 'show lists', 'daftar list', 'list di board', 'get_board_lists'],
    async fn(client, _pb, boardId, args = {}) {
      try {
        const actualBoardId = (args.boardId as string) || boardId;
        if (!actualBoardId) {
          return [{
            success: false,
            type: 'get_board_lists',
            name: 'failed',
            error: 'boardId required. Example: "lihat list di board Frontend"',
          }];
        }
        const lists = await client.getLists(actualBoardId) as Array<Record<string, unknown>>;
        const filtered = lists.filter((l: Record<string, unknown>) => !(l.closed as boolean));
        return [{
          success: true,
          type: 'get_board_lists',
          name: `Found ${filtered.length} list(s)`,
          detail: filtered.map((l: Record<string, unknown>) => ({
            id: l.id,
            name: l.name,
          })),
        }];
      } catch (err) {
        return [{ success: false, type: 'get_board_lists', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['get board', 'info board', 'detail board', 'informasi board'],
    async fn(client, _pb, _boardId, args = {}) {
      const boardId = (args.boardId as string);
      if (!boardId) {
        return [{
          success: false,
          type: 'get_board',
          name: 'failed',
          error: 'boardId required. Example: "info board --boardId abc123"',
        }];
      }
      try {
        const board = await client.getCard(boardId) as Record<string, unknown>;
        return [{
          success: true,
          type: 'get_board',
          name: board.name as string || 'Board',
          detail: {
            id: board.id,
            name: board.name,
            desc: board.desc,
            url: board.url,
            closed: board.closed,
          },
        }];
      } catch (err) {
        return [{ success: false, type: 'get_board', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['get_card'],
    async fn(client, _pb, _boardId, args = {}) {
      const cardId = (args.cardId as string) || (args.card as string) || '';
      if (!cardId) {
        return [{
          success: false,
          type: 'get_card',
          name: 'failed',
          error: 'cardId required. Example: "get_card --cardId abc123"',
        }];
      }
      try {
        const card = await client.getCard(cardId) as Record<string, unknown>;
        return [{
          success: true,
          type: 'get_card',
          name: (card.name as string) || cardId,
          detail: {
            id: card.id,
            name: card.name,
            idBoard: card.idBoard,
            labels: card.labels || [],
            url: card.url,
          },
        }];
      } catch (err) {
        return [{ success: false, type: 'get_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },
];

export default queryIntents;