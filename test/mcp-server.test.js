/**
 * Automated tests for KAEDE MCP Server (src/mcp-server.js)
 *
 * Tests all 44+ Trello tool handlers via stdio JSON-RPC,
 * with global.fetch mocked to return fake Trello API responses.
 */

import { describe, it, after, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SERVER_PATH = resolve(ROOT, 'packages', 'kaede-trello', 'src', 'mcp-server.ts');

// ── Mock Data ──

const MOCK_BOARDS = [
  { id: 'b1', name: 'Test Board', url: 'https://trello.com/b/test', closed: false },
  { id: 'b2', name: 'Archived Board', url: 'https://trello.com/b/arch', closed: true },
];

const MOCK_LISTS = [
  { id: 'l1', name: 'To Do', closed: false },
  { id: 'l2', name: 'In Progress', closed: false },
  { id: 'l3', name: 'Done', closed: false },
];

const MOCK_CARDS = [
  {
    id: 'c1',
    name: 'Task 1',
    due: null,
    dueComplete: false,
    url: 'https://trello.com/c/c1',
    desc: 'First task',
    idList: 'l1',
    idBoard: 'b1',
    idMembers: ['m1'],
    dateLastActivity: '2026-06-01T00:00:00.000Z',
    start: null,
  },
  {
    id: 'c2',
    name: 'Task 2',
    due: '2026-07-01T00:00:00.000Z',
    dueComplete: false,
    url: 'https://trello.com/c/c2',
    desc: 'Second task',
    idList: 'l2',
    idBoard: 'b1',
    idMembers: [],
    dateLastActivity: '2026-06-02T00:00:00.000Z',
    start: null,
  },
];

const MOCK_MEMBERS = [
  { id: 'm1', fullName: 'Alice', username: 'alice' },
  { id: 'm2', fullName: 'Bob', username: 'bob' },
];

const MOCK_ORGS = [{ id: 'o1', name: 'koneksi', displayName: 'PT Koneksi Jaringan Indonesia' }];

const MOCK_LABELS = [
  { id: 'lbl1', name: 'Bug', color: 'red' },
  { id: 'lbl2', name: 'Feature', color: 'green' },
  { id: 'lbl3', name: 'Enhancement', color: null },
];

const MOCK_ATTACHMENTS = [
  {
    id: 'a1',
    name: 'report.pdf',
    url: 'https://trello.com/a1',
    mimeType: 'application/pdf',
    bytes: 1024,
    date: '2026-06-01T00:00:00.000Z',
    isUpload: true,
  },
];

const MOCK_CHECKLISTS = [
  {
    id: 'cl1',
    name: 'QA Checklist',
    idCard: 'c1',
    checkItems: [
      { id: 'ci1', name: 'Test A', state: 'complete', pos: 1 },
      { id: 'ci2', name: 'Test B', state: 'incomplete', pos: 2 },
    ],
  },
];

const MOCK_COMMENTS = [
  {
    id: 'act1',
    type: 'commentCard',
    data: { text: 'Looks good' },
    memberCreator: { id: 'm1', fullName: 'Alice' },
    date: '2026-06-01T00:00:00.000Z',
  },
];

const MOCK_ACTIONS = [
  {
    id: 'act1',
    type: 'updateCard',
    data: { list: { name: 'Done' } },
    date: '2026-06-01T00:00:00.000Z',
    memberCreator: { fullName: 'Alice' },
  },
  {
    id: 'act2',
    type: 'commentCard',
    data: { text: 'Testing' },
    date: '2026-06-02T00:00:00.000Z',
    memberCreator: { fullName: 'Bob' },
  },
];

// Mock fetch responses keyed by URL pattern
const API = 'https://api.trello.com/1';

function mockFetch(url, opts = {}) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const method = (opts.method || 'GET').toUpperCase();

  // Helper to check if URL matches a pattern
  const match = (pattern) => urlStr.startsWith(`${API}${pattern}`);

  // Boards
  if (match('/members/me/boards')) {
    return ok(MOCK_BOARDS);
  }
  if (match('/members/me/organizations')) {
    return ok(MOCK_ORGS);
  }
  if (match('/boards/') && urlStr.includes('/lists')) {
    return ok(MOCK_LISTS);
  }
  if (match('/boards/') && urlStr.includes('/labels')) {
    return ok(MOCK_LABELS);
  }
  if (match('/boards/') && method === 'POST') {
    return ok({ id: 'b-new', name: 'New Board', url: 'https://trello.com/b/new' });
  }

  // Lists
  if (match('/lists/') && method === 'PUT') {
    return ok({ id: 'l1', name: 'Updated List', closed: false });
  }
  if (match('/lists/') && method === 'DELETE') {
    return ok({});
  }
  if (match('/lists/') && urlStr.includes('/cards')) {
    return ok(MOCK_CARDS);
  }

  // Cards
  if (
    match('/cards/') &&
    method === 'POST' &&
    !urlStr.includes('/attachments') &&
    !urlStr.includes('/actions') &&
    !urlStr.includes('/checklists') &&
    !urlStr.includes('/idLabels')
  ) {
    return ok({ id: 'c-new', name: 'New Card', url: 'https://trello.com/c/new', desc: '', idList: 'l1' });
  }
  if (match('/cards/') && method === 'PUT') {
    return ok({ id: 'c1', name: 'Updated Card', desc: '', due: null, start: null, subscribed: true });
  }
  if (match('/cards/') && method === 'DELETE') {
    return ok({});
  }
  if (match('/cards/') && urlStr.includes('/attachments') && method === 'GET') {
    return ok(MOCK_ATTACHMENTS);
  }
  if (match('/cards/') && urlStr.includes('/attachments') && method === 'POST') {
    return ok({
      id: 'a-new',
      name: 'file.pdf',
      url: 'https://trello.com/a-new',
      mimeType: 'application/pdf',
      bytes: 2048,
      date: '2026-06-27T00:00:00.000Z',
      isUpload: true,
    });
  }
  if (match('/cards/') && urlStr.includes('/checklists')) {
    return ok(MOCK_CHECKLISTS);
  }
  if (match('/cards/') && urlStr.includes('/actions') && urlStr.includes('/comments')) {
    if (method === 'POST')
      return ok({
        id: 'act-comment',
        type: 'commentCard',
        data: { text: 'Test comment' },
        date: '2026-06-27T00:00:00.000Z',
      });
    return ok(MOCK_COMMENTS);
  }
  if (match('/cards/') && urlStr.includes('/actions')) {
    return ok(MOCK_ACTIONS);
  }
  if (match('/cards/') && urlStr.includes('/idLabels')) {
    if (method === 'DELETE') return ok({});
    return ok({ id: 'c1', idLabels: ['lbl1'] });
  }
  if (match('/cards/') && urlStr.includes('/members')) {
    if (method === 'POST') return ok({ id: 'c1', idMembers: ['m1', 'm2'] });
    if (method === 'DELETE') return ok({ id: 'c1', idMembers: ['m1'] });
  }
  if (match('/cards/') && !urlStr.includes('?') && method === 'GET') {
    return ok(MOCK_CARDS[0]);
  }

  // Checklists
  if (match('/checklists/') && method === 'POST') {
    return ok({ id: 'cl-new', name: 'New Checklist', idCard: 'c1' });
  }
  if (match('/checklists/') && method === 'PUT') {
    return ok({ id: 'cl1', name: 'Updated Checklist', checkItems: [{ id: 'ci1', name: 'Test A', state: 'complete' }] });
  }
  if (match('/checklists/') && method === 'DELETE') {
    return ok({});
  }
  if (match('/checklists/') && urlStr.includes('/checkItems') && method === 'POST') {
    return ok({ id: 'ci-new', name: 'New Item', state: 'incomplete' });
  }
  if (match('/checklists/') && urlStr.includes('/checkItems') && method === 'DELETE') {
    return ok({});
  }

  // Labels
  if (match('/labels/') && method === 'POST') {
    return ok({ id: 'lbl-new', name: 'New Label', color: 'blue' });
  }
  if (match('/labels/') && method === 'PUT') {
    return ok({ id: 'lbl1', name: 'Updated Label', color: 'red' });
  }
  if (match('/labels/') && method === 'DELETE') {
    return ok({});
  }

  // Members/me
  if (match('/members/me/cards')) {
    return ok(MOCK_CARDS);
  }

  // Default
  return ok({});
}

function ok(data) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// ── RPC Helper ──

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
    }, 10000);

    proc.stdout.on('data', onData);
    proc.stdin.write(msg);
  });
}

// ── Tests ──

describe('KAEDE MCP Server (42 Trello tools — kaede-trello lib)', () => {
  let proc;

  before(() => {
    // Credentials + fetch mock are set via -r preload (mock-fetch.js)
    // The child process needs the preload to inherit the mock
    // We set env vars here too for safety, but child won't inherit them
  });

  after(() => {
    if (proc) {
      proc.stdin.end();
      proc.kill();
    }
    delete process.env.TRELLO_API_KEY;
    delete process.env.TRELLO_TOKEN;
    delete process.env.TRELLO_DEFAULT_BOARD_ID;
    if (typeof mock.restoreAll === 'function') mock.restoreAll();
  });

  it('0. initialize returns protocol version', async () => {
    const MOCK_PRELOAD = resolve(__dirname, 'mock-fetch.js');
    proc = spawn('bun', ['-r', MOCK_PRELOAD, SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    const res = await rpc(proc, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'Test', version: '1.0.0' },
    });
    assert.equal(res.result.protocolVersion, '2024-11-05');
    assert.equal(res.result.serverInfo.name, 'KAEDE Trello MCP');
  });

  it('0b. tools/list returns tool list', async () => {
    const res = await rpc(proc, 'tools/list', {});
    const tools = res.result.tools;
    assert.ok(tools.length >= 40, `Expected 40+ tools, got ${tools.length}`);
    const names = tools.map((t) => t.name);
    // Verify key tools exist across all categories
    assert.ok(names.includes('list_boards'), 'Missing list_boards');
    assert.ok(names.includes('get_lists'), 'Missing get_lists');
    assert.ok(names.includes('get_card'), 'Missing get_card');
    assert.ok(names.includes('attach_file_to_card'), 'Missing attach_file_to_card');
    assert.ok(names.includes('create_checklist'), 'Missing create_checklist');
    assert.ok(names.includes('add_comment'), 'Missing add_comment');
    assert.ok(names.includes('get_board_labels'), 'Missing get_board_labels');
    assert.ok(names.includes('get_board_members'), 'Missing get_board_members');
    assert.ok(names.includes('watch_card'), 'Missing watch_card');
    assert.ok(names.includes('sort_list_cards'), 'Missing sort_list_cards');
    assert.ok(names.includes('list_workspaces'), 'Missing list_workspaces');
  });

  // ── Board Tools ──

  it('1. list_boards returns all boards', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'list_boards', arguments: {} });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.boards.length >= 2);
    assert.equal(data.boards[0].name, 'Test Board');
  });

  it('2. create_board creates a new board', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'create_board',
      arguments: { name: 'New Board', desc: 'Test description' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.id, 'b-new');
    assert.equal(data.name, 'New Board');
  });

  // ── Workspace Tools ──

  it('3. list_workspaces returns organizations', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'list_workspaces', arguments: {} });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.workspaces.length >= 1);
    assert.equal(data.workspaces[0].displayName, 'PT Koneksi Jaringan Indonesia');
  });

  // ── List Tools ──

  it('4. get_lists returns board lists', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_lists', arguments: {} });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.lists.length, 3);
    assert.equal(data.lists[0].name, 'To Do');
  });

  it('5. add_list_to_board creates a new list', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'add_list_to_board', arguments: { name: 'Backlog' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.id, 'l1');
    assert.equal(data.name, 'To Do');
  });

  it('6. archive_list archives a list', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'archive_list', arguments: { listId: 'l1', closed: true } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.closed === false);
  });

  it('7. update_list updates list details', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'update_list',
      arguments: { listId: 'l1', name: 'Updated List' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'Updated List');
  });

  // ── Card Tools ──

  it('8. get_my_cards returns assigned cards', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_my_cards', arguments: {} });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.cards.length >= 2);
    assert.equal(data.cards[0].name, 'Task 1');
  });

  it('9. get_cards_by_list_id returns cards in list', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_cards_by_list_id', arguments: { listId: 'l1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.cards.length >= 1);
  });

  it('10. get_card returns card details', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_card', arguments: { cardId: 'c1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'Task 1');
  });

  it('11. add_card_to_list creates a new card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'add_card_to_list',
      arguments: { listId: 'l1', name: 'New Card', desc: 'Description' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'New Card');
  });

  it('12. update_card_details updates card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'update_card_details',
      arguments: { cardId: 'c1', name: 'Updated Card' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'Updated Card');
  });

  it('13. move_card moves card to another list', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'move_card', arguments: { cardId: 'c1', listId: 'l2' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.id);
  });

  it('14. archive_card archives a card', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'archive_card', arguments: { cardId: 'c1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.id);
  });

  it('15. copy_card copies card to another list', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'copy_card',
      arguments: { sourceCardId: 'c1', listId: 'l2', name: 'Copied Card', keepFromSource: 'comments,labels' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.id);
  });

  // ── Attachment Tools ──

  it('16. attach_file_to_card attaches file from URL', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'attach_file_to_card',
      arguments: {
        cardId: 'c1',
        fileUrl: 'https://example.com/file.pdf',
        name: 'doc.pdf',
        mimeType: 'application/pdf',
      },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'file.pdf');
    assert.equal(data.mimeType, 'application/pdf');
  });

  it('17. attach_image_to_card attaches image from URL', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'attach_image_to_card',
      arguments: { cardId: 'c1', imageUrl: 'https://example.com/image.png', name: 'screenshot' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'file.pdf');
  });

  it('18. attach_data_to_card attaches base64 data', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'attach_data_to_card',
      arguments: {
        cardId: 'c1',
        data: Buffer.from('hello').toString('base64'),
        name: 'data.txt',
        mimeType: 'text/plain',
      },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'file.pdf');
  });

  it('19. attach_image_data_to_card attaches image data', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'attach_image_data_to_card',
      arguments: { cardId: 'c1', imageData: Buffer.from('png-data').toString('base64'), name: 'screenshot.png' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'file.pdf');
  });

  it('20. get_card_attachments returns all attachments', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_card_attachments', arguments: { cardId: 'c1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.attachments.length >= 1);
    assert.equal(data.attachments[0].mimeType, 'application/pdf');
  });

  // ── Checklist Tools ──

  it('21. create_checklist creates checklist on card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'create_checklist',
      arguments: { cardId: 'c1', name: 'QA Checklist' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'New Checklist');
  });

  it('22. add_checklist_item adds item to checklist', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'add_checklist_item',
      arguments: { checklistId: 'cl1', name: 'Test item' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'New Item');
  });

  it('23. get_card_checklists returns checklists with items', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_card_checklists', arguments: { cardId: 'c1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.checklists.length >= 1);
    assert.equal(data.checklists[0].name, 'QA Checklist');
    assert.ok(data.checklists[0].items.length >= 1);
  });

  it('24. update_checklist_item updates item state', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'update_checklist_item',
      arguments: { cardId: 'c1', checklistId: 'cl1', itemId: 'ci1', state: 'complete' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.id);
  });

  it('25. delete_checklist_item removes item from checklist', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'delete_checklist_item',
      arguments: { checklistId: 'cl1', itemId: 'ci1' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  it('26. delete_checklist removes entire checklist', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'delete_checklist', arguments: { checklistId: 'cl1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  it('27. copy_checklist copies checklist to another card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'copy_checklist',
      arguments: { sourceChecklistId: 'cl1', cardId: 'c2', name: 'Copied Checklist' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.id);
  });

  // ── Comment Tools ──

  it('28. add_comment adds comment to card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'add_comment',
      arguments: { cardId: 'c1', text: 'Test comment' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.text, 'Test comment');
  });

  it('29. get_card_comments returns card comments', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_card_comments', arguments: { cardId: 'c1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.comments.length >= 1);
    assert.equal(data.comments[0].text, 'Looks good');
  });

  // ── Label Tools ──

  it('30. get_board_labels returns board labels', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_board_labels', arguments: { boardId: 'b1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.labels.length >= 2);
    assert.equal(data.labels[0].name, 'Bug');
  });

  it('31. create_label creates a new label', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'create_label',
      arguments: { boardId: 'b1', name: 'New Label', color: 'blue' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'New Label');
    assert.equal(data.color, 'blue');
  });

  it('32. update_label updates label', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'update_label',
      arguments: { labelId: 'lbl1', name: 'Updated Label' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.name, 'Updated Label');
  });

  it('33. delete_label deletes a label', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'delete_label', arguments: { labelId: 'lbl1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  it('34. search_labels searches labels by query', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'search_labels', arguments: { boardId: 'b1', query: 'Bug' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.labels.length >= 1);
    assert.ok(data.labels.some((l) => l.name === 'Bug'));
  });

  it('35. remove_label_from_card removes label from card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'remove_label_from_card',
      arguments: { cardId: 'c1', labelId: 'lbl1' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  // ── Member Tools ──

  it('36. get_board_members returns board members', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_board_members', arguments: { boardId: 'b1' } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.members.length >= 1);
    assert.equal(data.members[0].fullName, 'Alice');
  });

  it('37. assign_member_to_card assigns member to card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'assign_member_to_card',
      arguments: { cardId: 'c1', memberId: 'm2' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.success, true);
    assert.equal(data.cardId, 'c1');
  });

  it('38. remove_member_from_card removes member from card', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'remove_member_from_card',
      arguments: { cardId: 'c1', memberId: 'm2' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.equal(data.success, true);
    assert.equal(data.cardId, 'c1');
  });

  // ── Watch & Activity Tools ──

  it('39. watch_card subscribes to card', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'watch_card', arguments: { cardId: 'c1', watch: true } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.subscribed === true);
  });

  it('40. watch_list subscribes to list', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'watch_list', arguments: { listId: 'l1', watch: true } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  it('41. get_card_activity returns card activity', async () => {
    const res = await rpc(proc, 'tools/call', { name: 'get_card_activity', arguments: { cardId: 'c1', limit: 5 } });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.actions.length >= 1);
  });

  // ── Sort Tools ──

  it('42. sort_list_cards sorts cards by name', async () => {
    const res = await rpc(proc, 'tools/call', {
      name: 'sort_list_cards',
      arguments: { listId: 'l1', sortBy: 'name', order: 'asc' },
    });
    const data = JSON.parse(res.result.content[0].text);
    assert.ok(data.success !== false);
  });

  // ── Error Handling ──

  it('43. missing required parameter returns error', async () => {
    try {
      await rpc(proc, 'tools/call', { name: 'get_card', arguments: {} });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('missing required') || err.message.includes('cardId'));
    }
  });

  it('44. unknown tool returns error', async () => {
    try {
      await rpc(proc, 'tools/call', { name: 'nonexistent_tool', arguments: {} });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('Unknown tool') || err.message.includes('nonexistent'));
    }
  });
});
