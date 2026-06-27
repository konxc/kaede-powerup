import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlaybook, executeIntent } from '../src/orchestrator.js';

class MockClient {
  constructor() {
    this.lists = [];
    this.cards = [];
    this.members = [];
    this.comments = [];
    this.nextId = 1;
  }

  async connect() {}
  close() {}

  async callTool(name, args) {
    switch (name) {
      case 'list_boards':
        return { boards: [{ id: 'b1', name: 'Test Board' }] };
      case 'get_lists':
        return { lists: this.lists.filter(l => l.boardId === args.boardId) };
      case 'get_cards_by_list_id':
        return { cards: this.cards.filter(c => c.listId === args.listId) };
      case 'archive_card':
        this.cards = this.cards.filter(c => c.id !== args.cardId);
        return { success: true };
      case 'move_card':
        const card = this.cards.find(c => c.id === args.cardId);
        if (card) card.listId = args.listId;
        return { success: true };
      case 'add_comment':
        this.comments.push({ cardId: args.cardId, text: args.text });
        return { success: true };
      case 'list_workspaces':
        return { workspaces: [{ id: 'w1', name: 'Test' }] };
      case 'get_board_members':
        return { members: this.members };
      case 'get_my_cards':
        return { cards: this.cards };
      case 'get_cards_by_list_id':
        return { cards: this.cards.filter(c => c.listId === args.listId) };
      default:
        return {};
    }
  }

  async createList(boardId, name) {
    const list = { id: `l${this.nextId++}`, name, boardId, closed: false };
    this.lists.push(list);
    return list;
  }

  async getLists(boardId) {
    return this.lists.filter(l => l.boardId === boardId);
  }

  async getBoardMembers(boardId) {
    return this.members;
  }

  async createCard(listId, name, description) {
    const card = { id: `c${this.nextId++}`, name, desc: description, listId };
    this.cards.push(card);
    return card;
  }

  async assignMember(cardId, memberId) {
    this.members.push({ cardId, memberId });
    return { success: true };
  }

  async listBoards() {
    return [{ id: 'b1', name: 'Test Board' }];
  }

  async getMyCards() {
    return this.cards;
  }

  async getCardsByListId(listId, boardId) {
    return this.cards.filter(c => c.listId === listId);
  }

  // ── New handlers support ──

  async createBoard(name, opts) {
    const board = { id: `b${this.nextId++}`, name };
    return board;
  }

  async createLabel(boardId, name, color) {
    const label = { id: `lbl${this.nextId++}`, name, color, boardId };
    return label;
  }

  async archiveCard(cardId) {
    this.cards = this.cards.filter(c => c.id !== cardId);
    return { success: true };
  }

  async removeMember(cardId, memberId) {
    return { success: true };
  }

  async addLabelToCard(cardId, labelId) {
    return { success: true };
  }

  async archiveList(listId) {
    const list = this.lists.find(l => l.id === listId);
    if (list) list.closed = true;
    return { success: true };
  }

  async createChecklist(cardId, name) {
    const checklist = { id: `cl${this.nextId++}`, name, cardId, items: [] };
    this.checklists = this.checklists || [];
    this.checklists.push(checklist);
    return { id: checklist.id, name: checklist.name };
  }

  async addChecklistItem(checklistId, name, checked) {
    const item = { id: `ci${this.nextId++}`, name, checked: !!checked };
    this.checklistItems = this.checklistItems || [];
    this.checklistItems.push(item);
    return { id: item.id, name: item.name };
  }

  async updateCard(cardId, updates) {
    const card = this.cards.find(c => c.id === cardId);
    if (card) Object.assign(card, updates);
    return { success: true };
  }
}

const PLAYBOOK = `# Sprint Alpha

## Peran Tim

### PM
- **Tanggung jawab**: Sprint planning
- **Akses**: Admin
- **AI Instructions**: Bantu planning

### Developer
- **Tanggung jawab**: Coding
- **Akses**: Write

## Workflow Sprint

- **Backlog**: Ide mentah
- **To Do**: Siap dikerjakan
- **In Progress**: Sedang dikerja
- **Done**: Selesai

## Konvensi

\`feat:\` \`fix:\`
**Merah**: Bug / critical
**Hijau**: Task selesai
`;

describe('E2E: parsePlaybook → executeIntent (Mocked MCP)', () => {
  let pb;

  it('1. parsePlaybook produces correct structure', () => {
    pb = parsePlaybook(PLAYBOOK);
    assert.equal(pb.title, 'Sprint Alpha');
    assert.equal(pb.roles.length, 2);
    assert.deepEqual(pb.workflow.lists, ['Backlog', 'To Do', 'In Progress', 'Done']);
    assert.equal(pb.conventions.labels.length, 2);
    assert.equal(pb.conventions.titlePrefixes.length, 2);
  });

  it('2. executeIntent "mulai sprint" creates lists', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    assert.equal(results.length, 4);
    for (const r of results) {
      assert.equal(r.success, true);
      assert.equal(r.type, 'create_list');
    }
    assert.equal(client.lists.length, 4);
    assert.deepEqual(client.lists.map(l => l.name), ['Backlog', 'To Do', 'In Progress', 'Done']);
  });

  it('3. executeIntent "buat card" creates a card', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    const results = await executeIntent(client, 'buat card', pb, 'b1', {
      task: 'Login page',
      desc: 'Buat halaman login',
      list: 'To Do',
    });
    assert.equal(results.length, 1);
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'create_card');
    assert.ok(results[0].name.includes('Login page'));
    assert.equal(client.cards.length, 1);
    assert.equal(client.cards[0].name, 'Login page');
  });

  it('4. executeIntent "assign" assigns member to card', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Bug fix' });
    const results = await executeIntent(client, 'assign', pb, 'b1', {
      cardId: client.cards[0].id,
      memberId: 'm1',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'assign_member');
  });

  it('5. executeIntent "pindah" moves a card', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Feature X' });
    const cardId = client.cards[0].id;
    const doneList = client.lists.find(l => l.name === 'Done');
    const results = await executeIntent(client, 'pindahkan card', pb, 'b1', {
      cardId,
      listId: doneList.id,
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'move_card');
    assert.equal(client.cards[0].listId, doneList.id);
  });

  it('6. executeIntent "komentar" adds comment', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Test' });
    const results = await executeIntent(client, 'tambah komentar', pb, 'b1', {
      cardId: client.cards[0].id,
      text: 'Selesai di-review',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'add_comment');
    assert.equal(client.comments.length, 1);
    assert.equal(client.comments[0].text, 'Selesai di-review');
  });

  it('7. executeIntent "report" returns card count', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card 1' });
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card 2' });
    const results = await executeIntent(client, 'my cards', pb, 'b1');
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'report');
    assert.ok(results[0].name.includes('2 cards'));
  });

  it('8. executeIntent "tutup sprint" archives done cards', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card A', list: 'Done' });
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card B', list: 'Done' });
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card C', list: 'In Progress' });
    const results = await executeIntent(client, 'close sprint', pb, 'b1');
    const archiveResults = results.filter(r => r.type === 'archive_card');
    assert.equal(archiveResults.length, 2);
    assert.equal(archiveResults[0].success, true);
    // Cards in Done list should be archived
    const remaining = client.cards.filter(c => !c.archived).length || client.cards.length;
    assert.equal(remaining, 1); // Only the In Progress card remains
  });

  it('9. executeIntent unknown intent returns failure', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'do something weird', pb, 'b1');
    assert.equal(results[0].success, false);
    assert.equal(results[0].type, 'unknown_intent');
  });

  it('10. executeIntent "buat card" with listId skips getLists', async () => {
    const client = new MockClient();
    let getListsCalled = false;
    const origGetLists = client.getLists;
    client.getLists = async () => { getListsCalled = true; return origGetLists.call(client); };
    const results = await executeIntent(client, 'buat card', pb, 'b1', {
      task: 'Direct',
      listId: 'l123',
    });
    assert.equal(results[0].success, true);
    assert.equal(getListsCalled, false);
    client.getLists = origGetLists;
  });

  it('11. executeIntent "pindah" with listName finds list', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Move me' });
    const results = await executeIntent(client, 'pindah', pb, 'b1', {
      cardId: client.cards[0].id,
      listName: 'Done',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'move_card');
  });

  it('12. executeIntent "buat label" creates label', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'buat label merah', pb, 'b1', {
      color: 'Merah',
      name: 'Bug',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'create_label');
  });

  it('13. executeIntent "buat label" invalid color returns error', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'buat label', pb, 'b1', {
      color: 'Neon',
    });
    assert.equal(results[0].success, false);
    assert.equal(results[0].type, 'create_label');
  });

  it('14. executeIntent "arsipkan" archives card', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Archive me' });
    const cardId = client.cards[0].id;
    const results = await executeIntent(client, 'arsipkan card', pb, 'b1', { cardId });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'archive_card');
    assert.equal(client.cards.length, 0);
  });

  it('15. executeIntent "arsipkan" without cardId returns error', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'arsipkan', pb, 'b1', {});
    assert.equal(results[0].success, false);
  });

  it('16. executeIntent "pindah semua" moves all cards between lists', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card A', list: 'To Do' });
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Card B', list: 'To Do' });
    const results = await executeIntent(client, 'pindah semua', pb, 'b1', {
      dari: 'To Do',
      ke: 'In Progress',
    });
    assert.equal(results.length, 2);
    for (const r of results) {
      assert.equal(r.success, true);
      assert.equal(r.type, 'move_card');
    }
    const toDoList = client.lists.find(l => l.name === 'To Do');
    const doneCards = client.cards.filter(c => c.listId === toDoList.id);
    assert.equal(doneCards.length, 0);
  });

  it('17. executeIntent "buat board" creates board', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'buat board', pb, 'b1', { name: 'New Board' });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'create_board');
  });

  it('18. executeIntent "hapus anggota" removes member', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Test card' });
    const results = await executeIntent(client, 'hapus anggota', pb, 'b1', {
      cardId: client.cards[0].id,
      memberId: 'm1',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'remove_member');
  });

  it('19. executeIntent "tambah label ke card" adds label', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Label this' });
    const results = await executeIntent(client, 'pasang label', pb, 'b1', {
      cardId: client.cards[0].id,
      labelId: 'lbl1',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'add_label_to_card');
  });

  it('20. executeIntent "arsip list" archives a list', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    const backlog = client.lists.find(l => l.name === 'Backlog');
    assert.ok(backlog);
    const results = await executeIntent(client, 'arsip list', pb, 'b1', { name: 'Backlog' });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'archive_list');
    assert.equal(client.lists.find(l => l.id === backlog.id).closed, true);
  });

  it('21. executeIntent "arsip list" without name returns error', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'archive list', pb, 'b1', {});
    assert.equal(results[0].success, false);
    assert.equal(results[0].type, 'archive_list');
  });

  it('22. executeIntent "update card" updates card name', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Old Name' });
    const results = await executeIntent(client, 'update card', pb, 'b1', {
      cardId: client.cards[0].id,
      name: 'New Name',
    });
    assert.equal(results[0].success, true);
    assert.equal(results[0].type, 'update_card');
    assert.equal(client.cards[0].name, 'New Name');
  });

  it('23. executeIntent "update card" without cardId returns error', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'ubah kartu', pb, 'b1', { name: 'X' });
    assert.equal(results[0].success, false);
    assert.equal(results[0].type, 'update_card');
  });

  it('24. executeIntent "buat checklist" creates checklist with items', async () => {
    const client = new MockClient();
    await executeIntent(client, 'Mulai Sprint Alpha', pb, 'b1');
    await executeIntent(client, 'buat card', pb, 'b1', { task: 'Feature X' });
    const results = await executeIntent(client, 'buat checklist', pb, 'b1', {
      cardId: client.cards[0].id,
      name: 'QA Steps',
      items: ['Test login', 'Test logout'],
    });
    const createResult = results.find(r => r.type === 'create_checklist');
    assert.ok(createResult);
    assert.equal(createResult.success, true);
    assert.equal(createResult.name, 'QA Steps');
    const itemResults = results.filter(r => r.type === 'add_checklist_item');
    assert.equal(itemResults.length, 2);
    assert.equal(itemResults[0].name, 'Test login');
    assert.equal(itemResults[1].name, 'Test logout');
  });

  it('25. executeIntent "buat checklist" without cardId returns error', async () => {
    const client = new MockClient();
    const results = await executeIntent(client, 'add checklist', pb, 'b1', {});
    assert.equal(results[0].success, false);
    assert.equal(results[0].type, 'create_checklist');
  });
});
