/**
 * Plan Executors — Shared types
 */

import { TrelloMCPClient } from '../trello-client';

export type ExecutorResult = Promise<{ id?: string; name?: string; error?: string }>;

export type ExecutorFn = (
  client: TrelloMCPClient,
  params: Record<string, unknown>,
  boardId: string,
  cache: { lists?: Array<Record<string, unknown>> },
) => ExecutorResult;
