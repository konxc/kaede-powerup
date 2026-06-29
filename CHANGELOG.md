# Changelog — KAEDE MCP Enhancements

All notable changes to KAEDE MCP server implementation.

_Note: Source files now reside under `packages/kaede-trello/` in the current monorepo architecture._

## [Unreleased] — 2026-06-27

### Added — Phase 4: Sort & Advanced List Management

**Tools:**
- `copy_checklist` — Copy checklist to another card
- `sort_list_cards` — Sort cards in list by criteria (due, name, etc.)
- `update_list` — Update list details (name, position, closed state)

**Wrapper Methods:**
- `copyChecklist(sourceChecklistId, cardId)`
- `sortListCards(listId, sort)`
- `updateList(options)`

**Files Modified:**
- `packages/kaede-trello/src/mcp-server.js` — Added 3 tool handlers + 3 definitions
- `src/trello-client.js` — Added 3 wrapper methods
- `dist/mcp-server.js` — Built (20.63 KB)

---

### Added — Phase 3: Watch & Activity Tools

**Tools:**
- `watch_card` — Subscribe/unsubscribe from watching a card
- `watch_list` — Subscribe/unsubscribe from watching a list
- `get_card_activity` — Get activity/actions on a card
- `search_labels` — Search labels on board by name/color
- `remove_label_from_card` — Remove a label from a card

**Wrapper Methods:**
- `watchCard(cardId, add)` / `unwatchCard(cardId)`
- `watchList(listId, add)` / `unwatchList(listId)`
- `getCardActivity(cardId, options)`
- `searchLabels(boardId, query)`
- `removeLabelFromCard(cardId, labelId)`

**Files Modified:**
- `packages/kaede-trello/src/mcp-server.js` — Added 5 tool handlers + 5 definitions
- `src/trello-client.js` — Added 7 wrapper methods
- `dist/mcp-server.js` — Built (19.82 KB)

---

### Added — Phase 2: Checklist Enhancements

**Tools:**
- `delete_checklist` — Delete entire checklist from card
- `delete_checklist_item` — Delete item from checklist
- `update_checklist_item` — Update item name or checked state
- `get_card_checklists` — Get all checklists with items ✨ **NEW CONTRIBUTION**

**Wrapper Methods:**
- `deleteChecklist(checklistId)`
- `deleteChecklistItem(checklistId, checkItemId)`
- `updateChecklistItem(options)`
- `getCardChecklists(cardId)`

**Files Modified:**
- `packages/kaede-trello/src/mcp-server.js` — Added 4 tool handlers + 4 definitions
- `src/trello-client.js` — Added 4 wrapper methods
- `dist/mcp-server.js` — Built (18.58 KB)

**Documentation:**
- `test/CHECKLIST-TESTING.md` — Testing guide created

---

### Added — Phase 1: Attachments & Copy Card

**Tools:**
- `attach_file_to_card` — Attach file from URL
- `attach_image_to_card` — Attach image from URL
- `attach_data_to_card` — Attach from base64/data URL (stub)
- `attach_image_data_to_card` — Attach image data (stub)
- `get_card_attachments` — Get all attachments ✨ **NEW CONTRIBUTION**
- `copy_card` — Copy card to another list

**Enhancements:**
- `add_card_to_list` — Added `dueReminder` parameter
- `update_card_details` — Added `dueReminder` parameter

**Wrapper Methods:**
- `attachFileToCard(cardId, fileUrl, name, mimeType)`
- `attachImageToCard(cardId, imageUrl, name)`
- `getCardAttachments(cardId)`
- `copyCard(options)`

**Files Modified:**
- `packages/kaede-trello/src/mcp-server.js` — Added 7 tool handlers + 7 definitions
- `src/trello-client.js` — Added 7 wrapper methods
- `packages/kaede-trello/src/trello/attachments.js` — NEW utility module (228 lines)
- `dist/mcp-server.js` — Built (17.72 KB)

**Documentation:**
- `test/ATTACHMENTS-TESTING.md` — Testing guide
- `test/attachments.test.ps1` — PowerShell test script
- `test/manual-test-attachments.js` — Node.js test script
- `test/get-test-card.js` — Helper to get card IDs

---

### Changed — Global Credentials Architecture

**Breaking Change:** Credentials are now GLOBAL, not per-project.

**Location:**
- `~/.config/kaede/secrets.env` (Linux/Mac)
- `C:\Users\<You>\.config\kaede\secrets.env` (Windows)

**Setup:**
```bash
bun scripts/kaede.mjs setup
```

**Files Modified:**
- `scripts/kaede.mjs` — Updated to load from global path
- `README.md` — Updated credentials section
- `.env.example` — Changed to reference-only (safe to commit)
- `.gitignore` — Already includes `secrets.env`

**Migration:**
If you have `secrets.env` in project folder, move to global location:
```bash
# Move to global config
mkdir -p ~/.config/kaede
mv secrets.env ~/.config/kaede/
```

---

## Summary

### Total Tools Added: 20 + 2 enhancements

**Growth:** 24 → 44 tools (83% increase)

**Build Size:** 15.18 KB → 20.63 KB (+36%)

### New Contributions (Upstream Candidates)

1. `get_card_attachments` — Missing in TRELLO MCP
2. `get_card_checklists` — Missing in TRELLO MCP
3. `watch_card` + `watch_list` — Enhanced implementation

### Files Created

**Source:**
- `packages/kaede-trello/src/trello/attachments.js` (228 lines)

**Documentation:**
- `IMPLEMENTATION-SUMMARY.md` — Complete overview
- `CHANGELOG.md` — This file
- `test/MANUAL-TESTING.md` — Attachments testing guide
- `test/CHECKLIST-TESTING.md` — Checklist testing guide
- `.env.example` — Reference for credentials format

**Testing:**
- `test/manual-test-attachments.js`
- `test/get-test-card.js`
- `test/attachments.test.ps1`

---

## Upcoming

### Phase 6: Upstream Contribution

- [ ] Prepare PR #1: `get_card_attachments`
- [ ] Prepare PR #2: `get_card_checklists`
- [ ] Prepare PR #3: `watch_card` + `watch_list`
- [ ] Submit to delorenj/mcp-server-trello
- [ ] Track and merge PRs

### Phase 7: Sync & Cleanup

- [ ] Sync KAEDE with upstream TRELLO MCP
- [ ] Remove temporary wrapper code
- [ ] Update documentation
- [ ] Release new version

---

**Legend:**
- ✨ **NEW CONTRIBUTION** — Tools not available in upstream TRELLO MCP
- ⚠️ **STUB** — Implemented but requires additional work (e.g., multipart upload)
- ✅ **COMPLETE** — Fully implemented and tested