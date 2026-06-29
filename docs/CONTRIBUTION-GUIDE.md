# Contribution Guide — Upstream to TRELLO MCP

> **Complete guide for upstream contributors to delorenj/mcp-server-trello.**

**Version:** 1.0.0  
**Last Updated:** June 29, 2026  
**Maintained by:** Sandikodev  
**Status:** Active

---

## 📋 Overview

### Why Contribute Upstream?

Contributing to `delorenj/mcp-server-trello` is a strategic decision that provides benefits:

**For KAEDE Ecosystem:**
- ✅ Avoid maintaining duplicate code long-term
- ✅ Reduce maintenance burden
- ✅ Focus on orchestration (core competency)
- ✅ Establish credibility in MCP community

**For the Community:**
- ✅ Share improvements with other users
- ✅ Set the standard for Trello MCP implementations
- ✅ Build collaborative relationships
- ✅ Accelerate ecosystem growth

**For Sandikodev:**
- ✅ Active contributor status
- ✅ Influence project direction
- ✅ Early access to new features
- ✅ Network with MCP developers

---

## 🎯 Preparation

### Understanding TRELLO MCP Codebase

Before contributing, understand the architecture and code style:

#### Architecture Overview

```
mcp-server-trello/
├── src/
│   ├── index.ts              # Main server (45+ tools)
│   ├── trello-client.ts      # API client wrapper
│   ├── types.ts              # TypeScript interfaces
│   ├── rate-limiter.ts       # Token bucket algorithm
│   ├── url-validator.ts      # URL validation
│   ├── card-list-preview.ts  # Response formatting
│   ├── health/               # Health monitoring
│   └── trello/
│       └── attachments.ts    # Attachment utilities
│
├── test/
│   ├── trello-client.test.ts
│   └── trello/
│       └── attachments.test.ts
│
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── README.md                 # Documentation
```

#### Code Style

**TypeScript + Strict Typing:**
```typescript
// Use TypeScript for all new code
// 2 spaces for indentation
// Strict null checks enabled

interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  bytes: number | null;
  // ... more fields
}
```

**Zod Validation:**
```typescript
import { z } from 'zod';

this.server.registerTool(
  'attach_file_to_card',
  {
    title: 'Attach File to Card',
    description: 'Attach any file to a card from a URL',
    inputSchema: {
      boardId: z.string().optional().describe('Board ID'),
      cardId: z.string().describe('Card ID'),
      fileUrl: z.string().describe('File URL'),
      name: z.string().optional().describe('Attachment name'),
      mimeType: z.string().optional().describe('MIME type'),
    },
  },
  async ({ boardId, cardId, fileUrl, name, mimeType }) => {
    // Implementation
  }
);
```

**Error Handling:**
```typescript
try {
  const attachment = await this.trelloClient.attachFileToCard(
    boardId, cardId, fileUrl, name, mimeType
  );
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(attachment, null, 2) }],
  };
} catch (error) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    ],
    isError: true,
  };
}
```

#### Testing Framework

**Vitest (Fast, Vite-native):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrelloClient } from '../trello-client';

describe('TrelloClient', () => {
  describe('attachFileToCard', () => {
    it('should attach file from URL', async () => {
      const client = new TrelloClient({ apiKey: 'test', token: 'test' });
      const result = await client.attachFileToCard(
        'board123', 'card456', 'https://example.com/file.pdf'
      );
      expect(result).toBeDefined();
      expect(result.url).toContain('trello.com');
    });
  });
});
```

#### Build Process

**Bun (Recommended):**
```bash
# Install dependencies
bun install

# Build
bun run build

# Test
bun test

# Release
bun run release
```

---

### KAEDE Adaptation Layer

Since KAEDE uses **Vanilla JavaScript + fetch**, while TRELLO MCP uses **TypeScript + Axios**, adaptation is needed:

#### JavaScript → TypeScript Migration

**KAEDE Style (JavaScript + fetch):**
```javascript
// src/mcp-server.js
async function trello(path, opts = {}) {
  const auth = getAuth();
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}${auth.qs}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: opts.headers || {},
    body: opts.body || undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trello API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}
```

**TRELLO MCP Style (TypeScript + Axios):**
```typescript
// src/trello-client.ts
private async trelloRequest<T>(method: string, path: string, data?: any): Promise<T> {
  await this.rateLimiter.waitForAvailableToken();
  const response = await this.axiosInstance({ method, url: path, data });
  return response.data as T;
}
```

#### Adaptation Strategy

**Option 1: Port to TypeScript (Recommended)**
```typescript
// Convert KAEDE code to TypeScript
// Use same patterns as TRELLO MCP
// Easier upstream integration

// src/trello/attachments.ts (TypeScript)
import { AxiosInstance } from 'axios';
import { TrelloAttachment } from '../types';

export async function attachFile(
  axiosInstance: AxiosInstance,
  { cardId, fileUrl, name, mimeType }: AttachFileParams
): Promise<TrelloAttachment> {
  // Implementation
}
```

**Option 2: Maintain JavaScript Compatibility Layer**
```javascript
// Keep KAEDE in JavaScript
// Create adapter for TRELLO MCP compatibility
// More maintenance overhead

// src/trello/attachments.js (JavaScript)
export async function attachFile(
  trelloClient,  // KAEDE's fetch-based client
  { cardId, fileUrl, name, mimeType }
) {
  // Implementation with fetch
}
```

**Recommendation:** Option 1 (TypeScript) for easier upstream integration.

---

## 📤 Pull Request Workflow

### PR #1: Missing Convenience Methods

**Title:** `feat: Add get_card_attachments and get_card_checklists tools`

#### Rationale

Currently, users cannot retrieve attachments or checklists without fetching full card data. This creates:
- Unnecessary API calls
- Larger responses than needed
- Complexity for simple use cases

#### Implementation Plan

**Files to Modify:**
- `src/index.ts` — Add tool registrations
- `src/trello-client.ts` — Add methods
- `test/trello-client.test.ts` — Add tests
- `README.md` — Add documentation

**Tool 1: get_card_attachments**
```typescript
this.server.registerTool(
  'get_card_attachments',
  {
    title: 'Get Card Attachments',
    description: 'Retrieve all attachments from a specific card',
    inputSchema: {
      cardId: z.string().describe('ID of the card'),
      limit: z.number().optional().default(100).describe('Max attachments'),
    },
  },
  async ({ cardId, limit }) => {
    try {
      const attachments = await this.trelloClient.getCardAttachments(cardId, limit);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(attachments, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Tool 2: get_card_checklists**
```typescript
this.server.registerTool(
  'get_card_checklists',
  {
    title: 'Get Card Checklists',
    description: 'Get all checklists from a card with items and completion percentage',
    inputSchema: {
      cardId: z.string().describe('ID of the card'),
    },
  },
  async ({ cardId }) => {
    try {
      const checklists = await this.trelloClient.getCardChecklists(cardId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(checklists, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

#### Test Scenarios

```typescript
describe('get_card_attachments', () => {
  it('should return array of attachments', async () => {
    const attachments = await client.getCardAttachments('card123');
    expect(Array.isArray(attachments)).toBe(true);
    expect(attachments[0]).toHaveProperty('id');
    expect(attachments[0]).toHaveProperty('url');
  });

  it('should respect limit parameter', async () => {
    const attachments = await client.getCardAttachments('card123', 5);
    expect(attachments.length).toBeLessThanOrEqual(5);
  });
});

describe('get_card_checklists', () => {
  it('should return checklists with items', async () => {
    const checklists = await client.getCardChecklists('card123');
    expect(Array.isArray(checklists)).toBe(true);
    expect(checklists[0]).toHaveProperty('checkItems');
    expect(checklists[0]).toHaveProperty('percentComplete');
  });
});
```

---

### PR #2: Watch Features

**Title:** `feat: Add watch_card and watch_list tools for activity tracking`

#### Rationale

Users often want to follow card/list activity without manual checking. This enables:
- Automated notifications
- Activity tracking workflows
- Audit trail monitoring

#### Implementation Plan

**Tool 1: watch_card**
```typescript
this.server.registerTool(
  'watch_card',
  {
    title: 'Watch Card',
    description: 'Subscribe or unsubscribe to card activity notifications',
    inputSchema: {
      cardId: z.string().describe('ID of the card'),
      watch: z.boolean().describe('true to watch, false to unwatch'),
    },
  },
  async ({ cardId, watch }) => {
    try {
      const card = await this.trelloClient.watchCard(cardId, watch);
      return {
        content: [{ 
          type: 'text' as const, 
          text: `Successfully ${watch ? 'subscribed to' : 'unsubscribed from'} card ${card.name}`,
        }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**API Endpoint:**
```
POST /cards/{id}/subscribed
Body: { value: true | false }
```

**Tool 2: watch_list**
```typescript
this.server.registerTool(
  'watch_list',
  {
    title: 'Watch List',
    description: 'Subscribe or unsubscribe to list activity notifications',
    inputSchema: {
      listId: z.string().describe('ID of the list'),
      watch: z.boolean().describe('true to watch, false to unwatch'),
    },
  },
  async ({ listId, watch }) => {
    try {
      const list = await this.trelloClient.watchList(listId, watch);
      return {
        content: [{ 
          type: 'text' as const, 
          text: `Successfully ${watch ? 'subscribed to' : 'unsubscribed from'} list ${list.name}`,
        }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**API Endpoint:**
```
POST /lists/{id}/subscribed
Body: { value: true | false }
```

#### Use Cases

```typescript
// Use Case 1: Auto-notify on card activity
await mcp.trello.watch_card({ cardId: 'abc123', watch: true });
// → Receive notifications when card is updated

// Use Case 2: Track sprint list changes
await mcp.trello.watch_list({ listId: 'sprint-25', watch: true });
// → Monitor all cards added/removed from sprint

// Use Case 3: Audit trail
await mcp.trello.watch_card({ cardId: 'critical-bug', watch: true });
// → Log all changes for compliance
```

---

### PR #3: Label Management Enhancement

**Title:** `feat: Add search_labels and remove_label_from_card convenience tools`

#### Rationale

**search_labels:** Quality of life improvement for finding specific labels in large boards.

**remove_label_from_card:** More convenient than updating all labels array.

#### Implementation Plan

**Tool 1: search_labels**
```typescript
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
        content: [{ type: 'text' as const, text: JSON.stringify(filtered, null, 2) }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**Tool 2: remove_label_from_card**
```typescript
this.server.registerTool(
  'remove_label_from_card',
  {
    title: 'Remove Label from Card',
    description: 'Remove a single label from a card',
    inputSchema: {
      cardId: z.string().describe('ID of the card'),
      labelId: z.string().describe('ID of the label to remove'),
    },
  },
  async ({ cardId, labelId }) => {
    try {
      // Get current labels
      const card = await this.trelloClient.getCard(cardId);
      const currentLabels = card.labels || [];
      
      // Remove the specified label
      const newLabelIds = currentLabels
        .filter(l => l.id !== labelId)
        .map(l => l.id);
      
      // Update card with new labels
      await this.trelloClient.updateCard(cardId, { labels: newLabelIds });
      
      return {
        content: [{ 
          type: 'text' as const, 
          text: `Successfully removed label from card ${card.name}`,
        }],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
);
```

**API Endpoint:**
```
DELETE /cards/{id}/idLabels/{idLabel}
```

---

## 🧪 Testing Requirements

### Unit Tests (Vitest)

**Structure:**
```typescript
describe('ToolName', () => {
  describe('Success Cases', () => {
    it('should do X when Y', async () => {
      // Test implementation
    });
  });

  describe('Error Cases', () => {
    it('should throw error when invalid input', async () => {
      // Test implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle Z scenario', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests (Live Trello API)

**Setup:**
```typescript
// test/helpers/test-board.ts
export const TEST_BOARD_ID = process.env.TEST_BOARD_ID || 'rAKmlRj3';
export const TEST_CARD_ID = process.env.TEST_CARD_ID || 'test-card-1';

beforeEach(async () => {
  // Setup test data
  await setupTestData();
});

afterEach(async () => {
  // Cleanup test data
  await cleanupTestData();
});
```

### Manual Testing Checklist

**For Each Tool:**
- [ ] Happy path (normal usage)
- [ ] Error handling (invalid input)
- [ ] Edge cases (empty results, large datasets)
- [ ] Rate limiting (many rapid calls)
- [ ] Permission issues (read-only access)

---

## 📝 Communication Templates

### Initial Outreach Message

```markdown
Hi @delorenj! 👋

I've been using your amazing Trello MCP server for my KAEDE project 
(Trello + Playbook + AI Agent integration) and noticed a few missing 
features that would be really helpful for the community.

I've prepared 3 small PRs with comprehensive tests and documentation:

1. **get_card_attachments & get_card_checklists** — Missing data retrieval tools
   - Users currently can't fetch attachments/checklists without full card data
   - Adds 2 convenience methods with tests

2. **watch_card & watch_list** — Activity tracking features
   - Enables automated notifications and audit trails
   - Common request in Trello community

3. **search_labels & remove_label_from_card** — Quality of life improvements
   - Makes label management much easier
   - Follows existing code patterns

All PRs:
✅ Follow existing code style (TypeScript + Zod)
✅ Include comprehensive vitest tests
✅ Update README.md documentation
✅ No breaking changes

Would love your feedback! These enhancements would really help the 
KAEDE ecosystem and I believe other users would benefit too.

Thanks for maintaining this awesome project! 🙏

Best regards,
Sandikodev
PT Koneksi Jaringan Indonesia
GitHub: @Sandikodev
```

### PR Description Template

```markdown
## Description

Add [tool names] for [purpose].

This PR adds [X] new tools to [category]:
- `tool_name_1` — Description
- `tool_name_2` — Description

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [x] Tests added/updated (vitest)
- [x] Manual testing completed
- [x] All tests passing
- [x] Test coverage: XX%

## Checklist

- [x] Code follows project guidelines (TypeScript, 2 spaces, Zod validation)
- [x] Self-review completed
- [x] Comments added where necessary
- [x] Documentation updated (README.md)
- [x] No breaking changes
- [x] Backward compatible

## Related Issue

Closes #XXX (if applicable)

## Additional Context

[Use case examples, API references, etc.]
```

### Follow-up Message (After 1 Week)

```markdown
Hi @delorenj! 

Just wanted to follow up on these PRs (#XXX, #YYY, #ZZZ). Happy to make 
any changes you'd like to see!

Also, if there's a better way to structure these or if you'd prefer to 
combine them into a single PR, just let me know.

Thanks again for maintaining this project! 🙏
```

---

## 🔄 After Merge

### Sync KAEDE with Upstream

**Step 1: Update Dependencies**
```bash
# Update package.json
npm update @delorenj/mcp-server-trello

# Or with Bun
bun update @delorenj/mcp-server-trello
```

**Step 2: Remove Duplicate Implementations**
```bash
# Remove ported code from KAEDE
rm src/trello/attachments.js  # If upstream has it now

# Update imports
# Use upstream tools directly
```

**Step 3: Update Documentation**
```markdown
# Update docs/tools.md
# Add note: "This tool is now available in upstream TRELLO MCP v1.X.X"
# Link to upstream documentation
```

**Step 4: Version Bump**
```bash
npm version minor
git push origin main
git push origin --tags
```

---

## ❌ If PRs Not Merged

### Maintain KAEDE Fork

**Step 1: Document Divergence**
```markdown
# Create docs/UPSTREAM-DIFFERENCES.md
# List all features not in upstream
# Explain why fork is maintained
```

**Step 2: Publish Fork**
```bash
# Publish to npm
npm publish --scope @kaede/mcp-server-trello

# Update documentation
# Provide installation instructions for fork
```

**Step 3: Continue Engagement**

**Week 1:** Gentle follow-up
```markdown
Hi @delorenj! Just checking in on these PRs. Any feedback?
```

**Week 2:** Offer to take over maintenance
```markdown
Hi @delorenj! I notice you've been busy lately. Would you be open to 
additional maintainers for this project? I'd be happy to help review 
PRs and manage issues.
```

**Week 3:** Consider alternative distribution
```markdown
# If no response after 3 weeks:
# - Maintain fork
# - Document clearly
# - Support both versions
```

---

## 📊 Decision Log

### Why TypeScript for Contributions?

**Decision:** Use TypeScript for all upstream contributions  
**Date:** June 2026  
**Rationale:**
- TRELLO MCP codebase is TypeScript
- Better type safety
- Easier code review
- Aligns with project standards
- KAEDE can maintain JavaScript compatibility layer

### Why Separate PRs?

**Decision:** Submit 3 separate PRs (not one monolithic PR)  
**Date:** June 2026  
**Rationale:**
- Easier to review (smaller diffs)
- Can merge independently
- Less risk of conflicts
- Clearer git history
- Maintainer can prioritize

### Why Not Custom Fields?

**Decision:** Skip custom fields contribution  
**Date:** June 2026  
**Rationale:**
- Requires Trello Standard plan
- Not all users have access
- Power-Up feature (complex)
- Low priority for core use cases
- Can be added later if needed

### Why Contribute Back?

**Decision:** Actively contribute to upstream (not just fork)  
**Date:** June 2026  
**Rationale:**
- Avoid long-term maintenance burden
- Build community relationships
- Benefit entire ecosystem
- Establish KAEDE credibility
- Align with open source values

---

## 📚 References

### Internal Documents

- [`DEVELOPMENT-ROADMAP.md`](DEVELOPMENT-ROADMAP.html) — Master development plan
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) — Detailed feature specs
- [`tools.md`](tools.html) — KAEDE tools reference

### External Resources

- [TRELLO MCP Repository](https://github.com/delorenj/mcp-server-trello)
- [TRELLO MCP CONTRIBUTING.md](https://github.com/delorenj/mcp-server-trello/blob/main/CONTRIBUTING.md)
- [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Vitest Documentation](https://vitest.dev/)

### Code Examples

- [TRELLO MCP Examples](https://github.com/delorenj/mcp-server-trello/tree/main/examples)
- [KAEDE Test Suite](https://github.com/konxc/kaede-powerup/tree/main/test)

---

## 📞 Contact & Support

**For Questions:**
- GitHub Issues: [delorenj/mcp-server-trello/issues](https://github.com/delorenj/mcp-server-trello/issues)
- KAEDE Discussions: [kaede-powerup/discussions](https://github.com/konxc/kaede-powerup/discussions)
- Email: sandiko@koneksi.id

**For Contributors:**
- Read this guide first
- Check open issues
- Start with small PRs
- Be patient and responsive

**For Maintainers:**
- Thank you for your work! 🙏
- We're here to help
- Let's build something great together

---

**Last Updated:** June 29, 2026  
**Version:** 1.0.0  
**Next Review:** After upstream PRs merged  
**Status:** Active

---

*This document is part of the KAEDE Power-Up documentation suite. For the latest version, visit the [official documentation](index.html).*
