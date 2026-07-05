/**
 * KAEDE Execution History Store
 *
 * In-memory FIFO history untuk undo/rollback.
 * Tidak persist ke disk — data hilang saat proses restart.
 */

import { randomUUID } from 'crypto';
import type { ExecutionHistory } from './types';

const EXECUTION_HISTORY: ExecutionHistory[] = [];
const MAX_HISTORY = 10;

function generatePlanId(): string {
  return randomUUID().slice(0, 8);
}

export function getExecutionHistory(): ExecutionHistory[] {
  return [...EXECUTION_HISTORY];
}

export function getLastExecutionHistory(): ExecutionHistory | null {
  return EXECUTION_HISTORY.length > 0 ? EXECUTION_HISTORY[0] : null;
}

export function clearExecutionHistory(): void {
  EXECUTION_HISTORY.length = 0;
}

export function addExecutionHistory(
  entry: Omit<ExecutionHistory, 'planId' | 'timestamp'>,
): ExecutionHistory {
  const historyEntry: ExecutionHistory = {
    planId: generatePlanId(),
    timestamp: Date.now(),
    ...entry,
  };
  EXECUTION_HISTORY.unshift(historyEntry);
  if (EXECUTION_HISTORY.length > MAX_HISTORY) EXECUTION_HISTORY.pop();
  return historyEntry;
}

export function removeLastExecutionHistory(): ExecutionHistory | undefined {
  return EXECUTION_HISTORY.shift();
}
