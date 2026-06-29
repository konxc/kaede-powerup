#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mimeFromFilename, createAttachmentFormData, createUrlAttachmentData } from './trello/attachments.js';

const API = 'https://api.trello.com/1';
const VERSION = '2024-11-05';
const SERVER = { name: 'KAEDE Trello MCP', version: '1.0.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// â”€â”€â”€ Secrets â”€â”€â”€

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

// â”€â”€â”€ Trello API â”€â”€â”€

let _defaultBoardId = null;
function getDefaultBoardId() {
  if (!_defaultBoardId) {
    _defaultBoardId = process.env.TRELLO_DEFAULT_BOARD_ID || '';
  }
  return _defaultBoardId;
}

function resolveBoardId(args) {
  return args.boardId || getDefaultBoardId() || null;
}

function validateRequired(args, required, toolName) {
  const missing = required.filter((k) => args[k] == null);
  if (missing.length) {
    throw new Error(`${toolName}: missing required parameter(s): ${missing.join(', ')}`);
  }
}

function wrap(res) {
  return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
}

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

// â”€â”€â”€ MCP Protocol â”€â”€â”€

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

// â”€â”€â”€ Tool Implementations â”€â”€â”€

async function handleToolsCall(name, args) {
  switch (name) {
    // â”€â”€â”€ Boards â”€â”€â”€
    case 'list_boards': {
      const boards = await trello('/members/me/boards?fields=name,id,url,closed&filter=open');
      return { boards: boards.map((b) => ({ id: b.id, name: b.name, url: b.url, closed: b.closed })) };
    }
    case 'list_workspaces': {
      const orgs = await trello('/members/me/organizations?fields=name,id,displayName');
      return { workspaces: orgs.map((o) => ({ id: o.id, name: o.name, displayName: o.displayName })) };
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

    // â”€â”€â”€ Lists â”€â”€â”€
    case 'get_lists': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_lists: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const lists = await trello(`/boards/${bid}/lists?fields=name,id,closed`);
      return { lists: lists.map((l) => ({ id: l.id, name: l.name, closed: l.closed })) };
    }
    case 'add_list_to_board': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('add_list_to_board: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const list = await trelloPost(`/boards/${bid}/lists`, { name: args.name });
      return { id: list.id, name: list.name };
    }
    case 'archive_list': {
      const list = await trelloPut(`/lists/${args.listId}`, { closed: true });
      return { id: list.id, name: list.name, closed: list.closed };
    }

    // â”€â”€â”€ Cards â”€â”€â”€
    case 'get_my_cards': {
      const cards = await trello(
        `/members/me/cards?fields=name,id,due,dueComplete,idMembers,url,desc,idList,idBoard&members=true`,
      );
      return {
        cards: cards.map((c) => ({
          id: c.id,
          name: c.name,
          due: c.due,
          dueComplete: c.dueComplete,
          url: c.url,
          desc: c.desc,
          listId: c.idList,
          boardId: c.idBoard,
        })),
      };
    }
    case 'get_cards_by_list_id': {
      const lid = args.listId;
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,dateLastActivity,start';
      const cards = await trello(`/lists/${lid}/cards?fields=${fields}&members=true`);
      return {
        cards: cards.map((c) => ({
          id: c.id,
          name: c.name,
          due: c.due,
          dueComplete: c.dueComplete,
          start: c.start,
          url: c.url,
          desc: c.desc,
          idMembers: c.idMembers,
          dateLastActivity: c.dateLastActivity,
        })),
      };
    }
    case 'get_card': {
      if (!args.cardId) throw new Error('get_card: missing required parameter: cardId');
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,idList,idBoard,start,labels,dateLastActivity';
      const card = await trello(`/cards/${args.cardId}?fields=${fields}`);
      const res = {
        id: card.id,
        name: card.name,
        desc: card.desc,
        url: card.url,
        due: card.due,
        dueComplete: card.dueComplete,
        start: card.start,
        listId: card.idList,
        boardId: card.idBoard,
        idMembers: card.idMembers,
        labels: card.labels,
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
      if (args.dueReminder !== undefined) body.dueReminder = args.dueReminder;
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
      if (args.dueReminder !== undefined) body.dueReminder = args.dueReminder;
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

    // â”€â”€â”€ Members â”€â”€â”€
    case 'get_board_members': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_board_members: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
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

    // â”€â”€â”€ Labels â”€â”€â”€
    case 'get_board_labels': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_board_labels: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const labels = await trello(`/boards/${bid}/labels?fields=id,name,color`);
      return { labels };
    }
    case 'create_label': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('create_label: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
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

    // â”€â”€â”€ Checklists â”€â”€â”€
    case 'create_checklist': {
      const checklist = await trelloPost(`/cards/${args.cardId}/checklists`, { name: args.name });
      return { id: checklist.id, name: checklist.name };
    }
    case 'add_checklist_item': {
      const body = { name: args.name };
      if (args.checked !== undefined) body.checked = args.checked;
      const item = await trelloPost(`/checklists/${args.checklistId}/checkItems`, body);
      return { id: item.id, name: item.name };
    }

    // â”€â”€â”€ Comments â”€â”€â”€
    case 'add_comment': {
      const comment = await trelloPost(`/cards/${args.cardId}/actions/comments`, { text: args.text });
      return { id: comment.id, text: args.text };
    }
    case 'get_card_comments': {
      const limit = args.limit || 100;
      const actions = await trello(`/cards/${args.cardId}/actions?filter=commentCard&limit=${limit}`);
      return {
        comments: actions.map((a) => ({ id: a.id, text: a.data?.text, date: a.date, memberCreator: a.memberCreator })),
      };
    }

    // â”€â”€â”€ Attachments â”€â”€â”€
    case 'attach_file_to_card': {
      const { cardId, fileUrl, name, mimeType } = args;

      if (!fileUrl) {
        throw new Error('fileUrl is required');
      }

      const effectiveMimeType = mimeType || mimeFromFilename(fileUrl);
      const filename = name || fileUrl.split('/').pop() || 'attachment';

      let response;
      if (fileUrl.startsWith('file://')) {
        // Local file upload - need to handle via FormData
        // For now, use URL-based attachment
        throw new Error('Local file upload not yet implemented. Please use URL-based attachment.');
      } else {
        // URL-based attachment - Trello API expects POST with form data
        const body = { url: fileUrl };
        if (filename) body.name = filename;

        response = await trelloPost(`/cards/${cardId}/attachments`, body);
      }

      return {
        id: response.id,
        name: response.name,
        url: response.url,
        mimeType: response.mimeType,
        bytes: response.bytes,
      };
    }

    case 'attach_image_to_card': {
      const { cardId, imageUrl, name } = args;

      if (!imageUrl) {
        throw new Error('imageUrl is required');
      }

      const filename = name || 'Image Attachment';

      // Trello API expects POST with form data
      const body = { url: imageUrl };
      if (filename) body.name = filename;

      const response = await trelloPost(`/cards/${cardId}/attachments`, body);

      return {
        id: response.id,
        name: response.name,
        url: response.url,
        mimeType: response.mimeType,
        previews: response.previews,
      };
    }

    case 'get_card_attachments': {
      const { cardId } = args;

      if (!cardId) {
        throw new Error('cardId is required');
      }

      const attachments = await trello(`/cards/${cardId}/attachments`);

      return {
        attachments: attachments.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          mimeType: a.mimeType,
          bytes: a.bytes,
          date: a.date,
          isUpload: a.isUpload,
        })),
      };
    }

    case 'attach_data_to_card': {
      const { cardId, data, name, mimeType } = args;

      if (!data) {
        throw new Error('data is required (base64 or data URL)');
      }

      let buffer;
      let effectiveMimeType = mimeType || 'application/octet-stream';
      const filename = name || `attachment-${Date.now()}`;

      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format. Expected: data:[mime];base64,<data>');
        }
        effectiveMimeType = effectiveMimeType === 'application/octet-stream' ? matches[1] : effectiveMimeType;
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      const formData = createAttachmentFormData(buffer, filename, effectiveMimeType);
      const response = await trello(`/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      return {
        id: response.id,
        name: response.name,
        url: response.url,
        mimeType: response.mimeType,
        bytes: response.bytes,
        date: response.date,
        isUpload: response.isUpload,
      };
    }

    case 'attach_image_data_to_card': {
      const { cardId, imageData, name } = args;

      if (!imageData) {
        throw new Error('imageData is required (base64 or data URL)');
      }

      let buffer;
      let effectiveMimeType = 'image/png';
      const filename = name || `screenshot-${Date.now()}.png`;

      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format. Expected: data:[mime];base64,<data>');
        }
        effectiveMimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(imageData, 'base64');
      }

      const formData = createAttachmentFormData(buffer, filename, effectiveMimeType);
      const response = await trello(`/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      return {
        id: response.id,
        name: response.name,
        url: response.url,
        mimeType: response.mimeType,
        bytes: response.bytes,
        previews: response.previews,
        date: response.date,
        isUpload: response.isUpload,
      };
    }

    // â”€â”€â”€ Copy Card â”€â”€
    case 'copy_card': {
      const { sourceCardId, listId, name, description, keepFromSource, pos } = args;

      if (!sourceCardId || !listId) {
        throw new Error('sourceCardId and listId are required');
      }

      // Build request body for Trello API
      const body = {
        idList: listId,
      };

      if (name) body.name = name;
      if (description !== undefined) body.desc = description;
      if (pos) body.pos = pos;

      // keepFromSource: "all", comma-separated string, or array
      if (keepFromSource) {
        if (keepFromSource === 'all') {
          body.keepFromSource = 'all';
        } else if (Array.isArray(keepFromSource)) {
          body.keepFromSource = keepFromSource.join(',');
        } else if (typeof keepFromSource === 'object') {
          // Convert object keys to comma-separated list
          body.keepFromSource = Object.keys(keepFromSource).join(',');
        } else {
          // Parse comma-separated string
          const options = String(keepFromSource)
            .split(',')
            .map((s) => s.trim());
          body.keepFromSource = options.join(',');
        }
      }

      const response = await trelloPost(`/cards`, { ...body, idCardSource: sourceCardId });

      return {
        id: response.id,
        name: response.name,
        url: response.url,
        listId: response.idList,
        boardId: response.idBoard,
      };
    }

    // ─── Checklist Tools (Enhanced) ──
    case 'get_card_checklists': {
      const checklists = await trello(`/cards/${args.cardId}/checklists`);
      return {
        checklists: checklists.map((cl) => ({
          id: cl.id,
          name: cl.name,
          cardId: cl.idCard,
          boardId: cl.idBoard,
          itemCount: cl.checkItems?.length || 0,
          items: (cl.checkItems || []).map((item) => ({
            id: item.id,
            name: item.name,
            checked: item.state === 'complete',
            pos: item.pos,
          })),
        })),
      };
    }

    case 'delete_checklist': {
      await trelloDelete(`/checklists/${args.checklistId}`);
      return { success: true, checklistId: args.checklistId };
    }

    case 'delete_checklist_item': {
      await trelloDelete(`/checklists/${args.checklistId}/checkItems/${args.checkItemId}`);
      return { success: true };
    }

    case 'update_checklist_item': {
      const checklist = await trello(`/checklists/${args.checklistId}?fields=idCard`);
      const body = {};
      if (args.name) body.name = args.name;
      if (args.checked !== undefined) body.state = args.checked ? 'complete' : 'incomplete';
      if (args.pos !== undefined) body.pos = args.pos;
      const item = await trelloPut(`/cards/${checklist.idCard}/checkItem/${args.checkItemId}`, body);
      return {
        id: item.id,
        name: item.name,
        checked: item.state === 'complete',
        pos: item.pos,
      };
    }

    // ─── Watch Tools ──
    case 'watch_card': {
      const subscribed = args.add === true || (args.add === undefined && args.remove !== true);
      const card = await trelloPut(`/cards/${args.cardId}`, { subscribed });
      return { id: card.id, name: card.name, subscribed: card.subscribed };
    }

    case 'watch_list': {
      const subscribed = args.add === true || (args.add === undefined && args.remove !== true);
      const list = await trelloPut(`/lists/${args.listId}`, { subscribed });
      return { id: list.id, name: list.name, subscribed: list.subscribed };
    }

    // ─── Activity ──
    case 'get_card_activity': {
      const filter = args.filter || 'all';
      const limit = args.limit || 50;
      const actions = await trello(`/cards/${args.cardId}/actions?filter=${filter}&limit=${limit}`);
      return {
        actions: actions.map((a) => ({
          id: a.id,
          type: a.type,
          date: a.date,
          memberCreator: a.memberCreator
            ? {
                id: a.memberCreator.id,
                fullName: a.memberCreator.fullName,
                username: a.memberCreator.username,
              }
            : null,
          data: a.data,
        })),
      };
    }

    // ─── Label Tools ──
    case 'search_labels': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('search_labels: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const labels = await trello(`/boards/${bid}/labels?fields=id,name,color`);
      if (args.query) {
        const q = args.query.toLowerCase();
        return {
          labels: labels.filter(
            (l) => (l.name || '').toLowerCase().includes(q) || (l.color || '').toLowerCase().includes(q),
          ),
        };
      }
      return { labels };
    }

    case 'remove_label_from_card': {
      await trelloDelete(`/cards/${args.cardId}/idLabels/${args.labelId}`);
      return { success: true, cardId: args.cardId, labelId: args.labelId };
    }

    // ─── Copy Checklist ──
    case 'copy_checklist': {
      // Create new checklist on target card
      const sourceChecklist = await trello(`/checklists/${args.sourceChecklistId}?fields=name,checkItems`);
      const newChecklist = await trelloPost(`/cards/${args.cardId}/checklists`, { name: sourceChecklist.name });
      // Copy items from source
      if (sourceChecklist.checkItems?.length) {
        for (const item of sourceChecklist.checkItems) {
          await trelloPost(`/checklists/${newChecklist.id}/checkItems`, { name: item.name });
        }
      }
      const result = await trello(`/checklists/${newChecklist.id}?fields=name,idCard`);
      return {
        id: result.id,
        name: result.name,
        cardId: result.idCard,
        itemCount: sourceChecklist.checkItems?.length || 0,
      };
    }

    // ─── Sort List Cards ──
    case 'sort_list_cards': {
      const sortField =
        args.sort === 'listPosition'
          ? 'pos'
          : args.sort === 'dueDate'
            ? 'due'
            : args.sort === 'startDate'
              ? 'start'
              : args.sort;
      const cards = await trello(`/lists/${args.listId}/cards?fields=name,id,due,start,pos,dateLastActivity`);
      cards.sort((a, b) => {
        const va = a[sortField];
        const vb = b[sortField];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'string') return va.localeCompare(vb);
        return va - vb;
      });
      const sorted = cards.map((c, i) => ({ id: c.id, name: c.name, pos: i + 1 }));
      return { sorted };
    }

    // ─── Update List ──
    case 'update_list': {
      const body = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.closed !== undefined) body.closed = args.closed;
      if (args.pos !== undefined) body.pos = args.pos;
      if (args.subscribed !== undefined) body.subscribed = args.subscribed;
      const list = await trelloPut(`/lists/${args.listId}`, body);
      return { id: list.id, name: list.name, closed: list.closed, subscribed: list.subscribed };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// â”€â”€â”€ Tool Definitions â”€â”€â”€

const TOOLS = [
  toolSchema('list_boards', 'List all Trello boards the user has access to'),
  toolSchema('list_workspaces', 'List all Trello workspaces/organizations'),
  toolSchema(
    'create_board',
    'Create a new Trello board',
    {
      name: { type: 'string', description: 'Name of the board' },
      desc: { type: 'string', description: 'Description of the board' },
      idOrganization: { type: 'string', description: 'Workspace ID' },
      defaultLabels: { type: 'boolean', description: 'Create default labels' },
      defaultLists: { type: 'boolean', description: 'Create default lists' },
    },
    ['name'],
  ),

  toolSchema('get_lists', 'Get all lists in a board', {
    boardId: { type: 'string', description: 'Board ID (uses TRELLO_DEFAULT_BOARD_ID if not provided)' },
  }),
  toolSchema(
    'add_list_to_board',
    'Add a new list to a board',
    {
      boardId: { type: 'string', description: 'Board ID (uses TRELLO_DEFAULT_BOARD_ID if not provided)' },
      name: { type: 'string', description: 'Name of the new list' },
    },
    ['name'],
  ),
  toolSchema(
    'archive_list',
    'Archive a list',
    {
      listId: { type: 'string', description: 'ID of the list to archive' },
    },
    ['listId'],
  ),

  toolSchema('get_my_cards', 'Get all cards assigned to the current user'),
  toolSchema(
    'get_cards_by_list_id',
    'Get cards in a specific list',
    {
      listId: { type: 'string', description: 'ID of the list' },
      boardId: { type: 'string', description: 'Board ID (optional)' },
    },
    ['listId'],
  ),
  toolSchema(
    'get_card',
    'Get detailed card information',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      includeMarkdown: { type: 'boolean', description: 'Return description as markdown' },
    },
    ['cardId'],
  ),
  toolSchema(
    'add_card_to_list',
    'Add a new card to a list',
    {
      listId: { type: 'string', description: 'ID of the target list' },
      name: { type: 'string', description: 'Name of the card' },
      description: { type: 'string', description: 'Description' },
      dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
      dueReminder: {
        type: 'number',
        description: 'Due date reminder in minutes before due date (e.g., 1440 for 1 day before)',
      },
      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      labels: { type: 'array', items: { type: 'string' }, description: 'Label IDs' },
    },
    ['listId', 'name'],
  ),
  toolSchema(
    'update_card_details',
    'Update card details',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      name: { type: 'string', description: 'New name' },
      description: { type: 'string', description: 'New description' },
      dueDate: { type: 'string', description: 'New due date' },
      dueReminder: { type: 'number', description: 'New due date reminder in minutes before due date' },
      start: { type: 'string', description: 'New start date' },
      dueComplete: { type: 'boolean', description: 'Mark due complete' },
      labels: { type: 'array', items: { type: 'string' }, description: 'New label IDs' },
    },
    ['cardId'],
  ),
  toolSchema(
    'move_card',
    'Move card to another list',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      listId: { type: 'string', description: 'ID of the target list' },
      boardId: { type: 'string', description: 'Target board ID' },
    },
    ['cardId', 'listId'],
  ),
  toolSchema(
    'archive_card',
    'Archive a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
    },
    ['cardId'],
  ),

  toolSchema('get_board_members', 'Get members of a board', {
    boardId: { type: 'string', description: 'Board ID (uses TRELLO_DEFAULT_BOARD_ID if not provided)' },
  }),
  toolSchema(
    'assign_member_to_card',
    'Assign a member to a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      memberId: { type: 'string', description: 'ID of the member' },
    },
    ['cardId', 'memberId'],
  ),
  toolSchema(
    'remove_member_from_card',
    'Remove a member from a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      memberId: { type: 'string', description: 'ID of the member' },
    },
    ['cardId', 'memberId'],
  ),

  toolSchema('get_board_labels', 'Get all labels on a board', {
    boardId: { type: 'string', description: 'Board ID (uses TRELLO_DEFAULT_BOARD_ID if not provided)' },
  }),
  toolSchema(
    'create_label',
    'Create a new label',
    {
      boardId: { type: 'string', description: 'Board ID (uses TRELLO_DEFAULT_BOARD_ID if not provided)' },
      name: { type: 'string', description: 'Label name' },
      color: { type: 'string', description: 'Label color' },
    },
    ['name'],
  ),
  toolSchema(
    'update_label',
    'Update a label',
    {
      labelId: { type: 'string', description: 'ID of the label' },
      name: { type: 'string', description: 'New name' },
      color: { type: 'string', description: 'New color' },
    },
    ['labelId'],
  ),
  toolSchema(
    'delete_label',
    'Delete a label',
    {
      labelId: { type: 'string', description: 'ID of the label' },
    },
    ['labelId'],
  ),

  toolSchema(
    'add_comment',
    'Add a comment to a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      text: { type: 'string', description: 'Comment text' },
    },
    ['cardId', 'text'],
  ),
  toolSchema(
    'get_card_comments',
    'Get comments on a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      limit: { type: 'number', description: 'Max comments (default 100)' },
    },
    ['cardId'],
  ),

  toolSchema(
    'attach_file_to_card',
    'Attach a file to a card from URL',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      fileUrl: { type: 'string', description: 'URL of the file to attach' },
      name: { type: 'string', description: 'Attachment name (optional)' },
      mimeType: { type: 'string', description: 'MIME type (optional, auto-detected)' },
    },
    ['cardId', 'fileUrl'],
  ),
  toolSchema(
    'attach_image_to_card',
    'Attach an image to a card from URL',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      imageUrl: { type: 'string', description: 'URL of the image to attach' },
      name: { type: 'string', description: 'Attachment name (optional)' },
    },
    ['cardId', 'imageUrl'],
  ),
  toolSchema(
    'get_card_attachments',
    'Get all attachments from a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
    },
    ['cardId'],
  ),
  toolSchema(
    'attach_data_to_card',
    'Attach data (base64 or data URL) to a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      data: { type: 'string', description: 'Base64 data or data URL' },
      name: { type: 'string', description: 'Filename (optional)' },
      mimeType: { type: 'string', description: 'MIME type (optional)' },
    },
    ['cardId', 'data'],
  ),
  toolSchema(
    'attach_image_data_to_card',
    'Attach image data to a card (screenshot convenience)',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      imageData: { type: 'string', description: 'Base64 image data or data URL' },
      name: { type: 'string', description: 'Image filename (optional)' },
    },
    ['cardId', 'imageData'],
  ),
  toolSchema(
    'copy_card',
    'Copy/duplicate a card to another list (even on different board)',
    {
      sourceCardId: { type: 'string', description: 'ID of the source card to copy' },
      listId: { type: 'string', description: 'ID of the destination list' },
      name: { type: 'string', description: 'Override the name of the copied card (optional)' },
      description: { type: 'string', description: 'Override the description of the copied card (optional)' },
      keepFromSource: {
        type: 'string',
        description:
          'Properties to copy: "all" or comma-separated list (attachments,checklists,comments,customFields,due,start,labels,members,stickers)',
      },
      pos: { type: 'string', description: 'Position of the new card: "top", "bottom", or a positive float' },
    },
    ['sourceCardId', 'listId'],
  ),

  toolSchema(
    'create_checklist',
    'Create a checklist on a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      name: { type: 'string', description: 'Checklist name' },
    },
    ['cardId', 'name'],
  ),
  toolSchema(
    'add_checklist_item',
    'Add an item to a checklist',
    {
      checklistId: { type: 'string', description: 'ID of the checklist' },
      name: { type: 'string', description: 'Item name' },
      checked: { type: 'boolean', description: 'Mark as completed' },
    },
    ['checklistId', 'name'],
  ),
  toolSchema(
    'delete_checklist',
    'Delete a checklist from a card',
    {
      checklistId: { type: 'string', description: 'ID of the checklist to delete' },
    },
    ['checklistId'],
  ),
  toolSchema(
    'delete_checklist_item',
    'Delete an item from a checklist',
    {
      checklistId: { type: 'string', description: 'ID of the checklist' },
      checkItemId: { type: 'string', description: 'ID of the checklist item' },
    },
    ['checklistId', 'checkItemId'],
  ),
  toolSchema(
    'update_checklist_item',
    'Update a checklist item (name, checked state, position)',
    {
      checklistId: { type: 'string', description: 'ID of the checklist' },
      checkItemId: { type: 'string', description: 'ID of the checklist item' },
      name: { type: 'string', description: 'New item name' },
      checked: { type: 'boolean', description: 'New checked state' },
      pos: { type: 'number', description: 'New position' },
    },
    ['checklistId', 'checkItemId'],
  ),
  toolSchema(
    'get_card_checklists',
    'Get all checklists on a card with their items',
    {
      cardId: { type: 'string', description: 'ID of the card' },
    },
    ['cardId'],
  ),
  toolSchema(
    'watch_card',
    'Subscribe/unsubscribe from watching a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      add: { type: 'boolean', description: 'Set to true to start watching' },
      remove: { type: 'boolean', description: 'Set to true to stop watching' },
    },
    ['cardId'],
  ),
  toolSchema(
    'watch_list',
    'Subscribe/unsubscribe from watching a list',
    {
      listId: { type: 'string', description: 'ID of the list' },
      add: { type: 'boolean', description: 'Set to true to start watching' },
      remove: { type: 'boolean', description: 'Set to true to stop watching' },
    },
    ['listId'],
  ),
  toolSchema(
    'get_card_activity',
    'Get activity/actions on a card (comments, moves, updates)',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      filter: { type: 'string', description: 'Filter actions by type (e.g., \"commentCard\", \"moveCard\")' },
      limit: { type: 'number', description: 'Number of actions to return (default: 50)' },
    },
    ['cardId'],
  ),
  toolSchema(
    'search_labels',
    'Search labels on a board by name or color',
    {
      boardId: { type: 'string', description: 'ID of the board' },
      query: { type: 'string', description: 'Search query (label name or color)' },
    },
    ['boardId'],
  ),
  toolSchema(
    'remove_label_from_card',
    'Remove a label from a card',
    {
      cardId: { type: 'string', description: 'ID of the card' },
      labelId: { type: 'string', description: 'ID of the label to remove' },
    },
    ['cardId', 'labelId'],
  ),
  toolSchema(
    'copy_checklist',
    'Copy a checklist to another card',
    {
      sourceChecklistId: { type: 'string', description: 'ID of the source checklist' },
      cardId: { type: 'string', description: 'ID of the target card' },
    },
    ['sourceChecklistId', 'cardId'],
  ),
  toolSchema(
    'sort_list_cards',
    'Sort cards in a list by specified criteria',
    {
      listId: { type: 'string', description: 'ID of the list' },
      sort: { type: 'string', description: 'Sort criteria: due, dueDate, listPosition, name, startDate' },
    },
    ['listId', 'sort'],
  ),
  toolSchema(
    'update_list',
    'Update list details (name, position, closed state)',
    {
      listId: { type: 'string', description: 'ID of the list' },
      name: { type: 'string', description: 'New list name' },
      closed: { type: 'boolean', description: 'Close/open the list' },
      pos: { type: 'number', description: 'New position' },
      subscribed: { type: 'boolean', description: 'Subscribe/unsubscribe' },
    },
    ['listId'],
  ),
];

// â”€â”€â”€ Main â”€â”€â”€

const auth = getAuth();
if (!auth) {
  process.stderr.write('TRELLO_API_KEY or TRELLO_TOKEN not configured\n');
  process.stderr.write('Run `bun scripts/kaede.mjs setup` to configure\n');
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
        .then((res) => result(id, wrap(res)))
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
