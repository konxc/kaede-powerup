# Upstream Differences — KAEDE vs delorenj/mcp-server-trello

> **Version:** 1.0.1
> **Last Updated:** July 2026

This document catalogs all differences between KAEDE's Trello MCP implementation and the upstream [`delorenj/mcp-server-trello`](https://github.com/delorenj/mcp-server-trello).

## Architecture

| Aspect | Upstream | KAEDE |
|--------|----------|-------|
| Language | JavaScript | TypeScript (strict) |
| Runtime | Node.js 18+ | Bun 1.0+ |
| Build | tsc / esbuild | Bun native bundler |
| Entry point | `build/index.js` | `dist/mcp-server.js` |
| Package manager | npm | bun |

## Tools

### Upstream-only (44 tools)

The upstream package at `packages/kaede-trello/` provides 44 tools covering full CRUD for:
- **Boards**: `list_boards`, `create_board`, `get_board_labels`
- **Lists**: `get_lists`, `add_list_to_board`, `archive_list`, `update_list`, `copy_list`, `move_list`
- **Cards**: `get_cards_by_list_id`, `get_card`, `add_card_to_list`, `update_card_details`, `move_card`, `archive_card`, `copy_card`, `get_my_cards`, `sort_list_cards`
- **Attachments**: `attach_file_to_card`, `attach_image_to_card`, `attach_data_to_card`, `attach_image_data_to_card`, `get_card_attachments`
- **Checklists**: `create_checklist`, `add_checklist_item`, `get_card_checklists`, `update_checklist_item`, `delete_checklist_item`, `delete_checklist`, `copy_checklist`
- **Comments**: `add_comment`, `get_card_comments`
- **Labels**: `create_label`, `update_label`, `delete_label`, `search_labels`, `remove_label_from_card`
- **Members**: `get_board_members`, `assign_member_to_card`, `remove_member_from_card`
- **Watching**: `watch_card`, `watch_list`
- **Activity**: `get_card_activity`

### KAEDE-only (19 tools)

KAEDE wraps the upstream tools in an orchestration layer (`src/kaede-mcp-server.ts`):

| Tool | Purpose | Handler |
|------|---------|---------|
| `parse_playbook` | Parse playbook markdown → structured data | `handleParsePlaybook` |
| `bundle_context` | Load playbook + OpenKB + OpenCode context | `handleBundleContext` |
| `generate_plan` | Generate execution plan from intent | `handleGeneratePlan` |
| `execute_plan` | Execute multi-step plan with deps | `handleExecutePlan` |
| `undo_last_plan` | Reverse last executed plan | `handleUndoLastPlan` |
| `status` | Server version + path check | `handleStatus` |
| `resolve_board` | Parse board description → search keywords | `handleResolveBoard` |
| `resolve_context` | Resolve board/list names with auto-fill | `handleResolveContext` |
| `find_card` | Search cards by name | `handleFindCard` |
| `detect_duplicates` | Scan for duplicate cards | `handleDetectDuplicates` |
| `validate_context` | Pre-flight validation | `handleValidateContext` |
| `archive_duplicates` | Archive duplicate plan | `handleArchiveDuplicates` |
| `generate_template` | Card from template | `handleGenerateTemplate` |
| `load_templates` | Load custom templates | `handleLoadTemplates` |
| `generate_sprint_report` | Sprint report markdown | `handleGenerateSprintReport` |
| `batch_update_cards` | Batch update/move with filters | `handleBatchUpdateCards` |
| `enforce_playbook` | Validate plan against playbook | `handleEnforcePlaybook` |
| `get_execution_history` | View execution history | `handleGetExecutionHistory` |
| `clear_execution_history` | Clear execution history | `handleClearExecutionHistory` |

## Protocol Differences

### Upstream
- Pure stdio JSON-RPC 2.0
- Single `mcp-server.js` entry point
- No HTTP layer
- Direct Trello API mapping (1 tool = 1 API call)

### KAEDE
- **Two MCP servers**: KAEDE Orchestrator (stdio) + Trello MCP (stdio child process)
- **HTTP bridge**: `src/api-server.ts` on port 3456 (`POST /api/mcp`, `POST /api/tool`, `POST /api/health`)
- **Intent orchestration**: Natural language → `generatePlan` → `executePlan`
- **Auto-chaining**: Compound intents split by conjunctions (`lalu`, `dan`, `then`, `,`)
- **Playbook enforcement**: Prefix, label, workflow list, role validation
- **Dependency tracking**: `ref`/`dependsOn` system for multi-step plans
- **Undo support**: Inverse step generation for each action
- **Execution history**: Persisted in memory with undo capability

## Source Structure

### Upstream
```
mcp-server-trello/
├── src/
│   ├── mcp-server.js
│   ├── trello/
│   │   ├── boards.js
│   │   ├── cards.js
│   │   ├── labels.js
│   │   ├── lists.js
│   │   ├── members.js
│   │   ├── attachments.js
│   │   ├── comments.js
│   │   ├── checklists.js
│   │   └── activity.js
│   └── utils/
│       └── rate-limiter.js
└── build/
    └── index.js
```

### KAEDE
```
kaede-powerup/
├── packages/kaede-trello/  ← Upstream fork (TypeScript)
├── src/
│   ├── kaede-mcp-server.ts    ← 19 orchestration tools
│   ├── orchestrator.ts        ← generatePlan + barrel exports
│   ├── plan-handlers.ts       ← 16 intent pattern handlers
│   ├── plan-executor.ts       ← Multi-step executor + undo
│   ├── auto-chainer.ts        ← Compound intent splitting
│   ├── enforcer.ts            ← Playbook compliance engine
│   ├── api-server.ts          ← HTTP bridge (port 3456)
│   ├── trello-client.ts       ← Facade over Trello MCP stdio
│   ├── services/
│   │   ├── rpc-service.ts     ← JSON-RPC client
│   │   ├── execution-history.ts
│   │   └── history-store.ts
│   ├── intent-handlers/       ← 10 domain intent modules
│   ├── plan-executors/        ← 6 domain executor modules
│   ├── tool-handlers/         ← 7 MCP request handlers
│   └── types/                 ← TypeScript type definitions
├── public/                    ← Trello Power-Up frontend
│   ├── js/
│   │   ├── kaede.js
│   │   ├── mcp-client.js
│   │   └── components.js
│   ├── card.html
│   ├── board.html
│   ├── connect.html
│   ├── auth.html
│   └── mcp.html
└── test/                      ← 209 tests across 9 files
```

## Key Enhancements

1. **TypeScript migration** — All source code migrated from JS
2. **Modular architecture** — Single-responsibility modules (~100 lines each)
3. **Orchestration layer** — Natural language → Trello actions
4. **Auto-chaining** — Compound intents with 8 conjunctions
5. **Playbook enforcement** — 5 validators (prefix, label, workflow, role, single action)
6. **HTTP bridge** — REST endpoints for Power-Up integration
7. **Execution safety** — Undo, history, duplicate detection
8. **Template engine** — 5 built-in card templates + custom
9. **209 tests** — Full coverage across all modules
