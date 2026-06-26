import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SERVER_PATH = resolve(ROOT, 'src', 'kaede-mcp-server.js');

function rpc(proc, method, params = {}) {
  return new Promise((resolveMsg, reject) => {
    const id = Math.floor(Math.random() * 99999) + 1;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    let buffer = '';
    let done = false;

    const onData = (chunk) => {
      if (done) return;
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          if (response.id === id) {
            done = true;
            proc.stdout.removeListener('data', onData);
            if (response.error) reject(new Error(response.error.message));
            else resolveMsg(response);
          }
        } catch {}
      }
    };

    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        proc.stdout.removeListener('data', onData);
        reject(new Error('RPC timeout'));
      }
    }, 5000);

    proc.stdout.on('data', onData);
    proc.stdin.write(msg);
  });
}

const PLAYBOOK_SAMPLE = `# Sprint Alpha

## Peran Tim

### PM
- **Tanggung jawab**: Sprint planning
- **Akses**: Admin

## Workflow Sprint

- **Backlog**
- **To Do**
- **In Progress**
- **Done**

## Konvensi

\`feat:\` \`fix:\`
**Merah**: Bug / critical
**Hijau**: Task selesai
`;

describe('kaede-mcp-server (via stdio RPC)', () => {
  let proc;

  it('1. initialize returns protocol version', async () => {
    proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    const res = await rpc(proc, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'Test', version: '1.0.0' },
    });
    assert.equal(res.result.protocolVersion, '2024-11-05');
    assert.equal(res.result.serverInfo.name, 'KAEDE Orchestrator MCP');
  });

  it('2. tools/list returns 4 tools', async () => {
    const res = await rpc(proc, 'tools/list', {});
    const tools = res.result.tools;
    const names = tools.map(t => t.name).sort();
    assert.deepEqual(names, ['bundle_context', 'generate_plan', 'parse_playbook', 'status']);
  });

  it('3. parse_playbook tool works', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'parse_playbook',
      arguments: { content: PLAYBOOK_SAMPLE },
    });
    const text = JSON.parse(res.result.content[0].text);
    assert.equal(text.title, 'Sprint Alpha');
    assert.equal(text.roles.length, 1);
    assert.deepEqual(text.workflow.lists, ['Backlog', 'To Do', 'In Progress', 'Done']);
    assert.equal(text.conventions.labels.length, 2);
  });

  it('4. generate_plan "mulai sprint" creates list creation steps', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'generate_plan',
      arguments: { goal: 'Mulai Sprint Alpha', playbook: PLAYBOOK_SAMPLE },
    });
    const { plan } = JSON.parse(res.result.content[0].text);
    assert.equal(plan.length, 4);
    assert.equal(plan[0].action, 'create_list');
    assert.equal(plan[0].params.name, 'Backlog');
    assert.equal(plan[3].params.name, 'Done');
  });

  it('5. generate_plan "buat card" creates card step', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'generate_plan',
      arguments: { goal: 'buat card', playbook: PLAYBOOK_SAMPLE, task: 'Login page', list: 'To Do' },
    });
    const { plan } = JSON.parse(res.result.content[0].text);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].action, 'create_card');
    assert.equal(plan[0].params.name, 'Login page');
    assert.equal(plan[0].params.listName, 'To Do');
  });

  it('6. generate_plan unknown intent returns error step', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'generate_plan',
      arguments: { goal: 'do something weird', playbook: PLAYBOOK_SAMPLE },
    });
    const { plan } = JSON.parse(res.result.content[0].text);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].success, false);
    assert.equal(plan[0].action, 'unknown_intent');
  });

  it('7. status returns server info', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'status',
      arguments: {},
    });
    const text = JSON.parse(res.result.content[0].text);
    assert.equal(text.server.name, 'KAEDE Orchestrator MCP');
    assert.equal(text.server.version, '1.0.0');
  });

  it('8. unknown tool returns error', async () => {
    try {
      await rpc(proc, 'tools/call', { name: 'nonexistent_tool', arguments: {} });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('Unknown tool'));
    }
  });

  it('9. unknown method returns error', async () => {
    try {
      await rpc(proc, 'some_unknown_method', {});
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('Method not found'));
    }
  });

  after(() => {
    if (proc) {
      proc.stdin.end();
      proc.kill();
    }
  });
});

describe('generatePlan (direct imports)', () => {
  it('parses playbook then generates plan for "mulai sprint"', async () => {
    const { parsePlaybook, generatePlan } = await import('../src/orchestrator.js');
    const pb = parsePlaybook(PLAYBOOK_SAMPLE);
    const plan = generatePlan('Mulai Sprint Alpha', pb);
    assert.equal(plan.length, 4);
    assert.equal(plan[0].action, 'create_list');
    assert.equal(plan[0].params.name, 'Backlog');
    assert.equal(plan[0].description, 'Buat list "Backlog"');
  });

  it('generates plan for "buat board"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('buat board', pb, { name: 'Sprint 2' });
    assert.equal(plan.length, 1);
    assert.equal(plan[0].action, 'create_board');
    assert.equal(plan[0].params.name, 'Sprint 2');
  });

  it('generates plan for "assign"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('tugaskan', pb, { cardId: 'c1', memberId: 'm1' });
    assert.equal(plan.length, 1);
    assert.equal(plan[0].action, 'assign_member');
    assert.equal(plan[0].params.cardId, 'c1');
    assert.equal(plan[0].params.memberId, 'm1');
  });

  it('generates plan for "buat label"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('buat label merah', pb, { name: 'Bug', color: 'merah' });
    assert.equal(plan[0].action, 'create_label');
    assert.equal(plan[0].params.color, 'merah');
  });

  it('generates plan for "arsipkan"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('arsipkan card', pb, { cardId: 'c123' });
    assert.equal(plan[0].action, 'archive_card');
    assert.equal(plan[0].params.cardId, 'c123');
  });

  it('generates plan for "komentar"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('tambah komentar', pb, { cardId: 'c1', text: 'Done' });
    assert.equal(plan[0].action, 'add_comment');
    assert.equal(plan[0].params.text, 'Done');
  });

  it('generates plan for "pindah"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('pindahkan card', pb, { cardId: 'c1', listName: 'Done' });
    assert.equal(plan[0].action, 'move_card');
    assert.equal(plan[0].params.listName, 'Done');
  });

  it('generates plan for "pindah semua"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('pindah semua', pb, { dari: 'To Do', ke: 'In Progress' });
    assert.equal(plan[0].action, 'move_all_cards');
    assert.equal(plan[0].params.fromListName, 'To Do');
    assert.equal(plan[0].params.toListName, 'In Progress');
  });

  it('generates plan for "tutup sprint"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('close sprint', pb);
    assert.equal(plan[0].action, 'close_sprint');
  });

  it('generates plan for "buat checklist"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('buat checklist', pb, { cardId: 'c1', name: 'QA', items: ['Test A', 'Test B'] });
    assert.equal(plan[0].action, 'create_checklist');
    assert.equal(plan[0].params.name, 'QA');
  });

  it('generates plan for "report"', async () => {
    const { generatePlan } = await import('../src/orchestrator.js');
    const pb = { title: '', roles: [], workflow: { lists: [] }, conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] } };
    const plan = generatePlan('my cards', pb);
    assert.equal(plan[0].action, 'report');
  });
});
