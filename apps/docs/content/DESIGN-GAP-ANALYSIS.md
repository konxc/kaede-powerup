# KAEDE Design Gap Analysis — Read-Only Query Intents

## Problem Statement

**KAEDE tidak punya intent handler untuk read-only queries** (list, view, get). 

`kaede_generate_plan` hanya menangani **action intents**:
- ✅ "buat card" → create_card
- ✅ "pindah" → move_card
- ✅ "assign" → assign_member
- ✅ "tutup sprint" → close_sprint
- ✅ "report" → generate_sprint_report

Tapi **TIDAK ADA** handler untuk:
- ❌ "list boards" / "lihat semua board"
- ❌ "view cards" / "lihat card di list X"
- ❌ "show my tasks" / "kartu saya"
- ❌ "list labels" / "lihat label"

## Root Cause

### Arsitektur Saat Ini

```
┌─────────────────────────────────────────────────────┐
│  mcp.kaede (19 tools)                               │
│  — parse_playbook                                   │
│  — bundle_context                                   │
│  — generate_plan (ACTION intents ONLY) ← GAP HERE  │
│  — enforce_playbook                                 │
│  — detect_duplicates                                │
│  — generate_sprint_report                           │
│  — batch_update_cards                               │
└─────────────────────────────────────────────────────┘
                        ↓ calls
┌─────────────────────────────────────────────────────┐
│  mcp.trello (44 tools)                              │
│  — list_boards ✓                                    │
│  — get_lists ✓                                      │
│  — get_cards_by_list_id ✓                           │
│  — get_my_cards ✓                                   │
│  — get_card ✓                                       │
│  — create_card ✓                                    │
│  — move_card ✓                                      │
│  — assign_member ✓                                  │
│  ... (44 tools total)                               │
└─────────────────────────────────────────────────────┘
```

**Problem:** `mcp.kaede.generate_plan` adalah **action planner**, bukan **query interface**. 

User harus tahu:
- Mau ACTION? → `kaede_generate_plan`
- Mau READ? → Langsung panggil `mcp.trello.*` tools

Ini membingungkan user dan tidak intuitif.

## Impact

1. **User Experience Buruk**: User harus hafal mana action vs read
2. **Inconsistent Interface**: Tidak ada natural language untuk read queries
3. **Underutilized Tools**: `mcp.trello` punya 44 tools bagus, tapi susah diakses
4. **Manual Workaround**: User akhirnya pakai curl/REST API langsung (seperti terjadi tadi)

## Proposed Solutions

### Option A: Add Read Intent Handlers to generate_plan ⭐ RECOMMENDED

Tambahkan intent handlers baru di `src/plan-handlers.ts` untuk read queries:

```typescript
// src/plan-handlers.ts

onPlan(['list boards', 'lihat board', 'show boards', 'daftar board'], (_pb, args) => {
  return [
    {
      action: 'list_boards',
      params: { filter: args.filter || 'all' },
      description: 'List all boards',
    },
  ];
});

onPlan(['view cards', 'lihat card', 'show cards', 'daftar card'], (_pb, args) => {
  return [
    {
      action: 'get_cards_by_list',
      params: { listId: args.listId || args.list || '', boardId: args.boardId },
      description: `View cards in list ${args.list || args.listId}`,
    },
  ];
});

onPlan(['my cards', 'kartu saya', 'my tasks'], (_pb, args) => {
  return [
    {
      action: 'get_my_cards',
      params: {},
      description: 'Get cards assigned to me',
    },
  ];
});

onPlan(['list labels', 'lihat label', 'show labels'], (_pb, args) => {
  return [
    {
      action: 'get_board_labels',
      params: { boardId: args.boardId },
      description: 'List labels on board',
    },
  ];
});
```

**Pros:**
- ✅ Single interface (generate_plan handles everything)
- ✅ Natural language for all operations
- ✅ Consistent with existing pattern
- ✅ Minimal code changes

**Cons:**
- ⚠️ Blurs line between "action planner" vs "query interface"
- ⚠️ Need to handle read results differently (return data, not execute)

### Option B: New MCP Tool — `query_trello`

Buat tool baru di `mcp.kaede` khusus untuk read queries:

```typescript
// src/kaede-mcp-server.ts

toolSchema(
  'query_trello',
  'Execute read-only Trello queries via natural language',
  {
    query: { type: 'string', description: 'Natural language query' },
    boardId: { type: 'string', description: 'Optional board ID context' },
  },
  ['query'],
);

// Handler di src/tool-handlers/query.ts
export async function handleQueryTrello(...) {
  // Parse query → determine which mcp.trello tool to call
  // Execute tool → return results
}
```

**Pros:**
- ✅ Clean separation (actions vs queries)
- ✅ Dedicated query processing logic
- ✅ Can add query optimization/caching

**Cons:**
- ⚠️ More code changes (new tool, new handlers)
- ⚠️ Still two interfaces (generate_plan for actions, query_trello for reads)

### Option C: Unified Intent Router — `kaede_intent`

Buat tool baru yang auto-route berdasarkan intent type:

```typescript
toolSchema(
  'kaede_intent',
  'Execute any Trello intent (action or query) via natural language',
  {
    intent: { type: 'string', description: 'Any natural language intent' },
    args: { type: 'object', description: 'Optional arguments' },
  },
  ['intent'],
);

// Handler auto-detects:
// - If action intent → call generate_plan + execute
// - If read intent → call appropriate mcp.trello tool directly
```

**Pros:**
- ✅ Single unified interface
- ✅ Smart routing based on intent type

**Cons:**
- ⚠️ Significant refactoring needed
- ⚠️ More complex logic

## Recommendation

**Implement Option A first** (quick win, minimal changes), then consider Option C for long-term.

### Implementation Steps (Option A)

1. **Add read intent handlers** to `src/plan-handlers.ts`:
   - `list_boards`
   - `get_cards_by_list`
   - `get_my_cards`
   - `get_board_labels`
   - `get_board_lists`

2. **Update `src/intent-handlers/index.ts`** to handle read intents:
   - Return data instead of execution results
   - Format output for human readability

3. **Update documentation**:
   - Add read intents to supported intent list
   - Update examples in COMPREHENSIVE-GUIDE.md

4. **Test**:
   - Add tests for read intents
   - Verify output formatting

### Files to Modify

| File | Changes |
|------|---------|
| `src/plan-handlers.ts` | Add 5-7 new `onPlan()` handlers for read intents |
| `src/intent-handlers/index.ts` | Add read intent execution logic |
| `src/intent-handlers/query.ts` | NEW — dedicated read query handlers |
| `docs/COMPREHENSIVE-GUIDE.md` | Update supported intents list |
| `test/orchestrator.test.js` | Add tests for read intents |

## Example Usage After Fix

```bash
# CLI
kaede run "list boards"
kaede run "lihat card di list To Do" --board <id>
kaede run "kartu saya"

# AI Agent (via MCP)
⚙kaede_generate_plan [goal=Lihat semua board Entry, Backend, Frontend]
⚙kaede_generate_plan [goal=Tampilkan kartu saya]
⚙kaede_generate_plan [goal=Lihat label di board Frontend]
```

## Conclusion

**Yes, there is a design gap** — KAEDE lacks natural language support for read-only Trello queries. This forces users to either:
1. Remember which tools are action vs read
2. Use raw REST API calls (not ideal)

**Fix is straightforward**: Add read intent handlers following the existing pattern. This maintains consistency while improving UX.