#!/usr/bin/env bun
// Port langsung dari JS, tipenya sedang diperbaiki bertahap

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mimeFromFilename, createAttachmentFormData, createUrlAttachmentData } from './trello/attachments';

const API = 'https://api.trello.com/1';
const VERSION = '2024-11-05';
const SERVER = { name: 'KAEDE Trello MCP', version: '1.0.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Types ──
interface Auth {
  key: string;
  token: string;
  qs: string;
}

interface TrelloOpts {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  raw?: boolean;
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
    $schema: string;
  };
}

interface JsonRpcMsg {
  jsonrpc: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

type ToolResult = Record<string, unknown>;

// â”€â”€â”€ Secrets â”€â”€â”€

function loadEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const vars: Record<string, string> = {};
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

function getAuth(): Auth | null {
  const searchPaths = [
    resolve(ROOT, 'secrets.env'),
    resolve(ROOT, '..', 'secrets.env'),
    resolve(homedir(), '.config', 'kaede', 'secrets.env'),
    resolve(process.cwd(), 'secrets.env'),
  ];
  let merged: Record<string, string> = {};
  for (const p of searchPaths) {
    const exists = existsSync(p);
    process.stderr.write(`[kaede-mcp] scan secrets path: ${p} (exists=${exists})\n`);
    if (exists) merged = { ...merged, ...loadEnv(p) };
  }
  merged = { ...merged, ...(process.env as Record<string, string>) };

  const key = merged.TRELLO_API_KEY;
  const token = merged.TRELLO_TOKEN;
  if (!key || !token) {
    process.stderr.write(`[kaede-mcp] getAuth FAILED — key=${!!key} token=${!!token}\n`);
    return null;
  }
  process.stderr.write(`[kaede-mcp] getAuth OK — key=${key.slice(0, 4)}... token=${token.slice(0, 8)}...\n`);
  return { key, token, qs: `key=${key}&token=${token}` };
}

// â”€â”€â”€ Trello API â”€â”€â”€

let _defaultBoardId: string | null = null;
function getDefaultBoardId(): string {
  if (!_defaultBoardId) {
    _defaultBoardId = process.env.TRELLO_DEFAULT_BOARD_ID || '';
  }
  return _defaultBoardId;
}

function resolveBoardId(args: Record<string, unknown>): string | null {
  return (args.boardId as string) || getDefaultBoardId() || null;
}

function validateRequired(args: Record<string, unknown>, required: string[], toolName: string): void {
  const missing = required.filter((k) => args[k] == null);
  if (missing.length) {
    throw new Error(`${toolName}: missing required parameter(s): ${missing.join(', ')}`);
  }
}

function wrap(res: unknown): { content: Array<{ type: string; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
}

async function trello(path: string, opts: TrelloOpts = {}): Promise<unknown> {
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

function trelloPost(path: string, data: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams({ ...data, ...getAuth()! });
  return trello(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function trelloPut(path: string, data: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams({ ...data, ...getAuth()! });
  return trello(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function trelloDelete(path: string): Promise<unknown> {
  return trello(path, { method: 'DELETE' });
}

// â”€â”€â”€ MCP Protocol â”€â”€â”€

function send(msg: JsonRpcMsg): void {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function error(id: number | string | null, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function result(id: number | string | null, data: unknown): void {
  send({ jsonrpc: '2.0', id, result: data });
}

function toolSchema(
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = [],
): ToolDef {
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

async function handleToolsCall(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    // â”€â”€â”€ Boards â”€â”€â”€
    case 'list_boards': {
      const boards = (await trello('/members/me/boards?fields=name,id,url,closed,desc&filter=open')) as Array<
        Record<string, unknown>
      >;
      let filtered = boards;
      if (args.nameFilter) {
        const q = (args.nameFilter as string).toLowerCase();
        filtered = boards.filter(
          (b: Record<string, unknown>) =>
            ((b.name as string) || '').toLowerCase().includes(q) ||
            ((b.desc as string) || '').toLowerCase().includes(q),
        );
      }
      return {
        boards: filtered.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          name: b.name as string,
          url: b.url as string,
          closed: b.closed as boolean,
          desc: b.desc as string,
        })),
      };
    }
    case 'search_boards': {
      const query = (args.query as string || '').toLowerCase();
      const allBoards = (await trello('/members/me/boards?fields=name,id,url,closed,desc,dateLastActivity&filter=open')) as Array<Record<string, unknown>>;
      const scored = allBoards
        .map((b: Record<string, unknown>) => {
          const name = (b.name as string) || '';
          const desc = (b.desc as string) || '';
          let score = 0;
          if (name.toLowerCase().includes(query)) score += 3;
          if (name.toLowerCase().startsWith(query)) score += 2;
          if (desc.toLowerCase().includes(query)) score += 1;
          if (query.split(/\s+/).every((w) => name.toLowerCase().includes(w))) score += 2;
          return { id: b.id as string, name, url: b.url as string, closed: b.closed as boolean, desc, score };
        })
        .filter((b) => b.score > 0)
        .sort((a, b) => b.score - a.score);
      return { results: scored };
    }
    case 'search_cards': {
      const query = (args.query as string) || '';
      const boardId = (args.boardId as string) || '';
      const limit = (args.limit as number) || 50;
      if (!query) throw new Error('search_cards: query is required');
      let endpoint = `/search?query=${encodeURIComponent(query)}&card_fields=name,id,desc,idList,idBoard,due,start,dateLastActivity,labels,closed&cards_limit=${limit}`;
      if (boardId) endpoint += `&idBoards=${boardId}`;
      const result = (await trello(endpoint)) as { cards?: Array<Record<string, unknown>> };
      const cards = (result.cards || []).map((c) => ({
        id: c.id,
        name: c.name,
        desc: c.desc,
        listId: c.idList,
        boardId: c.idBoard,
        due: c.due,
        start: c.start,
        dateLastActivity: c.dateLastActivity,
        labels: c.labels,
        closed: c.closed,
      }));
      return { cards };
    }
    case 'list_workspaces': {
      const orgs = (await trello('/members/me/organizations?fields=name,id,displayName')) as Array<
        Record<string, unknown>
      >;
      return {
        workspaces: orgs.map((o: Record<string, unknown>) => ({
          id: o.id as string,
          name: o.name as string,
          displayName: o.displayName as string,
        })),
      };
    }
    case 'create_board': {
      const body: Record<string, string> = { name: args.name as string };
      if (args.desc) body.desc = args.desc as string;
      if (args.idOrganization) body.idOrganization = args.idOrganization as string;
      if (args.defaultLabels !== undefined) body.defaultLabels = args.defaultLabels as string;
      if (args.defaultLists !== undefined) body.defaultLists = args.defaultLists as string;
      const board = (await trelloPost('/boards', body)) as Record<string, unknown>;
      return { id: board.id as string, name: board.name as string, url: board.url as string };
    }

    // â”€â”€â”€ Lists â”€â”€â”€
    case 'get_lists': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_lists: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const lists = (await trello(`/boards/${bid}/lists?fields=name,id,closed`)) as Array<Record<string, unknown>>;
      return {
        lists: lists.map((l: Record<string, unknown>) => ({
          id: l.id as string,
          name: l.name as string,
          closed: l.closed as boolean,
        })),
      };
    }
    case 'add_list_to_board': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('add_list_to_board: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const list = (await trelloPost(`/boards/${bid}/lists`, { name: args.name as string })) as Record<string, unknown>;
      return { id: list.id as string, name: list.name as string };
    }
    case 'archive_list': {
      const list = (await trelloPut(`/lists/${args.listId as string}`, { closed: 'true' })) as Record<string, unknown>;
      return { id: list.id as string, name: list.name as string, closed: list.closed as boolean };
    }

    // â”€â”€â”€ Cards â”€â”€â”€
    case 'get_my_cards': {
      const cards = (await trello(
        `/members/me/cards?fields=name,id,due,dueComplete,idMembers,url,desc,idList,idBoard&members=true`,
      )) as Array<Record<string, unknown>>;
      return {
        cards: cards.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          due: c.due as string,
          dueComplete: c.dueComplete as boolean,
          url: c.url as string,
          desc: c.desc as string,
          listId: c.idList as string,
          boardId: c.idBoard as string,
        })),
      };
    }
    case 'get_cards_by_list_id': {
      const lid = args.listId;
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,dateLastActivity,start';
      const cards = (await trello(`/lists/${lid as string}/cards?fields=${fields}&members=true`)) as Array<
        Record<string, unknown>
      >;
      return {
        cards: cards.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          due: c.due as string,
          dueComplete: c.dueComplete as boolean,
          start: c.start as string,
          url: c.url as string,
          desc: c.desc as string,
          idMembers: c.idMembers as string,
          dateLastActivity: c.dateLastActivity as string,
        })),
      };
    }
    case 'get_card': {
      if (!args.cardId) throw new Error('get_card: missing required parameter: cardId');
      const fields = 'name,id,due,dueComplete,idMembers,url,desc,idList,idBoard,start,labels,dateLastActivity';
      const card = (await trello(`/cards/${args.cardId as string}?fields=${fields}`)) as Record<string, unknown>;
      const res: Record<string, unknown> = {
        id: card.id as string,
        name: card.name as string,
        desc: card.desc as string,
        url: card.url as string,
        due: card.due as string,
        dueComplete: card.dueComplete as boolean,
        start: card.start as string,
        listId: card.idList as string,
        boardId: card.idBoard as string,
        idMembers: card.idMembers as string,
        labels: card.labels as string,
        dateLastActivity: card.dateLastActivity as string,
      };
      if (args.includeMarkdown && card.desc) {
        res.descMarkdown = card.desc as string;
      }
      return res;
    }
    case 'add_card_to_list': {
      const body: Record<string, string> = { name: args.name as string, idList: args.listId as string };
      if (args.description) body.desc = args.description as string;
      if (args.dueDate) body.due = args.dueDate as string;
      if (args.dueReminder !== undefined) body.dueReminder = args.dueReminder as string;
      if (args.start) body.start = args.start as string;
      if (args.labels) body.idLabels = (args.labels as string[]).join(',');
      const card = (await trelloPost('/cards', body)) as Record<string, unknown>;
      return {
        id: card.id as string,
        name: card.name as string,
        url: card.url as string,
        listId: card.idList as string,
      };
    }
    case 'update_card_details': {
      const body: Record<string, string> = {};
      if (args.name) body.name = args.name as string;
      if (args.description) body.desc = args.description as string;
      if (args.dueDate) body.due = args.dueDate as string;
      if (args.dueReminder !== undefined) body.dueReminder = args.dueReminder as string;
      if (args.start) body.start = args.start as string;
      if (args.dueComplete !== undefined) body.dueComplete = args.dueComplete as string;
      if (args.labels) body.idLabels = (args.labels as string[]).join(',');
      const card = (await trelloPut(`/cards/${args.cardId as string}`, body)) as Record<string, unknown>;
      return { id: card.id as string, name: card.name as string, url: card.url as string };
    }
    case 'move_card': {
      const targetList = args.listId as string;
      const card = (await trelloPut(`/cards/${args.cardId as string}`, { idList: targetList })) as Record<
        string,
        unknown
      >;
      return { id: card.id as string, name: card.name as string, listId: card.idList as string };
    }
    case 'archive_card': {
      const card = (await trelloPut(`/cards/${args.cardId as string}`, { closed: 'true' })) as Record<string, unknown>;
      return { id: card.id as string, name: card.name as string, closed: card.closed as boolean };
    }

    // â”€â”€â”€ Members â”€â”€â”€
    case 'get_board_members': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_board_members: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const members = (await trello(`/boards/${bid}/members?fields=id,fullName,username,initials,avatarUrl`)) as Array<
        Record<string, unknown>
      >;
      return { members };
    }
    case 'assign_member_to_card': {
      const res = (await trelloPost(`/cards/${args.cardId as string}/idMembers`, {
        value: args.memberId as string,
      })) as Record<string, unknown>;
      return { success: true, cardId: args.cardId as string, memberId: args.memberId as string };
    }
    case 'remove_member_from_card': {
      await trelloDelete(`/cards/${args.cardId as string}/idMembers/${args.memberId as string}`);
      return { success: true, cardId: args.cardId as string, memberId: args.memberId as string };
    }

    // â”€â”€â”€ Labels â”€â”€â”€
    case 'get_board_labels': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('get_board_labels: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const labels = (await trello(`/boards/${bid}/labels?fields=id,name,color`)) as Array<Record<string, unknown>>;
      return { labels };
    }
    case 'create_label': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('create_label: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const body: Record<string, string> = { name: args.name as string };
      if (args.color) body.color = args.color as string;
      const label = (await trelloPost(`/boards/${bid}/labels`, body)) as Record<string, unknown>;
      return { id: label.id as string, name: label.name as string, color: label.color as string };
    }
    case 'update_label': {
      const body: Record<string, string> = {};
      if (args.name) body.name = args.name as string;
      if (args.color) body.color = args.color as string;
      const label = (await trelloPut(`/labels/${args.labelId as string}`, body)) as Record<string, unknown>;
      return { id: label.id as string, name: label.name as string, color: label.color as string };
    }
    case 'delete_label': {
      await trelloDelete(`/labels/${args.labelId as string}`);
      return { success: true, labelId: args.labelId as string };
    }

    // â”€â”€â”€ Checklists â”€â”€â”€
    case 'create_checklist': {
      const checklist = (await trelloPost(`/cards/${args.cardId as string}/checklists`, {
        name: args.name as string,
      })) as Record<string, unknown>;
      return { id: checklist.id as string, name: checklist.name as string };
    }
    case 'add_checklist_item': {
      const body: Record<string, string> = { name: args.name as string };
      if (args.checked !== undefined) body.checked = args.checked as string;
      const item = (await trelloPost(`/checklists/${args.checklistId as string}/checkItems`, body)) as Record<
        string,
        unknown
      >;
      return { id: item.id as string, name: item.name as string };
    }

    // â”€â”€â”€ Comments â”€â”€â”€
    case 'add_comment': {
      const comment = (await trelloPost(`/cards/${args.cardId as string}/actions/comments`, {
        text: args.text as string,
      })) as Record<string, unknown>;
      return { id: comment.id as string, text: args.text as string };
    }
    case 'get_card_comments': {
      const limit = (args.limit || 100) as number;
      const actions = (await trello(
        `/cards/${args.cardId as string}/actions?filter=commentCard&limit=${limit}`,
      )) as Array<Record<string, unknown>>;
      return {
        comments: actions.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          text: (a.data as Record<string, unknown>)?.text as string,
          date: a.date as string,
          memberCreator: a.memberCreator,
        })),
      };
    }

    // â”€â”€â”€ Attachments â”€â”€â”€
    case 'attach_file_to_card': {
      const cardId = args.cardId as string;
      const fileUrl = args.fileUrl as string;
      const name = args.name as string | undefined;
      const mimeType = args.mimeType as string | undefined;

      if (!fileUrl) {
        throw new Error('fileUrl is required');
      }

      const effectiveMimeType = mimeType || mimeFromFilename(fileUrl);
      const filename = name || (fileUrl.split('/').pop() as string) || 'attachment';

      let response: Record<string, unknown>;
      if (fileUrl.startsWith('file://')) {
        // Local file upload - need to handle via FormData
        // For now, use URL-based attachment
        throw new Error('Local file upload not yet implemented. Please use URL-based attachment.');
      } else {
        // URL-based attachment - Trello API expects POST with form data
        const body: Record<string, string> = { url: fileUrl };
        if (filename) body.name = filename;

        response = (await trelloPost(`/cards/${cardId}/attachments`, body)) as Record<string, unknown>;
      }

      return {
        id: response.id as string,
        name: response.name as string,
        url: response.url as string,
        mimeType: response.mimeType as string,
        bytes: response.bytes as number,
      };
    }

    case 'attach_image_to_card': {
      const cardId = args.cardId as string;
      const imageUrl = args.imageUrl as string;
      const name = args.name as string | undefined;

      if (!imageUrl) {
        throw new Error('imageUrl is required');
      }

      const filename = name || 'Image Attachment';

      // Trello API expects POST with form data
      const body: Record<string, string> = { url: imageUrl };
      if (filename) body.name = filename;

      const response = (await trelloPost(`/cards/${cardId}/attachments`, body)) as Record<string, unknown>;

      return {
        id: response.id as string,
        name: response.name as string,
        url: response.url as string,
        mimeType: response.mimeType as string,
        previews: response.previews as string,
      };
    }

    case 'get_card_attachments': {
      const cardId = args.cardId as string;

      if (!cardId) {
        throw new Error('cardId is required');
      }

      const attachments = (await trello(`/cards/${cardId}/attachments`)) as Array<Record<string, unknown>>;

      return {
        attachments: attachments.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          name: a.name as string,
          url: a.url as string,
          mimeType: a.mimeType as string,
          bytes: a.bytes as number,
          date: a.date as string,
          isUpload: a.isUpload as boolean,
        })),
      };
    }

    case 'attach_data_to_card': {
      const cardId = args.cardId as string;
      const data = args.data as string;
      const name = args.name as string | undefined;
      const mimeType = args.mimeType as string | undefined;

      if (!data) {
        throw new Error('data is required (base64 or data URL)');
      }

      let buffer: Buffer;
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
      const response = (await trello(`/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      })) as Record<string, unknown>;

      return {
        id: response.id as string,
        name: response.name as string,
        url: response.url as string,
        mimeType: response.mimeType as string,
        bytes: response.bytes as number,
        date: response.date as string,
        isUpload: response.isUpload as boolean,
      };
    }

    case 'attach_image_data_to_card': {
      const cardId = args.cardId as string;
      const imageData = args.imageData as string;
      const name = args.name as string | undefined;

      if (!imageData) {
        throw new Error('imageData is required (base64 or data URL)');
      }

      let buffer: Buffer;
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
      const response = (await trello(`/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      })) as Record<string, unknown>;

      return {
        id: response.id as string,
        name: response.name as string,
        url: response.url as string,
        mimeType: response.mimeType as string,
        bytes: response.bytes as number,
        previews: response.previews as string,
        date: response.date as string,
        isUpload: response.isUpload as boolean,
      };
    }

    // â”€â”€â”€ Copy Card â”€â”€
    case 'copy_card': {
      const sourceCardId = args.sourceCardId as string;
      const listId = args.listId as string;
      const name = args.name as string | undefined;
      const description = args.description as string | undefined;
      const keepFromSource = args.keepFromSource;
      const pos = args.pos as string | undefined;

      if (!sourceCardId || !listId) {
        throw new Error('sourceCardId and listId are required');
      }

      // Build request body for Trello API
      const body: Record<string, string> = {
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
          body.keepFromSource = (keepFromSource as string[]).join(',');
        } else if (typeof keepFromSource === 'object') {
          // Convert object keys to comma-separated list
          body.keepFromSource = Object.keys(keepFromSource as Record<string, unknown>).join(',');
        } else {
          // Parse comma-separated string
          const options = String(keepFromSource)
            .split(',')
            .map((s: string) => s.trim());
          body.keepFromSource = options.join(',');
        }
      }

      const response = (await trelloPost(`/cards`, { ...body, idCardSource: sourceCardId })) as Record<string, unknown>;

      return {
        id: response.id as string,
        name: response.name as string,
        url: response.url as string,
        listId: response.idList as string,
        boardId: response.idBoard as string,
      };
    }

    // ─── Checklist Tools (Enhanced) ──
    case 'get_card_checklists': {
      const checklists = (await trello(`/cards/${args.cardId as string}/checklists`)) as Array<Record<string, unknown>>;
      return {
        checklists: checklists.map((cl: Record<string, unknown>) => ({
          id: cl.id as string,
          name: cl.name as string,
          cardId: cl.idCard as string,
          boardId: cl.idBoard as string,
          itemCount: (cl.checkItems as Array<Record<string, unknown>>)?.length || 0,
          items: ((cl.checkItems as Array<Record<string, unknown>>) || []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            name: item.name as string,
            checked: item.state === 'complete',
            pos: item.pos as number,
          })),
        })),
      };
    }

    case 'delete_checklist': {
      await trelloDelete(`/checklists/${args.checklistId as string}`);
      return { success: true, checklistId: args.checklistId as string };
    }

    case 'delete_checklist_item': {
      await trelloDelete(`/checklists/${args.checklistId as string}/checkItems/${args.checkItemId as string}`);
      return { success: true };
    }

    case 'update_checklist_item': {
      const checklist = (await trello(`/checklists/${args.checklistId as string}?fields=idCard`)) as Record<
        string,
        unknown
      >;
      const body: Record<string, string> = {};
      if (args.name) body.name = args.name as string;
      if (args.checked !== undefined) body.state = args.checked ? 'complete' : 'incomplete';
      if (args.pos !== undefined) body.pos = args.pos as string;
      const item = (await trelloPut(
        `/cards/${checklist.idCard as string}/checkItem/${args.checkItemId as string}`,
        body,
      )) as Record<string, unknown>;
      return {
        id: item.id as string,
        name: item.name as string,
        checked: item.state === 'complete',
        pos: item.pos as number,
      };
    }

    // ─── Watch Tools ──
    case 'watch_card': {
      const subscribed = args.add === true || (args.add === undefined && args.remove !== true);
      const card = (await trelloPut(`/cards/${args.cardId as string}`, { subscribed: String(subscribed) })) as Record<
        string,
        unknown
      >;
      return { id: card.id as string, name: card.name as string, subscribed: card.subscribed as boolean };
    }

    case 'watch_list': {
      const subscribed = args.add === true || (args.add === undefined && args.remove !== true);
      const list = (await trelloPut(`/lists/${args.listId as string}`, { subscribed: String(subscribed) })) as Record<
        string,
        unknown
      >;
      return { id: list.id as string, name: list.name as string, subscribed: list.subscribed as boolean };
    }

    // ─── Activity ──
    case 'get_card_activity': {
      const filter = (args.filter || 'all') as string;
      const limit = (args.limit || 50) as number;
      const actions = (await trello(
        `/cards/${args.cardId as string}/actions?filter=${filter}&limit=${limit}`,
      )) as Array<Record<string, unknown>>;
      return {
        actions: actions.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          type: a.type as string,
          date: a.date as string,
          memberCreator: a.memberCreator
            ? {
                id: (a.memberCreator as Record<string, unknown>).id as string,
                fullName: (a.memberCreator as Record<string, unknown>).fullName as string,
                username: (a.memberCreator as Record<string, unknown>).username as string,
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
      const labels = (await trello(`/boards/${bid}/labels?fields=id,name,color`)) as Array<Record<string, unknown>>;
      if (args.query) {
        const q = (args.query as string).toLowerCase();
        return {
          labels: labels.filter(
            (l: Record<string, unknown>) =>
              ((l.name as string) || '').toLowerCase().includes(q) ||
              ((l.color as string) || '').toLowerCase().includes(q),
          ),
        };
      }
      return { labels };
    }

    case 'remove_label_from_card': {
      await trelloDelete(`/cards/${args.cardId as string}/idLabels/${args.labelId as string}`);
      return { success: true, cardId: args.cardId as string, labelId: args.labelId as string };
    }

    // ─── Copy Checklist ──
    case 'copy_checklist': {
      // Create new checklist on target card
      const sourceChecklist = (await trello(
        `/checklists/${args.sourceChecklistId as string}?fields=name,checkItems`,
      )) as Record<string, unknown>;
      const newChecklist = (await trelloPost(`/cards/${args.cardId as string}/checklists`, {
        name: sourceChecklist.name as string,
      })) as Record<string, unknown>;
      // Copy items from source
      const sourceItems = sourceChecklist.checkItems as Array<Record<string, unknown>> | undefined;
      if (sourceItems?.length) {
        for (const item of sourceItems) {
          await trelloPost(`/checklists/${newChecklist.id as string}/checkItems`, { name: item.name as string });
        }
      }
      const result = (await trello(`/checklists/${newChecklist.id as string}?fields=name,idCard`)) as Record<
        string,
        unknown
      >;
      return {
        id: result.id as string,
        name: result.name as string,
        cardId: result.idCard as string,
        itemCount: sourceItems?.length || 0,
      };
    }

    // ─── Set Board Project ──
    case 'set_board_project': {
      const bid = resolveBoardId(args);
      if (!bid) throw new Error('set_board_project: boardId is required (set TRELLO_DEFAULT_BOARD_ID or pass boardId)');
      const projectName = args.projectName as string;
      if (!projectName) throw new Error('projectName is required');
      const existing = (await trello(`/boards/${bid}?fields=desc`)) as Record<string, unknown>;
      const oldDesc = (existing.desc as string) || '';
      const lines = oldDesc.split('\n').filter((l: string) => !l.startsWith('KAEDE_PROJECT='));
      lines.push(`KAEDE_PROJECT=${projectName}`);
      if (args.playbookPath) lines.push(`KAEDE_PLAYBOOK=${args.playbookPath as string}`);
      const board = (await trelloPut(`/boards/${bid}`, { desc: lines.join('\n').trim() })) as Record<string, unknown>;
      return { id: board.id as string, name: board.name as string, desc: board.desc as string };
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
              : (args.sort as string);
      const cards = (await trello(
        `/lists/${args.listId as string}/cards?fields=name,id,due,start,pos,dateLastActivity`,
      )) as Array<Record<string, unknown>>;
      cards.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const va = a[sortField as string];
        const vb = b[sortField as string];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'string') return va.localeCompare(vb as string);
        return (va as number) - (vb as number);
      });
      const sorted = cards.map((c: Record<string, unknown>, i: number) => ({
        id: c.id as string,
        name: c.name as string,
        pos: i + 1,
      }));
      return { sorted };
    }

    // ─── Update List ──
    case 'update_list': {
      const body: Record<string, string> = {};
      if (args.name !== undefined) body.name = args.name as string;
      if (args.closed !== undefined) body.closed = args.closed as string;
      if (args.pos !== undefined) body.pos = args.pos as string;
      if (args.subscribed !== undefined) body.subscribed = args.subscribed as string;
      const list = (await trelloPut(`/lists/${args.listId as string}`, body)) as Record<string, unknown>;
      return {
        id: list.id as string,
        name: list.name as string,
        closed: list.closed as boolean,
        subscribed: list.subscribed as boolean,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// â”€â”€â”€ Tool Definitions â”€â”€â”€

const TOOLS: ToolDef[] = [
  toolSchema('list_boards', 'List all Trello boards the user has access to', {
    nameFilter: { type: 'string', description: 'Optional substring to filter boards by name or description (case-insensitive)' },
  }),
  toolSchema(
    'search_boards',
    'Search Trello boards by name or description with relevance scoring. Returns boards ordered by best match.',
    {
      query: { type: 'string', description: 'Search query (matches name and description)' },
    },
    ['query'],
  ),
  toolSchema(
    'search_cards',
    'Search Trello cards by text query across one or all boards. Uses Trello full-text search API.',
    {
      query: { type: 'string', description: 'Search query' },
      boardId: { type: 'string', description: 'Scope search to a specific board (optional, searches all boards if empty)' },
      limit: { type: 'number', description: 'Max results (default 50)' },
    },
    ['query'],
  ),
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
  toolSchema(
    'set_board_project',
    'Set project metadata on a board (stored in board description). Useful for linking boards to playbook paths.',
    {
      boardId: { type: 'string', description: 'Board ID (uses default if not provided)' },
      projectName: { type: 'string', description: 'Project name, e.g. "SMART Presensi"' },
      playbookPath: { type: 'string', description: 'Optional path to playbook' },
    },
    ['projectName'],
  ),
];

// â”€â”€â”€ Main â”€â”€â”€

const auth = getAuth();
if (!auth) {
  process.stderr.write('[kaede-mcp] FATAL: TRELLO_API_KEY or TRELLO_TOKEN not configured\n');
  process.stderr.write('[kaede-mcp] Run `bun scripts/kaede.ts setup` to configure, or set env vars\n');
  process.exit(1);
}
process.stderr.write(`[kaede-mcp] Server starting — ROOT=${ROOT}\n`);

let buffer = '';
const stdin = process.stdin;
stdin.setEncoding('utf-8');

stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

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
