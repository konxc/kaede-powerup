/**
 * KAEDE Intent Handlers — Barrel
 *
 * Semua intent handler didaftarkan di sini dari file domain terpisah.
 */

import { TrelloMCPClient } from '../trello-client';
import type { PlaybookResult, IntentResult, BatchCard, BatchUpdateFilter, BatchUpdateOperation } from '../types';
import cardIntents from './card';
import listIntents from './list';
import boardIntents from './board';
import labelIntents from './label';
import checklistIntents from './checklist';
import memberIntents from './member';
import commentIntents from './comment';
import reportIntents from './report';
import undoIntents from './undo';
import batchIntents from './batch';
import queryIntents from './query';

// Re-export types used by domain files
export type { IntentResult, BatchCard, BatchUpdateFilter, BatchUpdateOperation };

export interface IntentHandlerSpec {
  patterns: string[];
  fn: (
    client: TrelloMCPClient,
    pb: PlaybookResult,
    boardId: string,
    args?: Record<string, unknown>,
  ) => Promise<unknown[]>;
}

interface IntentHandler {
  patterns: string[];
  fn: (
    client: TrelloMCPClient,
    pb: PlaybookResult,
    boardId: string,
    args?: Record<string, unknown>,
  ) => Promise<unknown[]>;
}

const intentHandlers: IntentHandler[] = [];

function onIntent(patterns: string[], fn: IntentHandler['fn']): void {
  intentHandlers.push({ patterns: patterns.map((p) => p.toLowerCase()), fn });
}

// Register all domain intents
for (const spec of cardIntents) onIntent(spec.patterns, spec.fn);
for (const spec of listIntents) onIntent(spec.patterns, spec.fn);
for (const spec of boardIntents) onIntent(spec.patterns, spec.fn);
for (const spec of labelIntents) onIntent(spec.patterns, spec.fn);
for (const spec of checklistIntents) onIntent(spec.patterns, spec.fn);
for (const spec of memberIntents) onIntent(spec.patterns, spec.fn);
for (const spec of commentIntents) onIntent(spec.patterns, spec.fn);
for (const spec of reportIntents) onIntent(spec.patterns, spec.fn);
for (const spec of undoIntents) onIntent(spec.patterns, spec.fn);
for (const spec of batchIntents) onIntent(spec.patterns, spec.fn);
for (const spec of queryIntents) onIntent(spec.patterns, spec.fn);

export async function executeIntent(
  client: TrelloMCPClient,
  intent: string,
  playbookContext: PlaybookResult,
  boardId: string,
  extraArgs: Record<string, unknown> = {},
): Promise<unknown[]> {
  const lower = intent.toLowerCase();
  for (const h of intentHandlers) {
    if (h.patterns.some((p) => lower.includes(p))) {
      return h.fn(client, playbookContext, boardId, extraArgs);
    }
  }
  return [
    {
      success: false,
      type: 'unknown_intent',
      name: intent,
      error:
        'No handler matched. Try: mulai sprint, buat card, assign, buat label, arsipkan, arsip list, pindah semua, buat board, update card, buat checklist, komentar, report, tutup sprint, undo, batch update, sprint report',
    },
  ];
}
