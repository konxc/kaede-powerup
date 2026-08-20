# Checklist Management Tools — Testing Guide

Panduan testing untuk 4 tools checklist management yang baru ditambahkan.

---

## 📋 Tools Added

| Tool | Description | New Contribution |
|------|-------------|------------------|
| delete_checklist | Delete entire checklist from card | ❌ |
| delete_checklist_item | Delete item from checklist | ❌ |
| update_checklist_item | Update item name or checked state | ❌ |
| get_card_checklists | Get all checklists with items | ✨ **YES** |

---

## 🚀 Quick Test

### 1. Get Card Checklists (NEW CONTRIBUTION)

`javascript
import { TrelloMCPClient } from '../src/trello-client.js';

const client = new TrelloMCPClient();
await client.connect();

const result = await client.getCardChecklists('CARD_ID');
console.log('Checklists:', result);

// Output structure:
{
  checklists: [
    {
      id: '67xxx...',
      name: 'My Checklist',
      cardId: '67yyy...',
      boardId: '67zzz...',
      itemCount: 3,
      items: [
        { id: '67aaa...', name: 'Item 1', checked: false, pos: 0 },
        { id: '67bbb...', name: 'Item 2', checked: true, pos: 1 },
      ]
    }
  ]
}

client.close();
`

### 2. Update Checklist Item

`javascript
// Mark item as complete
await client.updateChecklistItem({
  checklistId: 'CHECKLIST_ID',
  checkItemId: 'ITEM_ID',
  checked: true,
});

// Rename item
await client.updateChecklistItem({
  checklistId: 'CHECKLIST_ID',
  checkItemId: 'ITEM_ID',
  name: 'New name',
});
`

### 3. Delete Checklist Item

`javascript
await client.deleteChecklistItem('CHECKLIST_ID', 'ITEM_ID');
`

### 4. Delete Entire Checklist

`javascript
await client.deleteChecklist('CHECKLIST_ID');
`

---

## ✅ Test Checklist

Create a test card with:
- [ ] At least 1 checklist
- [ ] Each checklist has 2-3 items
- [ ] Some items checked, some unchecked

### Test Cases

#### Test 1: Get Card Checklists
- [ ] Call get_card_checklists(CARD_ID)
- [ ] Verify checklists array is returned
- [ ] Verify each checklist has: id, name, itemCount, items
- [ ] Verify items have: id, name, checked, pos

#### Test 2: Update Checklist Item (Check)
- [ ] Get checklist and item IDs from Test 1
- [ ] Call updateChecklistItem({ checklistId, checkItemId, checked: true })
- [ ] Verify item is now checked
- [ ] Call get_card_checklists() again to verify

#### Test 3: Update Checklist Item (Rename)
- [ ] Call updateChecklistItem({ checklistId, checkItemId, name: 'New Name' })
- [ ] Verify name changed
- [ ] Verify other properties unchanged

#### Test 4: Delete Checklist Item
- [ ] Call deleteChecklistItem(checklistId, checkItemId)
- [ ] Verify item removed (call get_card_checklists())
- [ ] Verify itemCount decreased

#### Test 5: Delete Entire Checklist
- [ ] Call deleteChecklist(checklistId)
- [ ] Verify checklist removed from card
- [ ] Verify get_card_checklists() no longer shows it

---

## 🐛 Edge Cases to Test

- [ ] Delete non-existent checklist (should error)
- [ ] Delete non-existent item (should error)
- [ ] Update non-existent item (should error)
- [ ] Get checklists from card with no checklists (should return empty array)
- [ ] Delete checklist from card with multiple checklists (verify others remain)

---

## 📊 Expected API Calls

### get_card_checklists
`
GET /1/cards/{cardId}/checklists
`

### update_checklist_item
`
PUT /1/checklists/{checklistId}/checkItems/{checkItemId}
Body: { name: 'New Name', checked: true }
`

### delete_checklist_item
`
DELETE /1/checklists/{checklistId}/checkItems/{checkItemId}
`

### delete_checklist
`
DELETE /1/checklists/{checklistId}
`

---

## 📝 Test Results Template

`markdown
## Test Session: YYYY-MM-DD

**Tester:** [Name]
**Test Card:** [Card URL]

### Results

| Tool | Status | Notes |
|------|--------|-------|
| get_card_checklists | ✅ Pass / ❌ Fail | [Notes] |
| update_checklist_item (check) | ✅ Pass / ❌ Fail | [Notes] |
| update_checklist_item (rename) | ✅ Pass / ❌ Fail | [Notes] |
| delete_checklist_item | ✅ Pass / ❌ Fail | [Notes] |
| delete_checklist | ✅ Pass / ❌ Fail | [Notes] |

### Issues Found

1. [Issue description]
2. [Issue description]

### Screenshots

[Screenshot checklist di Trello sebelum/sesudah]
`

---

## 🎯 Next Steps

After testing:
1. Update DEVELOPMENT-ROADMAP.md dengan progress Phase 2
2. Lanjut ke Phase 3 (Watch \& Activity tools)
3. Prepare upstream PR untuk get_card_checklists

---

## 📚 References

- [Trello Checklist API](https://developer.trello.com/docs/checklist)
- [CheckItem API](https://developer.trello.com/docs/checkitem)
- [DEVELOPMENT-ROADMAP.md](../docs/DEVELOPMENT-ROADMAP.md)
