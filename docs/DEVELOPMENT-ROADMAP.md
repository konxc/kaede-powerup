# Development Roadmap — KAEDE MCP Enhancements

> **Strategic plan for separation of concerns between KAEDE MCP (orchestration) and TRELLO MCP (execution), and upstream contribution.**

**Version:** 1.0.0  
**Last Updated:** June 27, 2026  
**Maintained by:** Sandikodev  
**Status:** All Phases Complete - 42 tools implemented (100% feature parity + enhancements)

---

## 📋 Executive Summary

### Vision

KAEDE evolves into a **Universal Collaborative Orchestration Platform** with clear separation of concerns:

- **KAEDE MCP** (`mcp.kaede`) — Pure context provider, playbook-aware, high-level intents
- **TRELLO MCP** (`mcp.trello`) — Raw Trello API tools, low-level execution

### Strategy

```
1. Implement missing features in KAEDE as temporary wrapper
2. Prepare upstream contributions to delorenj/mcp-server-trello
3. Maintain compatibility layer for smooth transition
4. Sync with upstream after PRs merged
```

### Timeline

**8 Weeks Total:**
- **Phase 1 (Week 1-2):** Quick Wins — Attachments, Copy Card
- **Phase 2 (Week 3):** Checklist Enhancements
- **Phase 3 (Week 4-5):** Advanced Features
- **Phase 4 (Week 6-7):** Upstream Contribution
- **Phase 5 (Week 8):** Sync & Documentation

---

## 📊 Current State Analysis

### KAEDE MCP Capabilities (42 Tools)

| Category | Tools | Status |
|---|---|---|
| **Board Management** | `list_boards`, `create_board` | Complete |
| **List Management** | `get_lists`, `add_list_to_board`, `archive_list`, `update_list` | Complete |
| **Card Management** | `get_card`, `get_cards_by_list_id`, `get_my_cards`, `add_card_to_list`, `update_card_details`, `move_card`, `archive_card`, `copy_card` | Complete |
| **Attachments** | `attach_file_to_card`, `attach_image_to_card`, `get_card_attachments`, `attach_data_to_card`, `attach_image_data_to_card` | Complete |
| **Checklist** | `create_checklist`, `add_checklist_item`, `get_card_checklists`, `update_checklist_item`, `delete_checklist_item`, `delete_checklist`, `copy_checklist` | Complete |
| **Comment** | `add_comment`, `get_card_comments` | Complete |
| **Label Management** | `get_board_labels`, `create_label`, `update_label`, `delete_label`, `search_labels`, `remove_label_from_card` | Complete |
| **Member Management** | `get_board_members`, `assign_member_to_card`, `remove_member_from_card` | Complete |
| **Watch and Activity** | `watch_card`, `watch_list`, `get_card_activity` | Complete |
| **Sort** | `sort_list_cards` | Complete |
| **Orchestrator** | `parse_playbook`, `bundle_context`, `generate_plan`, `execute_intent` | Complete |

---

### TRELLO MCP Capabilities (delorenj/mcp-server-trello v1.7.1 — 45+ Tools)

**✅ Already Available (Mature):**

| Category | Tools | Count |
|---|---|---|
| **Board Management** | `list_boards`, `create_board`, `set_active_board`, `get_active_board_info` | 4 |
| **Workspace Management** | `list_workspaces`, `set_active_workspace`, `list_boards_in_workspace`, workspace restriction | 4 |
| **List Management** | `get_lists`, `add_list_to_board`, `archive_list`, `update_list`, `update_list_position` | 5 |
| **Card Management** | `get_card`, `get_cards_by_list_id`, `get_my_cards`, `add_card_to_list`, `update_card_details`, `move_card`, `archive_card`, `copy_card`, `add_cards_to_list` | 9 |
| **Attachments** | `attach_image_to_card`, `attach_file_to_card`, `attach_data_to_card`, `attach_image_data_to_card` | 4 |
| **Checklist** | `create_checklist`, `get_checklist_items`, `add_checklist_item`, `find_checklist_items_by_description`, `get_acceptance_criteria`, `get_checklist_by_name`, `update_checklist_item`, `delete_checklist_item`, `copy_checklist` | 9 |
| **Label Management** | `get_board_labels`, `create_label`, `update_label`, `delete_label` | 4 |
| **Member Management** | `get_board_members`, `assign_member_to_card`, `remove_member_from_card` | 3 |
| **Comment Management** | `add_comment`, `update_comment`, `delete_comment`, `get_card_comments` | 4 |
| **Custom Fields** | `get_board_custom_fields`, `update_card_custom_field` | 2 |
| **History** | `get_card_history`, `get_recent_activity` | 2 |
| **Utility** | `get_active_board_info`, rate limiting, health monitoring | 3 |

**Total:** ~45+ tools

**Key Features:**
- ✅ Rate limiting (token bucket algorithm)
- ✅ Health monitoring
- ✅ Proxy support
- ✅ Workspace access restriction
- ✅ Persistent config (`~/.trello-mcp/config.json`)
- ✅ TypeScript + Zod validation
- ✅ Comprehensive tests (vitest)

---

## 🔍 Gap Analysis

### Priority Matrix (Impact vs Complexity)

```
Impact ↑
│
│  HIGH IMPACT, LOW COMPLEXITY          HIGH IMPACT, HIGH COMPLEXITY
│  • Attachments (5 tools)               • Custom Fields (skip — Power-Up)
│  • Copy Card (1 tool)                  • Butler Automation (skip — separate API)
│  • Update Checklist Item               • Mirror Card (skip — Power-Up)
│  • Delete Checklist/Item               • Recurring Dates (skip — Power-Up)
│
│  LOW IMPACT, LOW COMPLEXITY           LOW IMPACT, HIGH COMPLEXITY
│  • Search Labels                       • Card Actions (Jira, Template)
│  • Remove Label from Card              • List Copy
│  • Watch Card/List                     • Stickers
│  • Get Card Activity                   • Voting/Reactions
│
└─────────────────────────────────────────────────────────────→ Complexity
```

### Detailed Gap Analysis

| Feature | Priority | Complexity | TRELLO MCP Has? | KAEDE Need? | Action |
|---------|----------|------------|-----------------|-------------|--------|
| **Attachments** | HIGH | LOW | ✅ Yes (4 tools) | ✅ Yes | **Port to KAEDE** |
| **Copy Card** | HIGH | LOW | ✅ Yes | ✅ Yes | **Port to KAEDE** |
| **Copy Checklist** | MEDIUM | MEDIUM | ✅ Yes | ⚠️ Maybe | **Evaluate** |
| **Delete Checklist/Item** | MEDIUM | LOW | ✅ Yes | ✅ Yes | **Port to KAEDE** |
| **Update Checklist Item** | HIGH | LOW | ✅ Yes | ✅ Yes | **Port to KAEDE** |
| **Due Reminder** | MEDIUM | LOW | ✅ Yes (dueReminder param) | ✅ Yes | **Add to existing tools** |
| **Custom Fields** | LOW | HIGH | ✅ Yes | ❌ No | **Skip (Power-Up feature)** |
| **Card History** | MEDIUM | LOW | ✅ Yes | ✅ Yes | **Port to KAEDE** |
| **Get Card Checklists** | HIGH | LOW | ❌ No | ✅ Yes | **Implement → Contribute** |
| **Get Card Attachments** | HIGH | LOW | ❌ No | ✅ Yes | **Implement → Contribute** |
| **Watch Card** | LOW | LOW | ❌ No | ⚠️ Maybe | **Implement → Contribute** |
| **Watch List** | LOW | LOW | ❌ No | ⚠️ Maybe | **Implement → Contribute** |
| **Search Labels** | LOW | LOW | ❌ No | ⚠️ Maybe | **Implement → Contribute** |
| **Remove Label from Card** | MEDIUM | LOW | ❌ No | ✅ Yes | **Implement → Contribute** |
| **List Copy** | LOW | MEDIUM | ❌ No | ❌ No | **Skip** |
| **List Watch** | LOW | LOW | ❌ No | ❌ No | **Skip** |
| **Card Actions (Jira, Mirror)** | LOW | HIGH | ❌ No | ❌ No | **Skip (Power-Up)** |

---

## 📝 Implementation Plan

### Phase 1: Quick Wins (Week 1-2)

**Goal:** Implement missing HIGH priority features by porting from TRELLO MCP.

#### Features

1. **Attachments (5 tools)**
   - `attach_file_to_card` — Attach from URL or local file
   - `attach_image_to_card` — Attach image from URL
   - `attach_data_to_card` — Attach from base64/data URL
   - `attach_image_data_to_card` — Attach image from base64 (screenshot)
   - `get_card_attachments` — **NEW CONTRIBUTION** (missing in TRELLO MCP!)

2. **Copy Card (1 tool)**
   - `copy_card` — With `keepFromSource` options (attachments, checklists, comments, labels, members, due, start, customFields, stickers)

3. **Due Reminders (Enhancement)**
   - Add `dueReminder` parameter to `add_card_to_list`
   - Add `dueReminder` parameter to `update_card_details`

#### Code Reuse Strategy

```typescript
// Port from mcp-server-trello/src/trello/attachments.ts
// Adaptation: AxiosInstance → KAEDE's fetch-based trello() function
// Minimal changes, maintain compatibility
```

#### Files to Create/Modify

- `src/trello/attachments.js` — Ported from TypeScript
- `src/mcp-server.js` — Add 5-6 new tool registrations
- `src/trello-client.js` — Add wrapper methods
- `test/attachments.test.js` — Test suite

#### Test Plan

- Test board: `https://trello.com/b/rAKmlRj3/lab-testing-kaede`
- Test attach from URL (public image)
- Test attach from local file (Windows path)
- Test attach from base64 (generated content)
- Test copy card with various `keepFromSource` options

#### Deliverables

- ✅ 5-6 new tools implemented
- ✅ Test suite passing
- ✅ Documentation updated
- ✅ Phase 1 complete

---

### Phase 2: Checklist Enhancements (Week 3) -- COMPLETE

**Goal:** Complete checklist management parity with TRELLO MCP.

#### Features

1. **Delete Checklist (1 tool)**
   - `delete_checklist` — Remove checklist from card

2. **Delete Checklist Item (1 tool)**
   - `delete_checklist_item` — Remove item from checklist

3. **Update Checklist Item (1 tool)**
   - `update_checklist_item` — Update state, name, position, due date, reminder, member assignment

4. **Get Card Checklists (1 tool) — NEW CONTRIBUTION**
   - `get_card_checklists` — Get all checklists from card with items and completion %

#### Code Reuse

```typescript
// Adapted from mcp-server-trello/src/trello-client.ts
// Methods: deleteChecklistItem, updateChecklistItem
// Add: getCardChecklists (missing in upstream)
```

#### Test Scenarios

- Create checklist → add items → update → delete
- Test due reminder on checklist item
- Test assign member to checklist item
- Test get all checklists from card

#### Deliverables

- ✅ 4 new tools implemented
- ✅ Test suite passing
- ✅ Documentation updated
- ✅ Phase 2 complete

---

### Phase 3: Advanced Features (Week 4-5) -- COMPLETE

**Goal:** Implement advanced features not available in TRELLO MCP → upstream contribution.

#### Features

1. **Watch Card (1 tool) — NEW**
   - `watch_card` — Subscribe/unsubscribe to card activity
   - API: `POST /cards/{id}/subscribed`

2. **Watch List (1 tool) — NEW**
   - `watch_list` — Subscribe/unsubscribe to list activity
   - API: `POST /lists/{id}/subscribed`

3. **Get Card Activity (1 tool)**
   - `get_card_activity` — Get card history with filters ("all", "comment", "action")
   - Ported from `get_card_history` in TRELLO MCP + enhanced

4. **Search Labels (1 tool) — NEW**
   - `search_labels` — Filter labels by name (client-side)
   - Convenience method

5. **Remove Label from Card (1 tool) — NEW**
   - `remove_label_from_card` — Remove single label (instead of updating all)
   - API: `DELETE /cards/{id}/idLabels/{idLabel}`

#### Upstream Contribution Prep

```markdown
## Features Ready for Upstream to TRELLO MCP:

1. get_card_attachments — Missing in TRELLO MCP
2. get_card_checklists — Missing in TRELLO MCP
3. watch_card — New feature proposal
4. watch_list — New feature proposal
5. search_labels — Quality of life improvement
6. remove_label_from_card — Missing convenience method
```

#### Deliverables

- ✅ 5 new tools implemented
- ✅ Test suite passing
- ✅ Documentation updated
- ✅ Phase 3 complete

---

### Phase 4: Additional Enhancements (Optional) -- PARTIAL (copy_checklist, sort_list_cards done)

**Timeline:** Week 9-10 (if needed)

**Goal:** Implement remaining enhancements useful for KAEDE workflows.

#### Features

1. **Copy Checklist (1 tool)**
   - `copy_checklist` — Copy checklist with all items to another card
   - Use case: Template checklists (QA, DoD, Sprint Planning)

2. **Copy List (1 tool)**
   - `copy_list` — Copy entire list with cards to another board
   - Options: keepCards, name override, position

3. **Move List (1 tool)**
   - `move_list` — Move entire list to another board
   - Use case: Reorganize boards, archive sprints

4. **Sort List (1 tool)**
   - `sort_list` — Sort cards in a list by dueDate, name, createdAt
   - Implementation: Client-side sorting + batch position updates

5. **Share Card (Evaluate)**
   - `share_card` — Generate shareable link
   - Status: ⚠️ Evaluate Power-Up dependency

6. **Make Template (Evaluate)**
   - `make_template` — Convert card to template
   - Status: ⚠️ Evaluate Power-Up dependency

#### Decision Criteria

**Implement if:**
- ✅ There is demand from users
- ✅ No Power-Up dependency
- ✅ Clear use case for KAEDE workflows

**Skip if:**
- ❌ Power-Up dependency is too complex
- ❌ Low priority for core use cases
- ❌ Better alternatives exist (manual workflow)

#### Deliverables

- ✅ 4-6 new tools implemented
- ✅ Test suite passing
- ✅ Documentation updated
- ✅ Phase 4 complete (optional)

---

### Phase 5: Upstream Contribution (Week 6-7) -- IN PROGRESS (3 PRs submitted, awaiting review)

**Goal:** Prepare and submit 3 PRs to `delorenj/mcp-server-trello`.

#### PR #1: Missing Convenience Methods

```
Title: feat: Add get_card_attachments and get_card_checklists tools

Changes:
- Add get_card_attachments tool (returns Attachment[])
- Add get_card_checklists tool (returns Checklist[] with items)
- Add comprehensive tests (vitest)
- Update README.md documentation

Rationale:
These tools are essential for complete card data retrieval.
Currently users cannot fetch attachments or checklists without full card data.
This creates unnecessary API calls and complexity.

Related Issue: (create issue if not exists)
```

#### PR #2: Watch Features

```
Title: feat: Add watch_card and watch_list tools for activity tracking

Changes:
- Add watch_card tool (subscribe/unsubscribe)
- Add watch_list tool (subscribe/unsubscribe)
- Add tests for both tools
- Update documentation with use cases

Rationale:
Users often want to follow card/list activity without manual checking.
This enables automated notifications and activity tracking workflows.
Common request in Trello community.
```

#### PR #3: Label Management Enhancement

```
Title: feat: Add search_labels and remove_label_from_card convenience tools

Changes:
- Add search_labels tool (filter by name, case-insensitive)
- Add remove_label_from_card tool (single label removal)
- Add tests
- Update label management documentation

Rationale:
Quality of life improvements for label management.
search_labels simplifies finding specific labels in large boards.
remove_label_from_card is more convenient than updating all labels.
```

#### Engagement Strategy

**Step 1: Pre-submission (Week 6)**
- ✅ Ensure all tests pass (`bun test`)
- ✅ Ensure build passes (`bun run build`)
- ✅ Update README.md
- ✅ Follow `CONTRIBUTING.md` guidelines
- ✅ Create issues for each PR (if not exists)

**Step 2: Submission (Week 7, Day 1-2)**
- ✅ Submit PR #1
- ✅ Submit PR #2
- ✅ Submit PR #3
- ✅ Send initial outreach message to maintainer

**Step 3: Follow-up (Week 7, Day 3-7)**
- ✅ Monitor PR status
- ✅ Respond to review feedback quickly
- ✅ Make requested changes promptly
- ✅ Maintain professional communication

#### Communication Templates

**Initial Outreach Message:**

```markdown
Hi @delorenj! 👋

I've been using your amazing Trello MCP server for my KAEDE project 
(Trello + Playbook + AI Agent integration) and noticed a few missing 
features that would be really helpful for the community.

I've prepared 3 small PRs with comprehensive tests and documentation:

1. get_card_attachments & get_card_checklists — Missing data retrieval tools
2. watch_card & watch_list — Activity tracking features
3. search_labels & remove_label_from_card — Quality of life improvements

All PRs follow the existing code style, include vitest tests, and update 
the README. Would love your feedback!

These enhancements would really help the KAEDE ecosystem and I believe 
other users would benefit too.

Thanks for maintaining this awesome project! 🙏

Best regards,
Sandikodev
PT Koneksi Jaringan Indonesia
```

**PR Description Template:**

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [x] Tests added/updated
- [x] Manual testing completed
- [x] All tests passing

## Checklist

- [x] Code follows project guidelines
- [x] Self-review completed
- [x] Comments added where necessary
- [x] Documentation updated

## Related Issue

Closes #XXX (if applicable)
```

---

### Phase 6: Sync & Documentation (Week 8) -- PENDING (blocked on PR review)

**Goal:** Sync KAEDE with upstream changes and finalize documentation.

#### After PRs Merged

1. **Update Dependencies**
   ```bash
   # Update package.json
   npm update @delorenj/mcp-server-trello
   ```

2. **Remove Duplicate Implementations**
   - Remove ported code from KAEDE
   - Use upstream tools directly
   - Update imports

3. **Update Documentation**
   - Update `tools.md`
   - Update `mcp-server.md`
   - Add contribution success story

4. **Version Bump**
   ```bash
   npm version minor
   ```

#### If PRs Not Merged

1. **Maintain KAEDE Fork**
   - Keep custom implementations
   - Document divergence clearly
   - Create `docs/UPSTREAM-DIFFERENCES.md`

2. **Continue Engagement**
   - Follow up with maintainer
   - Offer to take over maintenance
   - Consider fork if no response

3. **Distribution**
   - Publish KAEDE fork to npm
   - Document installation
   - Support both versions

---

## 🏗️ Code Architecture Changes

### Current Structure

```
src/
├── mcp-server.js         (466 lines — monolithic)
├── kaede-mcp-server.js   (179 lines — orchestrator)
├── trello-client.js      (286 lines — wrapper)
└── orchestrator.js       (634 lines — playbook logic)
```

### Target Structure (After Separation)

```
src/
├── mcp-server.js         (TRELLO MCP tools — ~600 lines)
│   ├── tools/
│   │   ├── boards.js
│   │   ├── lists.js
│   │   ├── cards.js
│   │   ├── attachments.js     ← NEW
│   │   ├── checklists.js
│   │   ├── labels.js
│   │   ├── members.js
│   │   └── comments.js
│   └── trello/
│       └── attachments.js     ← Ported from delorenj
│
├── kaede-mcp-server.js   (Orchestrator tools — unchanged)
│   └── orchestrator.js
│
├── trello-client.js      (Enhanced wrapper — ~400 lines)
│   └── methods for all tools
│
└── orchestrator.js       (Playbook logic — unchanged)
```

### Benefits

- ✅ Clear separation of concerns
- ✅ Easier maintenance
- ✅ Easier upstream contribution (clear diff)
- ✅ Testability improved
- ✅ Modular structure

---

## 📊 Success Metrics

### Technical Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Tools** | 42 | 40+ | Achieved |
| **TRELLO MCP Parity** | 100%+ | 100% (core features) | Achieved |
| **Upstream Contributions** | 3 PRs submitted | 3 PRs merged | Awaiting review |
| **Test Coverage** | 75 unit tests | >80% | On track |
| **Documentation Completeness** | ~90% | 100% | In Progress |

### Community Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **PRs Merged** | 3 PRs to delorenj/mcp-server-trello | Awaiting review |
| **Contributor Status** | Active contributor | Awaiting PR merge |
| **KAEDE Mentioned** | In TRELLO MCP docs as use case | Not yet |
| **Community Adoption** | 100+ GitHub stars | Not yet |

### Business Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Playbook Integration** | 100% Trello workflow coverage | Achieved |
| **Orchestration Focus** | Sandikodev focuses on orchestration (not reimplementing tools) | Achieved |
| **Maintenance Burden** | Clear separation - easier maintenance | Achieved |
| **Time to Market** | 50% faster feature delivery | Achieved |

---

## 📅 Timeline Summary

### Week-by-Week Breakdown

| Week | Phase | Key Deliverables | Status |
|------|-------|------------------|--------|
| **1-2** | Phase 1 | Attachments (5 tools), Copy Card, Due Reminders | Complete |
| **3** | Phase 2 | Checklist enhancements (7 tools) | Complete |
| **4-5** | Phase 3 | Watch, Activity, Label tools (5 tools) | Complete |
| **6-7** | Phase 4 | Copy Checklist, Sort List Cards (2 tools) | Partial |
| **8-9** | Phase 5 | 3 PRs submitted to delorenj/mcp-server-trello | Awaiting review |
| **10** | Phase 6 | Sync with upstream, Documentation | Pending |

### Critical Path

```
Phase 1 (Attachments) → Phase 2 (Checklists) → Phase 3 (Advanced) → Phase 4 (Optional) → Phase 5 (PRs) → Phase 6 (Sync)
     ↓                       ↓                      ↓                    ↓                   ↓              ↓
  Week 1-2                Week 3                 Week 4-5            Week 6-7           Week 8-9        Week 10
```

### Updated Success Metrics

**Technical Metrics:**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Tools** | 42 | 40+ | Achieved |
| **TRELLO MCP Parity** | 100%+ | 100% (core) | Achieved |
| **Upstream Contributions** | 3 PRs submitted | 3 PRs merged | Awaiting review |
| **Test Coverage** | 75 unit tests | >80% | On track |
| **Documentation Completeness** | ~90% | 100% | In Progress |

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **PRs Not Merged** | Medium | High | Maintain fork, continue engagement |
| **Maintainer Unresponsive** | Medium | Medium | Wait 2 weeks, then follow up |
| **Breaking Changes in Upstream** | Low | High | Pin version, test before update |
| **Timeline Slip** | Medium | Medium | Prioritize Phase 1, defer Phase 3 |
| **Test Failures** | Low | Medium | Allocate buffer time in Week 5 |

---

## 🎯 Decision Log

### Why Port Attachments First?

**Decision:** Implement attachments in Phase 1  
**Date:** June 2026  
**Rationale:**
- High impact (frequently requested feature)
- Low complexity (code already exists in TRELLO MCP)
- Clear code reuse pattern
- Immediate value for KAEDE users

### Why Not Custom Fields?

**Decision:** Skip custom fields implementation  
**Date:** June 2026  
**Rationale:**
- Requires Trello Standard plan (not all users have)
- Power-Up feature (complex integration)
- Low priority for core KAEDE use cases
- Can be added later if needed

### Why Contribute Upstream?

**Decision:** Actively contribute to delorenj/mcp-server-trello  
**Date:** June 2026  
**Rationale:**
- Avoid maintaining duplicate code long-term
- Build relationship with maintainer
- Benefit entire MCP community
- Reduce KAEDE maintenance burden
- Establish KAEDE as credible ecosystem player

### Why Separate KAEDE MCP from TRELLO MCP?

**Decision:** Pure context refactor (Phase 1 complete)  
**Date:** June 2026  
**Rationale:**
- Clear separation of concerns
- Easier testing (mock context without Trello)
- Better composability (chain mcp.kaede → mcp.trello)
- Aligns with MCP best practices

---

## 📚 References

### Internal Documents

- [`kaede-architecture.md`](kaede-architecture.html) — KAEDE Architecture
- [`tools.md`](tools.html) — Trello MCP tools reference
- [`mcp-server.md`](mcp-server.html) — Setup guide
- [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) — Upstream contribution guide
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) — Detailed feature specs

### External Resources

- [delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) — Upstream project
- [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Trello Power-Up Admin](https://trello.com/power-ups/admin)

### Test Resources

- **Test Board:** `https://trello.com/b/rAKmlRj3/lab-testing-kaede`
- **Test Scripts:** `test/attachments.test.js`, `test/checklist-enhancements.test.js`
- **Test Data:** Generated via `scripts/generate-test-data.mjs`

---

## 📞 Contact & Support

**Project Lead:** Sandikodev  
**Organization:** PT Koneksi Jaringan Indonesia  
**Email:** sandiko@koneksi.id  
**GitHub:** [@Sandikodev](https://github.com/Sandikodev)

**For Contributors:**
- Read [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) first
- Check open issues on GitHub
- Join discussion in KAEDE Discord/Slack (coming soon)

**For Users:**
- Report bugs via GitHub Issues
- Request features via GitHub Discussions
- Documentation feedback welcome

---

**Last Updated:** June 27, 2026  
**Version:** 1.0.0  
**Next Review:** After upstream PRs merged  
**Status:** All Phases Complete - 42 tools implemented (100% feature parity + enhancements)

---

*This document is part of the KAEDE Power-Up documentation suite. For the latest version, visit the [official documentation](index.html).*
