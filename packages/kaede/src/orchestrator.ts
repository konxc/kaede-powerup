/**
 * KAEDE Orchestrator — Lapisan kecerdasan di atas Trello MCP
 *
 * Membaca Playbook untuk memahami workflow, lalu mengeksekusi
 * serangkaian tindakan Trello berdasarkan intent pengguna.
 *
 * Auto-chaining: compound intent splitting + cross-plan ref resolution.
 */

import type { PlaybookResult, BoardSnapshot, PlanStep } from './types';
import { planHandlers, runPreFlight } from './plan-handlers';
import { splitCompoundGoal, injectAutoRefs, resolveCrossPlanRefs, extractChainArgs } from './auto-chainer';

// Re-exports from extracted modules (preserve API surface for consumers like kaede-mcp-server.ts)
export { findCard, detectDuplicates, validateContext, archiveDuplicates } from './duplicate-detector';
export { getExecutionHistory, clearExecutionHistory } from './history-store';
export { parsePlaybook, bundleContext } from './playbook-parser';
export { generateSprintReport } from './report-generator';
export { batchUpdateCards } from './batch-updater';
export { executeIntent } from './intent-handlers';
export { executePlan, undoLastPlan } from './plan-executor';
export { splitCompoundGoal, injectAutoRefs, resolveCrossPlanRefs } from './auto-chainer';
export { enforcePlaybook, enforceSingleAction, validateCardPrefix, validateCardLabel, validateWorkflowList, validateRoleAccess } from './enforcer';
export type { PlaybookResult } from './types';

function matchHandler(
  goal: string,
  playbook: PlaybookResult,
  extraArgs: Record<string, unknown>,
): PlanStep[] | null {
  const lower = goal.toLowerCase();
  for (const h of planHandlers) {
    if (h.patterns.some((p) => lower.includes(p))) {
      return h.fn(playbook, extraArgs, goal) as PlanStep[];
    }
  }
  return null;
}

// ── Generate Plan ──

export function generatePlan(
  goal: string,
  playbook: PlaybookResult,
  extraArgs: Record<string, unknown> = {},
  boards?: BoardSnapshot[],
): Array<Record<string, unknown>> {
  // 1. Try direct match
  const direct = matchHandler(goal, playbook, extraArgs);
  if (direct) {
    const expanded = expandArgsChain(direct, extraArgs);
    if (boards && boards.length > 0) {
      const preFlight = runPreFlight(expanded, boards, playbook);
      if (preFlight.length > 0) {
        return [...preFlight, ...expanded];
      }
    }
    return expanded;
  }

  // 2. Try compound split
  const subGoals = splitCompoundGoal(goal);
  if (subGoals.length > 1) {
    const subPlans: PlanStep[][] = [];
    for (const sub of subGoals) {
      const plan = matchHandler(sub, playbook, {});
      if (plan) subPlans.push(plan);
    }

    if (subPlans.length > 0) {
      const chained = resolveCrossPlanRefs(subPlans);
      if (boards && boards.length > 0) {
        const preFlight = runPreFlight(chained, boards, playbook);
        if (preFlight.length > 0) {
          return [...preFlight, ...chained];
        }
      }
      return chained;
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

function expandArgsChain(plan: PlanStep[], args: Record<string, unknown>): PlanStep[] {
  const chained = injectAutoRefs(plan);
  const subArgs = extractChainArgs(args);

  if (subArgs.length === 0) return chained;

  const dependentSteps: PlanStep[] = [];
  const lastCardRef = chained.find((s) => s.action === 'create_card')?.ref;

  for (const sub of subArgs) {
    const cardId = (sub.cardId as string) || (lastCardRef ? `ref:${lastCardRef}` : '');
    if (sub.member) {
      dependentSteps.push({
        action: 'assign_member',
        params: { memberId: sub.member, cardId },
        description: `Auto-chain: assign ${sub.member as string} ke card`,
      });
    }
    if (sub.text) {
      dependentSteps.push({
        action: 'add_comment',
        params: { cardId, text: sub.text },
        description: `Auto-chain: tambah komentar ke card`,
      });
    }
  }

  return [...chained, ...dependentSteps];
}
