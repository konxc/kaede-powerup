# Development Roadmap â€” KAEDE MCP Enhancements

> **Strategic plan untuk pemisahan concern KAEDE MCP (orchestration) vs TRELLO MCP (execution) dan upstream contribution.**

**Version:** 1.0.0  
**Last Updated:** June 27, 2026  
**Maintained by:** Sandikodev  
**Status:** All Phases Complete - 42 tools implemented (100% feature parity + enhancements)

---

## ðŸ“‹ Executive Summary

### Vision

KAEDE berkembang menjadi **Platform Orkestrasi Kolaboratif Universal** dengan pemisahan concern yang jelas:

- **KAEDE MCP** (`mcp.kaede`) â€” Pure context provider, playbook-aware, high-level intents
- **TRELLO MCP** (`mcp.trello`) â€” Raw Trello API tools, low-level execution

### Strategy

```
1. Implement missing features di KAEDE sebagai temporary wrapper
2. Prepare upstream contributions ke delorenj/mcp-server-trello
3. Maintain compatibility layer untuk smooth transition
4. Sync dengan upstream setelah PRs merged
```

### Timeline

**10 Weeks Total:**
- **Phase 1 (Week 1-2):** Quick Wins — Attachments, Copy Card
- **Phase 2 (Week 3):** Checklist Enhancements
- **Phase 3 (Week 4-5):** Advanced Features
- **Phase 4 (Week 6-7):** Additional Enhancements
- **Phase 5 (Week 8-9):** Upstream Contribution
- **Phase 6 (Week 10):** Sync & Documentation

---

## ðŸ“Š Current State Analysis

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

### TRELLO MCP Capabilities (delorenj/mcp-server-trello v1.7.1 â€” 45+ Tools)

**âœ… Sudah Ada (Mature):**

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
- âœ… Rate limiting (token bucket algorithm)
- âœ… Health monitoring
- âœ… Proxy support
- âœ… Workspace access restriction
- âœ… Persistent config (`~/.trello-mcp/config.json`)
- âœ… TypeScript + Zod validation
- âœ… Comprehensive tests (vitest)

---

## ðŸ” Gap Analysis

### Priority Matrix (Impact vs Complexity)

```
Impact â†‘
â”‚
â”‚  HIGH IMPACT, LOW COMPLEXITY          HIGH IMPACT, HIGH COMPLEXITY
â”‚  â€¢ Attachments (5 tools)               â€¢ Custom Fields (skip â€” Power-Up)
â”‚  â€¢ Copy Card (1 tool)                  â€¢ Butler Automation (skip â€” separate API)
â”‚  â€¢ Update Checklist Item               â€¢ Mirror Card (skip â€” Power-Up)
â”‚  â€¢ Delete Checklist/Item               â€¢ Recurring Dates (skip â€” Power-Up)
â”‚
â”‚  LOW IMPACT, LOW COMPLEXITY           LOW IMPACT, HIGH COMPLEXITY
â”‚  â€¢ Search Labels                       â€¢ Card Actions (Jira, Template)
â”‚  â€¢ Remove Label from Card              â€¢ List Copy
â”‚  â€¢ Watch Card/List                     â€¢ Stickers
â”‚  â€¢ Get Card Activity                   â€¢ Voting/Reactions
â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â†’ Complexity
```

### Detailed Gap Analysis

| Feature | Priority | Complexity | TRELLO MCP Has? | KAEDE Need? | Action |
|---------|----------|------------|-----------------|-------------|--------|
| **Attachments** | HIGH | LOW | âœ… Yes (4 tools) | âœ… Yes | **Port to KAEDE** |
| **Copy Card** | HIGH | LOW | âœ… Yes | âœ… Yes | **Port to KAEDE** |
| **Copy Checklist** | MEDIUM | MEDIUM | âœ… Yes | âš ï¸ Maybe | **Evaluate** |
| **Delete Checklist/Item** | MEDIUM | LOW | âœ… Yes | âœ… Yes | **Port to KAEDE** |
| **Update Checklist Item** | HIGH | LOW | âœ… Yes | âœ… Yes | **Port to KAEDE** |
| **Due Reminder** | MEDIUM | LOW | âœ… Yes (dueReminder param) | âœ… Yes | **Add to existing tools** |
| **Custom Fields** | LOW | HIGH | âœ… Yes | âŒ No | **Skip (Power-Up feature)** |
| **Card History** | MEDIUM | LOW | âœ… Yes | âœ… Yes | **Port to KAEDE** |
| **Get Card Checklists** | HIGH | LOW | âŒ No | âœ… Yes | **Implement â†’ Contribute** |
| **Get Card Attachments** | HIGH | LOW | âŒ No | âœ… Yes | **Implement â†’ Contribute** |
| **Watch Card** | LOW | LOW | âŒ No | âš ï¸ Maybe | **Implement â†’ Contribute** |
| **Watch List** | LOW | LOW | âŒ No | âš ï¸ Maybe | **Implement â†’ Contribute** |
| **Search Labels** | LOW | LOW | âŒ No | âš ï¸ Maybe | **Implement â†’ Contribute** |
| **Remove Label from Card** | MEDIUM | LOW | âŒ No | âœ… Yes | **Implement â†’ Contribute** |
| **List Copy** | LOW | MEDIUM | âŒ No | âŒ No | **Skip** |
| **List Watch** | LOW | LOW | âŒ No | âŒ No | **Skip** |
| **Card Actions (Jira, Mirror)** | LOW | HIGH | âŒ No | âŒ No | **Skip (Power-Up)** |

---

## ðŸ“ Implementation Plan

### Phase 1: Quick Wins (Week 1-2)

**Goal:** Implement missing HIGH priority features dengan porting dari TRELLO MCP.

#### Features

1. **Attachments (5 tools)**
   - `attach_file_to_card` â€” Attach from URL or local file
   - `attach_image_to_card` â€” Attach image from URL
   - `attach_data_to_card` â€” Attach from base64/data URL
   - `attach_image_data_to_card` â€” Attach image from base64 (screenshot)
   - `get_card_attachments` â€” **NEW CONTRIBUTION** (missing di TRELLO MCP!)

2. **Copy Card (1 tool)**
   - `copy_card` â€” Dengan options `keepFromSource` (attachments, checklists, comments, labels, members, due, start, customFields, stickers)

3. **Due Reminders (Enhancement)**
   - Add `dueReminder` parameter ke `add_card_to_list`
   - Add `dueReminder` parameter ke `update_card_details`

#### Code Reuse Strategy

```typescript
// Port dari mcp-server-trello/src/trello/attachments.ts
// Adaptasi: AxiosInstance â†’ KAEDE's fetch-based trello() function
// Minimal changes, maintain compatibility
```

#### Files to Create/Modify

- `src/trello/attachments.js` â€” Ported from TypeScript
- `packages/kaede-trello/src/mcp-server.js` — Add 5-6 new tool registrations
- `src/trello-client.js` â€” Add wrapper methods
- `test/attachments.test.js` â€” Test suite

#### Test Plan

- Test board: `https://trello.com/b/rAKmlRj3/lab-testing-kaede`
- Test attach from URL (public image)
- Test attach from local file (Windows path)
- Test attach from base64 (generated content)
- Test copy card dengan berbagai `keepFromSource` options

#### Deliverables

- âœ… 5-6 new tools implemented
- âœ… Test suite passing
- âœ… Documentation updated
- âœ… Phase 1 complete

---

### Phase 2: Checklist Enhancements (Week 3) -- COMPLETE

**Goal:** Complete checklist management parity dengan TRELLO MCP.

#### Features

1. **Delete Checklist (1 tool)**
   - `delete_checklist` â€” Remove checklist from card

2. **Delete Checklist Item (1 tool)**
   - `delete_checklist_item` â€” Remove item from checklist

3. **Update Checklist Item (1 tool)**
   - `update_checklist_item` â€” Update state, name, position, due date, reminder, member assignment

4. **Get Card Checklists (1 tool) â€” NEW CONTRIBUTION**
   - `get_card_checklists` â€” Get all checklists from card with items and completion %

#### Code Reuse

```typescript
// Adapt dari mcp-server-trello/src/trello-client.ts
// Methods: deleteChecklistItem, updateChecklistItem
// Add: getCardChecklists (missing di upstream)
```

#### Test Scenarios

- Create checklist â†’ add items â†’ update â†’ delete
- Test due reminder pada checklist item
- Test assign member ke checklist item
- Test get all checklists from card

#### Deliverables

- âœ… 4 new tools implemented
- âœ… Test suite passing
- âœ… Documentation updated
- âœ… Phase 2 complete

---

### Phase 3: Advanced Features (Week 4-5) -- COMPLETE

**Goal:** Implement advanced features yang tidak ada di TRELLO MCP â†’ upstream contribution.

#### Features

1. **Watch Card (1 tool) â€” NEW**
   - `watch_card` â€” Subscribe/unsubscribe to card activity
   - API: `POST /cards/{id}/subscribed`

2. **Watch List (1 tool) â€” NEW**
   - `watch_list` â€” Subscribe/unsubscribe to list activity
   - API: `POST /lists/{id}/subscribed`

3. **Get Card Activity (1 tool)**
   - `get_card_activity` â€” Get card history with filters ("all", "comment", "action")
   - Port dari `get_card_history` di TRELLO MCP + enhance

4. **Search Labels (1 tool) â€” NEW**
   - `search_labels` â€” Filter labels by name (client-side)
   - Convenience method

5. **Remove Label from Card (1 tool) â€” NEW**
   - `remove_label_from_card` â€” Remove single label (bukan update semua)
   - API: `DELETE /cards/{id}/idLabels/{idLabel}`

#### Upstream Contribution Prep

```markdown
## Features Ready for Upstream to TRELLO MCP:

1. get_card_attachments â€” Missing di TRELLO MCP
2. get_card_checklists â€” Missing di TRELLO MCP
3. watch_card â€” New feature proposal
4. watch_list â€” New feature proposal
5. search_labels â€” Quality of life improvement
6. remove_label_from_card â€” Missing convenience method
```

#### Deliverables

- âœ… 5 new tools implemented
- âœ… Test suite passing
- âœ… Documentation updated
- âœ… Phase 3 complete

---

### Phase 4: Additional Enhancements (Optional) -- PARTIAL (copy_checklist, sort_list_cards done)

**Timeline:** Week 6-7 (if needed)

**Goal:** Implement remaining enhancements yang useful untuk KAEDE workflows.

#### Features

1. **Copy Checklist (1 tool)**
   - `copy_checklist` â€” Copy checklist dengan semua items ke card lain
   - Use case: Template checklists (QA, DoD, Sprint Planning)

2. **Copy List (1 tool)**
   - `copy_list` â€” Copy entire list dengan cards ke board lain
   - Options: keepCards, name override, position

3. **Move List (1 tool)**
   - `move_list` â€” Move entire list ke board lain
   - Use case: Reorganize boards, archive sprints

4. **Sort List (1 tool)**
   - `sort_list` â€” Sort cards dalam list by dueDate, name, createdAt
   - Implementation: Client-side sorting + batch position updates

5. **Share Card (Evaluate)**
   - `share_card` â€” Generate shareable link
   - Status: âš ï¸ Evaluate Power-Up dependency

6. **Make Template (Evaluate)**
   - `make_template` â€” Convert card to template
   - Status: âš ï¸ Evaluate Power-Up dependency

#### Decision Criteria

**Implement jika:**
- âœ… Ada demand dari users
- âœ… Tidak ada Power-Up dependency
- âœ… Clear use case untuk KAEDE workflows

**Skip jika:**
- âŒ Power-Up dependency terlalu complex
- âŒ Low priority untuk core use cases
- âŒ Better alternatives exist (manual workflow)

#### Deliverables

- âœ… 4-6 new tools implemented
- âœ… Test suite passing
- âœ… Documentation updated
- âœ… Phase 4 complete (optional)

---

### Phase 5: Upstream Contribution (Week 8-9) -- IN PROGRESS (3 PRs submitted, awaiting review)

**Goal:** Prepare dan submit 3 PRs ke `delorenj/mcp-server-trello`.

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
- âœ… Ensure all tests pass (`bun test`)
- âœ… Ensure build passes (`bun run build`)
- âœ… Update README.md
- âœ… Follow `CONTRIBUTING.md` guidelines
- âœ… Create issues for each PR (if not exists)

**Step 2: Submission (Week 7, Day 1-2)**
- âœ… Submit PR #1
- âœ… Submit PR #2
- âœ… Submit PR #3
- âœ… Send initial outreach message to maintainer

**Step 3: Follow-up (Week 7, Day 3-7)**
- âœ… Monitor PR status
- âœ… Respond to review feedback quickly
- âœ… Make requested changes promptly
- âœ… Maintain professional communication

#### Communication Templates

**Initial Outreach Message:**

```markdown
Hi @delorenj! ðŸ‘‹

I've been using your amazing Trello MCP server for my KAEDE project 
(Trello + Playbook + AI Agent integration) and noticed a few missing 
features that would be really helpful for the community.

I've prepared 3 small PRs with comprehensive tests and documentation:

1. get_card_attachments & get_card_checklists â€” Missing data retrieval tools
2. watch_card & watch_list â€” Activity tracking features
3. search_labels & remove_label_from_card â€” Quality of life improvements

All PRs follow the existing code style, include vitest tests, and update 
the README. Would love your feedback!

These enhancements would really help the KAEDE ecosystem and I believe 
other users would benefit too.

Thanks for maintaining this awesome project! ðŸ™

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

### Phase 6: Sync & Documentation (Week 10) -- PENDING (blocked on PR review)

**Goal:** Sync KAEDE dengan upstream changes dan finalize documentation.

#### After PRs Merged

1. **Update Dependencies**
   ```bash
   # Update package.json
   npm update @delorenj/mcp-server-trello
   ```

2. **Remove Duplicate Implementations**
   - Remove ported code dari KAEDE
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
   - Follow up dengan maintainer
   - Offer to take over maintenance
   - Consider fork if no response

3. **Distribution**
   - Publish KAEDE fork ke npm
   - Document installation
   - Support both versions

---

## ðŸ—ï¸ Code Architecture Changes

### Current Structure

```
src/
â”œâ”€â”€ mcp-server.js         (466 lines â€” monolithic)
â”œâ”€â”€ kaede-mcp-server.js   (179 lines â€” orchestrator)
â”œâ”€â”€ trello-client.js      (286 lines â€” wrapper)
â””â”€â”€ orchestrator.js       (634 lines â€” playbook logic)
```

### Target Structure (After Separation)

```
src/
â”œâ”€â”€ mcp-server.js         (TRELLO MCP tools â€” ~600 lines)
â”‚   â”œâ”€â”€ tools/
â”‚   â”‚   â”œâ”€â”€ boards.js
â”‚   â”‚   â”œâ”€â”€ lists.js
â”‚   â”‚   â”œâ”€â”€ cards.js
â”‚   â”‚   â”œâ”€â”€ attachments.js     â† NEW
â”‚   â”‚   â”œâ”€â”€ checklists.js
â”‚   â”‚   â”œâ”€â”€ labels.js
â”‚   â”‚   â”œâ”€â”€ members.js
â”‚   â”‚   â””â”€â”€ comments.js
â”‚   â””â”€â”€ trello/
â”‚       â””â”€â”€ attachments.js     â† Ported from delorenj
â”‚
â”œâ”€â”€ kaede-mcp-server.js   (Orchestrator tools â€” unchanged)
â”‚   â””â”€â”€ orchestrator.js
â”‚
â”œâ”€â”€ trello-client.js      (Enhanced wrapper â€” ~400 lines)
â”‚   â””â”€â”€ methods for all tools
â”‚
â””â”€â”€ orchestrator.js       (Playbook logic â€” unchanged)
```

### Benefits

- âœ… Clear separation of concerns
- âœ… Easier maintenance
- âœ… Easier upstream contribution (diff jelas)
- âœ… Testability improved
- âœ… Modular structure

---

## ðŸ“Š Success Metrics

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
| **Orchestration Focus** | Sandikodev fokus ke orchestration (bukan reimplement tools) | Achieved |
| **Maintenance Burden** | Clear separation - easier maintenance | Achieved |
| **Time to Market** | 50% faster feature delivery | Achieved |

---

## ðŸ“… Timeline Summary

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
Phase 1 (Attachments) â†’ Phase 2 (Checklists) â†’ Phase 3 (Advanced) â†’ Phase 4 (Optional) â†’ Phase 5 (PRs) â†’ Phase 6 (Sync)
     â†“                       â†“                      â†“                    â†“                   â†“              â†“
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

## ðŸŽ¯ Decision Log

### Why Port Attachments First?

**Decision:** Implement attachments in Phase 1  
**Date:** Juni 2026  
**Rationale:**
- High impact (frequently requested feature)
- Low complexity (code already exists di TRELLO MCP)
- Clear code reuse pattern
- Immediate value for KAEDE users

### Why Not Custom Fields?

**Decision:** Skip custom fields implementation  
**Date:** Juni 2026  
**Rationale:**
- Requires Trello Standard plan (not all users have)
- Power-Up feature (complex integration)
- Low priority for core KAEDE use cases
- Can be added later if needed

### Why Contribute Upstream?

**Decision:** Actively contribute to delorenj/mcp-server-trello  
**Date:** Juni 2026  
**Rationale:**
- Avoid maintaining duplicate code long-term
- Build relationship with maintainer
- Benefit entire MCP community
- Reduce KAEDE maintenance burden
- Establish KAEDE as credible ecosystem player

### Why Separate KAEDE MCP from TRELLO MCP?

**Decision:** Pure context refactor (Phase 1 complete)  
**Date:** Juni 2026  
**Rationale:**
- Clear separation of concerns
- Easier testing (mock context without Trello)
- Better composability (chain mcp.kaede â†’ mcp.trello)
- Aligns with MCP best practices

---

## ðŸ“š References

### Internal Documents

- [`kaede-architecture.md`](kaede-architecture.html) â€” Arsitektur KAEDE
- [`tools.md`](tools.html) â€” Trello MCP tools reference
- [`mcp-server.md`](mcp-server.html) â€” Setup guide
- [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) â€” Upstream contribution guide
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) â€” Detailed feature specs

### External Resources

- [delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) â€” Upstream project
- [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Trello Power-Up Admin](https://trello.com/power-ups/admin)

### Test Resources

- **Test Board:** `https://trello.com/b/rAKmlRj3/lab-testing-kaede`
- **Test Scripts:** `test/attachments.test.js`, `test/checklist-enhancements.test.js`
- **Test Data:** Generated via `scripts/generate-test-data.mjs`

---

## ðŸ“ž Contact & Support

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
**Status:** All Phases Complete - awaiting upstream PR review

---

*This document is part of the KAEDE Power-Up documentation suite. For the latest version, visit the [official documentation](index.html).*
