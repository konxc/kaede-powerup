/**
 * KAEDE MCP — Report & Batch Tool Handlers
 *
 * Menangani: generate_sprint_report, batch_update_cards
 */

import * as orch from '../orchestrator';
import { withTrelloClient } from '../mcp-helpers';

export async function handleGenerateSprintReport(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  const listNames = (args.listNames as string[]) || [];
  const sprintName = (args.sprintName as string) || 'Sprint Report';

  const result = await withTrelloClient((client) => orch.generateSprintReport(client, boardId, listNames, sprintName));
  return { report: result } as Record<string, unknown>;
}

export async function handleBatchUpdateCards(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  const filter: Record<string, unknown> = {};
  for (const key of ['filterList', 'memberId', 'dueBefore', 'dueAfter', 'moveToListName', 'setName', 'setDesc', 'setDue', 'setStart']) {
    if (args[key]) filter[key] = args[key];
  }
  if (args.addLabels) filter.addLabels = args.addLabels;
  if (args.removeLabels) filter.removeLabels = args.removeLabels;

  const result = await withTrelloClient((client) => orch.batchUpdateCards(client, boardId, filter));
  return result as Record<string, unknown>;
}
