/**
 * Undo intent handlers — undo last plan
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';
import { undoLastPlan } from '../plan-executor';

const undoIntents: IntentHandlerSpec[] = [
  {
    patterns: ['undo', 'batalkan', 'rollback', 'kembalikan'],
    async fn(client, _pb, _boardId) {
      try {
        const result = await undoLastPlan(client);
        return [{
          success: result.success,
          type: 'undo',
          name: `Undo ${result.undoneSteps} steps`,
          detail: result,
          error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        }];
      } catch (err) {
        return [{ success: false, type: 'undo', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },
];

export default undoIntents;
