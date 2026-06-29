# SDLC Roles — Who Needs KAEDE?

KAEDE bridges Trello project management with AI Agents across the entire Software Development Life Cycle. Here is who benefits and how.

---

## Product Manager / Project Manager

**Pain points:**
- Sprint setup is repetitive: create lists, cards, labels, assign members
- Team members forget to follow SOPs (label conventions, list workflows)
- Hard to get a daily snapshot of what everyone is working on

**How KAEDE helps:**
```
"Mulai Sprint Alpha" → KAEDE auto-creates sprint lists, populates cards,
applies correct labels, assigns members per playbook rules
```
- Intent-driven orchestration: `kaede run --intent "Mulai Sprint Alpha"`
- Playbook enforcement: write SOPs once in Markdown, AI Agent applies them
- `kaede today` — quick daily view of all assigned tasks across boards
- Dashboard popup on each Trello board with environment statistics

---

## Developer / Engineer

**Pain points:**
- Context switching between IDE, Trello, and chat to update card status
- Manual card updates feel like overhead during coding flow
- Attaching screenshots to cards requires multiple steps

**How KAEDE helps:**
```
Paste screenshot from clipboard → AI Agent attaches to Trello card
via base64, no file upload needed
```
- 44 MCP tools — comprehensive Trello API access from AI Agent
- Clipboard-to-card attachment (base64 screenshots)
- Full checklist CRUD: create, update, delete, copy across cards
- `kaede init` — one-command MCP setup in any project
- `kaede setup` — global credentials, no per-project env vars

---

## QA / Tester

**Pain points:**
- Repeating the same checklist items across multiple cards
- Need to track card history to verify what changed and when
- Sorting through cards by due date or priority is manual

**How KAEDE helps:**
```
Copy QA checklist template to 10 cards in one command via AI Agent
```
- Checklist templates: copy QA, DoD, Sprint Planning checklists between cards
- `get_card_activity` — full audit trail of comments, moves, updates
- `sort_list_cards` — auto-sort cards by due date, name, or position
- Label management: search, create, update, delete — fine-grained control

---

## Tech Lead / Architect

**Pain points:**
- Maintaining consistent workflow standards across multiple teams
- Ensuring AI Agents respect project governance rules
- Need clean separation between context logic and execution

**How KAEDE helps:**
```
Playbook → OpenKB → OpenCode → mcp.kaede (orchestration) → mcp.trello (execution)
```
- **Dual MCP architecture**: `mcp.kaede` (4 context tools) + `mcp.trello` (40+ execution tools)
- Playbook parser — structured SOP enforcement from human-readable Markdown
- OpenKB integration — shared glossary & decision log for AI Agent
- Role-based access control per `docs/role-management.md`
- Rate limiting (token bucket) — automatic Trello API compliance

---

## Stakeholder / Business Owner

**Pain points:**
- Want visibility into project progress without learning Trello
- Need high-level status without team overhead
- Cost concerns with per-seat licensing

**How KAEDE helps:**
- Trello badges show environment status (PROD/STAG/DEV) directly on card faces
- Read-only board access for non-technical viewers
- Proprietary license allows unlimited internal use — no per-seat cost
- `kaede status --mcp` — health check of the entire integration

---

## AI / ML Engineer & MCP Developer

**Pain points:**
- Building MCP servers from scratch for each tool integration
- Adding new Trello capabilities requires deep API knowledge
- No standardized way to contribute back to the ecosystem

**How KAEDE helps:**
- 42 tools from packages/kaede-trello + 45+ tools from upstream @delorenj/mcp-server-trello
- `CONTRIBUTING.md` — step-by-step guide to add new tools
- Auto-built MCP server via `bun run build:mcp`
- 3 upstream PRs contributed to `delorenj/mcp-server-trello`

---

## Summary

| Role | Key Benefit | Entry Point |
|---|---|---|
| PM/PM | Intent-driven sprint automation | `kaede run --intent` |
| Developer | 44 MCP tools from AI Agent | `kaede init` |
| QA/Tester | Checklist templates + card history | `get_card_activity` |
| Tech Lead | Playbook-enforced governance | Playbook parser |
| Stakeholder | Zero-config visibility | Trello badges |
| AI Engineer | Extensible MCP architecture | `CONTRIBUTING.md` |
