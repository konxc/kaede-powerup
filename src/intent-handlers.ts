/**
 * KAEDE Intent Handlers — Barrel
 *
 * Re-export dari domain-split modules di intent-handlers/.
 * Import tetap menggunakan `from './intent-handlers'` untuk backward compatibility.
 */

export { executeIntent } from './intent-handlers/index';
export type { IntentResult, BatchCard, BatchUpdateFilter, BatchUpdateOperation } from './intent-handlers/index';
