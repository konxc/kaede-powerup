# KAEDE Query Intents — Usage Guide

## Overview

KAEDE now supports **read-only query intents** for natural language access to Trello data. No need to remember tool names or IDs — just use natural language.

## Available Query Intents

### 1. List All Boards

**Patterns:** `list boards`, `lihat board`, `show boards`, `daftar board`, `semua board`

**CLI:**
```bash
kaede run --playbook <path> "list boards"
```

**Output:**
```
✓ list_boards: Found 6 board(s)
  • 🛠️ IT & Infrastructure — https://trello.com/b/HScqrU8P/
  • Entrypoint SMART Presensi — https://trello.com/b/BHXA6ZcR/
  • Fullstack-Backend — https://trello.com/b/wkhcMXZ5/
  • Fullstack-Frontend — https://trello.com/b/eB3YKmer/
  • Lab Testing KAEDE — https://trello.com/b/rAKmlRj3/
  • Sandikodev — https://trello.com/b/QKmmbHXd/
```

---

### 2. My Cards (Assigned to Me)

**Patterns:** `my cards`, `kartu saya`, `tugas saya`, `card saya`

**CLI:**
```bash
kaede run --playbook <path> "my cards"
```

**Output:**
```
✓ report: Found 3 cards assigned to you
  6a21a625ca89f4de01f0712a: 1 items
    • Update UI/UX: Hero, Blog Carousel, & Content System
  6a441568717cb1f2f867fb04: 1 items
    • Masalah Alat (Opencode, Antigravity, Chrome)
  6a3e55da168c3daab0fcbb3a: 1 items
    • 🏗️ A1: StorageService + S3 Upload Integration
```

---

### 3. View Cards in List

**Patterns:** `view cards`, `lihat card`, `show cards`, `daftar card`, `card di list`

**CLI (with listId):**
```bash
kaede run --playbook <path> "lihat card di list" --listId <listId>
```

**CLI (with listName + boardId):**
```bash
kaede run --playbook <path> "lihat card di list Sprint Backlog" --board <boardId>
```

**Output:**
```
✓ get_cards_by_list: Found 2 card(s) in list
  • FE-008: LivePresensi WebRTC + Canvas Compression (6a48c4cc9cd46bfbcffbe651)
  • FE-009: Add Siswa Routes to web.php (6a48c4cedb11b44b76a6e98d)
```

---

### 4. List Labels on Board

**Patterns:** `list labels`, `lihat label`, `show labels`, `daftar label`

**CLI:**
```bash
kaede run --playbook <path> "list labels" --board <boardId>
```

**Output:**
```
✓ get_board_labels: Found 5 label(s)
  • red (priority-high)
  • yellow (priority-medium)
  • green (priority-low)
  • blue (feature)
  • purple (bug)
```

---

### 5. List Lists on Board

**Patterns:** `list lists`, `lihat list`, `show lists`, `daftar list`, `list di board`

**CLI:**
```bash
kaede run --playbook <path> "lihat list di board" --board <boardId>
```

**Output:**
```
✓ get_board_lists: Found 4 list(s)
  • 📋 Sprint Backlog (6a48c43733188eb8f8c1fa60)
  • 👀 Code Review (6a48c4370560a765b2710ddb)
  • ✅ Done (6a4416ec8b6613af7ee64369)
  • 🔨 In Progress (6a4416ebb38c4e25a0d03c09)
```

---

### 6. Get Board Info

**Patterns:** `get board`, `info board`, `detail board`, `informasi board`

**CLI:**
```bash
kaede run --playbook <path> "info board" --board <boardId>
```

**Output:**
```
✓ get_board: Fullstack-Frontend
  id: 6a3e9744e324a5ae9a525ac7
  url: https://trello.com/b/eB3YKmer/fullstack-frontend-inertiajs-vite-react
  closed: false
```

---

## AI Agent Usage

For AI Agents using `mcp.kaede`:

```
⚙kaede_generate_plan [goal=Lihat semua board Trello]
⚙kaede_generate_plan [goal=Tampilkan kartu saya]
⚙kaede_generate_plan [goal=Lihat card di list Sprint Backlog board Frontend]
⚙kaede_generate_plan [goal=Lihat label di board Backend]
```

The `generate_plan` tool will recognize these as query intents and execute the appropriate handlers.

---

## Examples

### Example 1: Quick Board Overview

```bash
# List all boards
kaede run "list boards"

# Pick a board and see its lists
kaede run "lihat list di board" --board 6a3e9744e324a5ae9a525ac7

# See cards in a specific list
kaede run "lihat card di list" --listId 6a48c43733188eb8f8c1fa60
```

### Example 2: Sprint Status Check

```bash
# See my assigned cards
kaede run "kartu saya"

# See all cards in Sprint Backlog
kaede run "view cards in Sprint Backlog" --board <boardId>

# Generate sprint report
kaede run "sprint report" --board <boardId>
```

### Example 3: Board Exploration

```bash
# Get board info
kaede run "info board" --board <boardId>

# List all labels
kaede run "list labels" --board <boardId>

# List all lists
kaede run "list lists" --board <boardId>
```

---

## Implementation Details

- **File:** `src/intent-handlers/query.ts` — 6 query handlers
- **Registration:** `src/intent-handlers/index.ts` — imports and registers `queryIntents`
- **Display:** `scripts/kaede.ts` — enhanced to show `detail` data from query results
- **Tests:** 209 pass, 0 fail (no existing tests broken)

---

## Design Philosophy

**Before:** KAEDE only supported **action intents** (create, move, assign). Read queries required direct `mcp.trello` tool calls.

**After:** KAEDE now supports **both action and query intents** via natural language. Single unified interface.

| Operation Type | Before | After |
|---------------|--------|-------|
| **Action** (create card, move, assign) | ✅ `kaede_generate_plan` | ✅ `kaede_generate_plan` |
| **Query** (list boards, view cards) | ❌ No support | ✅ `kaede_generate_plan` |

This maintains consistency while improving UX.