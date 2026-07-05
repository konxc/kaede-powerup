/**
 * Board intent handlers — create_board
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';

const boardIntents: IntentHandlerSpec[] = [
  {
    patterns: ['buat board', 'create board', 'new board'],
    async fn(client, _pb, _boardId, args) {
      const name = (args?.name as string) || (args?.nama as string) || 'New Board';
      try {
        const r = await client.createBoard(name, {});
        return [{ success: true, type: 'create_board', name, result: r }];
      } catch (err) {
        return [{ success: false, type: 'create_board', name, error: getErrorMessage(err) }];
      }
    },
  },
];

export default boardIntents;
