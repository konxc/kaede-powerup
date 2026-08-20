/**
 * Comment intent handlers — add_comment
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';

const commentIntents: IntentHandlerSpec[] = [
  {
    patterns: ['komentar', 'comment', 'tambah komentar'],
    async fn(client, _pb, _boardId, args) {
      const cardId = (args?.cardId as string) || (args?.card as string) || '';
      const text = (args?.text as string) || (args?.comment as string) || '';

      if (!cardId || !text) {
        return [{ success: false, type: 'add_comment', name: 'missing args', error: 'cardId and text required' }];
      }
      try {
        await client.callTool('add_comment', { cardId, text });
        return [{ success: true, type: 'add_comment', name: `Comment on ${cardId}` }];
      } catch (err) {
        return [{ success: false, type: 'add_comment', name: cardId, error: getErrorMessage(err) }];
      }
    },
  },
];

export default commentIntents;
