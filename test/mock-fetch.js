/**
 * Fetch mock preload — set env vars + mock global.fetch
 * Load with: bun -r ./test/mock-fetch.js
 *
 * Uses URL pathname-based matching to handle Trello API routes correctly
 * regardless of query string ordering or trailing slash variations.
 * Routes are ordered from most-specific to most-general.
 */

// Set mock credentials
process.env.TRELLO_API_KEY = 'mock-key';
process.env.TRELLO_TOKEN = 'mock-token';
process.env.TRELLO_DEFAULT_BOARD_ID = 'b1';

const API_BASE = 'https://api.trello.com/1';

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
const MOCK_ORG = { id: 'o1', name: 'koneksi', displayName: 'PT Koneksi Jaringan Indonesia' };
const MOCK_MEMBERS = [
  { id: 'm1', fullName: 'Alice', username: 'alice' },
  { id: 'm2', fullName: 'Bob', username: 'bob' },
];
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

/**
 * Parse the URL and derive the normalized Trello resource path.
 * Returns the pathname stripped of the API version prefix (/1/).
 * e.g., https://api.trello.com/1/boards/b1/lists?key=... → /boards/b1/lists
 */
function getPath(urlStr) {
  try {
    const parsed = new URL(urlStr);
    // pathname is like /1/boards or /1/cards/c1
    // Strip the /1/ prefix
    return parsed.pathname.replace(/^\/1(?:\/|$)/, '/');
  } catch {
    return null;
  }
}

function mockFetch(url, opts = {}) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const method = (opts.method || 'GET').toUpperCase();
  const path = getPath(urlStr);
  if (!path) return ok({});

  //---- Boards & Members ----
  if (path === '/members/me/boards' && method === 'GET') return ok(MOCK_BOARDS);
  if (path === '/members/me/organizations' && method === 'GET') return ok([MOCK_ORG]);
  if (path === '/members/me/cards' && method === 'GET') return ok(MOCK_CARDS);

  //---- Board sub-routes (more specific first) ----
  if (path.match(/^\/boards\/[^/]+\/lists$/) && method === 'POST') return ok(MOCK_LISTS[0]); // add_list_to_board
  if (path.match(/^\/boards\/[^/]+\/lists$/) && method === 'GET') return ok(MOCK_LISTS);
  if (path.match(/^\/boards\/[^/]+\/labels$/) && method === 'GET') return ok(MOCK_LABELS);
  if (path.match(/^\/boards\/[^/]+\/labels$/) && method === 'POST')
    return ok({ id: 'lbl-new', name: 'New Label', color: 'blue' });
  if (path.match(/^\/boards\/[^/]+\/members$/) && method === 'GET') return ok(MOCK_MEMBERS);
  if (path === '/boards' && method === 'POST')
    return ok({ id: 'b-new', name: 'New Board', url: 'https://trello.com/b/new' }); // create_board

  //---- Lists ----
  if (path.match(/^\/lists\/[^/]+\/cards$/) && method === 'GET') return ok(MOCK_CARDS);
  if (path.match(/^\/lists\/[^/]+$/) && method === 'PUT')
    return ok({ id: 'l1', name: 'Updated List', closed: false, subscribed: true });
  if (path.match(/^\/lists\/[^/]+$/) && method === 'DELETE') return ok({});

  //---- Card sub-routes (more specific first) ----
  if (path.match(/^\/cards\/[^/]+\/attachments$/)) {
    if (method === 'GET') return ok(MOCK_ATTACHMENTS);
    if (method === 'POST')
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
  if (path.match(/^\/cards\/[^/]+\/checklists$/)) {
    if (method === 'GET') return ok(MOCK_CHECKLISTS);
    if (method === 'POST') return ok({ id: 'cl-new', name: 'New Checklist', idCard: 'c1' });
  }
  if (path.match(/^\/cards\/[^/]+\/actions\/comments$/)) {
    if (method === 'POST')
      return ok({
        id: 'act-comment',
        type: 'commentCard',
        data: { text: 'Test comment' },
        date: '2026-06-27T00:00:00.000Z',
      });
    if (method === 'GET') return ok(MOCK_COMMENTS);
  }
  if (path.match(/^\/cards\/[^/]+\/actions$/) && method === 'GET') return ok(MOCK_COMMENTS);
  if (path.match(/^\/cards\/[^/]+\/idLabels\/[^/]+$/) && method === 'DELETE') return ok({});
  if (path.match(/^\/cards\/[^/]+\/idLabels$/)) {
    if (method === 'POST') return ok({ id: 'c1', idLabels: ['lbl1'] });
    if (method === 'GET') return ok({ id: 'c1', idLabels: ['lbl1'] });
  }
  if (path.match(/^\/cards\/[^/]+\/members$/) && method === 'POST') return ok({ id: 'c1', idMembers: ['m1', 'm2'] });
  if (path.match(/^\/cards\/[^/]+\/members\/[^/]+$/) && method === 'DELETE') return ok({ id: 'c1', idMembers: ['m1'] });
  if (path.match(/^\/cards\/[^/]+\/checkItem\/[^/]+$/) && method === 'PUT')
    return ok({ id: 'ci1', name: 'Updated Item', state: 'complete', pos: 1 });

  //---- Card CRUD (exact /cards or /cards/{id}) ----
  if (path === '/cards' || path.match(/^\/cards\/[^/]+$/)) {
    if (method === 'GET') return ok(MOCK_CARDS[0]);
    if (method === 'POST')
      return ok({
        id: 'c-new',
        name: 'New Card',
        url: 'https://trello.com/c/new',
        desc: '',
        idList: 'l1',
        idBoard: 'b1',
      });
    if (method === 'PUT')
      return ok({ id: 'c1', name: 'Updated Card', desc: '', due: null, start: null, subscribed: true });
    if (method === 'DELETE') return ok({});
  }

  //---- Checklists ----
  if (path.match(/^\/checklists\/[^/]+\/checkItems$/)) {
    if (method === 'GET') return ok(MOCK_CHECKLISTS[0].checkItems);
    if (method === 'POST') return ok({ id: 'ci-new', name: 'New Item', state: 'incomplete' });
    if (method === 'DELETE') return ok({});
  }
  if (path.match(/^\/checklists\/[^/]+$/)) {
    if (method === 'GET') return ok(MOCK_CHECKLISTS[0]);
    if (method === 'POST') return ok({ id: 'cl-new', name: 'New Checklist', idCard: 'c1' });
    if (method === 'PUT') return ok({ id: 'cl1', name: 'Updated Checklist', checkItems: [] });
    if (method === 'DELETE') return ok({});
  }

  //---- Labels ----
  if (path.match(/^\/labels\/[^/]+$/)) {
    if (method === 'PUT') return ok({ id: 'lbl1', name: 'Updated Label', color: 'red' });
    if (method === 'DELETE') return ok({});
  }

  // Default fallback
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

global.fetch = mockFetch;
