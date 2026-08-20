/**
 * KAEDE — Shared Type Definitions (Barrel)
 *
 * Semua tipe dire-export dari domain files di src/types/.
 * Import tetap menggunakan `from './types'` untuk backward compatibility.
 */

export * from './types/plan-types';
export * from './types/playbook-types';
export * from './types/trello-types';
export * from './types/template-types';

// ── Error Helper ──

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as Record<string, unknown>).message);
  return String(err);
}
