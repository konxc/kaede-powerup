/**
 * Batch intent handlers — batch update, buat cards batch, setup sprint
 */

import { getErrorMessage } from '../types';
import type { BatchCard, BatchUpdateFilter, BatchUpdateOperation, IntentResult, IntentHandlerSpec } from './index';
import { batchUpdateCards } from '../batch-updater';

const batchIntents: IntentHandlerSpec[] = [
  {
    patterns: ['batch update', 'update massal', 'batch pindah', 'batch move'],
    async fn(client, _pb, boardId, args = {}) {
      const filter: BatchUpdateFilter = {
        listName: (args.filterList as string) || (args.fromList as string) || '',
        labelName: (args.filterLabel as string) || '',
        memberId: (args.memberId as string) || '',
        dueBefore: (args.dueBefore as string) || '',
        dueAfter: (args.dueAfter as string) || '',
      };
      const operation: BatchUpdateOperation = {
        moveToListName: (args.toList as string) || (args.moveTo as string) || '',
        addLabels: (args.addLabels as string[]) || [],
        removeLabels: (args.removeLabels as string[]) || [],
        setName: (args.setName as string) || '',
        setDescription: (args.setDesc as string) || (args.setDescription as string) || '',
        setDue: (args.setDue as string) || '',
        setStart: (args.setStart as string) || '',
      };

      if (!filter.listName && !operation.moveToListName && !operation.setName) {
        return [{ success: false, type: 'batch_update', name: 'missing args', error: 'filterList or toList required' }];
      }

      try {
        const result = await batchUpdateCards(client, boardId, filter, operation);
        return [{
          success: result.errors.length === 0,
          type: 'batch_update',
          name: `Updated ${result.updated} cards`,
          detail: result,
          error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        }];
      } catch (err) {
        return [{ success: false, type: 'batch_update', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['buat cards batch', 'batch cards', 'create batch'],
    async fn(client, pb, boardId, args = {}) {
      const results: IntentResult[] = [];
      const cardsInput = (args.cards as BatchCard[]) || [];
      const listName = (args.list as string) || (args.listName as string) || pb.workflow.lists[0] || '';

      const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
      const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
      if (!target) {
        return [{ success: false, type: 'batch_cards', name: listName, error: `List "${listName}" not found` }];
      }

      for (const card of cardsInput) {
        try {
          const r = (await client.createCard(target.id as string, card.task, card.desc || '')) as Record<string, unknown>;
          const cardId = r.id as string;
          results.push({ success: true, type: 'create_card', name: card.task, result: { id: cardId } });

          if (card.start || card.due) {
            const updates: Record<string, unknown> = {};
            if (card.start) updates.start = card.start;
            if (card.due) updates.due = card.due;
            try { await client.updateCard(cardId, updates); } catch {}
          }

          if (card.checklist && card.checklist.length > 0) {
            try {
              const cl = (await client.createChecklist(cardId, 'Acceptance Criteria')) as Record<string, unknown>;
              for (const item of card.checklist) {
                try { await client.addChecklistItem(cl.id as string, item); } catch {}
              }
            } catch {}
          }

          if (card.comment) {
            try { await client.addComment(cardId, card.comment); } catch {}
          }
        } catch (err) {
          results.push({ success: false, type: 'create_card', name: card.task, error: getErrorMessage(err) });
        }
      }
      return results;
    },
  },

  {
    patterns: ['setup sprint', 'set up sprint', 'mulai sprint baru'],
    async fn(client, pb, _boardId, args = {}) {
      const results: IntentResult[] = [];
      const boardsInput = (args.boards as Array<{ boardId: string; boardName: string }>) || [];
      const cardsInput = (args.cards as BatchCard[]) || [];

      for (const board of boardsInput) {
        const bid = board.boardId;

        for (const listName of pb.workflow.lists) {
          try {
            const r = await client.createList(bid, listName);
            results.push({ success: true, type: 'create_list', name: listName, result: r });
          } catch (err) {
            results.push({ success: false, type: 'create_list', name: listName, error: getErrorMessage(err) });
          }
        }

        const lists = (await client.getLists(bid)) as Array<Record<string, unknown>>;

        for (const card of cardsInput) {
          const listName = card.list || pb.workflow.lists[0] || '';
          const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
          if (!target) {
            results.push({ success: false, type: 'create_card', name: card.task, error: `List "${listName}" not found` });
            continue;
          }

          try {
            const r = (await client.createCard(target.id as string, card.task, card.desc || '')) as Record<string, unknown>;
            const cardId = r.id as string;
            results.push({ success: true, type: 'create_card', name: card.task, result: { id: cardId } });

            if (card.start || card.due) {
              const updates: Record<string, unknown> = {};
              if (card.start) updates.start = card.start;
              if (card.due) updates.due = card.due;
              try { await client.updateCard(cardId, updates); } catch {}
            }

            if (card.checklist && card.checklist.length > 0) {
              try {
                const cl = (await client.createChecklist(cardId, 'Acceptance Criteria')) as Record<string, unknown>;
                results.push({ success: true, type: 'create_checklist', name: 'Acceptance Criteria', result: { id: cl.id } });
                for (const item of card.checklist) {
                  try {
                    await client.addChecklistItem(cl.id as string, item);
                    results.push({ success: true, type: 'add_checklist_item', name: item });
                  } catch (err) {
                    results.push({ success: false, type: 'add_checklist_item', name: item, error: getErrorMessage(err) });
                  }
                }
              } catch (err) {
                results.push({ success: false, type: 'create_checklist', name: 'Acceptance Criteria', error: getErrorMessage(err) });
              }
            }

            if (card.comment) {
              try {
                await client.addComment(cardId, card.comment);
                results.push({ success: true, type: 'add_comment', name: `Comment on ${card.task}` });
              } catch (err) {
                results.push({ success: false, type: 'add_comment', name: card.task, error: getErrorMessage(err) });
              }
            }
          } catch (err) {
            results.push({ success: false, type: 'create_card', name: card.task, error: getErrorMessage(err) });
          }
        }
      }
      return results;
    },
  },
];

export default batchIntents;
