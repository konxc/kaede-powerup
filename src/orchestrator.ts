/**
 * KAEDE Orchestrator — Lapisan kecerdasan di atas Trello MCP
 *
 * Membaca Playbook untuk memahami workflow, lalu mengeksekusi
 * serangkaian tindakan Trello berdasarkan intent pengguna.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TrelloMCPClient } from './trello-client';

// ── Type Definitions ──

interface PlaybookConventions {
  titlePrefixes: string[];
  descriptionTemplate: string;
  labels: Array<{ color: string; meaning: string }>;
}

interface PlaybookResult {
  title: string;
  roles: Array<{
    name: string;
    responsibilities: string[];
    access: string;
    aiInstructions: string;
  }>;
  workflow: { lists: string[] };
  conventions: PlaybookConventions;
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

interface PlanHandler {
  patterns: string[];
  fn: (pb: PlaybookResult, args: Record<string, unknown>) => Array<Record<string, unknown>>;
}

interface IntentResult {
  success: boolean;
  type: string;
  name: string;
  error?: string;
  result?: unknown;
  detail?: unknown;
}

interface BundlePaths {
  playbook?: string;
  openkb?: string;
  opencode?: string;
}

interface BundleContextResult {
  playbook: PlaybookResult | null;
  openkb: { glossary: string[]; decisions: string[] };
  opencode: Record<string, unknown> | null;
}

// ── Section Map ──

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

// ── Parse Playbook ──

export function parsePlaybook(content: string): PlaybookResult {
  const lines = content.split('\n');
  const result: PlaybookResult = {
    title: '',
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };

  let currentSection: string | null = null;
  let currentRole: PlaybookResult['roles'][0] | null = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const listItem = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.*)/);

    if (h1 && !result.title) {
      result.title = h1[1].trim();
      continue;
    }

    if (h2) {
      currentSection = mapSection(h2[1]);
      continue;
    }

    if (currentSection === 'roles' && h3) {
      if (currentRole) result.roles.push(currentRole);
      const roleName = h3[1].replace(/Peran:\s*/i, '').trim();
      currentRole = { name: roleName, responsibilities: [], access: '', aiInstructions: '' };
      continue;
    }

    if (currentRole && listItem) {
      const key = listItem[1].toLowerCase();
      const value = listItem[2].trim();
      if (key.includes('tanggung')) {
        currentRole.responsibilities.push(value);
      } else if (key.includes('akses')) {
        currentRole.access = value;
      } else if (key.includes('ai')) {
        currentRole.aiInstructions = value;
      }
    }

    if (currentSection === 'workflow') {
      const wfListLine = line.match(/^[-*\d]+\.?\s+\*\*(.+?)\*\*/);
      if (wfListLine) {
        const listName = wfListLine[1].trim();
        if (listName && !result.workflow.lists.includes(listName)) {
          result.workflow.lists.push(listName);
        }
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
      const labelColorMatch = line.match(/\*{0,2}(merah|kuning|hijau|red|yellow|green)\*{0,2}\s*:\s*(.+)/i);
      if (labelColorMatch) {
        result.conventions.labels.push({ color: labelColorMatch[1], meaning: labelColorMatch[2].trim() });
      }
    }
  }

  if (currentRole) result.roles.push(currentRole);
  return result;
}

// ── Intent Handlers ──

const intentHandlers: IntentHandler[] = [];

function onIntent(patterns: string[], fn: IntentHandler['fn']): void {
  intentHandlers.push({ patterns: patterns.map((p) => p.toLowerCase()), fn });
}

onIntent(['mulai sprint', 'setup sprint'], async (client, pb, boardId) => {
  const results: IntentResult[] = [];
  for (const listName of pb.workflow.lists) {
    try {
      const r = await client.createList(boardId, listName);
      results.push({ success: true, type: 'create_list', name: listName, result: r });
    } catch (err) {
      results.push({ success: false, type: 'create_list', name: listName, error: (err as Error).message });
    }
  }
  return results;
});

onIntent(['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'], async (client, pb, boardId, args) => {
  const name = (args?.task as string) || (args?.name as string) || 'New Task';
  const desc = (args?.desc as string) || (args?.description as string) || '';
  const listName = (args?.list as string) || pb.workflow.lists[0];
  const listId = (args?.listId as string) || '';

  if (listId) {
    try {
      const r = await client.createCard(listId, name, desc);
      return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
    } catch (err) {
      return [{ success: false, type: 'create_card', name, error: (err as Error).message }];
    }
  }

  const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const target = lists.find((l) => (l.name as string).toLowerCase() === (listName || '').toLowerCase());
  if (!target) {
    return [{ success: false, type: 'create_card', name, error: `List "${listName}" not found` }];
  }
  try {
    const r = await client.createCard(target.id as string, name, desc);
    return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
  } catch (err) {
    return [{ success: false, type: 'create_card', name, error: (err as Error).message }];
  }
});

onIntent(['assign', 'tugaskan', 'tambahkan anggota'], async (client, _pb, _boardId, args) => {
  const memberId = (args?.memberId as string) || (args?.member as string) || '';
  const cardId = (args?.cardId as string) || (args?.card as string) || '';

  if (!memberId || !cardId) {
    return [{ success: false, type: 'assign_member', name: 'missing args', error: 'memberId and cardId required' }];
  }
  try {
    await client.assignMember(cardId, memberId);
    return [{ success: true, type: 'assign_member', name: `Member ${memberId} → Card ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'assign_member', name: `${memberId} → ${cardId}`, error: (err as Error).message }];
  }
});

onIntent(['tutup sprint', 'close sprint', 'archive sprint'], async (client, _pb, boardId) => {
  const results: IntentResult[] = [];
  const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const toArchive = lists.filter((l) =>
    ['done', 'selesai', 'qa', 'code review', 'qa/code review'].some((k) =>
      (l.name as string).toLowerCase().includes(k),
    ),
  );
  for (const list of toArchive) {
    try {
      const cards = (await client.callTool('get_cards_by_list_id', { listId: list.id })) as {
        cards?: Array<Record<string, unknown>>;
      };
      for (const card of cards.cards || []) {
        try {
          await client.callTool('archive_card', { cardId: card.id });
          results.push({ success: true, type: 'archive_card', name: card.name as string });
        } catch (err) {
          results.push({
            success: false,
            type: 'archive_card',
            name: card.name as string,
            error: (err as Error).message,
          });
        }
      }
    } catch (err) {
      results.push({ success: false, type: 'get_cards', name: list.name as string, error: (err as Error).message });
    }
  }
  return results;
});

onIntent(['pindah semua', 'move all', 'pindahkan semua'], async (client, _pb, boardId, args) => {
  const fromListName = (args?.dari as string) || (args?.from as string) || (args?.listName as string) || '';
  const toListName = (args?.ke as string) || (args?.to as string) || (args?.listNameTarget as string) || '';

  if (!fromListName || !toListName) {
    return [{ success: false, type: 'move_all_cards', name: 'missing args', error: 'from and to list names required' }];
  }

  try {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const fromList = lists.find((l) => (l.name as string).toLowerCase().includes(fromListName.toLowerCase()));
    const toList = lists.find((l) => (l.name as string).toLowerCase().includes(toListName.toLowerCase()));
    if (!fromList)
      return [
        { success: false, type: 'move_all_cards', name: fromListName, error: `List "${fromListName}" not found` },
      ];
    if (!toList)
      return [{ success: false, type: 'move_all_cards', name: toListName, error: `List "${toListName}" not found` }];

    const cards = (await client.getCardsByListId(fromList.id as string, boardId)) as Array<Record<string, unknown>>;
    const results: IntentResult[] = [];
    for (const card of cards) {
      try {
        await client.callTool('move_card', { cardId: card.id, listId: toList.id });
        results.push({ success: true, type: 'move_card', name: card.name as string });
      } catch (err) {
        results.push({ success: false, type: 'move_card', name: card.name as string, error: (err as Error).message });
      }
    }
    return results;
  } catch (err) {
    return [{ success: false, type: 'move_all_cards', name: fromListName, error: (err as Error).message }];
  }
});

onIntent(['pindah', 'move card', 'pindahkan'], async (client, _pb, boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const listId = (args?.listId as string) || (args?.list as string) || '';
  const listName = (args?.listName as string) || '';

  if (!cardId || (!listId && !listName)) {
    return [{ success: false, type: 'move_card', name: 'missing args', error: 'cardId and listId/listName required' }];
  }

  let targetListId = listId;
  if (!targetListId && listName) {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
    if (!target) return [{ success: false, type: 'move_card', name: cardId, error: `List "${listName}" not found` }];
    targetListId = target.id as string;
  }

  try {
    await client.callTool('move_card', { cardId, listId: targetListId });
    return [{ success: true, type: 'move_card', name: `Card ${cardId} → List ${targetListId}` }];
  } catch (err) {
    return [{ success: false, type: 'move_card', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['komentar', 'comment', 'tambah komentar'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const text = (args?.text as string) || (args?.comment as string) || '';

  if (!cardId || !text) {
    return [{ success: false, type: 'add_comment', name: 'missing args', error: 'cardId and text required' }];
  }
  try {
    await client.callTool('add_comment', { cardId, text });
    return [{ success: true, type: 'add_comment', name: `Comment on ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'add_comment', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['buat label', 'create label', 'tambah label baru'], async (client, _pb, boardId, args) => {
  const colorName = (args?.color as string) || (args?.warna as string) || '';
  const labelName = (args?.name as string) || (args?.nama as string) || '';
  let targetColor = colorName.toLowerCase();

  const colorMap: Record<string, string> = {
    merah: 'red',
    kuning: 'yellow',
    hijau: 'green',
    biru: 'blue',
    orange: 'orange',
    ungu: 'purple',
    pink: 'pink',
    abu: 'gray',
    red: 'red',
    yellow: 'yellow',
    green: 'green',
    blue: 'blue',
    purple: 'purple',
    gray: 'gray',
  };
  targetColor = colorMap[targetColor] || targetColor;

  const validColors = ['red', 'yellow', 'green', 'blue', 'orange', 'purple', 'pink', 'gray'];
  if (!targetColor || !validColors.includes(targetColor)) {
    return [
      {
        success: false,
        type: 'create_label',
        name: labelName || '(no name)',
        error: `Invalid color "${colorName}". Gunakan: merah/kuning/hijau/biru/orange/ungu/pink/abu`,
      },
    ];
  }

  const displayName = labelName || targetColor;
  try {
    const r = await client.createLabel(boardId, displayName, targetColor);
    return [{ success: true, type: 'create_label', name: displayName, result: r }];
  } catch (err) {
    return [{ success: false, type: 'create_label', name: displayName, error: (err as Error).message }];
  }
});

onIntent(['arsip list', 'archive list', 'hapus list'], async (client, _pb, boardId, args) => {
  const listName = (args?.nama as string) || (args?.name as string) || '';
  const listId = (args?.listId as string) || '';

  if (!listId && !listName) {
    return [{ success: false, type: 'archive_list', name: 'missing args', error: 'listId or name required' }];
  }

  let targetListId = listId;
  if (!targetListId && listName) {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
    if (!target)
      return [{ success: false, type: 'archive_list', name: listName, error: `List "${listName}" not found` }];
    targetListId = target.id as string;
  }

  try {
    await client.archiveList(targetListId);
    return [{ success: true, type: 'archive_list', name: `List ${listName || targetListId} archived` }];
  } catch (err) {
    return [{ success: false, type: 'archive_list', name: listName, error: (err as Error).message }];
  }
});

onIntent(['arsipkan', 'archive card', 'hapus card', 'delete card'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  if (!cardId) {
    return [{ success: false, type: 'archive_card', name: 'missing args', error: 'cardId required' }];
  }
  try {
    await client.archiveCard(cardId);
    return [{ success: true, type: 'archive_card', name: `Archived ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'archive_card', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['update card', 'ubah kartu', 'edit card', 'update kartu'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  if (!cardId) {
    return [{ success: false, type: 'update_card', name: 'missing args', error: 'cardId required' }];
  }

  const updates: Record<string, unknown> = {};
  if (args?.name) updates.name = args.name;
  if (args?.description || args?.desc) updates.description = args.description || args.desc;
  if (args?.dueDate) updates.dueDate = args.dueDate;
  if (args?.start) updates.start = args.start;
  if (args?.dueComplete !== undefined) updates.dueComplete = args.dueComplete;
  if (args?.labels) updates.labels = args.labels;

  try {
    await client.updateCard(cardId, updates);
    return [{ success: true, type: 'update_card', name: `Card ${cardId} updated` }];
  } catch (err) {
    return [{ success: false, type: 'update_card', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['buat checklist', 'add checklist', 'tambah checklist'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const name = (args?.name as string) || (args?.nama as string) || 'Checklist';
  const items = (args?.items as string[]) || [];

  if (!cardId) {
    return [{ success: false, type: 'create_checklist', name: 'missing args', error: 'cardId required' }];
  }

  try {
    const r = (await client.createChecklist(cardId, name)) as Record<string, unknown>;
    const results: IntentResult[] = [{ success: true, type: 'create_checklist', name: r.name as string, result: r }];
    for (const item of items) {
      try {
        const ir = await client.addChecklistItem(r.id as string, item);
        results.push({ success: true, type: 'add_checklist_item', name: item, result: ir });
      } catch (err) {
        results.push({ success: false, type: 'add_checklist_item', name: item, error: (err as Error).message });
      }
    }
    return results;
  } catch (err) {
    return [{ success: false, type: 'create_checklist', name, error: (err as Error).message }];
  }
});

onIntent(['buat board', 'create board', 'new board'], async (client, _pb, _boardId, args) => {
  const name = (args?.name as string) || (args?.nama as string) || 'New Board';
  try {
    const r = await client.createBoard(name, {});
    return [{ success: true, type: 'create_board', name, result: r }];
  } catch (err) {
    return [{ success: false, type: 'create_board', name, error: (err as Error).message }];
  }
});

onIntent(['hapus anggota', 'remove member', 'keluarkan anggota'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const memberId = (args?.memberId as string) || (args?.member as string) || '';
  if (!cardId || !memberId) {
    return [{ success: false, type: 'remove_member', name: 'missing args', error: 'cardId and memberId required' }];
  }
  try {
    await client.removeMember(cardId, memberId);
    return [{ success: true, type: 'remove_member', name: `${memberId} removed from ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'remove_member', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['tambah label ke card', 'add label to card', 'pasang label'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const labelId = (args?.labelId as string) || (args?.label as string) || '';
  if (!cardId || !labelId) {
    return [{ success: false, type: 'add_label_to_card', name: 'missing args', error: 'cardId and labelId required' }];
  }
  try {
    await client.addLabelToCard(cardId, labelId);
    return [{ success: true, type: 'add_label_to_card', name: `Label ${labelId} → Card ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'add_label_to_card', name: cardId, error: (err as Error).message }];
  }
});

onIntent(['report', 'progress', 'my cards', 'kartu saya'], async (client, _pb, _boardId) => {
  try {
    const r = (await client.callTool('get_my_cards', {})) as { cards?: Array<Record<string, unknown>> };
    const cards = r.cards || [];
    const grouped: Record<string, unknown[]> = {};
    for (const c of cards) {
      const listName = (c.listId as string) || 'Unknown';
      if (!grouped[listName]) grouped[listName] = [];
      grouped[listName].push(c);
    }
    return [{ success: true, type: 'report', name: `Found ${cards.length} cards assigned to you`, detail: grouped }];
  } catch (err) {
    return [{ success: false, type: 'report', name: 'failed', error: (err as Error).message }];
  }
});

// ── Execute Intent ──

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
        'No handler matched. Try: mulai sprint, buat card, assign, buat label, arsipkan, arsip list, pindah semua, buat board, update card, buat checklist, komentar, report, tutup sprint',
    },
  ];
}

// ── Bundle Context ──

export function bundleContext(paths: BundlePaths): BundleContextResult {
  const context: BundleContextResult = {
    playbook: null,
    openkb: { glossary: [], decisions: [] },
    opencode: null,
  };

  if (paths.playbook && existsSync(paths.playbook)) {
    const content = readFileSync(paths.playbook, 'utf-8');
    context.playbook = parsePlaybook(content);
  }

  if (paths.openkb) {
    const glossaryPath = resolve(paths.openkb, 'SHARED', 'glossary.md');
    if (existsSync(glossaryPath)) {
      const gl = readFileSync(glossaryPath, 'utf-8');
      context.openkb.glossary = gl.split('\n').filter((l) => l.startsWith('- **'));
    }
    const decisionPath = resolve(paths.openkb, 'SHARED', 'decision-log.md');
    if (existsSync(decisionPath)) {
      const dl = readFileSync(decisionPath, 'utf-8');
      context.openkb.decisions = dl.split('\n').filter((l) => l.startsWith('## '));
    }
  }

  if (paths.opencode) {
    const configPath = resolve(paths.opencode, 'opencode.json');
    if (existsSync(configPath)) {
      try {
        context.opencode = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      } catch {
        context.opencode = null;
      }
    }
  }

  return context;
}

// ── Plan Handlers ──

const planHandlers: PlanHandler[] = [];

function onPlan(patterns: string[], fn: PlanHandler['fn']): void {
  planHandlers.push({ patterns: patterns.map((p) => p.toLowerCase()), fn });
}

onPlan(['mulai sprint', 'setup sprint'], (pb, _args) => {
  return pb.workflow.lists.map((listName) => ({
    action: 'create_list',
    params: { name: listName },
    description: `Buat list "${listName}"`,
  }));
});

onPlan(['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'], (pb, args) => {
  const name = (args.task as string) || (args.name as string) || 'New Task';
  const listName = (args.list as string) || pb.workflow.lists[0] || '';
  return [
    {
      action: 'create_card',
      params: { name, desc: args.desc || args.description || '', listName },
      description: `Buat card "${name}" di list "${listName}"`,
    },
  ];
});

onPlan(['assign', 'tugaskan', 'tambahkan anggota'], (_pb, args) => {
  return [
    {
      action: 'assign_member',
      params: { memberId: args.memberId || args.member || '', cardId: args.cardId || args.card || '' },
      description: `Assign anggota ${args.member || args.memberId || ''} ke card ${args.card || args.cardId || ''}`,
    },
  ];
});

onPlan(['tutup sprint', 'close sprint', 'archive sprint'], (_pb, _args) => {
  return [
    {
      action: 'close_sprint',
      params: {},
      description: 'Arsipkan semua card di list Done/Selesai/QA/Code Review',
    },
  ];
});

onPlan(['pindah semua', 'move all', 'pindahkan semua'], (_pb, args) => {
  return [
    {
      action: 'move_all_cards',
      params: { fromListName: args.dari || args.from || '', toListName: args.ke || args.to || '' },
      description: `Pindahkan semua card dari "${args.dari || args.from || ''}" ke "${args.ke || args.to || ''}"`,
    },
  ];
});

onPlan(['pindah', 'move card', 'pindahkan'], (_pb, args) => {
  return [
    {
      action: 'move_card',
      params: {
        cardName: args.cardId || args.card || '',
        listName: args.listName || '',
        listId: args.listId || args.list || '',
      },
      description: `Pindahkan card ke list ${args.listName || args.listId || ''}`,
    },
  ];
});

onPlan(['komentar', 'comment', 'tambah komentar'], (_pb, args) => {
  return [
    {
      action: 'add_comment',
      params: { cardName: args.cardId || args.card || '', text: args.text || args.comment || '' },
      description: `Tambah komentar ke card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat label', 'create label', 'tambah label baru'], (_pb, args) => {
  return [
    {
      action: 'create_label',
      params: { name: args.name || args.nama || '', color: args.color || args.warna || '' },
      description: `Buat label "${args.name || args.nama || ''}" warna ${args.color || args.warna || ''}`,
    },
  ];
});

onPlan(['arsip list', 'archive list', 'hapus list'], (_pb, args) => {
  return [
    {
      action: 'archive_list',
      params: { listName: args.nama || args.name || '', listId: args.listId || '' },
      description: `Arsipkan list "${args.nama || args.name || ''}"`,
    },
  ];
});

onPlan(['arsipkan', 'archive card', 'hapus card', 'delete card'], (_pb, args) => {
  return [
    {
      action: 'archive_card',
      params: { cardId: args.cardId || args.card || '' },
      description: `Arsipkan card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['update card', 'ubah kartu', 'edit card', 'update kartu'], (_pb, args) => {
  return [
    {
      action: 'update_card',
      params: { cardId: args.cardId || args.card || '', name: args.name, desc: args.description || args.desc },
      description: `Update card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat checklist', 'add checklist', 'tambah checklist'], (_pb, args) => {
  return [
    {
      action: 'create_checklist',
      params: {
        cardId: args.cardId || args.card || '',
        name: args.name || args.nama || 'Checklist',
        items: args.items || [],
      },
      description: `Buat checklist "${args.name || args.nama || 'Checklist'}" di card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat board', 'create board', 'new board'], (_pb, args) => {
  return [
    {
      action: 'create_board',
      params: { name: args.name || args.nama || 'New Board' },
      description: `Buat board "${args.name || args.nama || 'New Board'}"`,
    },
  ];
});

onPlan(['hapus anggota', 'remove member', 'keluarkan anggota'], (_pb, args) => {
  return [
    {
      action: 'remove_member',
      params: { cardId: args.cardId || args.card || '', memberId: args.memberId || args.member || '' },
      description: `Hapus anggota ${args.memberId || args.member || ''} dari card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['tambah label ke card', 'add label to card', 'pasang label'], (_pb, args) => {
  return [
    {
      action: 'add_label_to_card',
      params: { cardId: args.cardId || args.card || '', labelId: args.labelId || args.label || '' },
      description: `Pasang label ${args.labelId || args.label || ''} ke card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['report', 'progress', 'my cards', 'kartu saya'], (_pb, _args) => {
  return [
    {
      action: 'report',
      params: {},
      description: 'Tampilkan laporan kartu yang ditugaskan',
    },
  ];
});

// ── Generate Plan ──

export function generatePlan(
  goal: string,
  playbook: PlaybookResult,
  extraArgs: Record<string, unknown> = {},
): Array<Record<string, unknown>> {
  const lower = goal.toLowerCase();
  for (const h of planHandlers) {
    if (h.patterns.some((p) => lower.includes(p))) {
      return h.fn(playbook, extraArgs);
    }
  }
  return [
    {
      success: false,
      action: 'unknown_intent',
      params: { goal },
      description: `Intent tidak dikenal: "${goal}". Coba: mulai sprint, buat card, assign, buat label, arsipkan, arsip list, pindah semua, buat board, update card, buat checklist, komentar, report, tutup sprint`,
    },
  ];
}
