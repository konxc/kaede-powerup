/**
 * Card intent handlers — create, update, archive, add_label
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';

const cardIntents: IntentHandlerSpec[] = [
  {
    patterns: ['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'],
    async fn(client, pb, boardId, args) {
      const name = (args?.task as string) || (args?.name as string) || 'New Task';
      const desc = (args?.desc as string) || (args?.description as string) || '';
      const listName = (args?.list as string) || pb.workflow.lists[0];
      const listId = (args?.listId as string) || '';

      if (listId) {
        try {
          const r = await client.createCard(listId, name, desc);
          return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
        } catch (err) {
          return [{ success: false, type: 'create_card', name, error: getErrorMessage(err) }];
        }
      }

      const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
      const target = lists.find((l) => (l.name as string).toLowerCase() === (listName || '').toLowerCase());
      if (!target) {
        return [{ success: false, type: 'create_card', name, error: `List "${listName}" not found` }];
      }
      try {
        const r = await client.createCard(target.id as string, name, desc);
        return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
      } catch (err) {
        return [{ success: false, type: 'create_card', name, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['update card', 'ubah kartu', 'edit card', 'update kartu'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      if (!cardId) {
        return [{ success: false, type: 'update_card', name: 'missing args', error: 'cardId required' }];
      }

      const updates: Record<string, unknown> = {};
      if (args?.name) updates.name = args.name;
      if (args?.description || args?.desc) updates.description = args.description || args.desc;
      if (args?.dueDate) updates.dueDate = args.dueDate;
      if (args?.start) updates.start = args.start;
      if (args?.dueComplete !== undefined) updates.dueComplete = args.dueComplete;
      if (args?.labels) updates.labels = args.labels;

      try {
        await client.updateCard(cardId, updates);
        return [{ success: true, type: 'update_card', name: `Card ${cardId} updated` }];
      } catch (err) {
        return [{ success: false, type: 'update_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['arsipkan', 'archive card', 'hapus card', 'delete card'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      if (!cardId) {
        return [{ success: false, type: 'archive_card', name: 'missing args', error: 'cardId required' }];
      }
      try {
        await client.archiveCard(cardId);
        return [{ success: true, type: 'archive_card', name: `Archived ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'archive_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['tambah label ke card', 'add label to card', 'pasang label', 'add_label_to_card'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const labelId = (args?.labelId as string) || (args?.label as string) || '';
      if (!cardId || !labelId) {
        return [{ success: false, type: 'add_label_to_card', name: 'missing args', error: 'cardId and labelId required' }];
      }
      try {
        await client.addLabelToCard(cardId, labelId);
        return [{ success: true, type: 'add_label_to_card', name: `Label ${labelId} → Card ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'add_label_to_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['hapus label dari card', 'remove label from card', 'remove_label_from_card'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const labelId = (args?.labelId as string) || (args?.label as string) || '';
      if (!cardId || !labelId) {
        return [{ success: false, type: 'remove_label_from_card', name: 'missing args', error: 'cardId and labelId required' }];
      }
      try {
        await client.removeLabelFromCard(cardId, labelId);
        return [{ success: true, type: 'remove_label_from_card', name: `Label ${labelId} removed from Card ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'remove_label_from_card', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },
];

export default cardIntents;
