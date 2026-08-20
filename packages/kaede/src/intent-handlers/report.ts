/**
 * Report intent handlers — report, sprint report
 */

import { getErrorMessage } from '../types';
import type { IntentHandlerSpec } from './index';
import { generateSprintReport } from '../report-generator';

const reportIntents: IntentHandlerSpec[] = [
  {
    patterns: ['report', 'progress', 'my cards', 'kartu saya'],
    async fn(client, _pb, _boardId) {
      try {
        const r = (await client.callTool('get_my_cards', {})) as { cards?: Array<Record<string, unknown>> };
        const cards = r.cards || [];
        const grouped: Record<string, unknown[]> = {};
        for (const c of cards) {
          const listName = (c.listId as string) || 'Unknown';
          if (!grouped[listName]) grouped[listName] = [];
          grouped[listName].push(c);
        }
        return [{ success: true, type: 'report', name: `Found ${cards.length} cards assigned to you`, detail: grouped }];
      } catch (err) {
        return [{ success: false, type: 'report', name: 'failed', error: getErrorMessage(err) }];
      }
    },
  },

  {
    patterns: ['sprint report', 'generate report', 'laporan sprint', 'buat laporan'],
    async fn(client, _pb, boardId, args = {}) {
      const listNames = (args.listNames as string[]) || (args.lists as string[]) || [];
      const sprintName = (args.sprint as string) || (args.name as string) || 'Current Sprint';
      try {
        const report = await generateSprintReport(client, boardId, listNames, sprintName);
        return [{
          success: true, type: 'sprint_report', name: sprintName,
          detail: report, result: { markdown: report.markdown },
        }];
      } catch (err) {
        return [{ success: false, type: 'sprint_report', name: sprintName, error: getErrorMessage(err) }];
      }
    },
  },
];

export default reportIntents;
