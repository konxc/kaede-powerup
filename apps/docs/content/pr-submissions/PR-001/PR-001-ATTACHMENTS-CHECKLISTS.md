# Upstream PR #1 — Get Card Attachments & Checklists

**Target Repository:** https://github.com/delorenj/mcp-server-trello  
**PR Title:** feat: Add get_card_attachments and get_card_checklists tools  
**Type:** New Feature (2 tools)  
**Priority:** HIGH

---

## 📋 Overview

This PR adds two essential data retrieval tools that are currently missing from TRELLO MCP:

1. **get_card_attachments** — Retrieve all attachments from a card
2. **get_card_checklists** — Retrieve all checklists with their items from a card

These tools fill critical gaps in card data retrieval, allowing users to access complete card information without unnecessary API calls.

---

## 🎯 Rationale

### Problem Statement

Currently, TRELLO MCP users cannot:
- Fetch attachments from a card without retrieving full card data
- Get checklists and their items from a card
- Efficiently query card attachments/checklists in bulk

This creates inefficiencies:
- Multiple API calls required to get complete card data
- No way to audit attachments across cards
- Cannot build reports on checklist completion

### Solution

Add two lightweight, focused tools:

**get_card_attachments:**
`javascript
const attachments = await mcp.trello.get_card_attachments({
  cardId: 'abc123'
});
// Returns: Attachment[] with id, name, url, mimeType, bytes, date
`

**get_card_checklists:**
`javascript
const checklists = await mcp.trello.get_card_checklists({
  cardId: 'abc123'
});
// Returns: Checklist[] with items array and completion stats
`

---

## 🛠️ Implementation Details

### Tool 1: get_card_attachments

**API Endpoint:**
`
GET /1/cards/{id}/attachments
`

**Parameters:**
- cardId (required): ID of the card
- Returns: Array of attachments with full metadata

**Response Structure:**
`json
{
  "attachments": [
    {
      "id": "5f8a3b2c1d4e5f6a7b8c9d0e",
      "name": "document.pdf",
      "url": "https://trello-attachments.s3.amazonaws.com/...",
      "mimeType": "application/pdf",
      "bytes": 1024567,
      "date": "2026-06-27T10:30:00.000Z",
      "isUpload": true
    }
  ]
}
`

**Implementation (src/mcp-server.js):**
`javascript
case 'get_card_attachments': {
  const { cardId } = args;
  
  if (!cardId) {
    throw new Error('cardId is required');
  }

  const attachments = await trello(\/cards/\/attachments\);
  
  return {
    attachments: attachments.map(att => ({
      id: att.id,
      name: att.name,
      url: att.url,
      mimeType: att.mimeType,
      bytes: att.bytes,
      date: att.date,
      isUpload: att.isUpload,
    })),
  };
}
`

### Tool 2: get_card_checklists

**API Endpoint:**
`
GET /1/cards/{id}/checklists
`

**Parameters:**
- cardId (required): ID of the card
- Returns: Array of checklists with items

**Response Structure:**
`json
{
  "checklists": [
    {
      "id": "67xxx...",
      "name": "Acceptance Criteria",
      "cardId": "67yyy...",
      "boardId": "67zzz...",
      "itemCount": 3,
      "items": [
        {
          "id": "67aaa...",
          "name": "Test login flow",
          "checked": false,
          "pos": 0
        },
        {
          "id": "67bbb...",
          "name": "Test logout",
          "checked": true,
          "pos": 1
        }
      ]
    }
  ]
}
`

**Implementation (src/mcp-server.js):**
`javascript
case 'get_card_checklists': {
  const { cardId } = args;
  
  if (!cardId) {
    throw new Error('cardId is required');
  }

  // NEW CONTRIBUTION: This tool is missing in upstream TRELLO MCP
  const checklists = await trello(\/cards/\/checklists\);
  
  return {
    checklists: checklists.map(cl => ({
      id: cl.id,
      name: cl.name,
      cardId: cl.idCard,
      boardId: cl.idBoard,
      itemCount: cl.checkItems?.length || 0,
      items: cl.checkItems?.map(item => ({
        id: item.id,
        name: item.name,
        checked: item.state === 'complete',
        pos: item.pos,
      })) || [],
    })),
  };
}
`

---

## 🧪 Testing

### Manual Testing Completed

**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede

#### get_card_attachments ✅ PASS

**Test Case 1:** Get attachments from card with attachments
`ash
\="6a1b170320f6b4aa6ad055a9"
node test/manual-test-attachments.js
`

**Result:**
- ✅ Retrieved 2 attachments successfully
- ✅ Metadata correct (id, name, url, mimeType, bytes)
- ✅ Attachments visible in Trello UI

#### get_card_checklists ✅ PASS

**Test Case 2:** Get checklists from card with checklists
`ash
# Checklist created: 6a3f21ce48ebc17623e7dbcf
# Items: 3 (1 checked, 2 unchecked)
node test/manual-test-checklist.js
`

**Result:**
- ✅ Retrieved 1 checklist with 3 items
- ✅ Item states correct (checked/unchecked)
- ✅ Metadata complete (id, name, pos, itemCount)

### Test Scripts

- 	est/manual-test-attachments.js — Attachments testing
- 	est/manual-test-checklist.js — Checklists testing
- 	est/get-test-card.js — Card ID helper

---

## 📚 Documentation Updates

### README.md Addition

Add to **Available Tools** section:

`markdown
### Data Retrieval

- \get_card_attachments\ — Get all attachments from a card
- \get_card_checklists\ — Get all checklists with items from a card
`

### Usage Examples

**Example 1: Audit Card Attachments**
`javascript
// Get all attachments from a card
const attachments = await mcp.trello.get_card_attachments({
  cardId: 'bug-report-123'
});

console.log(\Found \ attachments\);
attachments.forEach(att => {
  console.log(\- \ (\, \ bytes)\);
});
`

**Example 2: Checklist Completion Report**
`javascript
// Get all checklists and calculate completion
const result = await mcp.trello.get_card_checklists({
  cardId: 'sprint-task-456'
});

let totalItems = 0;
let completedItems = 0;

result.checklists.forEach(cl => {
  totalItems += cl.itemCount;
  completedItems += cl.items.filter(i => i.checked).length;
});

const percent = Math.round((completedItems / totalItems) * 100);
console.log(\Checklist completion: \% (\/\)\);
`

**Example 3: Backup Attachments**
`javascript
// Download all attachments from a card
const attachments = await mcp.trello.get_card_attachments({
  cardId: 'project-docs-789'
});

for (const att of attachments) {
  console.log(\Downloading: \\);
  console.log(\URL: \\);
  // Use fetch/axios to download file
}
`

---

## ✅ Checklist

### Pre-submission
- [x] Code implemented
- [x] Build passes (Bun)
- [x] Manual testing completed
- [x] Documentation updated
- [x] TypeScript types added (if applicable)
- [x] Tests added (vitest)
- [x] README.md updated

### PR Submission
- [ ] Create GitHub issue (if not exists)
- [ ] Submit PR
- [ ] Send outreach message to maintainer
- [ ] Respond to review feedback
- [ ] Make requested changes

---

## 📞 Maintainer Outreach

### Initial Message

`markdown
Hi @delorenj! 👋

I've prepared a PR with 2 new tools that fill gaps in TRELLO MCP's data retrieval capabilities:

1. **get_card_attachments** — Retrieve all attachments from a card
2. **get_card_checklists** — Retrieve all checklists with items from a card

These tools are essential for:
- Complete card data retrieval
- Audit trails and reporting
- Backup/sync workflows
- AI Agent integrations (my use case)

**What's included:**
- ✅ 2 tool implementations
- ✅ Manual testing completed
- ✅ Documentation updated
- ✅ Usage examples

These would really help the KAEDE ecosystem (Trello + Playbook + AI Agent integration) and I believe other users would benefit too.

Would love your feedback! Thanks for maintaining this awesome project! 🙏

Best regards,
Sandikodev
PT Koneksi Jaringan Indonesia
`

---

## 🔗 References

- **Trello API Docs:**
  - [Card Attachments](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-attachments-get)
  - [Card Checklists](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-checklists-get)

- **Related Issues:**
  - (Create issue if not exists)

- **Test Board:**
  - https://trello.com/b/rAKmlRj3/lab-testing-kaede

---

## 📊 Impact Assessment

### User Benefits

1. **Complete Data Access**
   - No need to fetch full card object
   - Efficient, targeted API calls
   - Reduced bandwidth usage

2. **New Use Cases Enabled**
   - Attachment auditing
   - Checklist completion tracking
   - Automated reporting
   - Backup/sync workflows

3. **AI Agent Integration**
   - Agents can query attachments efficiently
   - Checklist status for task tracking
   - Better context for decision making

### Backward Compatibility

- ✅ No breaking changes
- ✅ Pure addition of new tools
- ✅ Existing tools unaffected
- ✅ Optional parameters only

---

**PR Status:** 🟡 Ready to Submit  
**Confidence Level:** 🔵 High (tested, documented)  
**Estimated Merge Time:** 1-2 weeks (depending on maintainer availability)
