/**
 * KAEDE MCP — Report & Batch Tool Handlers
 *
 * Menangani: generate_sprint_report, batch_update_cards
 */

import * as orch from '../orchestrator';
import { withTrelloClient } from '../mcp-helpers';
import type { BatchUpdateFilter, BatchUpdateOperation } from '../types';

export async function handleGenerateSprintReport(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  const listNames = (args.listNames as string[]) || [];
  const sprintName = (args.sprintName as string) || 'Sprint Report';

  const result = await withTrelloClient((client) => orch.generateSprintReport(client, boardId, listNames, sprintName));
  return { report: result } as Record<string, unknown>;
}

export async function handleBatchUpdateCards(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  const filter: BatchUpdateFilter = {};
  const operation: BatchUpdateOperation = {};
  if (args.filterList) filter.listName = args.filterList as string;
  if (args.memberId) filter.memberId = args.memberId as string;
  if (args.dueBefore) filter.dueBefore = args.dueBefore as string;
  if (args.dueAfter) filter.dueAfter = args.dueAfter as string;
  if (args.moveToListName) operation.moveToListName = args.moveToListName as string;
  if (args.setName) operation.setName = args.setName as string;
  if (args.setDesc) operation.setDescription = args.setDesc as string;
  if (args.setDue) operation.setDue = args.setDue as string;
  if (args.setStart) operation.setStart = args.setStart as string;
  if (args.addLabels) operation.addLabels = args.addLabels as string[];
  if (args.removeLabels) operation.removeLabels = args.removeLabels as string[];

  const result = await withTrelloClient((client) => orch.batchUpdateCards(client, boardId, filter, operation));
  return result as Record<string, unknown>;
}
