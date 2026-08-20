/**
 * Netlify Proxy Tests — parity & capability guards
 *
 * Verifies the stateless serverless proxy (`netlify/functions/trello-proxy.ts`)
 * stays disciplined vs the full local orchestrator:
 *   1. Health + tool dispatch basics
 *   2. Capability pin — category D tools are NEVER exposed (unsupported / 404)
 *   3. Parity — parse_playbook & enforce_playbook output ≡ src/ reference
 *   4. Auth guard — ALL Trello intents require auth (Bearer per-user token validated
 *      via /1/tokens/{token}, or X-KAEDE-Key integrator path); no open reads.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../../../apps/static/netlify/functions/trello-proxy.ts';
import { parsePlaybook } from '../src/playbook-parser.ts';
import { enforcePlaybook } from '../src/enforcer.ts';

function invoke({ path = '/', method = 'POST', body, headers = {} } = {}) {
  return handler(
    {
      httpMethod: method,
      path,
      headers,
      body: body !== undefined ? JSON.stringify(body) : '',
    },
    {},
  );
}

function toolCall(name, args = {}) {
  return invoke({ path: '/api/tool', body: { name, arguments: args } });
}

function mcpCall(intent, args = {}, headers = {}) {
  return invoke({ path: '/api/mcp', body: { intent, args }, headers });
}

const PLAYBOOK_SAMPLE = `# Sprint Alpha

## Peran Tim

### PM
- **Tanggung jawab**: Sprint planning, backlog grooming
- **Akses**: Full admin

### Developer
- **Tanggung jawab**: Coding, testing
- **Akses**: Write

## Workflow Sprint

- **Backlog**: Ide mentah
- **To Do**: Siap dikerjakan
- **In Progress**: Sedang dikerjakan
- **Done**: Selesai

## Konvensi

\`feat:\` \`fix:\` \`docs:\` \`chore:\`
**Merah**: Bug / critical
**Kuning**: Enhancement
**Hijau**: Task selesai
`;

const SAMPLE_PLAN = [
  {
    action: 'create_card',
    params: { name: 'badprefix: card tanpa prefix', listName: 'Review', labels: ['random label'] },
    description: 'Violating card',
  },
  {
    action: 'create_list',
    params: { name: 'Review' },
    description: 'List not in workflow',
  },
];

describe('trello-proxy (stateless serverless)', () => {
  it('1. health endpoint responds', async () => {
    const res = await invoke({ path: '/' });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'ok');
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  });

  it('2. CORS allows Authorization & X-KAEDE-Key headers', async () => {
    const res = await invoke({ path: '/', method: 'OPTIONS' });
    assert.equal(res.statusCode, 204);
    const headers = res.headers['Access-Control-Allow-Headers'];
    assert.ok(headers.includes('X-KAEDE-Key'));
    assert.ok(headers.includes('Authorization'));
  });

  it('3. unknown tool returns 404', async () => {
    const res = await toolCall('nope_not_a_tool');
    assert.equal(res.statusCode, 404);
    assert.ok(JSON.parse(res.body).error.includes('Unknown tool'));
  });

  it('4. capability pin — category D tools are unsupported/blocked', async () => {
    const planRes = await toolCall('generate_plan', { goal: 'mulai sprint' });
    assert.equal(planRes.statusCode, 200);
    const planBody = JSON.parse(planRes.body);
    assert.equal(planBody.plan[0].action, 'unsupported');

    const execRes = await toolCall('execute_plan', { plan: [] });
    assert.equal(execRes.statusCode, 200);
    assert.equal(JSON.parse(execRes.body).success, false);

    const undoRes = await toolCall('undo_last_plan');
    assert.equal(undoRes.statusCode, 404);

    const historyRes = await toolCall('get_execution_history');
    assert.equal(historyRes.statusCode, 404);

    const bundleRes = await toolCall('bundle_context', {});
    assert.equal(bundleRes.statusCode, 404);
  });

  it('5. capability pin — no category D intents exposed via /api/mcp', async () => {
    const res = await mcpCall('execute_plan', { plan: [] });
    assert.equal(res.statusCode, 404);
    assert.ok(JSON.parse(res.body).error.includes('Unknown intent'));
  });

  it('6. parity — parse_playbook proxy output equals src reference', async () => {
    const res = await toolCall('parse_playbook', { content: PLAYBOOK_SAMPLE });
    assert.equal(res.statusCode, 200);
    const proxyOut = JSON.parse(res.body);
    const refOut = parsePlaybook(PLAYBOOK_SAMPLE);
    assert.deepEqual(proxyOut, refOut);
  });

  it('7. parity — enforce_playbook proxy output equals src reference', async () => {
    const res = await toolCall('enforce_playbook', {
      playbook: PLAYBOOK_SAMPLE,
      plan: SAMPLE_PLAN,
      boards: [],
    });
    assert.equal(res.statusCode, 200);
    const proxyOut = JSON.parse(res.body);
    const refOut = enforcePlaybook(SAMPLE_PLAN, parsePlaybook(PLAYBOOK_SAMPLE), []);
    assert.deepEqual(proxyOut, refOut);
  });

  it('8. detect_duplicates runs pure (no Trello needed)', async () => {
    const res = await toolCall('detect_duplicates', {
      boards: [
        {
          boardId: 'b1',
          boardName: 'B1',
          lists: [
            {
              listId: 'l1',
              listName: 'To Do',
              cards: [
                { id: 'c1', name: 'Card A' },
                { id: 'c2', name: 'Card A' },
              ],
            },
          ],
        },
      ],
    });
    assert.equal(res.statusCode, 200);
    const out = JSON.parse(res.body);
    assert.equal(out.sameList.length, 1);
    assert.equal(out.totalDuplicateCards, 2);
  });

  describe('auth guard (per-user OAuth + integrator key)', () => {
    const KEY = 'test-kaede-key-123';
    const USER_TOKEN = 'ATTA-per-user-token';
    const SERVICE_TOKEN = 'ATTA-service-account';

    // Stub global fetch to emulate Trello: token validation + API endpoints.
    function stubTrello({ api } = {}) {
      const calls = [];
      const prev = globalThis.fetch;
      globalThis.fetch = async (url) => {
        const u = String(url);
        calls.push(u);
        const tokenMatch = u.match(/\/tokens\/([^?]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          if (token === USER_TOKEN) {
            return { ok: true, status: 200, json: async () => ({ id: token, member: { id: 'm1', username: 'sandikodev', fullName: 'Sandiko' } }) };
          }
          return { ok: false, status: 401, text: async () => 'invalid token', json: async () => ({ message: 'invalid token' }) };
        }
        for (const [pattern, value] of api || []) {
          if (u.includes(pattern)) {
            return { ok: true, status: 200, json: async () => (typeof value === 'function' ? value() : value) };
          }
        }
        throw new Error('unexpected fetch: ' + u);
      };
      return {
        calls,
        restore: () => { globalThis.fetch = prev; },
      };
    }

    it('9a. intent without any auth → 401 (fail closed)', async () => {
      process.env.KAEDE_API_KEY = KEY;
      try {
        const res = await mcpCall('create_card', { name: 'X', listId: 'l1' });
        assert.equal(res.statusCode, 401);
      } finally {
        delete process.env.KAEDE_API_KEY;
      }
    });

    it('9b. read intent without auth → 401 (no more open reads)', async () => {
      process.env.KAEDE_API_KEY = KEY;
      try {
        const res = await mcpCall('list_boards', {});
        assert.equal(res.statusCode, 401);
      } finally {
        delete process.env.KAEDE_API_KEY;
      }
    });

    it('9c. invalid Bearer per-user token → 401', async () => {
      process.env.TRELLO_API_KEY = 'test-consumer-key';
      const stub = stubTrello();
      try {
        const res = await mcpCall('list_boards', {}, { authorization: 'Bearer invalid-token' });
        assert.equal(res.statusCode, 401);
      } finally {
        stub.restore();
        delete process.env.TRELLO_API_KEY;
      }
    });

    it('9d. valid Bearer per-user token → 200 (validated server-side, uses user token)', async () => {
      process.env.TRELLO_API_KEY = 'test-consumer-key';
      const stub = stubTrello({
        api: [['/members/me/boards', [{ id: 'b1', name: 'Sprint', closed: false }]]],
      });
      try {
        const res = await mcpCall('list_boards', {}, { authorization: 'Bearer ' + USER_TOKEN });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.equal(body.success, true);
        assert.equal(body.results.length, 1);
        assert.equal(body.results[0].id, 'b1');
        assert.equal(body.results[0].name, 'Sprint');
        const validated = stub.calls.some((u) => u.includes('/tokens/' + USER_TOKEN));
        assert.ok(validated, 'token must be validated against Trello');
      } finally {
        stub.restore();
        delete process.env.TRELLO_API_KEY;
      }
    });

    it('9e. wrong X-KAEDE-Key → 401', async () => {
      process.env.KAEDE_API_KEY = KEY;
      try {
        const res = await mcpCall('create_card', { name: 'X', listId: 'l1' }, { 'x-kaede-key': 'wrong-key' });
        assert.equal(res.statusCode, 401);
      } finally {
        delete process.env.KAEDE_API_KEY;
      }
    });

    it('9f. correct X-KAEDE-Key (integrator, service account) → proceeds to Trello', async () => {
      process.env.KAEDE_API_KEY = KEY;
      process.env.TRELLO_API_KEY = 'test-consumer-key';
      process.env.TRELLO_TOKEN = SERVICE_TOKEN;
      const stub = stubTrello({
        api: [['/lists/l1/cards', { id: 'newcard', name: 'X' }]],
      });
      try {
        const res = await mcpCall('create_card', { name: 'X', listId: 'l1' }, { 'x-kaede-key': KEY });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.equal(body.results.id, 'newcard');
        const usedService = stub.calls.some((u) => u.includes('token=' + SERVICE_TOKEN));
        assert.ok(usedService, 'integrator path must use service-account token');
      } finally {
        stub.restore();
        delete process.env.KAEDE_API_KEY;
        delete process.env.TRELLO_API_KEY;
        delete process.env.TRELLO_TOKEN;
      }
    });

    it('9g. label sync intent requires auth too', async () => {
      process.env.KAEDE_API_KEY = KEY;
      try {
        const res = await mcpCall('add_label_to_card', { cardId: 'c1', labelId: 'lbl1' });
        assert.equal(res.statusCode, 401);
      } finally {
        delete process.env.KAEDE_API_KEY;
      }
    });

    it('9h. generate_sprint_report (Trello-backed tool) requires auth', async () => {
      process.env.KAEDE_API_KEY = KEY;
      try {
        const res = await toolCall('generate_sprint_report', { boardId: 'b1' });
        assert.equal(res.statusCode, 401);
      } finally {
        delete process.env.KAEDE_API_KEY;
      }
    });

    it('9i. pure tools stay open (no Trello, no auth needed)', async () => {
      const parseRes = await toolCall('parse_playbook', { content: PLAYBOOK_SAMPLE });
      assert.equal(parseRes.statusCode, 200);
      const enforceRes = await toolCall('enforce_playbook', { playbook: PLAYBOOK_SAMPLE, plan: SAMPLE_PLAN, boards: [] });
      assert.equal(enforceRes.statusCode, 200);
      const dupRes = await toolCall('detect_duplicates', {
        boards: [{ boardId: 'b1', boardName: 'B1', lists: [{ listId: 'l1', listName: 'To Do', cards: [{ id: 'c1', name: 'A' }, { id: 'c2', name: 'A' }] }] }],
      });
      assert.equal(dupRes.statusCode, 200);
    });
  });
});
