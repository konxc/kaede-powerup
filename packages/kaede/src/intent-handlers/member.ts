/**
 * Member intent handlers — assign, remove_member
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';

const memberIntents: IntentHandlerSpec[] = [
  {
    patterns: ['assign', 'tugaskan', 'tambahkan anggota'],
    async fn(client, _pb, _boardId, args) {
      const memberId = (args?.memberId as string) || (args?.member as string) || '';
      const cardId = (args?.cardId as string) || (args?.card as string) || '';

      if (!memberId || !cardId) {
        return [{ success: false, type: 'assign_member', name: 'missing args', error: 'memberId and cardId required' }];
      }
      try {
        await client.assignMember(cardId, memberId);
        return [{ success: true, type: 'assign_member', name: `Member ${memberId} → Card ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'assign_member', name: `${memberId} → ${cardId}`, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['hapus anggota', 'remove member', 'keluarkan anggota'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const memberId = (args?.memberId as string) || (args?.member as string) || '';
      if (!cardId || !memberId) {
        return [{ success: false, type: 'remove_member', name: 'missing args', error: 'cardId and memberId required' }];
      }
      try {
        await client.removeMember(cardId, memberId);
        return [{ success: true, type: 'remove_member', name: `${memberId} removed from ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'remove_member', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },
];

export default memberIntents;
