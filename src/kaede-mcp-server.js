#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VERSION = '2024-11-05';
const SERVER = { name: 'KAEDE Orchestrator MCP', version: '1.0.0' };

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

const TOOLS = [
  toolSchema('execute_intent', 'Execute a KAEDE orchestration intent (buat card, mulai sprint, assign, etc.) against a Trello board', {
    intent: { type: 'string', description: 'Natural language intent. Examples: "buat card", "mulai sprint", "buat board", "assign", "pindah", "komentar", "buat label", "arsipkan", "tutup sprint", "report", "buat checklist"' },
    boardId: { type: 'string', description: 'Trello board ID (auto-detected if not provided)' },
    playbook: { type: 'string', description: 'Playbook markdown content for context-aware execution' },
    task: { type: 'string', description: 'Task/card name for "buat card"' },
    name: { type: 'string', description: 'Name for "buat board", "buat label"' },
    desc: { type: 'string', description: 'Description for "buat card"' },
    list: { type: 'string', description: 'Target list name for "buat card", "pindah"' },
    member: { type: 'string', description: 'Member ID for "assign"' },
    memberId: { type: 'string', description: 'Member ID for "hapus anggota"' },
    color: { type: 'string', description: 'Color for "buat label" (red, orange, yellow, green, blue, purple, pink, lime, sky, black)' },
    cardId: { type: 'string', description: 'Card ID for "pindah", "arsipkan", "komentar", "update card"' },
    text: { type: 'string', description: 'Comment text for "komentar"' },
    from: { type: 'string', description: 'Source list name for "pindah semua"' },
    to: { type: 'string', description: 'Target list name for "pindah semua"' },
    items: { type: 'array', items: { type: 'string' }, description: 'Checklist items for "buat checklist"' },
  }, ['intent']),

  toolSchema('parse_playbook', 'Parse a playbook markdown document into structured data (roles, workflow lists, conventions, labels)', {
    content: { type: 'string', description: 'Playbook markdown content' },
  }, ['content']),

  toolSchema('bundle_context', 'Load and combine project context from playbook, OpenKB, and OpenCode config', {
    playbookPath: { type: 'string', description: 'Path to playbook markdown file' },
    openkbPath: { type: 'string', description: 'Path to .openkb directory' },
    opencodePath: { type: 'string', description: 'Path to .opencode directory' },
  }),

  toolSchema('boards', 'List all Trello boards accessible via KAEDE', {
    detail: { type: 'boolean', description: 'Include lists in each board' },
  }),

  toolSchema('status', 'Check KAEDE orchestration status — version, Trello connection, available boards count'),
];

async function handleToolsCall(name, args) {
  if (name === 'status') {
    const { TrelloMCPClient } = await import(resolve(ROOT, 'src', 'trello-client.js'));
    let boardCount = 0;
    let connected = false;
    let errorMsg = null;
    try {
      const client = new TrelloMCPClient();
      await client.connect();
      const boards = await client.listBoards();
      boardCount = boards.length;
      connected = true;
      client.close();
    } catch (err) {
      errorMsg = err.message;
    }
    return { server: SERVER, connected, boardCount, error: errorMsg };
  }

  if (name === 'boards') {
    const { TrelloMCPClient } = await import(resolve(ROOT, 'src', 'trello-client.js'));
    const client = new TrelloMCPClient();
    await client.connect();
    const boards = await client.listBoards();
    const result = [];
    for (const b of boards) {
      const entry = { id: b.id, name: b.name, url: b.url };
      if (args.detail) {
        const lists = await client.getLists(b.id);
        entry.lists = lists.map(l => ({ id: l.id, name: l.name }));
      }
      result.push(entry);
    }
    client.close();
    return { boards: result };
  }

  if (name === 'parse_playbook') {
    const { parsePlaybook } = await import(resolve(ROOT, 'src', 'orchestrator.js'));
    const playbook = parsePlaybook(args.content);
    return playbook;
  }

  if (name === 'bundle_context') {
    const { bundleContext } = await import(resolve(ROOT, 'src', 'orchestrator.js'));
    const ctx = bundleContext({
      playbook: args.playbookPath,
      openkb: args.openkbPath,
      opencode: args.opencodePath,
    });
    return {
      title: ctx.playbook?.title || null,
      rolesCount: ctx.playbook?.roles?.length || 0,
      lists: ctx.playbook?.workflow?.lists || [],
      labels: ctx.playbook?.conventions?.labels || [],
      openkbTerms: ctx.openkb.glossary?.length || 0,
      openkbDecisions: ctx.openkb.decisions?.length || 0,
      hasMCP: !!ctx.opencode?.mcp?.trello,
    };
  }

  if (name === 'execute_intent') {
    const { parsePlaybook, executeIntent } = await import(resolve(ROOT, 'src', 'orchestrator.js'));
    const { TrelloMCPClient } = await import(resolve(ROOT, 'src', 'trello-client.js'));

    let context = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    if (args.playbook) {
      context = parsePlaybook(args.playbook);
    }

    const client = new TrelloMCPClient();
    await client.connect();

    let boardId = args.boardId;
    if (!boardId) {
      const boards = await client.listBoards();
      if (boards.length > 0) {
        boardId = boards[0].id;
      } else {
        client.close();
        throw new Error('No boards found. Provide a boardId or create a board first.');
      }
    }

    const extraArgs = {};
    for (const key of ['task', 'name', 'desc', 'list', 'member', 'memberId', 'color', 'cardId', 'text', 'from', 'to']) {
      if (args[key] !== undefined) extraArgs[key] = args[key];
    }
    if (args.items !== undefined) {
      extraArgs.items = (Array.isArray(args.items) ? args.items : [args.items]).map(i => ({ name: i }));
    }

    const results = await executeIntent(client, args.intent, context, boardId, extraArgs);
    client.close();
    return { results };
  }

  throw new Error(`Unknown tool: ${name}`);
}

const auth = { placeholder: true };

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
