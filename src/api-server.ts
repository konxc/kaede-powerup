import http from 'http';
import type { PlaybookResult, PlanStep, BoardSnapshot } from './types';

export async function startApiServer(port: number = 3456): Promise<http.Server> {
  const { TrelloMCPClient } = await import('./trello-client');
  const { parsePlaybook, executeIntent, generatePlan, enforcePlaybook } = await import('./orchestrator');

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Content-Length': '0' });
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: string) => (body += chunk));
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);

        if (url.pathname === '/api/mcp') {
          await handleMCP(parsed, res, parsePlaybook, executeIntent);
          return;
        }

        if (url.pathname === '/api/tool') {
          await handleTool(parsed, res, generatePlan, enforcePlaybook, parsePlaybook);
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: message }));
      }
    });
  });

  return new Promise((resolvePromise) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`\n  \x1b[36m  KAEDE API Server running on http://localhost:${port}\x1b[0m`);
      console.log(`  \x1b[90m  POST /api/mcp      — execute MCP intent\x1b[0m`);
      console.log(`  \x1b[90m  POST /api/tool     — call MCP tool directly\x1b[0m`);
      console.log(`  \x1b[90m  POST /api/health   — health check\x1b[0m`);
      resolvePromise(server);
    });
  });
}

async function handleMCP(
  parsed: Record<string, unknown>,
  res: http.ServerResponse,
  parsePlaybook: (content: string) => PlaybookResult,
  executeIntent: (client: import('./trello-client').TrelloMCPClient, intent: string, context: PlaybookResult, boardId: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  const { intent, args = {}, boardId, playbook } = parsed as {
    intent?: string;
    args?: Record<string, unknown>;
    boardId?: string;
    playbook?: string;
  };

  if (!intent) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'intent required' }));
    return;
  }

  const { TrelloMCPClient } = await import('./trello-client');
  const client = new TrelloMCPClient();
  await client.connect();

  const context: PlaybookResult = playbook
    ? parsePlaybook(playbook)
    : { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };

  const results = await executeIntent(client, intent, context, boardId || '', args);
  client.close();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, results }));
}

async function handleTool(
  parsed: Record<string, unknown>,
  res: http.ServerResponse,
  generatePlan: (goal: string, playbook: PlaybookResult, extraArgs: Record<string, unknown>, boards?: BoardSnapshot[]) => Array<Record<string, unknown>>,
  enforcePlaybook: (playbookContent: string, plan: PlanStep[], boards?: BoardSnapshot[]) => { safe: boolean; warnings: Array<{ type: string; message: string; severity: string }>; blockers: Array<{ type: string; message: string; severity: string }>; summary: string },
  parsePlaybook: (content: string) => PlaybookResult,
): Promise<void> {
  const { name, arguments: args = {} } = parsed as { name?: string; arguments?: Record<string, unknown> };

  if (!name) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'tool name required' }));
    return;
  }

  switch (name) {
    case 'enforce_playbook': {
      const { playbook: pb, plan, boards } = args as { playbook?: string; plan?: PlanStep[]; boards?: BoardSnapshot[] };
      if (!pb) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'playbook required' }));
        return;
      }
      const result = enforcePlaybook(pb, plan || [], boards || []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    case 'generate_plan': {
      const { goal, ...extra } = args as { goal?: string } & Record<string, unknown>;
      if (!goal) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'goal required' }));
        return;
      }
      const emptyPlaybook: PlaybookResult = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
      const plan = generatePlan(goal, emptyPlaybook, extra || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ plan }));
      return;
    }

    case 'parse_playbook': {
      const { content } = args as { content?: string };
      if (!content) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'content required' }));
        return;
      }
      const result = parsePlaybook(content);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    default:
      res.writeHead(404);
      res.end(JSON.stringify({ error: `Unknown tool: ${name}` }));
  }
}
