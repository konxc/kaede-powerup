/**
 * List intent handlers — create_list, archive_list, move_all_cards, move_card
 */

import { getErrorMessage } from '../types';
import type { IntentResult, IntentHandlerSpec } from './index';

const listIntents: IntentHandlerSpec[] = [
  {
    patterns: ['mulai sprint'],
    async fn(client, pb, boardId) {
      const results: IntentResult[] = [];
      for (const listName of pb.workflow.lists) {
        try {
          const r = await client.createList(boardId, listName);
          results.push({ success: true, type: 'create_list', name: listName, result: r });
        } catch (err) {
          results.push({ success: false, type: 'create_list', name: listName, error: getErrorMessage(err) });
        }
      }
      return results;
    },
  },

  {
    patterns: ['tutup sprint', 'close sprint', 'archive sprint'],
    async fn(client, _pb, boardId) {
      const results: IntentResult[] = [];
      const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
      const toArchive = lists.filter((l) =>
        ['done', 'selesai', 'qa', 'code review', 'qa/code review'].some((k) =>
          (l.name as string).toLowerCase().includes(k),
        ),
      );
      for (const list of toArchive) {
        try {
          const cards = (await client.callTool('get_cards_by_list_id', { listId: list.id })) as {
            cards?: Array<Record<string, unknown>>;
          };
          for (const card of cards.cards || []) {
            try {
              await client.callTool('archive_card', { cardId: card.id });
              results.push({ success: true, type: 'archive_card', name: card.name as string });
            } catch (err) {
              results.push({
                success: false, type: 'archive_card', name: card.name as string, error: getErrorMessage(err),
              });
            }
          }
        } catch (err) {
          results.push({ success: false, type: 'get_cards', name: list.name as string, error: getErrorMessage(err) });
        }
      }
      return results;
    },
  },

  {
    patterns: ['pindah semua', 'move all', 'pindahkan semua'],
    async fn(client, _pb, boardId, args) {
      const fromListName = (args?.dari as string) || (args?.from as string) || (args?.listName as string) || '';
      const toListName = (args?.ke as string) || (args?.to as string) || (args?.listNameTarget as string) || '';

      if (!fromListName || !toListName) {
        return [{ success: false, type: 'move_all_cards', name: 'missing args', error: 'from and to list names required' }];
      }

      try {
        const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
        const fromList = lists.find((l) => (l.name as string).toLowerCase().includes(fromListName.toLowerCase()));
        const toList = lists.find((l) => (l.name as string).toLowerCase().includes(toListName.toLowerCase()));
        if (!fromList)
          return [{ success: false, type: 'move_all_cards', name: fromListName, error: `List "${fromListName}" not found` }];
        if (!toList)
          return [{ success: false, type: 'move_all_cards', name: toListName, error: `List "${toListName}" not found` }];

        const cards = (await client.getCardsByListId(fromList.id as string, boardId)) as Array<Record<string, unknown>>;
        const results: IntentResult[] = [];
        for (const card of cards) {
          try {
            await client.callTool('move_card', { cardId: card.id, listId: toList.id });
            results.push({ success: true, type: 'move_card', name: card.name as string });
          } catch (err) {
            results.push({ success: false, type: 'move_card', name: card.name as string, error: getErrorMessage(err) });
          }
        }
        return results;
      } catch (err) {
        return [{ success: false, type: 'move_all_cards', name: fromListName, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['pindah', 'move card', 'pindahkan'],
    async fn(client, _pb, boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const listId = (args?.listId as string) || (args?.list as string) || '';
      const listName = (args?.listName as string) || '';

      if (!cardId || (!listId && !listName)) {
        return [{ success: false, type: 'move_card', name: 'missing args', error: 'cardId and listId/listName required' }];
      }

      let targetListId = listId;
      if (!targetListId && listName) {
        const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
        const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
        if (!target) return [{ success: false, type: 'move_card', name: cardId, error: `List "${listName}" not found` }];
        targetListId = target.id as string;
      }

      try {
        await client.callTool('move_card', { cardId, listId: targetListId });
        return [{ success: true, type: 'move_card', name: `Card ${cardId} → List ${targetListId}` }];
      } catch (err) {
        return [{ success: false, type: 'move_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['arsip list', 'archive list', 'hapus list'],
    async fn(client, _pb, boardId, args) {
      const listName = (args?.nama as string) || (args?.name as string) || '';
      const listId = (args?.listId as string) || '';

      if (!listId && !listName) {
        return [{ success: false, type: 'archive_list', name: 'missing args', error: 'listId or name required' }];
      }

      let targetListId = listId;
      if (!targetListId && listName) {
        const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
        const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
        if (!target) return [{ success: false, type: 'archive_list', name: listName, error: `List "${listName}" not found` }];
        targetListId = target.id as string;
      }

      try {
        await client.archiveList(targetListId);
        return [{ success: true, type: 'archive_list', name: `List ${listName || targetListId} archived` }];
      } catch (err) {
        return [{ success: false, type: 'archive_list', name: listName, error: getErrorMessage(err) }];
      }
    },
  },
];

export default listIntents;
