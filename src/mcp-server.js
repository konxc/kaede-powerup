#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const API = 'https://api.trello.com/1';
const VERSION = '2024-11-05';
const SERVER = { name: 'KAEDE Trello MCP', version: '1.0.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Secrets ───

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k) vars[k] = v;
  }
  return vars;
}

function getAuth() {
  const searchPaths = [
    resolve(ROOT, 'secrets.env'),
    resolve(ROOT, '..', 'secrets.env'),
    resolve(homedir(), '.config', 'kaede', 'secrets.env'),
    resolve(process.cwd(), 'secrets.env'),
  ];
  let merged = {};
  for (const p of searchPaths) merged = { ...merged, ...loadEnv(p) };
  merged = { ...merged, ...process.env };

  const key = merged.TRELLO_API_KEY;
  const token = merged.TRELLO_TOKEN;
  if (!key || !token) return null;
  return { key, token, qs: `key=${key}&token=${token}` };
}

// ─── Trello API ───

async function trello(path, opts = {}) {
  const auth = getAuth();
  if (!auth) throw new Error('TRELLO_API_KEY or TRELLO_TOKEN not configured');
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}${auth.qs}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: opts.headers || {},
    body: opts.body || undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trello API ${res.status}: ${text.slice(0, 200)}`);
  }
  if (opts.raw) return res;
  return res.json();
}

function trelloPost(path, data) {
  const body = new URLSearchParams({ ...data, ...getAuth() });
  return trello(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function trelloPut(path, data) {
  const body = new URLSearchParams({ ...data, ...getAuth() });
  return trello(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function trelloDelete(path) {
  return trello(path, { method: 'DELETE' });
}

// ─── MCP Protocol ───

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function error(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function result(id, data) {
  send({ jsonrpc: '2.0', id, result: data });
}

function toolSchema(name, description, properties = {}, required = []) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  };
}

// ─── Tool Implementations ───

async function handleToolsCall(name, args) {
  switch (name) {
    // ─── Boards ───
    case 'list_boards': {
      const boards = await trello('/members/me/boards?fields=name,id,url,closed&filter=open');
      return { boards: boards.map(b => ({ id: b.id, name: b.name, url: b.url, closed: b.closed })) };
    }
    case 'list_workspaces': {
      const orgs = await trello('/members/me/organizations?fields=name,id,displayName');
      return { workspaces: orgs.map(o => ({ id: o.id, name: o.name, displayName: o.displayName })) };
    }
    case 'create_board': {
      const body = { name: args.name };
      if (args.desc) body.desc = args.desc;
      if (args.idOrganization) body.idOrganization = args.idOrganization;
      if (args.defaultLabels !== undefined) body.defaultLabels = args.defaultLabels;
      if (args.defaultLists !== undefined) body.defaultLists = args.defaultLists;
      const board = await trelloPost('/boards', body);
      return { id: board.id, name: board.name, url: board.url };
    }

    // ─── Lists ───
    case 'get_lists': {
      const bid = args.boardId || getAuth().key;
      const lists = await trello(`/boards/${bid}/lists?fields=name,id,closed`);
      return { lists: lists.map(l => ({ id: l.id, name: l.name, closed: l.closed })) };
    }
    case 'add_list_to_board': {
      const bid = args.boardId || getAuth().key;
      const list = await trelloPost(`/boards/${bid}/lists`, { name: args.name });
      return { id: list.id, name: list.name };
    }
    case 'archive_list': {
      const list = await trelloPut(`/lists/${args.listId}`, { closed: true });
      return { id: list.id, name: list.name, closed: list.closed };
    }

    // ─── Cards ───
    case 'get_my_cards': {
      const me = await trello('/members/me');
      const boards = await trello(`/members/${me.id}/boards?fields=id&filter=open`);
      const allCards = [];
      for (const board of boards) {
        const lists = await trello(`/boards/${board.id}/lists?fields=id`);
        for (const list of lists) {
          const cards = await trello(`/lists/${list.id}/cards?fields=name,id,due,dueComplete,idMembers,url,desc&members=true`);
          allCards.push(...cards.filter(c => c.idMembers?.includes(me.id)).map(c => ({
            id: c.id, name: c.name, due: c.due, dueComplete: c.dueComplete,
            url: c.url, desc: c.desc, listId: list.id, boardId: board.id,
          })));
        }
      }
      return { cards: allCards };
    }
    case 'get_cards_by_list_id': {
      const lid = args.listId;
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,dateLastActivity,start';
      const cards = await trello(`/lists/${lid}/cards?fields=${fields}&members=true`);
      return { cards: cards.map(c => ({
        id: c.id, name: c.name, due: c.due, dueComplete: c.dueComplete,
        start: c.start, url: c.url, desc: c.desc, idMembers: c.idMembers,
        dateLastActivity: c.dateLastActivity,
      })) };
    }
    case 'get_card': {
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,idList,idBoard,start,labels,dateLastActivity';
      const card = await trello(`/cards/${args.cardId}?fields=${fields}`);
      const res = {
        id: card.id, name: card.name, desc: card.desc, url: card.url,
        due: card.due, dueComplete: card.dueComplete, start: card.start,
        listId: card.idList, boardId: card.idBoard,
        idMembers: card.idMembers, labels: card.labels,
        dateLastActivity: card.dateLastActivity,
      };
      if (args.includeMarkdown && card.desc) {
        res.descMarkdown = card.desc;
      }
      return res;
    }
    case 'add_card_to_list': {
      const body = { name: args.name, idList: args.listId };
      if (args.description) body.desc = args.description;
      if (args.dueDate) body.due = args.dueDate;
      if (args.start) body.start = args.start;
      if (args.labels) body.idLabels = args.labels.join(',');
      const card = await trelloPost('/cards', body);
      return { id: card.id, name: card.name, url: card.url, listId: card.idList };
    }
    case 'update_card_details': {
      const body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.desc = args.description;
      if (args.dueDate) body.due = args.dueDate;
      if (args.start) body.start = args.start;
      if (args.dueComplete !== undefined) body.dueComplete = args.dueComplete;
      if (args.labels) body.idLabels = args.labels.join(',');
      const card = await trelloPut(`/cards/${args.cardId}`, body);
      return { id: card.id, name: card.name, url: card.url };
    }
    case 'move_card': {
      const targetList = args.listId;
      const card = await trelloPut(`/cards/${args.cardId}`, { idList: targetList });
      return { id: card.id, name: card.name, listId: card.idList };
    }
    case 'archive_card': {
      const card = await trelloPut(`/cards/${args.cardId}`, { closed: true });
      return { id: card.id, name: card.name, closed: card.closed };
    }

    // ─── Members ───
    case 'get_board_members': {
      const bid = args.boardId || getAuth().key;
      const members = await trello(`/boards/${bid}/members?fields=id,fullName,username,initials,avatarUrl`);
      return { members };
    }
    case 'assign_member_to_card': {
      const res = await trelloPost(`/cards/${args.cardId}/idMembers`, { value: args.memberId });
      return { success: true, cardId: args.cardId, memberId: args.memberId };
    }
    case 'remove_member_from_card': {
      const res = await trelloDelete(`/cards/${args.cardId}/idMembers/${args.memberId}`);
      return { success: true, cardId: args.cardId, memberId: args.memberId };
    }

    // ─── Labels ───
    case 'get_board_labels': {
      const bid = args.boardId || getAuth().key;
      const labels = await trello(`/boards/${bid}/labels?fields=id,name,color`);
      return { labels };
    }
    case 'create_label': {
      const bid = args.boardId || getAuth().key;
      const body = { name: args.name };
      if (args.color) body.color = args.color;
      const label = await trelloPost(`/boards/${bid}/labels`, body);
      return { id: label.id, name: label.name, color: label.color };
    }
    case 'update_label': {
      const body = {};
      if (args.name) body.name = args.name;
      if (args.color) body.color = args.color;
      const label = await trelloPut(`/labels/${args.labelId}`, body);
      return { id: label.id, name: label.name, color: label.color };
    }
    case 'delete_label': {
      await trelloDelete(`/labels/${args.labelId}`);
      return { success: true, labelId: args.labelId };
    }

    // ─── Comments ───
    case 'add_comment': {
      const comment = await trelloPost(`/cards/${args.cardId}/actions/comments`, { text: args.text });
      return { id: comment.id, text: args.text };
    }
    case 'get_card_comments': {
      const limit = args.limit || 100;
      const actions = await trello(`/cards/${args.cardId}/actions?filter=commentCard&limit=${limit}`);
      return { comments: actions.map(a => ({ id: a.id, text: a.data?.text, date: a.date, memberCreator: a.memberCreator })) };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Tool Definitions ───

const TOOLS = [
  toolSchema('list_boards', 'List all Trello boards the user has access to'),
  toolSchema('list_workspaces', 'List all Trello workspaces/organizations'),
  toolSchema('create_board', 'Create a new Trello board', {
    name: { type: 'string', description: 'Name of the board' },
    desc: { type: 'string', description: 'Description of the board' },
    idOrganization: { type: 'string', description: 'Workspace ID' },
    defaultLabels: { type: 'boolean', description: 'Create default labels' },
    defaultLists: { type: 'boolean', description: 'Create default lists' },
  }, ['name']),

  toolSchema('get_lists', 'Get all lists in a board', {
    boardId: { type: 'string', description: 'Board ID (uses default if not provided)' },
  }),
  toolSchema('add_list_to_board', 'Add a new list to a board', {
    boardId: { type: 'string', description: 'Board ID' },
    name: { type: 'string', description: 'Name of the new list' },
  }, ['name']),
  toolSchema('archive_list', 'Archive a list', {
    listId: { type: 'string', description: 'ID of the list to archive' },
  }, ['listId']),

  toolSchema('get_my_cards', 'Get all cards assigned to the current user'),
  toolSchema('get_cards_by_list_id', 'Get cards in a specific list', {
    listId: { type: 'string', description: 'ID of the list' },
    boardId: { type: 'string', description: 'Board ID (optional)' },
  }, ['listId']),
  toolSchema('get_card', 'Get detailed card information', {
    cardId: { type: 'string', description: 'ID of the card' },
    includeMarkdown: { type: 'boolean', description: 'Return description as markdown' },
  }, ['cardId']),
  toolSchema('add_card_to_list', 'Add a new card to a list', {
    listId: { type: 'string', description: 'ID of the target list' },
    name: { type: 'string', description: 'Name of the card' },
    description: { type: 'string', description: 'Description' },
    dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
    start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
    labels: { type: 'array', items: { type: 'string' }, description: 'Label IDs' },
  }, ['listId', 'name']),
  toolSchema('update_card_details', 'Update card details', {
    cardId: { type: 'string', description: 'ID of the card' },
    name: { type: 'string', description: 'New name' },
    description: { type: 'string', description: 'New description' },
    dueDate: { type: 'string', description: 'New due date' },
    start: { type: 'string', description: 'New start date' },
    dueComplete: { type: 'boolean', description: 'Mark due complete' },
    labels: { type: 'array', items: { type: 'string' }, description: 'New label IDs' },
  }, ['cardId']),
  toolSchema('move_card', 'Move card to another list', {
    cardId: { type: 'string', description: 'ID of the card' },
    listId: { type: 'string', description: 'ID of the target list' },
    boardId: { type: 'string', description: 'Target board ID' },
  }, ['cardId', 'listId']),
  toolSchema('archive_card', 'Archive a card', {
    cardId: { type: 'string', description: 'ID of the card' },
  }, ['cardId']),

  toolSchema('get_board_members', 'Get members of a board', {
    boardId: { type: 'string', description: 'Board ID' },
  }),
  toolSchema('assign_member_to_card', 'Assign a member to a card', {
    cardId: { type: 'string', description: 'ID of the card' },
    memberId: { type: 'string', description: 'ID of the member' },
  }, ['cardId', 'memberId']),
  toolSchema('remove_member_from_card', 'Remove a member from a card', {
    cardId: { type: 'string', description: 'ID of the card' },
    memberId: { type: 'string', description: 'ID of the member' },
  }, ['cardId', 'memberId']),

  toolSchema('get_board_labels', 'Get all labels on a board', {
    boardId: { type: 'string', description: 'Board ID' },
  }),
  toolSchema('create_label', 'Create a new label', {
    boardId: { type: 'string', description: 'Board ID' },
    name: { type: 'string', description: 'Label name' },
    color: { type: 'string', description: 'Label color' },
  }, ['name']),
  toolSchema('update_label', 'Update a label', {
    labelId: { type: 'string', description: 'ID of the label' },
    name: { type: 'string', description: 'New name' },
    color: { type: 'string', description: 'New color' },
  }, ['labelId']),
  toolSchema('delete_label', 'Delete a label', {
    labelId: { type: 'string', description: 'ID of the label' },
  }, ['labelId']),

  toolSchema('add_comment', 'Add a comment to a card', {
    cardId: { type: 'string', description: 'ID of the card' },
    text: { type: 'string', description: 'Comment text' },
  }, ['cardId', 'text']),
  toolSchema('get_card_comments', 'Get comments on a card', {
    cardId: { type: 'string', description: 'ID of the card' },
    limit: { type: 'number', description: 'Max comments (default 100)' },
  }, ['cardId']),
];

// ─── Main ───

const auth = getAuth();
if (!auth) {
  process.stderr.write('TRELLO_API_KEY or TRELLO_TOKEN not configured\n');
  process.stderr.write('Run `node scripts/kaede.mjs setup` to configure\n');
  process.exit(1);
}

let buffer = '';
const stdin = process.stdin;
stdin.setEncoding('utf-8');

stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }

    const method = msg.method;
    const id = msg.id;
    const params = msg.params || {};

    if (method === 'initialize') {
      result(id, {
        protocolVersion: VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    } else if (method === 'notifications/initialized') {
      // no response needed
    } else if (method === 'tools/list') {
      result(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      handleToolsCall(params.name, params.arguments || {})
        .then((res) => {
          const content = typeof res === 'string'
            ? [{ type: 'text', text: res }]
            : [{ type: 'text', text: JSON.stringify(res, null, 2) }];
          result(id, { content });
        })
        .catch((err) => {
          error(id, -32603, err.message);
        });
    } else {
      error(id, -32601, `Method not found: ${method}`);
    }
  }
});

stdin.on('end', () => {
  process.exit(0);
});
