## Description

This PR adds two essential data retrieval tools that are currently missing from TRELLO MCP:

### 1. get_card_attachments
Retrieve all attachments from a card with full metadata (id, name, url, mimeType, bytes, date).

### 2. get_card_checklists  
Retrieve all checklists from a card with their items and completion status.

These tools fill critical gaps in card data retrieval, enabling:
- Complete card data access without fetching full card object
- Attachment auditing and backup workflows
- Checklist completion tracking and reporting
- Efficient AI Agent integrations

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Motivation

Currently, TRELLO MCP users cannot efficiently retrieve attachments or checklists from cards without fetching the entire card object. This creates inefficiencies for:

- **Audit workflows** — Need to track all attachments across cards
- **Reporting** — Checklist completion statistics
- **Backup/Sync** — Download all attachments from a card
- **AI Agents** — Context-aware decision making requires attachment/checklist data

These tools provide focused, efficient access to card attachments and checklists.

## Implementation

### get_card_attachments

**API Endpoint:**
\\\
GET /1/cards/{id}/attachments
\\\

**Response:**
\\\	ypescript
{
  attachments: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  bytes: number;
  date: string;
  isUpload: boolean;
}
\\\

### get_card_checklists

**API Endpoint:**
\\\
GET /1/cards/{id}/checklists
\\\

**Response:**
\\\	ypescript
{
  checklists: CardChecklist[];
}

interface CardChecklist {
  id: string;
  name: string;
  cardId: string;
  boardId: string;
  itemCount: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  pos: number;
}
\\\

## Testing

- [x] Tests added/updated
- [x] Manual testing completed
- [x] All tests passing

### Test Coverage

**Attachments:**
- ✅ Get attachments from card with attachments
- ✅ Handle card with no attachments (empty array)
- ✅ Metadata validation (id, name, url, mimeType, bytes)

**Checklists:**
- ✅ Get checklists from card with checklists
- ✅ Handle card with no checklists (empty array)
- ✅ Item state validation (checked/unchecked)
- ✅ Item metadata (id, name, pos)

### Manual Testing

**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede

**Test Results:**
- get_card_attachments: ✅ PASS (retrieved 2 attachments)
- get_card_checklists: ✅ PASS (retrieved 1 checklist with 3 items)

## Documentation

- [x] README.md updated
- [x] Tool descriptions added
- [x] Usage examples provided
- [x] TypeScript types documented

## Checklist

- [x] Code follows project guidelines
- [x] Self-review completed
- [x] Comments added where necessary
- [x] Documentation updated
- [x] No breaking changes
- [x] Backward compatible

## Related Issue

Closes #(create issue number if applicable)

## Screenshots (if applicable)

N/A — Backend tools, no UI changes

## Additional Context

These tools were developed as part of the KAEDE project (Trello + Playbook + AI Agent integration) where efficient data retrieval is critical for AI Agent workflows.

**Real-world use case:**
`javascript
// AI Agent needs to check if a bug report has screenshots
const attachments = await mcp.trello.get_card_attachments({
  cardId: 'bug-report-123'
});

const hasScreenshots = attachments.some(att => 
  att.mimeType?.startsWith('image/')
);

if (!hasScreenshots) {
  await mcp.trello.add_comment({
    cardId: 'bug-report-123',
    text: 'Please attach screenshots to reproduce this bug.'
  });
}
`

---

**Thanks for maintaining this awesome project!** 🙏

This PR would really help the KAEDE ecosystem and I believe other users would benefit from these data retrieval tools.

Looking forward to your feedback!

Best regards,  
Sandikodev  
PT Koneksi Jaringan Indonesia
