/**
 * Checklist intent handlers — create_checklist
 */

import { getErrorMessage } from '../types';
import type { IntentResult, IntentHandlerSpec } from './index';

const checklistIntents: IntentHandlerSpec[] = [
  {
    patterns: ['buat checklist', 'add checklist', 'tambah checklist'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const name = (args?.name as string) || (args?.nama as string) || 'Checklist';
      const items = (args?.items as string[]) || [];

      if (!cardId) {
        return [{ success: false, type: 'create_checklist', name: 'missing args', error: 'cardId required' }];
      }

      try {
        const r = (await client.createChecklist(cardId, name)) as Record<string, unknown>;
        const results: IntentResult[] = [{ success: true, type: 'create_checklist', name: r.name as string, result: r }];
        for (const item of items) {
          try {
            const ir = await client.addChecklistItem(r.id as string, item);
            results.push({ success: true, type: 'add_checklist_item', name: item, result: ir });
          } catch (err) {
            results.push({ success: false, type: 'add_checklist_item', name: item, error: getErrorMessage(err) });
          }
        }
        return results;
      } catch (err) {
        return [{ success: false, type: 'create_checklist', name, error: getErrorMessage(err) }];
      }
    },
  },
];

export default checklistIntents;
