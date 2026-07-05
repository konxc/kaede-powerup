/**
 * KAEDE Orchestrator — Lapisan kecerdasan di atas Trello MCP
 *
 * Membaca Playbook untuk memahami workflow, lalu mengeksekusi
 * serangkaian tindakan Trello berdasarkan intent pengguna.
 *
 * File ini sekarang menjadi barrel — semua logika dipecah ke modul terpisah.
 */

import type { PlaybookResult, BoardSnapshot } from './types';
import { planHandlers, runPreFlight } from './plan-handlers';

// Re-exports from extracted modules (preserve API surface for consumers like kaede-mcp-server.ts)
export { findCard, detectDuplicates, validateContext, archiveDuplicates } from './duplicate-detector';
export { getExecutionHistory, clearExecutionHistory } from './history-store';
export { parsePlaybook, bundleContext } from './playbook-parser';
export { generateSprintReport } from './report-generator';
export { batchUpdateCards } from './batch-updater';
export { executeIntent } from './intent-handlers';
export { executePlan, undoLastPlan } from './plan-executor';
export type { PlaybookResult } from './types';

// ── Generate Plan ──

export function generatePlan(
  goal: string,
  playbook: PlaybookResult,
  extraArgs: Record<string, unknown> = {},
  boards?: BoardSnapshot[],
): Array<Record<string, unknown>> {
  const lower = goal.toLowerCase();
  for (const h of planHandlers) {
    if (h.patterns.some((p) => lower.includes(p))) {
      const plan = h.fn(playbook, extraArgs, goal);
      if (boards && boards.length > 0) {
        const preFlight = runPreFlight(plan, boards);
        if (preFlight.length > 0) {
          return [...preFlight, ...plan];
        }
      }
      return plan;
    }
  }
  return [
    {
      success: false,
      action: 'unknown_intent',
      params: { goal },
      description: `Intent tidak dikenal: "${goal}". Coba: mulai sprint, buat card, assign, buat label, arsipkan, arsip list, pindah semua, buat board, update card, buat checklist, komentar, report, tutup sprint, undo, batch update, sprint report`,
    },
  ];
}
