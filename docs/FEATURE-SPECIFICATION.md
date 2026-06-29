# Feature Specification — KAEDE MCP Enhancements

> **Detailed specification for all implemented KAEDE MCP features.**

**Version:** 1.0.0  
**Last Updated:** June 29, 2026  
**Maintained by:** Sandikodev  
**Status:** Complete — All Phases Implemented

---

## 📋 Overview

This document contains the complete specification for each feature to be implemented in KAEDE MCP, including:
- API endpoints reference
- Tool parameters
- Implementation details
- Test scenarios
- Edge cases

---

## 📎 Attachments Implementation

### Overview

**Priority:** HIGH (Phase 1)  
**Complexity:** LOW  
**TRELLO MCP Status:** ✅ Has 4 attachment tools  
**KAEDE Status:** ❌ Missing  
**Action:** Port from TRELLO MCP + add `get_card_attachments` (new contribution)

### Tools to Implement

1. `attach_file_to_card` — Attach from URL or local file
2. `attach_image_to_card` — Attach image from URL
3. `attach_data_to_card` — Attach from base64/data URL
4. `attach_image_data_to_card` — Attach image from base64 (screenshot)
5. `get_card_attachments` — **NEW CONTRIBUTION** (missing from TRELLO MCP!)

### API Endpoints

```
POST /cards/{id}/attachments
  Body: { url, name, mimeType }  (for URL attachment)
  OR
  Multipart: file (for file upload)

DELETE /cards/{id}/attachments/{idAttachment}
  (for deleting attachment)

GET /cards/{id}/attachments
  (for getting all attachments)
```

### Tool Specifications

#### 1. attach_file_to_card

**Purpose:** Attach any type of file to a card from URL or local file path.

**Parameters:**
```typescript
{
  boardId?: string,    // Optional: Board ID (uses default if not provided)
  cardId: string,      // Required: Card ID
  fileUrl: string,     // Required: URL or local file path (file://)
  name?: string,       // Optional: Attachment name
  mimeType?: string,   // Optional: MIME type
}
```

**Implementation:**
```javascript
// src/mcp-server.js
this.server.registerTool(
  'attach_file_to_card',
  {
    title: 'Attach File to Card',
    description: 'Attach any file to a card from a URL or local file path',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      cardId: z.string().describe('Card ID'),
      fileUrl: z.string().describe('File URL or local path (file://)'),
      name: z.string().optional().describe('Attachment name'),
      mimeType: z.string().optional().describe('MIME type'),
    },
  },
  async ({ boardId, cardId, fileUrl, name, mimeType }) => {
    try {
      const attachment = await this.trelloClient.attachFileToCard(
        cardId, fileUrl, name, mimeType
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(attachment, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**MIME Type Detection:**
```javascript
// src/trello/attachments.js
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  // ... more types
};

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}
```

**Local File Handling:**
```javascript
// Detect file:// protocol
if (fileUrl.startsWith('file://')) {
  // Upload local file
  const localPath = fileURLToPath(fileUrl);
  const formData = new FormData();
  formData.append('file', fs.createReadStream(localPath));
  formData.append('name', name || path.basename(localPath));
  formData.append('mimeType', mimeType || mimeFromFilename(localPath));
  
  const response = await trello(`/cards/${cardId}/attachments`, {
    method: 'POST',
    body: formData,
  });
  return response;
} else {
  // Attach from URL
  const response = await trelloPost(`/cards/${cardId}/attachments`, {
    url: fileUrl,
    name: name || 'File Attachment',
    mimeType: mimeType || mimeFromFilename(fileUrl),
  });
  return response;
}
```

**Test Scenarios:**
```javascript
// test/attachments.test.js
describe('attach_file_to_card', () => {
  it('should attach file from URL', async () => {
    const result = await client.attachFileToCard(
      'card123',
      'https://example.com/document.pdf',
      'Project Document'
    );
    expect(result).toHaveProperty('id');
    expect(result.url).toContain('trello.com');
    expect(result.name).toBe('Project Document');
  });

  it('should attach local file', async () => {
    const result = await client.attachFileToCard(
      'card123',
      'file:///C:/Users/Test/document.pdf',
      'Local Document'
    );
    expect(result).toHaveProperty('id');
    expect(result.fileName).toBe('Local Document');
  });

  it('should auto-detect MIME type', async () => {
    const result = await client.attachFileToCard(
      'card123',
      'https://example.com/image.png'
    );
    expect(result.mimeType).toBe('image/png');
  });

  it('should handle invalid URL', async () => {
    await expect(client.attachFileToCard(
      'card123',
      'not-a-valid-url'
    )).rejects.toThrow('Invalid URL');
  });
});
```

---

#### 2. attach_image_to_card

**Purpose:** Attach an image to a card from a URL.

**Parameters:**
```typescript
{
  boardId?: string,
  cardId: string,
  imageUrl: string,
  name?: string,
}
```

**Implementation:**
```javascript
// Convenience wrapper around attach_file_to_card
this.server.registerTool(
  'attach_image_to_card',
  {
    title: 'Attach Image to Card',
    description: 'Attach an image to a card from a URL',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      cardId: z.string().describe('Card ID'),
      imageUrl: z.string().describe('Image URL'),
      name: z.string().optional().default('Image Attachment').describe('Attachment name'),
    },
  },
  async ({ boardId, cardId, imageUrl, name }) => {
    try {
      const attachment = await this.trelloClient.attachImageToCard(
        cardId, imageUrl, name
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(attachment, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Test Scenarios:**
```javascript
describe('attach_image_to_card', () => {
  it('should attach image from URL', async () => {
    const result = await client.attachImageToCard(
      'card123',
      'https://example.com/screenshot.png',
      'Feature Screenshot'
    );
    expect(result).toHaveProperty('id');
    expect(result.mimeType).toBe('image/png');
    expect(result.previews).toBeDefined();
  });

  it('should generate preview', async () => {
    const result = await client.attachImageToCard(
      'card123',
      'https://example.com/photo.jpg'
    );
    expect(result.previews.length).toBeGreaterThan(0);
    expect(result.previews[0]).toHaveProperty('url');
    expect(result.previews[0]).toHaveProperty('width');
  });
});
```

---

#### 3. attach_data_to_card

**Purpose:** Attach binary data (image, PDF, text, etc.) from base64-encoded data or data URL.

**Parameters:**
```typescript
{
  boardId?: string,
  cardId: string,
  data: string,      // Base64 or data URL
  name?: string,
  mimeType?: string,
}
```

**Implementation:**
```javascript
this.server.registerTool(
  'attach_data_to_card',
  {
    title: 'Attach Data to Card',
    description: 'Attach binary data from base64 or data URL',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      cardId: z.string().describe('Card ID'),
      data: z.string().describe('Base64 data or data URL'),
      name: z.string().optional().describe('Filename'),
      mimeType: z.string().optional().describe('MIME type'),
    },
  },
  async ({ boardId, cardId, data, name, mimeType }) => {
    try {
      let buffer;
      let effectiveMimeType = mimeType;

      // Parse data URL
      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format');
        }
        effectiveMimeType = effectiveMimeType || matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Raw base64
        buffer = Buffer.from(data, 'base64');
      }

      effectiveMimeType = effectiveMimeType || mimeFromFilename(name) || 'application/octet-stream';
      const fileName = name || `attachment-${Date.now()}`;

      const formData = new FormData();
      formData.append('file', buffer, { filename: fileName, contentType: effectiveMimeType });
      formData.append('name', fileName);
      formData.append('mimeType', effectiveMimeType);

      const response = await trello(`/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Use Cases:**
- Screenshots (clipboard paste)
- Generated PDFs
- AI-generated content
- Exported data

**Test Scenarios:**
```javascript
describe('attach_data_to_card', () => {
  it('should attach from data URL', async () => {
    const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQh';
    const result = await client.attachDataToCard(
      'card123',
      dataUrl,
      'hello.txt',
      'text/plain'
    );
    expect(result).toHaveProperty('id');
    expect(result.mimeType).toBe('text/plain');
  });

  it('should attach from base64', async () => {
    const base64 = 'SGVsbG8gV29ybGQh';
    const result = await client.attachDataToCard(
      'card123',
      base64,
      'test.bin'
    );
    expect(result).toHaveProperty('id');
  });

  it('should handle invalid data URL', async () => {
    await expect(client.attachDataToCard(
      'card123',
      'not-a-data-url'
    )).rejects.toThrow('Invalid data URL format');
  });
});
```

---

#### 4. attach_image_data_to_card

**Purpose:** Attach image from base64 data (convenience wrapper for screenshots).

**Parameters:**
```typescript
{
  boardId?: string,
  cardId: string,
  imageData: string,
  name?: string,
  mimeType?: string,
}
```

**Implementation:**
```javascript
this.server.registerTool(
  'attach_image_data_to_card',
  {
    title: 'Attach Image Data to Card',
    description: 'Attach image from base64 data (screenshot convenience)',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      cardId: z.string().describe('Card ID'),
      imageData: z.string().describe('Base64 image data'),
      name: z.string().optional().describe('Image filename'),
      mimeType: z.string().optional().default('image/png').describe('MIME type'),
    },
  },
  async ({ boardId, cardId, imageData, name, mimeType }) => {
    try {
      const attachment = await this.trelloClient.attachImageDataToCard(
        cardId, imageData, name, mimeType
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(attachment, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Screenshot Workflow:**
```javascript
// User workflow: Copy screenshot → Paste to AI Agent → Attach to Trello card

// 1. User copies screenshot to clipboard
// 2. AI Agent converts to base64
const base64Image = await clipboardToBase64();

// 3. AI Agent attaches to card
await mcp.trello.attach_image_data_to_card({
  cardId: 'bug-report-123',
  imageData: base64Image,
  name: 'bug-screenshot.png',
  mimeType: 'image/png'
});
```

---

#### 5. get_card_attachments (NEW CONTRIBUTION)

**Purpose:** Retrieve all attachments from a card (missing from TRELLO MCP!).

**Parameters:**
```typescript
{
  cardId: string,
  limit?: number,  // Default: 100
}
```

**Implementation:**
```javascript
this.server.registerTool(
  'get_card_attachments',
  {
    title: 'Get Card Attachments',
    description: 'Retrieve all attachments from a specific card',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      limit: z.number().optional().default(100).describe('Max attachments'),
    },
  },
  async ({ cardId, limit }) => {
    try {
      const attachments = await this.trelloClient.getCardAttachments(cardId, limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(attachments, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**API Endpoint:**
```
GET /cards/{id}/attachments?limit={limit}
```

**Response:**
```json
[
  {
    "id": "5f8a3b2c1d4e5f6a7b8c9d0e",
    "name": "document.pdf",
    "url": "https://trello-attachments.s3.amazonaws.com/...",
    "fileName": "document.pdf",
    "bytes": 1024567,
    "date": "2026-06-27T10:30:00.000Z",
    "mimeType": "application/pdf",
    "previews": [],
    "isUpload": true
  }
]
```

**Use Cases:**
- Audit trail (track all attachments)
- Backup (download all attachments)
- Sync (mirror attachments to another system)
- Analytics (count attachments per card)

---

## 📋 Copy Card Implementation

### Overview

**Priority:** HIGH (Phase 1)  
**Complexity:** LOW  
**TRELLO MCP Status:** ✅ Has `copy_card`  
**KAEDE Status:** ❌ Missing  
**Action:** Port from TRELLO MCP

### API Endpoint

```
POST /cards/{id}/copy
Body: {
  name?: string,
  desc?: string,
  idList?: string,
  keepFromSource?: string,  // "all" or comma-separated list
  pos?: number | "top" | "bottom"
}
```

### Tool Specification

**copy_card**

**Purpose:** Copy/duplicate a Trello card to any list (even on a different board).

**Parameters:**
```typescript
{
  sourceCardId: string,    // Required: ID of source card
  listId: string,          // Required: ID of destination list
  name?: string,           // Optional: Override name
  description?: string,    // Optional: Override description
  keepFromSource?: string, // Optional: "all" or "attachments,checklists,comments,customFields,due,start,labels,members,stickers"
  pos?: string,            // Optional: "top", "bottom", or number
}
```

**Implementation:**
```javascript
this.server.registerTool(
  'copy_card',
  {
    title: 'Copy Card',
    description: 'Copy/duplicate a Trello card to any list (even on different board)',
    inputSchema: {
      sourceCardId: z.string().describe('Source card ID'),
      listId: z.string().describe('Destination list ID'),
      name: z.string().optional().describe('Override name'),
      description: z.string().optional().describe('Override description'),
      keepFromSource: z.string().optional().describe('Properties to copy: "all" or comma-separated list'),
      pos: z.string().optional().describe('Position: "top", "bottom", or number'),
    },
  },
  async ({ sourceCardId, listId, name, description, keepFromSource, pos }) => {
    try {
      const card = await this.trelloClient.copyCard({
        sourceCardId,
        listId,
        name,
        description,
        keepFromSource,
        pos,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

### keepFromSource Options

| Value | Copies |
|-------|--------|
| `"all"` | Everything (default) |
| `"attachments"` | Only attachments |
| `"checklists"` | Only checklists |
| `"comments"` | Only comments |
| `"customFields"` | Only custom fields |
| `"due"` | Due date only |
| `"start"` | Start date only |
| `"labels"` | Only labels |
| `"members"` | Only members |
| `"stickers"` | Only stickers |
| `"due,start,labels"` | Due date, start date, and labels |

### Edge Cases

**Missing Properties:**
```javascript
// If source card has no attachments, don't fail
// Just copy what exists
```

**Permission Issues:**
```javascript
// If user doesn't have access to destination list
// Throw clear error: "No permission to add cards to this list"
```

**Circular References:**
```javascript
// If copying a card that contains mirror links
// Don't copy mirror links (would create infinite loop)
```

### Test Scenarios

```javascript
describe('copy_card', () => {
  it('should copy card with all properties', async () => {
    const result = await client.copyCard({
      sourceCardId: 'card123',
      listId: 'list456',
      keepFromSource: 'all'
    });
    expect(result).toHaveProperty('id');
    expect(result.name).toContain('Copy of');
  });

  it('should copy to different board', async () => {
    const result = await client.copyCard({
      sourceCardId: 'card123',
      listId: 'list789',  // Different board
    });
    expect(result.idBoard).not.toBe('board123');
  });

  it('should copy only specified properties', async () => {
    const result = await client.copyCard({
      sourceCardId: 'card123',
      listId: 'list456',
      keepFromSource: 'due,labels'
    });
    // Should have due date and labels
    // Should NOT have attachments, checklists, etc.
  });

  it('should override name', async () => {
    const result = await client.copyCard({
      sourceCardId: 'card123',
      listId: 'list456',
      name: 'Custom Name'
    });
    expect(result.name).toBe('Custom Name');
  });
});
```

---

## ✅ Checklist Enhancements

### Overview

**Priority:** MEDIUM (Phase 2)  
**Complexity:** LOW-MEDIUM  
**TRELLO MCP Status:** ✅ Has 9 checklist tools  
**KAEDE Status:** ⚠️ Partial (only 2 tools)  
**Action:** Port missing tools + add `get_card_checklists` (new contribution)

### Tools to Implement

1. `delete_checklist` — Remove checklist from card
2. `delete_checklist_item` — Remove item from checklist
3. `update_checklist_item` — Update state, name, position, due, reminder, member
4. `get_card_checklists` — **NEW CONTRIBUTION** (missing from TRELLO MCP!)

---

### delete_checklist

**API Endpoint:**
```
DELETE /checklists/{id}
```

**Implementation:**
```javascript
this.server.registerTool(
  'delete_checklist',
  {
    title: 'Delete Checklist',
    description: 'Delete a checklist from a card',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      checklistId: z.string().describe('Checklist ID'),
    },
  },
  async ({ cardId, checklistId }) => {
    try {
      await this.trelloClient.deleteChecklist(checklistId);
      return {
        content: [{ type: 'text', text: `Checklist ${checklistId} deleted successfully` }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

---

### delete_checklist_item

**API Endpoint:**
```
DELETE /checklists/{idChecklist}/checkItems/{idCheckItem}
```

**Implementation:**
```javascript
this.server.registerTool(
  'delete_checklist_item',
  {
    title: 'Delete Checklist Item',
    description: 'Delete a checklist item from a card',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      checklistId: z.string().describe('Checklist ID'),
      itemId: z.string().describe('Checklist item ID'),
    },
  },
  async ({ cardId, checklistId, itemId }) => {
    try {
      await this.trelloClient.deleteChecklistItem(checklistId, itemId);
      return {
        content: [{ type: 'text', text: `Item ${itemId} deleted successfully` }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

---

### update_checklist_item

**API Endpoint:**
```
PUT /checklists/{idChecklist}/checkItems/{idCheckItem}
Body: {
  name?: string,
  state?: 'complete' | 'incomplete',
  pos?: number | 'top' | 'bottom',
  due?: string | null,
  dueReminder?: number | null,
  idMember?: string | null
}
```

**Implementation:**
```javascript
this.server.registerTool(
  'update_checklist_item',
  {
    title: 'Update Checklist Item',
    description: 'Update checklist item name, state, position, due date, reminder, or member',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      checklistId: z.string().describe('Checklist ID'),
      itemId: z.string().describe('Item ID'),
      name: z.string().optional().describe('New item text'),
      state: z.enum(['complete', 'incomplete']).optional().describe('Item state'),
      pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position'),
      due: z.string().nullable().optional().describe('Due date (ISO 8601)'),
      dueReminder: z.number().nullable().optional().describe('Reminder in minutes'),
      idMember: z.string().nullable().optional().describe('Member ID to assign'),
    },
  },
  async ({ cardId, checklistId, itemId, name, state, pos, due, dueReminder, idMember }) => {
    try {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (state !== undefined) updates.state = state;
      if (pos !== undefined) updates.pos = pos;
      if (due !== undefined) updates.due = due;
      if (dueReminder !== undefined) updates.dueReminder = dueReminder;
      if (idMember !== undefined) updates.idMember = idMember;

      const item = await this.trelloClient.updateChecklistItem(checklistId, itemId, updates);
      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

---

### get_card_checklists (NEW CONTRIBUTION)

**Purpose:** Get all checklists from a card with items and completion percentage.

**API Endpoint:**
```
GET /cards/{id}/checklists
```

**Implementation:**
```javascript
this.server.registerTool(
  'get_card_checklists',
  {
    title: 'Get Card Checklists',
    description: 'Get all checklists from a card with items and completion percentage',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
    },
  },
  async ({ cardId }) => {
    try {
      const checklists = await this.trelloClient.getCardChecklists(cardId);
      return {
        content: [{ type: 'text', text: JSON.stringify(checklists, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Response:**
```json
[
  {
    "id": "checklist123",
    "name": "Acceptance Criteria",
    "checkItems": [
      {
        "id": "item1",
        "name": "Test login flow",
        "state": "complete",
        "due": "2026-06-30T12:00:00.000Z",
        "dueReminder": 1440
      },
      {
        "id": "item2",
        "name": "Test logout",
        "state": "incomplete"
      }
    ],
    "percentComplete": 50
  }
]
```

---

## 🆕 Advanced Features

### watch_card

**API Endpoint:**
```
POST /cards/{id}/subscribed
Body: { value: true | false }
```

**Implementation:**
```javascript
this.server.registerTool(
  'watch_card',
  {
    title: 'Watch Card',
    description: 'Subscribe or unsubscribe to card activity',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      watch: z.boolean().describe('true to watch, false to unwatch'),
    },
  },
  async ({ cardId, watch }) => {
    try {
      const card = await this.trelloClient.watchCard(cardId, watch);
      return {
        content: [{ 
          type: 'text', 
          text: `Successfully ${watch ? 'subscribed to' : 'unsubscribed from'} card ${card.name}`,
        }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

---

### watch_list

**API Endpoint:**
```
POST /lists/{id}/subscribed
Body: { value: true | false }
```

---

### get_card_activity

**API Endpoint:**
```
GET /cards/{id}/actions?filter={filter}&limit={limit}
```

---

### search_labels

**Implementation:**
```javascript
this.server.registerTool(
  'search_labels',
  {
    title: 'Search Labels',
    description: 'Search for labels by name (case-insensitive)',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      query: z.string().describe('Search query'),
    },
  },
  async ({ boardId, query }) => {
    try {
      const allLabels = await this.trelloClient.getBoardLabels(boardId);
      const filtered = allLabels.filter(label =>
        label.name.toLowerCase().includes(query.toLowerCase())
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

---

### remove_label_from_card

**API Endpoint:**
```
DELETE /cards/{id}/idLabels/{idLabel}
```

---

## 📋 Additional Enhancements (Phase 4+)

These features are additional enhancements that can be implemented after Phases 1-3 are complete.

### Copy Checklist

**Purpose:** Copy a checklist (with all items) from one card to another.

**API Endpoint:**
```
POST /checklists/{id}/copy
Body: {
  idCard: string,
  name?: string,
  pos?: number | "top" | "bottom"
}
```

**Tool Specification:**
```javascript
this.server.registerTool(
  'copy_checklist',
  {
    title: 'Copy Checklist',
    description: 'Copy a checklist with all items from one card to another',
    inputSchema: {
      sourceChecklistId: z.string().describe('Source checklist ID'),
      targetCardId: z.string().describe('Target card ID'),
      name: z.string().optional().describe('Override checklist name'),
      pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position'),
    },
  },
  async ({ sourceChecklistId, targetCardId, name, pos }) => {
    try {
      const checklist = await this.trelloClient.copyChecklist({
        sourceChecklistId,
        targetCardId,
        name,
        pos,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(checklist, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Use Cases:**
- Template checklists (QA, Definition of Done, Sprint Planning)
- Reuse checklist structure across cards
- Standardize processes

---

### Copy List

**Purpose:** Copy an entire list (with all cards) to another board.

**API Endpoint:**
```
POST /lists/{id}/copy
Body: {
  idBoard: string,
  name?: string,
  keepCards?: boolean,
  pos?: number | "top" | "bottom"
}
```

**Tool Specification:**
```javascript
this.server.registerTool(
  'copy_list',
  {
    title: 'Copy List',
    description: 'Copy an entire list with all cards to another board',
    inputSchema: {
      listId: z.string().describe('Source list ID'),
      targetBoardId: z.string().describe('Target board ID'),
      name: z.string().optional().describe('Override list name'),
      keepCards: z.boolean().optional().default(true).describe('Copy cards too'),
      pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position'),
    },
  },
  async ({ listId, targetBoardId, name, keepCards, pos }) => {
    try {
      const list = await this.trelloClient.copyList({
        listId,
        targetBoardId,
        name,
        keepCards,
        pos,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(list, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Edge Cases:**
- Large lists (100+ cards) — May take time
- Permissions — User must have write access to target board
- Card attachments — Copied but may take longer

---

### Move List

**Purpose:** Move a list to a different board.

**API Endpoint:**
```
PUT /lists/{id}
Body: {
  idBoard: string,
  pos?: number | "top" | "bottom"
}
```

**Tool Specification:**
```javascript
this.server.registerTool(
  'move_list',
  {
    title: 'Move List',
    description: 'Move an entire list to a different board',
    inputSchema: {
      listId: z.string().describe('List ID to move'),
      targetBoardId: z.string().describe('Target board ID'),
      pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position'),
    },
  },
  async ({ listId, targetBoardId, pos }) => {
    try {
      const list = await this.trelloClient.moveList(listId, targetBoardId, pos);
      return {
        content: [{ type: 'text', text: JSON.stringify(list, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Use Cases:**
- Reorganize boards
- Archive old sprint lists to separate board
- Merge boards

---

### Sort List

**Purpose:** Sort cards in a list by various criteria.

**Implementation:** Client-side sorting + batch position updates

**Tool Specification:**
```javascript
this.server.registerTool(
  'sort_list',
  {
    title: 'Sort List',
    description: 'Sort cards in a list by various criteria',
    inputSchema: {
      listId: z.string().describe('List ID to sort'),
      sortBy: z.enum(['dueDate', 'name', 'createdAt', 'lastActivity']).describe('Sort criteria'),
      order: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
    },
  },
  async ({ listId, sortBy, order }) => {
    try {
      // Get all cards in list
      const cards = await this.trelloClient.getCardsByList(listId);
      
      // Sort client-side
      const sorted = cards.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'dueDate') {
          comparison = (a.due || '').localeCompare(b.due || '');
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'createdAt') {
          comparison = (a.dateLastActivity || '').localeCompare(b.dateLastActivity || '');
        }
        return order === 'asc' ? comparison : -comparison;
      });
      
      // Update positions in batch
      const updates = sorted.map((card, index) => ({
        cardId: card.id,
        pos: (index + 1) * 1024, // Trello uses fractional indexing
      }));
      
      await Promise.all(updates.map(u => 
        this.trelloClient.updateCard(u.cardId, { pos: u.pos })
      ));
      
      return {
        content: [{ type: 'text', text: `Successfully sorted ${sorted.length} cards by ${sortBy} (${order})` }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Performance Considerations:**
- Batch updates to avoid rate limiting
- Max 100 cards per sort (Trello API limit)
- For larger lists, implement pagination

---

### Share Card (Evaluate Feasibility)

**Purpose:** Generate a shareable link for a card.

**Status:** ⚠️ **Requires evaluation** — May be Power-Up feature

**Potential API:**
```
GET /cards/{id}/share
```

**If Implemented:**
```javascript
this.server.registerTool(
  'share_card',
  {
    title: 'Share Card',
    description: 'Generate a shareable link for a card',
    inputSchema: {
      cardId: z.string().describe('Card ID'),
      public: z.boolean().optional().default(false).describe('Public or organization-only'),
    },
  },
  async ({ cardId, public: isPublic }) => {
    try {
      const shareLink = await this.trelloClient.shareCard(cardId, isPublic);
      return {
        content: [{ type: 'text', text: `Share link: ${shareLink}` }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Decision:** Defer until Power-Up dependency is clarified.

---

### Make Template (Evaluate Feasibility)

**Purpose:** Convert a card to a template.

**Status:** ⚠️ **Requires evaluation** — May be Power-Up feature

**Potential API:**
```
POST /cards/{id}/convertToTemplate
```

**If Implemented:**
```javascript
this.server.registerTool(
  'make_template',
  {
    title: 'Make Template',
    description: 'Convert a card to a template',
    inputSchema: {
      cardId: z.string().describe('Card ID to convert'),
    },
  },
  async ({ cardId }) => {
    try {
      const template = await this.trelloClient.makeTemplate(cardId);
      return {
        content: [{ type: 'text', text: `Card converted to template: ${template.url}` }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Decision:** Defer until Power-Up dependency is clarified.

---

### Features to Skip (Power-Up / Complex)

The following features **will not be implemented** in Phases 1-4 because:
- Require a special Power-Up
- High complexity
- Low priority for core KAEDE use cases

| Feature | Reason | Alternative |
|---------|--------|-------------|
| **Create Jira Work Item** | Jira Power-Up required | Use Jira MCP server instead |
| **Mirror Card** | Mirror Power-Up required | Manual copy + link |
| **Butler Automation** | Separate Butler API | Use Trello Butler UI |
| **Custom Fields** | Standard plan required | Use labels + descriptions |
| **Recurring Cards** | Power-Up feature | Manual copy + due date |
| **Stickers** | Low priority | Use emojis in descriptions |
| **Voting** | Power-Up feature | Manual tracking |
| **Reactions** | Power-Up feature | Comments instead |

**Note:** If there is strong demand from users, these features can be re-evaluated for Phase 5+.

---

## 📊 Updated Priority Matrix

With the addition of Phase 4 features, the priority matrix is updated to:

```
Impact ↑
│
│  PHASE 1 (Week 1-2)               PHASE 2 (Week 3)
│  • Attachments (5 tools)           • Delete checklist/item
│  • Copy Card (1 tool)              • Update checklist item
│  • Due Reminders                   • Get card checklists
│
│  PHASE 3 (Week 4-5)                PHASE 4 (Week 9-10, Optional)
│  • Watch card/list                 • Copy checklist
│  • Get card activity               • Copy list
│  • Search labels                   • Move list
│  • Remove label from card          • Sort list
│                                    • Share card (evaluate)
│                                    • Make template (evaluate)
│
│  SKIP (Power-Up / Complex)
│  • Jira integration
│  • Mirror card
│  • Butler automation
│  • Custom fields
└────────────────────────────────────────────────────────────────────→ Complexity
```

---

## 📅 Timeline (Historical)

Semua fase sudah complete. **Total final: 42 tools** di `packages/kaede-trello` + **55+ tools** di upstream `@delorenj/mcp-server-trello`.

| Phase | Weeks | Tools Added |
|-------|-------|-------------|
| **Phase 1** (Attachments & Copy Card) | 1-2 | 6 tools |
| **Phase 2** (Checklist Enhancements) | 3 | 4 tools |
| **Phase 3** (Watch & Activity) | 4-5 | 5 tools |
| **Phase 4** (Sort & List Mgmt) | 6-7 | 3 tools |
| **Upstream PRs** | 8-10 | 3 PRs submitted |

**PR ke delorenj:**
- [#98](https://github.com/delorenj/mcp-server-trello/pull/98) — `get_card_attachments`, `get_card_checklists`
- [#99](https://github.com/delorenj/mcp-server-trello/pull/99) — `watch_card`, `watch_list`
- [#100](https://github.com/delorenj/mcp-server-trello/pull/100) — `search_labels`, `remove_label_from_card`

---

## 📞 Contact & Support

### Test Board Setup

**Board:** `https://trello.com/b/rAKmlRj3/lab-testing-kaede`

**Test Cards Structure:**
```
List: Test Attachments
  - Card: Test URL attachment
  - Card: Test local file attachment
  - Card: Test base64 attachment

List: Test Copy Card
  - Card: Source card (with labels, members, checklists)
  - Card: Copy destination

List: Test Checklists
  - Card: Test create/update/delete checklist
  - Card: Test checklist items

List: Test Watch
  - Card: Test watch/unwatch
```

### Automated Tests

**Test Scripts:**
- `test/attachments.test.js`
- `test/copy-card.test.js`
- `test/checklist-enhancements.test.js`
- `test/advanced-features.test.js`

### Manual Testing Checklist

**For Each Tool:**
- [ ] Happy path (normal usage)
- [ ] Error handling (invalid input)
- [ ] Edge cases (empty results, large datasets)
- [ ] Rate limiting (many rapid calls)
- [ ] Permission issues (read-only access)

---

## 📊 API Reference

### Complete Mapping

| Tool | API Endpoint | Method |
|------|--------------|--------|
| `attach_file_to_card` | `/cards/{id}/attachments` | POST |
| `attach_image_to_card` | `/cards/{id}/attachments` | POST |
| `attach_data_to_card` | `/cards/{id}/attachments` | POST (multipart) |
| `attach_image_data_to_card` | `/cards/{id}/attachments` | POST (multipart) |
| `get_card_attachments` | `/cards/{id}/attachments` | GET |
| `copy_card` | `/cards/{id}/copy` | POST |
| `delete_checklist` | `/checklists/{id}` | DELETE |
| `delete_checklist_item` | `/checklists/{id}/checkItems/{idItem}` | DELETE |
| `update_checklist_item` | `/checklists/{id}/checkItems/{idItem}` | PUT |
| `get_card_checklists` | `/cards/{id}/checklists` | GET |
| `watch_card` | `/cards/{id}/subscribed` | POST |
| `watch_list` | `/lists/{id}/subscribed` | POST |
| `get_card_activity` | `/cards/{id}/actions` | GET |
| `search_labels` | `/boards/{id}/labels` | GET (filter) |
| `remove_label_from_card` | `/cards/{id}/idLabels/{idLabel}` | DELETE |

---

## 📞 Contact & Support

**For Questions:**
- GitHub Issues: [kaede-powerup/issues](https://github.com/konxc/kaede-powerup/issues)
- Email: sandiko@koneksi.id

**For Contributors:**
- Read [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html)
- Check [`DEVELOPMENT-ROADMAP.md`](DEVELOPMENT-ROADMAP.html)
- Start with small PRs

---

**Last Updated:** June 2026  
**Version:** 1.0.0  
**Next Review:** After Phase 1 complete  
**Status:** In Development

---

*This document is part of the KAEDE Power-Up documentation suite. For the latest version, visit the [official documentation](index.html).*
