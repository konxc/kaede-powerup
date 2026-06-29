import http from 'http';

export async function startApiServer(port: number = 3456): Promise<http.Server> {
  const { TrelloMCPClient } = await import('./trello-client');
  const { parsePlaybook, executeIntent } = await import('./orchestrator');

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

    if (url.pathname !== '/api/mcp') {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: string) => (body += chunk));
    req.on('end', async () => {
      try {
        const {
          intent,
          args = {},
          boardId,
          playbook,
        } = JSON.parse(body) as {
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

        const client = new TrelloMCPClient();
        await client.connect();

        let context: Record<string, unknown> = {
          title: '',
          roles: [],
          workflow: { lists: [] },
          conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
        };
        if (playbook) {
          context = parsePlaybook(playbook) as unknown as Record<string, unknown>;
        }

        const results = await executeIntent(client, intent, context as never, boardId || '', args);
        client.close();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, results }));
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
      console.log(`  \x1b[90m  POST /api/health   — health check\x1b[0m`);
      resolvePromise(server);
    });
  });
}
