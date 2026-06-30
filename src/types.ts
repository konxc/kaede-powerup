/**
 * KAEDE — Shared Type Definitions & Utilities
 *
 * Types dan utilities yang digunakan bersama antar modul.
 * Dipisahkan untuk menghindari circular dependencies.
 */

// ── Error Helper ──

/**
 * Ekstrak pesan error dengan aman dari unknown type.
 * Pattern ini menggantikan `(err as Error).message` yang tidak type-safe.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as Record<string, unknown>).message);
  return String(err);
}
