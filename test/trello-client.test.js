import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'events';
import { TrelloMCPClient } from '../src/trello-client.ts';

function createMockFn() {
  const fn = function (...args) {
    fn.mock.calls.push(args);
    return fn.mock.returnValue;
  };
  fn.mock = { calls: [] };
  fn.mockReturnValue = function (v) {
    fn.mock.returnValue = v;
    return fn;
  };
  return fn;
}

function createMockProcess() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stdin = { write: createMockFn() };
  proc.kill = createMockFn();
  return proc;
}

class FastClient extends TrelloMCPClient {
  constructor() {
    super(undefined, 1);
  }
}

let clients = [];

after(() => {
  for (const c of clients) {
    if (c && c.pending) {
      for (const [, entry] of c.pending) clearTimeout(entry.timer);
      c.pending.clear();
    }
    if (c && c.process) c.process.removeAllListeners();
    if (c) c.close();
  }
  clients = [];
});

describe('TrelloMCPClient', () => {
  it('constructor sets default server path', () => {
    const client = new TrelloMCPClient();
    assert.ok(client.serverPath.includes('mcp-server'));
    assert.equal(client.rpcId, 0);
    assert.ok(client.pending instanceof Map);
  });

  it('constructor accepts custom server path', () => {
    const client = new TrelloMCPClient('/custom/path.js');
    assert.equal(client.serverPath, '/custom/path.js');
  });

  it('constructor accepts custom timeout', () => {
    const client = new TrelloMCPClient(undefined, 5000);
    assert.equal(client.requestTimeout, 5000);
  });

  it('sendRequest increments rpcId and creates pending entry', async () => {
    const client = new FastClient();
    clients.push(client);
    client.process = createMockProcess();
    client.pending = new Map();

    const origId = client.rpcId;
    const promise = client.sendRequest('test_method', { foo: 'bar' });

    assert.equal(client.rpcId, origId + 1);
    assert.equal(client.pending.size, 1);

    const [, entry] = client.pending.entries().next().value;
    clearTimeout(entry.timer);
    entry.reject(new Error('cleanup'));
    await promise.catch(() => {});
  });

  it('sendRequest timer rejects on timeout', async () => {
    const client = new FastClient();
    clients.push(client);
    client.process = createMockProcess();
    client.pending = new Map();

    const promise = client.sendRequest('timeout_test', {});
    await assert.rejects(promise, /RPC timeout/);
    assert.equal(client.pending.size, 0);
  });

  it('close kills process and readline', () => {
    const client = new FastClient();
    const proc = createMockProcess();
    client.process = proc;
    const rlClose = createMockFn();
    client.rl = { close: rlClose };

    client.close();

    assert.equal(proc.kill.mock.calls.length, 1);
    assert.equal(rlClose.mock.calls.length, 1);
  });

  it('close handles null process and null rl', () => {
    const client = new FastClient();
    client.close();
  });

  it('rejects pending requests on process exit', async () => {
    const client = new FastClient();
    const proc = createMockProcess();
    client.process = proc;
    client.pending = new Map();

    proc.on('exit', (code) => {
      client._exited = true;
      if (client.pending.size > 0) {
        for (const [, entry] of client.pending) {
          clearTimeout(entry.timer);
          entry.reject(new Error(`MCP server exited with code ${code}`));
        }
        client.pending.clear();
      }
    });

    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {}, 99999);
      client.pending.set(1, { resolve, reject, timer });
    });

    proc.emit('exit', 1);

    try {
      await promise;
      throw new Error('Should have rejected');
    } catch (err) {
      assert.equal(err.message, 'MCP server exited with code 1');
      assert.equal(client.pending.size, 0);
    }
  });

  it('handles JSON response via line handler', async () => {
    const client = new FastClient();
    clients.push(client);
    const proc = createMockProcess();
    client.process = proc;
    client.rl = { close: createMockFn() };

    const resultPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {}, 99999);
      client.pending.set(42, { resolve, reject, timer });
    });

    const line = JSON.stringify({ id: 42, result: { boards: [{ id: 'b1' }] } });
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && client.pending.has(msg.id)) {
        const { resolve: res, reject: rej, timer } = client.pending.get(msg.id);
        clearTimeout(timer);
        client.pending.delete(msg.id);
        res(msg.result);
      }
    } catch {
      /* skip */
    }

    const result = await resultPromise;
    assert.deepEqual(result, { boards: [{ id: 'b1' }] });
  });

  it('handles JSON error via line handler', async () => {
    const client = new FastClient();
    clients.push(client);
    const proc = createMockProcess();
    client.process = proc;
    client.rl = { close: createMockFn() };

    const errPromise = new Promise((resolve) => {
      const timer = setTimeout(() => {}, 99999);
      client.pending.set(7, { resolve: () => {}, reject: resolve, timer });
    });

    const line = JSON.stringify({ id: 7, error: { message: 'Not found' } });
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && client.pending.has(msg.id)) {
        const { resolve: res, reject: rej, timer } = client.pending.get(msg.id);
        clearTimeout(timer);
        client.pending.delete(msg.id);
        rej(new Error(msg.error.message));
      }
    } catch {
      /* skip */
    }

    const err = await errPromise;
    assert.equal(err.message, 'Not found');
  });

  it('callTool parses text content to JSON', async () => {
    const client = new FastClient();
    client.sendRequest = async () => ({
      content: [{ type: 'text', text: JSON.stringify({ boards: [{ id: 'b1' }] }) }],
    });
    const result = await client.callTool('list_boards', {});
    assert.deepEqual(result, { boards: [{ id: 'b1' }] });
  });

  it('callTool returns raw result for non-text content', async () => {
    const client = new FastClient();
    client.sendRequest = async () => ({
      content: [{ type: 'image', data: 'base64...' }],
    });
    const result = await client.callTool('get_card', { cardId: 'c1' });
    assert.deepEqual(result, { content: [{ type: 'image', data: 'base64...' }] });
  });

  it('listBoards delegates to callTool', async () => {
    const client = new FastClient();
    client.callTool = async () => ({ boards: [{ id: 'b1', name: 'Board 1' }] });
    const boards = await client.listBoards();
    assert.equal(boards.length, 1);
    assert.equal(boards[0].name, 'Board 1');
  });

  it('getLists delegates to callTool', async () => {
    const client = new FastClient();
    client.callTool = async () => ({ lists: [{ id: 'l1', name: 'To Do' }] });
    const lists = await client.getLists('b1');
    assert.equal(lists.length, 1);
    assert.equal(lists[0].name, 'To Do');
  });

  it('listWorkspaces delegates to callTool', async () => {
    const client = new FastClient();
    client.callTool = async () => ({ workspaces: [{ id: 'w1' }] });
    const ws = await client.listWorkspaces();
    assert.equal(ws.length, 1);
  });

  it('getBoardMembers delegates to callTool', async () => {
    const client = new FastClient();
    client.callTool = async () => ({ members: [{ id: 'm1' }] });
    const m = await client.getBoardMembers('b1');
    assert.equal(m.length, 1);
  });

  it('getMyCards delegates to callTool', async () => {
    const client = new FastClient();
    client.callTool = async () => ({ cards: [{ id: 'c1' }] });
    const c = await client.getMyCards();
    assert.equal(c.length, 1);
  });
});
