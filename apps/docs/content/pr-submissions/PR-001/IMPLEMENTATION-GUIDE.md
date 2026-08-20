# Implementation Guide — Porting to TRELLO MCP

This guide helps port the get_card_attachments and get_card_checklists tools from KAEDE to delorenj/mcp-server-trello.

---

## 📁 File Structure (TRELLO MCP)

`
mcp-server-trello/
├── src/
│   ├── trello/
│   │   └── attachments.ts       ← Existing (port get_card_attachments here)
│   │   └── checklists.ts        ← NEW (add get_card_checklists here)
│   ├── tools/
│   │   ├── attachments.ts       ← Register get_card_attachments
│   │   └── checklists.ts        ← Register get_card_checklists
│   └── index.ts                 ← Export tools
├── tests/
│   ├── attachments.test.ts      ← Add get_card_attachments tests
│   └── checklists.test.ts       ← Add get_card_checklists tests
└── README.md                    ← Update documentation
`

---

## 🔧 Porting Steps

### Step 1: Add get_card_attachments to src/trello/attachments.ts

**Current KAEDE Implementation (JavaScript):**
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

**TRELLO MCP Version (TypeScript):**
`	ypescript
// src/trello/attachments.ts
export async function getCardAttachments(
  client: TrelloClient,
  cardId: string
): Promise<Attachment[]> {
  const response = await client.get(\/cards/\/attachments\);
  
  return response.map((att: any) => ({
    id: att.id,
    name: att.name,
    url: att.url,
    mimeType: att.mimeType,
    bytes: att.bytes,
    date: att.date,
    isUpload: att.isUpload,
  }));
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  bytes: number;
  date: string;
  isUpload: boolean;
}
`

---

### Step 2: Add get_card_checklists to src/trello/checklists.ts

**Create New File:** src/trello/checklists.ts

`	ypescript
// src/trello/checklists.ts
export async function getCardChecklists(
  client: TrelloClient,
  cardId: string
): Promise<CardChecklist[]> {
  const response = await client.get(\/cards/\/checklists\);
  
  return response.map((cl: any) => ({
    id: cl.id,
    name: cl.name,
    cardId: cl.idCard,
    boardId: cl.idBoard,
    itemCount: cl.checkItems?.length || 0,
    items: cl.checkItems?.map((item: any) => ({
      id: item.id,
      name: item.name,
      checked: item.state === 'complete',
      pos: item.pos,
    })) || [],
  }));
}

export interface CardChecklist {
  id: string;
  name: string;
  cardId: string;
  boardId: string;
  itemCount: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  pos: number;
}
`

---

### Step 3: Register Tools in src/tools/

**src/tools/attachments.ts:**
`	ypescript
import { getCardAttachments } from '../trello/attachments';

export const getCardAttachmentsTool = {
  name: 'get_card_attachments',
  description: 'Get all attachments from a card',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card',
      },
    },
    required: ['cardId'],
  },
  handler: async (args: any, client: TrelloClient) => {
    const attachments = await getCardAttachments(client, args.cardId);
    return { attachments };
  },
};
`

**src/tools/checklists.ts:**
`	ypescript
import { getCardChecklists } from '../trello/checklists';

export const getCardChecklistsTool = {
  name: 'get_card_checklists',
  description: 'Get all checklists on a card with their items',
  inputSchema: {
    type: 'object',
    properties: {
      cardId: {
        type: 'string',
        description: 'ID of the card',
      },
    },
    required: ['cardId'],
  },
  handler: async (args: any, client: TrelloClient) => {
    const checklists = await getCardChecklists(client, args.cardId);
    return { checklists };
  },
};
`

---

### Step 4: Add Tests

**tests/attachments.test.ts:**
`	ypescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TrelloClient } from '../src/trello/client';

describe('get_card_attachments', () => {
  let client: TrelloClient;
  const TEST_CARD_ID = process.env.TEST_CARD_ID || '6a1b170320f6b4aa6ad055a9';

  beforeAll(() => {
    client = new TrelloClient({
      apiKey: process.env.TRELLO_API_KEY!,
      token: process.env.TRELLO_TOKEN!,
    });
  });

  it('should get attachments from card', async () => {
    const result = await getCardAttachments(client, TEST_CARD_ID);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.attachments)).toBe(true);
    
    if (result.attachments.length > 0) {
      const first = result.attachments[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('url');
      expect(first).toHaveProperty('mimeType');
    }
  });

  it('should handle card with no attachments', async () => {
    const EMPTY_CARD_ID = 'empty-card-id';
    const result = await getCardAttachments(client, EMPTY_CARD_ID);
    
    expect(result.attachments).toEqual([]);
  });
});
`

**tests/checklists.test.ts:**
`	ypescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getCardChecklists } from '../src/trello/checklists';
import { TrelloClient } from '../src/trello/client';

describe('get_card_checklists', () => {
  let client: TrelloClient;
  const TEST_CARD_ID = process.env.TEST_CARD_ID || '6a1b170320f6b4aa6ad055a9';

  beforeAll(() => {
    client = new TrelloClient({
      apiKey: process.env.TRELLO_API_KEY!,
      token: process.env.TRELLO_TOKEN!,
    });
  });

  it('should get checklists from card', async () => {
    const result = await getCardChecklists(client, TEST_CARD_ID);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.checklists)).toBe(true);
    
    if (result.checklists.length > 0) {
      const first = result.checklists[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('items');
      expect(Array.isArray(first.items)).toBe(true);
    }
  });

  it('should return checklist items with correct state', async () => {
    const result = await getCardChecklists(client, TEST_CARD_ID);
    
    if (result.checklists.length > 0) {
      const checklist = result.checklists[0];
      if (checklist.items.length > 0) {
        const item = checklist.items[0];
        expect(item).toHaveProperty('checked');
        expect(typeof item.checked).toBe('boolean');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('id');
      }
    }
  });

  it('should handle card with no checklists', async () => {
    const EMPTY_CARD_ID = 'empty-card-id';
    const result = await getCardChecklists(client, EMPTY_CARD_ID);
    
    expect(result.checklists).toEqual([]);
  });
});
`

---

### Step 5: Update README.md

Add to **Available Tools** section:

`markdown
### Data Retrieval Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| \get_card_attachments\ | Get all attachments from a card | cardId (required) |
| \get_card_checklists\ | Get all checklists with items from a card | cardId (required) |
`

Add usage examples:

`markdown
#### get_card_attachments

Retrieve all attachments from a specific card.

**Parameters:**
- \cardId\ (required): ID of the card

**Example:**
\\\javascript
const attachments = await mcp.trello.get_card_attachments({
  cardId: 'abc123'
});

console.log(\Found \ attachments\);
attachments.forEach(att => {
  console.log(\- \ (\)\);
});
\\\

#### get_card_checklists

Retrieve all checklists and their items from a card.

**Parameters:**
- \cardId\ (required): ID of the card

**Example:**
\\\javascript
const result = await mcp.trello.get_card_checklists({
  cardId: 'abc123'
});

result.checklists.forEach(cl => {
  console.log(\Checklist: \\);
  console.log(\  Items: \\);
  cl.items.forEach(item => {
    const status = item.checked ? '✓' : ' ';
    console.log(\  [\] \\);
  });
});
\\\
`

---

## ✅ Porting Checklist

- [ ] Create/update src/trello/attachments.ts
- [ ] Create src/trello/checklists.ts
- [ ] Register tools in src/tools/
- [ ] Add TypeScript interfaces
- [ ] Add vitest tests
- [ ] Update README.md
- [ ] Run tests: \
pm test\
- [ ] Build: \
pm run build\
- [ ] Lint: \
pm run lint\
- [ ] Create PR

---

## 📞 Submission

1. **Fork** delorenj/mcp-server-trello
2. **Create branch:** \eat/get-card-data-tools\
3. **Commit changes** with clear message
4. **Create PR** with description from PR-001-ATTACHMENTS-CHECKLISTS.md
5. **Send outreach message** to maintainer

---

**Status:** 🟡 Ready to Port  
**Source:** KAEDE MCP (tested & working)  
**Target:** delorenj/mcp-server-trello
