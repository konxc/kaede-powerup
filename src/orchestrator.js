/**
 * KAEDE Orchestrator — Lapisan kecerdasan di atas Trello MCP
 *
 * Membaca Playbook untuk memahami workflow, lalu mengeksekusi
 * serangkaian tindakan Trello berdasarkan intent pengguna.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TrelloMCPClient } from './trello-client.js';

const SECTION_MAP = {
  roles: ['peran', 'role', 'roles & responsibilities', 'team roles', 'roles', 'siapa saja'],
  workflow: ['alur', 'workflow', 'sprint workflow', 'kanban', 'sprint'],
  conventions: ['konvensi', 'nama', 'naming', 'standards', 'aturan', 'conventions', 'convention'],
};

function mapSection(title) {
  const lower = title.toLowerCase();
  for (const [key, keywords] of Object.entries(SECTION_MAP)) {
    if (keywords.some(k => lower.includes(k))) return key;
  }
  return null;
}

export function parsePlaybook(content) {
  const lines = content.split('\n');
  const result = {
    title: '',
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };

  let currentSection = null;
  let currentRole = null;
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

const intentHandlers = [];

function onIntent(patterns, fn) {
  intentHandlers.push({ patterns: patterns.map(p => p.toLowerCase()), fn });
}

onIntent(['mulai sprint', 'setup sprint'], async (client, pb, boardId) => {
  const results = [];
  for (const listName of pb.workflow.lists) {
    try {
      const r = await client.createList(boardId, listName);
      results.push({ success: true, type: 'create_list', name: listName, result: r });
    } catch (err) {
      results.push({ success: false, type: 'create_list', name: listName, error: err.message });
    }
  }
  return results;
});

onIntent(['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'], async (client, pb, boardId, args) => {
  const name = args.task || args.name || 'New Task';
  const desc = args.desc || args.description || '';
  const listName = args.list || pb.workflow.lists[0];
  const listId = args.listId || '';

  if (listId) {
    try {
      const r = await client.createCard(listId, name, desc);
      return [{ success: true, type: 'create_card', name: r.name }];
    } catch (err) {
      return [{ success: false, type: 'create_card', name, error: err.message }];
    }
  }

  const lists = await client.getLists(boardId);
  const target = lists.find(l => l.name.toLowerCase() === (listName || '').toLowerCase());
  if (!target) {
    return [{ success: false, type: 'create_card', name, error: `List "${listName}" not found` }];
  }
  try {
    const r = await client.createCard(target.id, name, desc);
    return [{ success: true, type: 'create_card', name: r.name }];
  } catch (err) {
    return [{ success: false, type: 'create_card', name, error: err.message }];
  }
});

onIntent(['assign', 'tugaskan', 'tambahkan anggota'], async (client, pb, boardId, args) => {
  const memberId = args.memberId || args.member || '';
  const cardId = args.cardId || args.card || '';

  if (!memberId || !cardId) {
    return [{ success: false, type: 'assign_member', name: 'missing args', error: 'memberId and cardId required' }];
  }
  try {
    await client.assignMember(cardId, memberId);
    return [{ success: true, type: 'assign_member', name: `Member ${memberId} → Card ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'assign_member', name: `${memberId} → ${cardId}`, error: err.message }];
  }
});

onIntent(['tutup sprint', 'close sprint', 'archive sprint'], async (client, pb, boardId) => {
  const results = [];
  const lists = await client.getLists(boardId);
  const toArchive = lists.filter(l =>
    ['done', 'selesai', 'qa', 'code review', 'qa/code review'].some(k => l.name.toLowerCase().includes(k))
  );
  for (const list of toArchive) {
    try {
      const cards = await client.callTool('get_cards_by_list_id', { listId: list.id });
      for (const card of (cards.cards || [])) {
        try {
          await client.callTool('archive_card', { cardId: card.id });
          results.push({ success: true, type: 'archive_card', name: card.name });
        } catch (err) {
          results.push({ success: false, type: 'archive_card', name: card.name, error: err.message });
        }
      }
    } catch (err) {
      results.push({ success: false, type: 'get_cards', name: list.name, error: err.message });
    }
  }
  return results;
});

onIntent(['pindah', 'move card', 'pindahkan'], async (client, pb, boardId, args) => {
  const cardId = args.cardId || args.card || '';
  const listId = args.listId || args.list || '';
  const listName = args.listName || '';

  if (!cardId || (!listId && !listName)) {
    return [{ success: false, type: 'move_card', name: 'missing args', error: 'cardId and listId/listName required' }];
  }

  let targetListId = listId;
  if (!targetListId && listName) {
    const lists = await client.getLists(boardId);
    const target = lists.find(l => l.name.toLowerCase() === listName.toLowerCase());
    if (!target) return [{ success: false, type: 'move_card', name: cardId, error: `List "${listName}" not found` }];
    targetListId = target.id;
  }

  try {
    await client.callTool('move_card', { cardId, listId: targetListId });
    return [{ success: true, type: 'move_card', name: `Card ${cardId} → List ${targetListId}` }];
  } catch (err) {
    return [{ success: false, type: 'move_card', name: cardId, error: err.message }];
  }
});

onIntent(['komentar', 'comment', 'tambah komentar'], async (client, pb, boardId, args) => {
  const cardId = args.cardId || args.card || '';
  const text = args.text || args.comment || '';

  if (!cardId || !text) {
    return [{ success: false, type: 'add_comment', name: 'missing args', error: 'cardId and text required' }];
  }
  try {
    await client.callTool('add_comment', { cardId, text });
    return [{ success: true, type: 'add_comment', name: `Comment on ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'add_comment', name: cardId, error: err.message }];
  }
});

onIntent(['report', 'progress', 'my cards', 'kartu saya'], async (client, pb, boardId) => {
  try {
    const r = await client.callTool('get_my_cards', {});
    const cards = r.cards || [];
    const grouped = {};
    for (const c of cards) {
      const listName = c.listId || 'Unknown';
      if (!grouped[listName]) grouped[listName] = [];
      grouped[listName].push(c);
    }
    return [{ success: true, type: 'report', name: `Found ${cards.length} cards assigned to you`, detail: grouped }];
  } catch (err) {
    return [{ success: false, type: 'report', name: 'failed', error: err.message }];
  }
});

export async function executeIntent(client, intent, playbookContext, boardId, extraArgs = {}) {
  const lower = intent.toLowerCase();
  for (const h of intentHandlers) {
    if (h.patterns.some(p => lower.includes(p))) {
      return h.fn(client, playbookContext, boardId, extraArgs);
    }
  }
  return [{ success: false, type: 'unknown_intent', name: intent, error: 'No handler matched. Try: mulai sprint, buat card, assign, pindah, komentar, report' }];
}

export function bundleContext(paths) {
  const context = {
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
      context.openkb.glossary = gl.split('\n').filter(l => l.startsWith('- **'));
    }
    const decisionPath = resolve(paths.openkb, 'SHARED', 'decision-log.md');
    if (existsSync(decisionPath)) {
      const dl = readFileSync(decisionPath, 'utf-8');
      context.openkb.decisions = dl.split('\n').filter(l => l.startsWith('## '));
    }
  }

  if (paths.opencode) {
    const configPath = resolve(paths.opencode, 'opencode.json');
    if (existsSync(configPath)) {
      try {
        context.opencode = JSON.parse(readFileSync(configPath, 'utf-8'));
      } catch {
        context.opencode = null;
      }
    }
  }

  return context;
}