# Testing Guide — KAEDE MCP

Panduan lengkap untuk testing semua tools yang telah ditambahkan ke KAEDE MCP.

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Test Board](#test-board)
3. [Phase 1: Attachments](#phase-1-attachments)
4. [Phase 2: Checklist](#phase-2-checklist)
5. [Phase 3: Watch & Activity](#phase-3-watch--activity)
6. [Phase 4: Sort & List](#phase-4-sort--list)
7. [Test Results Template](#test-results-template)

---

## Setup

### 1. Credentials

```bash
bun scripts/kaede.mjs setup
```

Atau manual edit: `~/.config/kaede/secrets.env`

```env
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
```

### 2. Build MCP Server

```bash
bun run build:mcp
```

### 3. Helper Scripts

```bash
# Get card IDs from test board
bun test/get-test-card.js

# Run attachment tests
bun test/manual-test-attachments.js
```

---

## Test Board

**URL:** https://trello.com/b/rAKmlRj3/lab-testing-kaede

**Access:** Public board — anyone can view and test

**Setup:**
1. Create at least 3 lists: "To Do", "In Progress", "Done"
2. Create at least 2 cards per list
3. Add checklists to some cards
4. Add attachments to some cards

---

## Phase 1: Attachments

### Tools to Test

- [ ] `attach_file_to_card`
- [ ] `attach_image_to_card`
- [ ] `get_card_attachments`
- [ ] `copy_card`

### Test: Attach Image

```javascript
import { TrelloMCPClient } from '../src/trello-client.js';

const client = new TrelloMCPClient();
await client.connect();

const result = await client.attachImageToCard(
  'CARD_ID',
  'https://via.placeholder.com/400x300.png',
  'Test Image'
);

console.log('Attached:', result);
client.close();
```

**Expected:**
- Image appears in card attachments
- MIME type: `image/png`
- Name: "Test Image"

### Test: Get Attachments

```javascript
const attachments = await client.getCardAttachments('CARD_ID');
console.log(`Found ${attachments.length} attachment(s)`);
attachments.forEach(att => {
  console.log(`- ${att.name} (${att.mimeType})`);
});
```

**Expected:**
- Array of all attachments
- Each has: id, name, url, mimeType, bytes, date

### Test: Copy Card

```javascript
const copied = await client.copyCard({
  sourceCardId: 'SOURCE_CARD_ID',
  listId: 'TARGET_LIST_ID',
  name: 'Copied Card',
  keepFromSource: 'all', // or 'attachments,checklists'
});

console.log('Copied to:', copied.url);
```

**Expected:**
- New card created
- Same attachments (if keepFromSource includes 'attachments')
- Same checklists (if keepFromSource includes 'checklists')

---

## Phase 2: Checklist

### Tools to Test

- [ ] `get_card_checklists`
- [ ] `update_checklist_item`
- [ ] `delete_checklist_item`
- [ ] `delete_checklist`

### Test: Get Checklists

```javascript
const result = await client.getCardChecklists('CARD_ID');
console.log(`Found ${result.checklists.length} checklist(s)`);

result.checklists.forEach(cl => {
  console.log(`Checklist: ${cl.name}`);
  console.log(`  Items: ${cl.itemCount}`);
  cl.items.forEach(item => {
    console.log(`  - [${item.checked ? 'x' : ' '}] ${item.name}`);
  });
});
```

**Expected:**
- Array of checklists
- Each checklist has items array
- Items have: id, name, checked, pos

### Test: Update Checklist Item

```javascript
// Mark as complete
await client.updateChecklistItem({
  checklistId: 'CHECKLIST_ID',
  checkItemId: 'ITEM_ID',
  checked: true,
});

// Rename
await client.updateChecklistItem({
  checklistId: 'CHECKLIST_ID',
  checkItemId: 'ITEM_ID',
  name: 'New Name',
});
```

**Expected:**
- Item state changes in Trello UI
- Name updates immediately

### Test: Delete Checklist Item

```javascript
await client.deleteChecklistItem('CHECKLIST_ID', 'ITEM_ID');
```

**Expected:**
- Item removed from checklist
- Other items remain

### Test: Delete Checklist

```javascript
await client.deleteChecklist('CHECKLIST_ID');
```

**Expected:**
- Entire checklist removed from card

---

## Phase 3: Watch & Activity

### Tools to Test

- [ ] `watch_card`
- [ ] `watch_list`
- [ ] `get_card_activity`
- [ ] `search_labels`
- [ ] `remove_label_from_card`

### Test: Watch Card

```javascript
// Start watching
await client.watchCard('CARD_ID', true);

// Stop watching
await client.unwatchCard('CARD_ID');
```

**Expected:**
- Card shows "Watching" badge
- Notifications enabled

### Test: Get Card Activity

```javascript
const activity = await client.getCardActivity('CARD_ID', {
  filter: 'commentCard', // optional: only comments
  limit: 10,             // optional: default 50
});

console.log(`Found ${activity.count} actions`);
activity.actions.forEach(action => {
  console.log(`${action.type} by ${action.memberCreator?.fullName}`);
  console.log(`  Date: ${action.date}`);
});
```

**Expected:**
- Array of actions (comments, moves, updates)
- Each has: id, type, date, memberCreator, data

### Test: Search Labels

```javascript
const labels = await client.searchLabels('BOARD_ID', 'urgent');
console.log(`Found ${labels.count} labels`);
labels.labels.forEach(label => {
  console.log(`- ${label.name} (${label.color})`);
});
```

**Expected:**
- Filtered labels matching query
- Search in name and color

### Test: Remove Label

```javascript
await client.removeLabelFromCard('CARD_ID', 'LABEL_ID');
```

**Expected:**
- Label removed from card
- Other labels remain

---

## Phase 4: Sort & List

### Tools to Test

- [ ] `copy_checklist`
- [ ] `sort_list_cards`
- [ ] `update_list`

### Test: Copy Checklist

```javascript
const result = await client.copyChecklist(
  'SOURCE_CHECKLIST_ID',
  'TARGET_CARD_ID'
);

console.log(`Copied checklist: ${result.name}`);
console.log(`Items: ${result.itemCount}`);
```

**Expected:**
- New checklist on target card
- Same items as source

### Test: Sort List Cards

```javascript
// Sort by due date
await client.sortListCards('LIST_ID', 'due');

// Sort by name
await client.sortListCards('LIST_ID', 'name');

// Sort by position
await client.sortListCards('LIST_ID', 'listPosition');
```

**Expected:**
- Cards reordered in list
- Sort criteria applied correctly

### Test: Update List

```javascript
// Rename
await client.updateList({
  listId: 'LIST_ID',
  name: 'New List Name',
});

// Close list
await client.updateList({
  listId: 'LIST_ID',
  closed: true,
});

// Change position
await client.updateList({
  listId: 'LIST_ID',
  pos: 0, // Move to first position
});
```

**Expected:**
- List details updated
- Changes visible in Trello UI

---

## Test Results Template

Copy template ini untuk dokumentasi hasil testing:

```markdown
## Test Session: YYYY-MM-DD

**Tester:** [Nama]
**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede
**Cards Used:** [List card IDs]

### Phase 1: Attachments

| Tool | Status | Notes |
|------|--------|-------|
| attach_file_to_card | ✅ Pass / ❌ Fail | [Notes] |
| attach_image_to_card | ✅ Pass / ❌ Fail | [Notes] |
| get_card_attachments | ✅ Pass / ❌ Fail | [Notes] |
| copy_card | ✅ Pass / ❌ Fail | [Notes] |

### Phase 2: Checklist

| Tool | Status | Notes |
|------|--------|-------|
| get_card_checklists | ✅ Pass / ❌ Fail | [Notes] |
| update_checklist_item | ✅ Pass / ❌ Fail | [Notes] |
| delete_checklist_item | ✅ Pass / ❌ Fail | [Notes] |
| delete_checklist | ✅ Pass / ❌ Fail | [Notes] |

### Phase 3: Watch & Activity

| Tool | Status | Notes |
|------|--------|-------|
| watch_card | ✅ Pass / ❌ Fail | [Notes] |
| watch_list | ✅ Pass / ❌ Fail | [Notes] |
| get_card_activity | ✅ Pass / ❌ Fail | [Notes] |
| search_labels | ✅ Pass / ❌ Fail | [Notes] |
| remove_label_from_card | ✅ Pass / ❌ Fail | [Notes] |

### Phase 4: Sort & List

| Tool | Status | Notes |
|------|--------|-------|
| copy_checklist | ✅ Pass / ❌ Fail | [Notes] |
| sort_list_cards | ✅ Pass / ❌ Fail | [Notes] |
| update_list | ✅ Pass / ❌ Fail | [Notes] |

### Issues Found

1. [Issue description with steps to reproduce]
2. [Issue description with steps to reproduce]

### Screenshots

[Screenshot attachments/checklists di Trello sebelum/sesudah testing]

### Summary

- **Total Tests:** [X]
- **Passed:** [Y]
- **Failed:** [Z]
- **Skipped:** [W]

**Overall Status:** ✅ All Pass / ⚠️ Some Issues
```

---

## Common Issues & Solutions

### Issue: "Connection failed"

**Cause:** MCP server not built or credentials missing

**Solution:**
```bash
bun run build:mcp
bun scripts/kaede.mjs setup
```

### Issue: "Unauthorized"

**Cause:** Invalid API key or token

**Solution:**
1. Regenerate credentials from https://trello.com/app-key
2. Update `~/.config/kaede/secrets.env`
3. Restart test script

### Issue: "Card not found"

**Cause:** Invalid card ID

**Solution:**
```bash
# Get valid card IDs
bun test/get-test-card.js
```

### Issue: "Rate limit exceeded"

**Cause:** Too many API calls in short time

**Solution:**
- Wait 1-2 minutes between tests
- Trello API limit: 100 requests per 10 seconds

---

## Next Steps After Testing

1. **Document Results**
   - Fill in test results template
   - Screenshot successes/failures
   - Note any edge cases

2. **Report Issues**
   - Create bug report in `test/ISSUES.md`
   - Include steps to reproduce
   - Include expected vs actual behavior

3. **Prepare Upstream PR**
   - Select tools that work perfectly
   - Port to delorenj/mcp-server-trello structure
   - Add TypeScript types and tests
   - Submit PR

---

## References

- **Trello API Docs:** https://developer.trello.com/docs
- **Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede
- **Upstream:** https://github.com/delorenj/mcp-server-trello
- **Implementation Summary:** `IMPLEMENTATION-SUMMARY.md`
- **Contributing Guide:** `CONTRIBUTING.md`