/**
 * Label intent handlers — create_label, setup labels batch
 */

import { getErrorMessage } from '../types';
import type { IntentResult, IntentHandlerSpec } from './index';

const colorMap: Record<string, string> = {
  merah: 'red', kuning: 'yellow', hijau: 'green', biru: 'blue',
  orange: 'orange', ungu: 'purple', pink: 'pink', abu: 'gray',
  red: 'red', yellow: 'yellow', green: 'green', blue: 'blue',
  purple: 'purple', gray: 'gray',
};

const validColors = ['red', 'yellow', 'green', 'blue', 'orange', 'purple', 'pink', 'gray'];

const labelIntents: IntentHandlerSpec[] = [
  {
    patterns: ['buat label', 'create label', 'tambah label baru', 'create_label'],
    async fn(client, _pb, boardId, args = {}) {
      const colorName = (args?.color as string) || (args?.warna as string) || '';
      const labelName = (args?.name as string) || (args?.nama as string) || '';
      let targetColor = colorName.toLowerCase();
      targetColor = colorMap[targetColor] || targetColor;

      if (!targetColor || !validColors.includes(targetColor)) {
        return [{
          success: false, type: 'create_label', name: labelName || '(no name)',
          error: `Invalid color "${colorName}". Gunakan: merah/kuning/hijau/biru/orange/ungu/pink/abu`,
        }];
      }

      const displayName = labelName || targetColor;
      try {
        const r = await client.createLabel(boardId, displayName, targetColor);
        return [{ success: true, type: 'create_label', name: displayName, result: r }];
      } catch (err) {
        return [{ success: false, type: 'create_label', name: displayName, error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['setup labels batch', 'batch labels', 'create labels batch'],
    async fn(client, _pb, boardId, args = {}) {
      const results: IntentResult[] = [];
      const labels = (args.labels as Array<{ name: string; color: string }>) || [];

      for (const label of labels) {
        try {
          const r = await client.createLabel(boardId, label.name, label.color);
          results.push({ success: true, type: 'create_label', name: label.name, result: r });
        } catch (err) {
          results.push({ success: false, type: 'create_label', name: label.name, error: getErrorMessage(err) });
        }
      }
      return results;
    },
  },
];

export default labelIntents;
