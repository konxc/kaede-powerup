/**
 * KAEDE — Agent-to-Agent Handoff Event Mechanism
 *
 * Mengelola protokol pertukaran instruksi terstruktur (handoff) antar-agent
 * (contoh: Terminal/Antigravity Agent <-> Hermes Agent di WhatsApp <-> OpenCode)
 * melalui komentar kartu Trello yang terbaca mesin dan manusia.
 */

export type HandoffStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface HandoffPayload {
  protocol: 'kaede-handoff/v1';
  id: string;
  timestamp: string;
  sourceAgent: string;
  targetAgent: string;
  cardId: string;
  cardTitle?: string;
  action: string;
  status: HandoffStatus;
  instructions: string;
  payload: Record<string, unknown>;
}

export interface StatusUpdatePayload {
  protocol: 'kaede-handoff/v1';
  type: 'status_update';
  handoffId: string;
  timestamp: string;
  updaterAgent: string;
  status: HandoffStatus;
  message?: string;
}

export interface CreateHandoffOptions {
  sourceAgent?: string;
  targetAgent: string;
  cardId: string;
  cardTitle?: string;
  action: string;
  instructions?: string;
  payload?: Record<string, unknown>;
}

export const HANDOFF_START_TAG = '<!-- KAEDE:HANDOFF:START -->';
export const HANDOFF_END_TAG = '<!-- KAEDE:HANDOFF:END -->';
export const STATUS_START_TAG = '<!-- KAEDE:HANDOFF_STATUS:START -->';
export const STATUS_END_TAG = '<!-- KAEDE:HANDOFF_STATUS:END -->';

/**
 * Membuat paket direktif handoff baru yang diformat untuk komentar Trello.
 */
export function createHandoffDirective(options: CreateHandoffOptions): {
  comment: string;
  directive: HandoffPayload;
} {
  const id = `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();
  const sourceAgent = options.sourceAgent || 'kaede-orchestrator';
  const instructions = options.instructions || `Lakukan tindakan ${options.action} sesuai data terlampir.`;
  const payloadData = options.payload || {};

  const directive: HandoffPayload = {
    protocol: 'kaede-handoff/v1',
    id,
    timestamp,
    sourceAgent,
    targetAgent: options.targetAgent,
    cardId: options.cardId,
    cardTitle: options.cardTitle,
    action: options.action,
    status: 'pending',
    instructions,
    payload: payloadData,
  };

  const jsonSnippet = JSON.stringify(directive, null, 2);

  const humanReadable = [
    `🤖 **KAEDE Agent Handoff Directive**`,
    ``,
    `- **ID**: \`${id}\``,
    `- **From**: \`@${sourceAgent}\` ➔ **To**: \`@${options.targetAgent}\``,
    `- **Action**: \`${options.action}\``,
    `- **Status**: ⏳ \`pending\``,
    `- **Timestamp**: ${timestamp}`,
    ``,
    `> **Instruksi**: ${instructions}`,
    ``,
    Object.keys(payloadData).length > 0
      ? `**Payload Parameters**:\n\`\`\`json\n${JSON.stringify(payloadData, null, 2)}\n\`\`\``
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const comment = `${HANDOFF_START_TAG}\n${jsonSnippet}\n${HANDOFF_END_TAG}\n\n${humanReadable}`;

  return { comment, directive };
}

/**
 * Membuat komentar pembaruan status untuk handoff yang sedang berjalan.
 */
export function createStatusUpdateComment(
  handoffId: string,
  status: HandoffStatus,
  options: { message?: string; updaterAgent?: string } = {},
): { comment: string; update: StatusUpdatePayload } {
  const timestamp = new Date().toISOString();
  const updaterAgent = options.updaterAgent || 'kaede-agent';

  const update: StatusUpdatePayload = {
    protocol: 'kaede-handoff/v1',
    type: 'status_update',
    handoffId,
    timestamp,
    updaterAgent,
    status,
    message: options.message,
  };

  const jsonSnippet = JSON.stringify(update, null, 2);

  const statusIcons: Record<HandoffStatus, string> = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '⏹️',
  };

  const humanReadable = [
    `🔔 **KAEDE Handoff Status Update**`,
    ``,
    `- **Handoff ID**: \`${handoffId}\``,
    `- **Status**: ${statusIcons[status] || '•'} \`${status}\``,
    `- **Updated by**: \`@${updaterAgent}\` at ${timestamp}`,
    options.message ? `> ${options.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const comment = `${STATUS_START_TAG}\n${jsonSnippet}\n${STATUS_END_TAG}\n\n${humanReadable}`;

  return { comment, update };
}

/**
 * Mengekstrak dan menyinkronkan seluruh riwayat direktif handoff dari komentar kartu.
 */
export function parseHandoffDirectives(
  comments: Array<{ text?: string; data?: { text?: string }; id?: string; date?: string }>,
): HandoffPayload[] {
  const directivesMap = new Map<string, HandoffPayload>();
  const updates: StatusUpdatePayload[] = [];

  for (const c of comments) {
    const rawText = c.text || c.data?.text || '';
    if (!rawText) continue;

    // 1. Cek Direktif Awal
    if (rawText.includes(HANDOFF_START_TAG) && rawText.includes(HANDOFF_END_TAG)) {
      try {
        const start = rawText.indexOf(HANDOFF_START_TAG) + HANDOFF_START_TAG.length;
        const end = rawText.indexOf(HANDOFF_END_TAG);
        const jsonStr = rawText.substring(start, end).trim();
        const parsed = JSON.parse(jsonStr) as HandoffPayload;
        if (parsed.protocol === 'kaede-handoff/v1' && parsed.id) {
          directivesMap.set(parsed.id, parsed);
        }
      } catch {
        // Abaikan parse error jika ada komentar terkorupsi
      }
    }

    // 2. Cek Status Updates
    if (rawText.includes(STATUS_START_TAG) && rawText.includes(STATUS_END_TAG)) {
      try {
        const start = rawText.indexOf(STATUS_START_TAG) + STATUS_START_TAG.length;
        const end = rawText.indexOf(STATUS_END_TAG);
        const jsonStr = rawText.substring(start, end).trim();
        const parsed = JSON.parse(jsonStr) as StatusUpdatePayload;
        if (parsed.protocol === 'kaede-handoff/v1' && parsed.type === 'status_update' && parsed.handoffId) {
          updates.push(parsed);
        }
      } catch {
        // Abaikan parse error
      }
    }
  }

  // Terapkan update status sesuai kronologi
  updates.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  for (const u of updates) {
    const target = directivesMap.get(u.handoffId);
    if (target) {
      target.status = u.status;
    }
  }

  return Array.from(directivesMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
