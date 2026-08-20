/**
 * KAEDE Trello Proxy — Netlify Function (Mode 2: stateless serverless)
 *
 * Lapisan tipis & stateless untuk Power-Up public / pihak ke-3.
 * Orkestrasi (generate_plan/execute_plan/history/git) TIDAK tersedia di sini
 * — hanya subset kategori A (pure) + B (baca) + C (tulis terkendali).
 *
 * Auth (per-user OAuth, multi-tenant):
 *   - Path publik (Power-Up browser): header `Authorization: Bearer <per-user token>`
 *     (token hasil OAuth akun pengguna masing-masing, disimpan member-private).
 *     Proxy memvalidasi token via GET /1/tokens/{token} dengan consumer key
 *     (TRELLO_API_KEY). Token yang dipakai untuk panggilan Trello = token user itu
 *     sendiri → least-privilege (hanya board milik user). Proxy tetap stateless.
 *   - Path integrator (server-to-server): header `X-KAEDE-Key` = KAEDE_API_KEY,
 *     menggunakan token service-account (TRELLO_TOKEN). Hanya jika KAEDE_API_KEY diset.
 *   - Tanpa salah satu → 401.
 *
 * Environment: TRELLO_API_KEY (consumer key), TRELLO_TOKEN (service account, integrator),
 *              KAEDE_API_KEY (integrator guard).
 *
 * Endpoints:
 *   POST /              → health check
 *   POST /api/health    → health check
 *   POST /api/tool      → tool dispatch (enforce_playbook, parse_playbook, detect_duplicates = pure/open;
 *                         generate_sprint_report = butuh auth)
 *   POST /api/mcp       → execute MCP intent (whitelisted, butuh auth)
 */

// ═══════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════

interface NetlifyEvent {
  httpMethod?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface Auth {
  token: string;
  member: unknown;
  integrator?: boolean;
}

interface PlaybookRole {
  name: string;
  responsibilities: string[];
  access: string;
  aiInstructions: string;
}

interface PlaybookResult {
  title: string;
  roles: PlaybookRole[];
  workflow: { lists: string[] };
  conventions: {
    titlePrefixes: string[];
    descriptionTemplate: string;
    labels: Array<{ color: string; meaning: string }>;
  };
}

type Warning = {
  rule: string;
  severity: string;
  message: string;
  actual: string;
  expected: string;
};

// ═══════════════════════════════════════════════════════════════
//  Constants & Helpers
// ═══════════════════════════════════════════════════════════════

const TRELLO_API_BASE = 'https://api.trello.com/1';

function json(body: unknown, status = 200): NetlifyResponse {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-KAEDE-Key',
    },
    body: JSON.stringify(body),
  };
}

function parsePath(event: NetlifyEvent): string {
  const p = event.path || '';
  const base = '/.netlify/functions/trello-proxy';
  const rest = p.startsWith(base) ? p.slice(base.length) : p;
  return rest || '/';
}

// ═══════════════════════════════════════════════════════════════
//  Per-User OAuth Auth (Mode 2 discipline — multi-tenant)
// ═══════════════════════════════════════════════════════════════

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function headerValue(event: NetlifyEvent, name: string): string {
  const headers = event.headers || {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === name.toLowerCase()) return v;
  }
  return '';
}

function bearerToken(event: NetlifyEvent): string {
  const raw = headerValue(event, 'authorization');
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

// Validasi token per-user terhadap Trello: GET /1/tokens/{token}?key=<consumerKey>
// Mengembalikan { token, member } dengan identitas user. Server tidak menyimpan apa pun.
async function validateUserToken(token: string): Promise<Auth> {
  const key = process.env.TRELLO_API_KEY || '';
  if (!key) throw new AuthError('TRELLO_API_KEY is not configured on the server.', 503);
  const qs = new URLSearchParams({ key }).toString();
  const res = await fetch(`${TRELLO_API_BASE}/tokens/${token}?${qs}`);
  if (!res.ok) {
    throw new AuthError('Invalid or expired Trello token. Re-authorize in the Power-Up.', 401);
  }
  const data = await res.json();
  return { token, member: (data && (data as { member?: unknown }).member) || null };
}

// Resolusi auth per-request:
//   1) Bearer per-user (publik / Power-Up) → validasi & pakai token user tsb.
//   2) X-KAEDE-Key integrator → pakai token service-account (TRELLO_TOKEN).
//   3) Tidak ada → null (ditolak 401 oleh pemanggil).
async function resolveAuth(event: NetlifyEvent): Promise<Auth | null> {
  const userToken = bearerToken(event);
  if (userToken) {
    return validateUserToken(userToken);
  }

  const providedKey = headerValue(event, 'x-kaede-key');
  const configured = process.env.KAEDE_API_KEY || '';
  if (configured && providedKey === configured) {
    const service = process.env.TRELLO_TOKEN || '';
    if (!service) throw new AuthError('TRELLO_TOKEN is not configured for integrator access.', 503);
    return { token: service, member: null, integrator: true };
  }
  if (configured && providedKey) {
    throw new AuthError('Invalid X-KAEDE-Key.', 401);
  }
  return null;
}

function normalize(s: string): string {
  return (s || '').toLowerCase().trim();
}

// ═══════════════════════════════════════════════════════════════
//  Trello REST Helpers
// ═══════════════════════════════════════════════════════════════

async function trelloGet(pathname: string, params: Record<string, string>, token: string): Promise<unknown> {
  if (!token) throw new AuthError('Authentication required.', 401);
  const key = process.env.TRELLO_API_KEY || '';
  if (!key) throw new AuthError('TRELLO_API_KEY is not configured on the server.', 503);
  const qs = new URLSearchParams({ key, token, ...params }).toString();
  const url = `${TRELLO_API_BASE}${pathname}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API ${res.status}: ${text}`);
  }
  return res.json();
}

async function trelloPost(pathname: string, body: Record<string, unknown>, token: string): Promise<unknown> {
  if (!token) throw new AuthError('Authentication required.', 401);
  const key = process.env.TRELLO_API_KEY || '';
  if (!key) throw new AuthError('TRELLO_API_KEY is not configured on the server.', 503);
  const qs = new URLSearchParams({ key, token }).toString();
  const url = `${TRELLO_API_BASE}${pathname}?${qs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API ${res.status}: ${text}`);
  }
  return res.json();
}

async function trelloDelete(pathname: string, token: string): Promise<unknown> {
  if (!token) throw new AuthError('Authentication required.', 401);
  const key = process.env.TRELLO_API_KEY || '';
  if (!key) throw new AuthError('TRELLO_API_KEY is not configured on the server.', 503);
  const qs = new URLSearchParams({ key, token }).toString();
  const url = `${TRELLO_API_BASE}${pathname}?${qs}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API ${res.status}: ${text}`);
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
//  Playbook Parser (pure)
// ═══════════════════════════════════════════════════════════════

const SECTION_MAP: Record<string, string[]> = {
  roles: ['peran', 'role', 'roles & responsibilities', 'team roles', 'roles', 'siapa saja'],
  workflow: ['alur', 'workflow', 'sprint workflow', 'kanban', 'sprint'],
  conventions: ['konvensi', 'nama', 'naming', 'standards', 'aturan', 'conventions', 'convention'],
};

function mapSection(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [key, keywords] of Object.entries(SECTION_MAP)) {
    if (keywords.some((k) => lower.includes(k))) return key;
  }
  return null;
}

function parsePlaybook(content: string): PlaybookResult {
  const lines = content.split('\n');
  const result: PlaybookResult = {
    title: '',
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };
  let currentSection: string | null = null;
  let currentRole: PlaybookRole | null = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const listItem = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.*)/);

    if (h1 && !result.title) { result.title = h1[1].trim(); continue; }
    if (h2) { currentSection = mapSection(h2[1]); continue; }

    if (currentSection === 'roles' && h3) {
      if (currentRole) result.roles.push(currentRole);
      currentRole = { name: h3[1].replace(/Peran:\s*/i, '').trim(), responsibilities: [], access: '', aiInstructions: '' };
      continue;
    }
    if (currentRole && listItem) {
      const key = listItem[1].toLowerCase();
      const value = listItem[2].trim();
      if (key.includes('tanggung')) currentRole.responsibilities.push(value);
      else if (key.includes('akses')) currentRole.access = value;
      else if (key.includes('ai')) currentRole.aiInstructions = value;
    }

    if (currentSection === 'workflow') {
      const wf = line.match(/^[-*\d]+\.?\s+\*\*(.+?)\*\*/);
      if (wf && wf[1].trim() && !result.workflow.lists.includes(wf[1].trim())) {
        result.workflow.lists.push(wf[1].trim());
      }
    }

    if (currentSection === 'conventions') {
      const prefixMatch = line.match(/`(feat|fix|docs|chore|refactor|test):/g);
      if (prefixMatch) {
        for (const p of prefixMatch) {
          const cleaned = p.replace(/`/g, '');
          if (!result.conventions.titlePrefixes.includes(cleaned)) {
            result.conventions.titlePrefixes.push(cleaned);
          }
        }
      }
      const colorMatch = line.match(/\*{0,2}(merah|kuning|hijau|red|yellow|green)\*{0,2}\s*:\s*(.+)/i);
      if (colorMatch) {
        result.conventions.labels.push({ color: colorMatch[1], meaning: colorMatch[2].trim() });
      }
    }
  }
  if (currentRole) result.roles.push(currentRole);
  return result;
}

// ═══════════════════════════════════════════════════════════════
//  Enforcer (pure)
// ═══════════════════════════════════════════════════════════════

function getPrefix(cardName: string): string | null {
  const match = (cardName || '').match(/^(\w[\w-]*?:)/);
  return match ? match[1].toLowerCase() : null;
}

function validateCardPrefix(cardName: string, allowedPrefixes: string[]): Warning | null {
  if (!cardName || !allowedPrefixes || allowedPrefixes.length === 0) return null;
  const prefix = getPrefix(cardName);
  if (!prefix) {
    return { rule: 'title_prefix', severity: 'warning', message: `Card title "${cardName}" has no prefix. Expected one of: ${allowedPrefixes.join(', ')}`, actual: '(none)', expected: allowedPrefixes.join(', ') };
  }
  if (!allowedPrefixes.map(normalize).includes(prefix)) {
    return { rule: 'title_prefix', severity: 'warning', message: `Card title "${cardName}" uses prefix "${prefix}" which is not in allowed prefixes: ${allowedPrefixes.join(', ')}`, actual: prefix, expected: allowedPrefixes.join(', ') };
  }
  return null;
}

function validateCardLabel(labelName: string, allowedLabels: Array<{ color: string; meaning: string }>): Warning | null {
  if (!labelName || !allowedLabels || allowedLabels.length === 0) return null;
  const lower = normalize(labelName);
  const matched = allowedLabels.some((l) => normalize(l.color) === lower || normalize(l.meaning).includes(lower));
  if (!matched) {
    return { rule: 'allowed_label', severity: 'warning', message: `Label "${labelName}" is not defined in playbook conventions. Allowed: ${allowedLabels.map((l) => l.color).join(', ')}`, actual: labelName, expected: allowedLabels.map((l) => `${l.color} (${l.meaning})`).join(', ') };
  }
  return null;
}

function validateWorkflowList(listName: string, workflowLists: string[]): Warning | null {
  if (!listName || !workflowLists || workflowLists.length === 0) return null;
  if (!workflowLists.some((l) => normalize(l) === normalize(listName))) {
    return { rule: 'workflow_list', severity: 'info', message: `List "${listName}" is not in workflow lists: ${workflowLists.join(', ')}`, actual: listName, expected: workflowLists.join(', ') };
  }
  return null;
}

function validateRoleAccess(roleName: string, action: string, roles: PlaybookRole[]): Warning | null {
  if (!roleName || !roles || roles.length === 0) return null;

  const restrictedActions: Record<string, string[]> = {
    close_sprint: ['PM', 'Lead', 'Admin'],
    setup_sprint: ['PM', 'Lead'],
    batch_update_cards: ['PM', 'Lead'],
    delete_board: ['Admin'],
    archive_board: ['Admin'],
  };

  const requiredRoles = restrictedActions[action];
  if (!requiredRoles) return null;

  const matched = roles.find((r) => normalize(r.name) === normalize(roleName));
  if (!matched || !requiredRoles.some((rr) => normalize(rr) === normalize(roleName))) {
    return { rule: 'role_access', severity: 'blocker', message: `Role "${roleName}" does not have permission to execute "${action}". Required: ${requiredRoles.join(', ')}`, actual: roleName, expected: requiredRoles.join(', ') };
  }
  return null;
}

function enforcePlaybook(plan: Array<{ action: string; params?: Record<string, unknown> }>, playbook: PlaybookResult, boards?: unknown[]): {
  safe: boolean;
  warnings: Warning[];
  blockers: string[];
  summary: string;
} {
  const warnings: Warning[] = [];
  const { titlePrefixes, labels: allowedLabels } = playbook.conventions;
  const { lists: workflowLists } = playbook.workflow;

  for (const step of (plan || [])) {
    if (step.action === 'create_card') {
      const cardName = (step.params?.name as string) || '';
      const cardLabels = (step.params?.labels as string[]) || [];
      const pw = validateCardPrefix(cardName, titlePrefixes);
      if (pw) warnings.push(pw);
      const lw = validateWorkflowList((step.params?.listName as string) || '', workflowLists);
      if (lw) warnings.push(lw);
      for (const lbl of cardLabels) {
        const lw2 = validateCardLabel(lbl, allowedLabels);
        if (lw2) warnings.push(lw2);
      }
    }
    if (step.action === 'create_list') {
      const n = (step.params?.name as string) || '';
      if (n && workflowLists.length > 0) {
        const w = validateWorkflowList(n, workflowLists);
        if (w) warnings.push(w);
      }
    }
    if (step.action === 'close_sprint' || step.action === 'batch_update_cards') {
      const roleWarn = validateRoleAccess('PM', step.action, playbook.roles);
      if (roleWarn && boards) {
        warnings.push(roleWarn);
      }
    }
  }

  if (boards) {
    for (const board of boards as Array<{ lists?: Array<{ cards?: Array<{ name?: string }> }> }>) {
      for (const list of (board.lists || [])) {
        for (const card of (list.cards || [])) {
          const pw = validateCardPrefix(card.name || '', titlePrefixes);
          if (pw) warnings.push(pw);
        }
      }
    }
  }

  const blockers = warnings.filter((w) => w.severity === 'blocker').map((w) => w.message);
  const safe = blockers.length === 0;

  let summary: string;
  if (warnings.length === 0) {
    summary = 'All actions comply with playbook conventions.';
  } else {
    const blocking = blockers.length;
    const advisory = warnings.length - blocking;
    summary = `${warnings.length} playbook violation(s) found: ${blocking} blocker(s), ${advisory} advisory.`;
  }

  return { safe, warnings, blockers, summary };
}

// ═══════════════════════════════════════════════════════════════
//  Duplicate Detector (pure)
// ═══════════════════════════════════════════════════════════════

interface CardEntry {
  card: { id: string; name: string; [k: string]: unknown };
  listName: string;
  boardName: string;
  boardId: string;
  listId: string;
}

function detectDuplicates(boards: Array<{ boardId: string; boardName?: string; lists?: Array<{ listId: string; listName?: string; cards?: Array<{ id: string; name: string; [k: string]: unknown }> }> }>): {
  sameList: unknown[];
  crossList: unknown[];
  crossBoard: unknown[];
  totalDuplicateCards: number;
  totalCards: number;
} {
  const all: CardEntry[] = [];
  for (const b of (boards || [])) {
    for (const l of (b.lists || [])) {
      for (const c of (l.cards || [])) {
        all.push({ card: c, listName: l.listName || '', boardName: b.boardName || '', boardId: b.boardId, listId: l.listId });
      }
    }
  }

  const groups = new Map<string, CardEntry[]>();
  for (const entry of all) {
    const key = normalize(entry.card.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const sameList: unknown[] = [];
  const crossList: unknown[] = [];
  const crossBoard: unknown[] = [];

  for (const [name, entries] of groups) {
    if (entries.length < 2) continue;

    // sameList
    const byLocation = new Map<string, CardEntry[]>();
    for (const e of entries) {
      const loc = `${e.boardId}:${e.listId}`;
      if (!byLocation.has(loc)) byLocation.set(loc, []);
      byLocation.get(loc)!.push(e);
    }
    for (const [, locEntries] of byLocation) {
      if (locEntries.length > 1) {
        sameList.push({ name: locEntries[0].card.name, count: locEntries.length, cards: locEntries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })), location: 'sameList' });
      }
    }

    // crossList (same board, different lists)
    const byBoard = new Map<string, CardEntry[]>();
    for (const e of entries) {
      if (!byBoard.has(e.boardId)) byBoard.set(e.boardId, []);
      byBoard.get(e.boardId)!.push(e);
    }
    for (const [, boardEntries] of byBoard) {
      const uniqueLists = new Set(boardEntries.map((e) => `${e.boardId}:${e.listId}`));
      if (uniqueLists.size > 1 && boardEntries.length > 1) {
        const already = sameList.some((g) => normalize((g as { name: string }).name) === name && boardEntries.every((e) => (g as { cards: Array<{ id: string }> }).cards.some((gc) => gc.id === e.card.id)));
        if (!already) {
          crossList.push({ name: boardEntries[0].card.name, count: boardEntries.length, cards: boardEntries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })), location: 'crossList' });
        }
      }
    }

    // crossBoard
    const uniqueBoards = new Set(entries.map((e) => e.boardId));
    if (uniqueBoards.size > 1) {
      crossBoard.push({ name: entries[0].card.name, count: entries.length, cards: entries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })), location: 'crossBoard' });
    }
  }

  const totalDuplicateCards = all.filter((e) => (groups.get(normalize(e.card.name))?.length || 0) > 1).length;
  return { sameList, crossList, crossBoard, totalDuplicateCards, totalCards: all.length };
}

// ═══════════════════════════════════════════════════════════════
//  Intent → Trello Action Handlers
// ═══════════════════════════════════════════════════════════════

type IntentHandler = (args: Record<string, unknown>, auth: Auth) => Promise<unknown>;

const INTENT_HANDLERS: Record<string, IntentHandler> = {
  health: async () => ({ status: 'ok', version: '1.1.0' }),

  list_boards: async (args, auth) => {
    const boards = await trelloGet('/members/me/boards', { fields: 'name,id,url,shortUrl,closed' }, auth.token);
    return (boards as Array<{ id: string; name: string; url: string; shortUrl: string; closed: boolean }>).filter((b) => !b.closed).map((b) => ({ id: b.id, name: b.name, url: b.url, shortUrl: b.shortUrl }));
  },

  get_board_lists: async (args, auth) => {
    const { boardId } = args;
    if (!boardId) throw new Error('boardId required');
    const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: 'name,id,closed' }, auth.token);
    return (lists as Array<{ id: string; name: string; closed: boolean }>).filter((l) => !l.closed).map((l) => ({ id: l.id, name: l.name }));
  },

  get_cards_by_list: async (args, auth) => {
    const { listId } = args;
    if (!listId) throw new Error('listId required');
    return trelloGet(`/lists/${listId}/cards`, { fields: 'name,id,due,dueComplete,idMembers,start,dateLastActivity' }, auth.token);
  },

  get_card: async (args, auth) => {
    const { cardId } = args;
    if (!cardId) throw new Error('cardId required');
    return trelloGet(`/cards/${cardId}`, { fields: 'name,id,desc,due,dueComplete,labels,idBoard,url,dateLastActivity' }, auth.token);
  },

  get_board_labels: async (args, auth) => {
    const { boardId } = args;
    if (!boardId) throw new Error('boardId required');
    return trelloGet(`/boards/${boardId}/labels`, { fields: 'id,name,color' }, auth.token);
  },

  add_label_to_card: async (args, auth) => {
    const { cardId, labelId } = args;
    if (!cardId || !labelId) throw new Error('cardId and labelId required');
    return trelloPost(`/cards/${cardId}/idLabels`, { value: labelId }, auth.token);
  },

  remove_label_from_card: async (args, auth) => {
    const { cardId, labelId } = args;
    if (!cardId || !labelId) throw new Error('cardId and labelId required');
    return trelloDelete(`/cards/${cardId}/idLabels/${labelId}`, auth.token);
  },

  create_card: async (args, auth) => {
    const { name, desc, listId } = args;
    if (!name || !listId) throw new Error('name and listId required');
    return trelloPost(`/lists/${listId}/cards`, { name, desc: desc || '' }, auth.token);
  },

  create_list: async (args, auth) => {
    const { name, boardId } = args;
    if (!name || !boardId) throw new Error('name and boardId required');
    return trelloPost(`/boards/${boardId}/lists`, { name }, auth.token);
  },

  create_label: async (args, auth) => {
    const { name, color, boardId } = args;
    if (!name || !boardId) throw new Error('name and boardId required');
    return trelloPost(`/boards/${boardId}/labels`, { name, color: color || 'green' }, auth.token);
  },

  move_card: async (args, auth) => {
    const { cardId, listId } = args;
    if (!cardId || !listId) throw new Error('cardId and listId required');
    return trelloPost(`/cards/${cardId}`, { idList: listId }, auth.token);
  },

  add_comment: async (args, auth) => {
    const { cardId, text } = args;
    if (!cardId || !text) throw new Error('cardId and text required');
    return trelloPost(`/cards/${cardId}/actions/comments`, { text }, auth.token);
  },

  find_members: async (args, auth) => {
    return trelloGet('/members/me', { fields: 'fullName,username,email,id' }, auth.token);
  },
};

// ═══════════════════════════════════════════════════════════════
//  Handlers
// ═══════════════════════════════════════════════════════════════

async function handleHealth(): Promise<NetlifyResponse> {
  return json({ status: 'ok', version: '1.1.0' });
}

async function handleTool(body: Record<string, unknown>, event: NetlifyEvent): Promise<NetlifyResponse> {
  const { name, arguments: args = {} } = body || {};
  if (!name) return json({ error: 'tool name required' }, 400);

  switch (name) {
    case 'enforce_playbook': {
      const { playbook: pb, plan, boards } = args as { playbook?: string | PlaybookResult; plan?: Array<{ action: string; params?: Record<string, unknown> }>; boards?: unknown[] };
      if (!pb) return json({ error: 'playbook required' }, 400);
      const parsed = typeof pb === 'string' ? parsePlaybook(pb) : pb;
      const result = enforcePlaybook(plan || [], parsed, boards || []);
      return json(result);
    }

    case 'parse_playbook': {
      const { content } = args as { content?: string };
      if (!content) return json({ error: 'content required' }, 400);
      return json(parsePlaybook(content));
    }

    case 'generate_plan': {
      return json({ plan: [{ action: 'unsupported', params: { note: 'generate_plan requires KAEDE orchestrator locally. Use kaede start instead.' }, description: 'generate_plan is not available via Netlify proxy. Run locally with kaede start.' }] });
    }

    case 'execute_plan': {
      return json({ success: false, error: 'execute_plan requires KAEDE orchestrator locally. Use kaede start instead.' });
    }

    case 'detect_duplicates': {
      const { boards } = args as { boards?: Array<{ boardId: string; boardName?: string; lists?: Array<{ listId: string; listName?: string; cards?: Array<{ id: string; name: string; [k: string]: unknown }> }> }> };
      if (!boards) return json({ error: 'boards required' }, 400);
      return json(detectDuplicates(boards));
    }

    case 'generate_sprint_report': {
      const { boardId, listName, sprintName } = args as { boardId?: string; listName?: string; sprintName?: string };
      if (!boardId) return json({ error: 'boardId required' }, 400);
      let auth: Auth | null;
      try {
        auth = await resolveAuth(event);
      } catch (err) {
        return json({ error: (err as Error).message }, (err as AuthError).status || 401);
      }
      if (!auth) {
        return json({ error: 'Authentication required. Send Authorization: Bearer <user-token> or X-KAEDE-Key.' }, 401);
      }
      try {
        const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: 'name,id,closed' }, auth.token);
        const activeLists = (lists as Array<{ id: string; name: string; closed: boolean }>).filter((l) => !l.closed);
        const targetLists = listName
          ? activeLists.filter((l) => normalize(l.name).includes(normalize(listName)))
          : activeLists;

        const listCardMap: Record<string, Array<Record<string, unknown>>> = {};
        const allCards: Array<Record<string, unknown>> = [];

        for (const list of targetLists) {
          const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: 'name,id,due,dueComplete,start,desc,url,dateLastActivity,labels' }, auth.token);
          listCardMap[list.name] = (cards as Array<Record<string, unknown>>).map((c) => ({ id: c.id, name: c.name, listName: list.name, due: c.due, dueComplete: c.dueComplete, start: c.start, desc: c.desc, url: c.url, dateLastActivity: c.dateLastActivity, labels: (c.labels as Array<{ name?: string; color?: string }>) || [] }));
          allCards.push(...listCardMap[list.name]);
        }

        const now = new Date();
        const overdueCount = allCards.filter((c) => c.due && !c.dueComplete && new Date(c.due as string) < now).length;
        const completedCount = allCards.filter((c) => c.dueComplete).length;

        const groupedByLabel: Record<string, number> = {};
        for (const c of allCards) {
          for (const l of (c.labels as Array<{ name?: string; color?: string }>)) {
            const key = (l.name || l.color) as string;
            groupedByLabel[key] = (groupedByLabel[key] || 0) + 1;
          }
        }

        const boardInfo = (await trelloGet(`/boards/${boardId}`, { fields: 'name' }, auth.token)) as { name: string };

        const lines: string[] = [];
        lines.push(`# Sprint Report: ${sprintName || 'Current Sprint'}`);
        lines.push(`**Board:** ${boardInfo.name}`);
        lines.push(`**Generated:** ${now.toISOString().slice(0, 10)}`);
        lines.push(`**Total Cards:** ${allCards.length}`);
        lines.push(`**Overdue:** ${overdueCount}`);
        lines.push(`**Completed:** ${completedCount}`);
        lines.push('');
        for (const [lName, cards] of Object.entries(listCardMap)) {
          lines.push(`## ${lName} (${cards.length})`);
          for (const c of cards) {
            const dueStr = c.due ? ` [${new Date(c.due as string).toISOString().slice(0, 10)}${c.dueComplete ? ' ✓' : ''}]` : '';
            const labelStr = (c.labels as Array<{ name?: string; color?: string }>)?.length ? ` \`${(c.labels as Array<{ name?: string; color?: string }>).map((l) => l.name || l.color).join(', ')}\`` : '';
            lines.push(`- ${c.name}${dueStr}${labelStr}`);
          }
          lines.push('');
        }
        if (Object.keys(groupedByLabel).length > 0) {
          lines.push('## Cards by Label');
          for (const [label, count] of Object.entries(groupedByLabel).sort((a, b) => b[1] - a[1])) {
            lines.push(`- **${label}**: ${count}`);
          }
        }

        return json({
          boardName: boardInfo.name,
          sprintName: sprintName || 'Current Sprint',
          generatedAt: now.toISOString(),
          totalCards: allCards.length,
          lists: targetLists.map((l) => ({ listName: l.name, cardCount: (listCardMap[l.name] || []).length, cards: listCardMap[l.name] || [] })),
          groupedByLabel,
          overdueCount,
          completedCount,
          markdown: lines.join('\n'),
        });
      } catch (err) {
        return json({ error: (err as Error).message }, 500);
      }
    }

    default:
      return json({ error: `Unknown tool: ${name}` }, 404);
  }
}

async function handleMCP(body: Record<string, unknown>, event: NetlifyEvent): Promise<NetlifyResponse> {
  const { intent, args = {}, boardId } = body || {};
  if (!intent) return json({ error: 'intent required' }, 400);

  const handler = INTENT_HANDLERS[intent as string];
  if (!handler) return json({ error: `Unknown intent: ${intent}`, supported: Object.keys(INTENT_HANDLERS) }, 404);

  let auth: Auth | null;
  try {
    auth = await resolveAuth(event);
  } catch (err) {
    return json({ error: (err as Error).message }, (err as AuthError).status || 401);
  }
  if (!auth) {
    return json({
      error: 'Authentication required. Public path: Authorization: Bearer <per-user-token>. Integrator path: X-KAEDE-Key.',
    }, 401);
  }

  try {
    const results = await handler({ ...(args as Record<string, unknown>), boardId }, auth);
    return json({ success: true, results });
  } catch (err) {
    const status = (err as AuthError).status || 500;
    return json({ success: false, error: (err as Error).message }, status);
  }
}

// ═══════════════════════════════════════════════════════════════
//  Main Handler
// ═══════════════════════════════════════════════════════════════

export const handler = async (event: NetlifyEvent, context?: unknown): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-KAEDE-Key',
      },
      body: '',
    };
  }

  const route = parsePath(event);

  // Health check at root or /api/health (accept both GET and POST)
  if (route === '/' || route === '/api/health') {
    return handleHealth();
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (route === '/api/tool') {
    return handleTool(body, event);
  }

  if (route === '/api/mcp') {
    return handleMCP(body, event);
  }

  return json({ error: 'Not found', route }, 404);
};
