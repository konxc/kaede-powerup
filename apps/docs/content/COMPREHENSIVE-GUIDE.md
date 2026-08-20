# KAEDE — Comprehensive Guide

> **Version:** 1.1.0  
> **Last Updated:** July 5, 2026  
> **Maintained by:** Sandikodev — PT Koneksi Jaringan Indonesia

---

## Table of Contents

1. [What is KAEDE?](#what-is-kaede)
2. [Installation & Setup](#installation--setup)
3. [CLI Usage (17 Commands)](#cli-usage-17-commands)
4. [Frontend UI (Trello Power-Up)](#frontend-ui-trello-power-up)
5. [Architecture](#architecture)
6. [Complete Feature Inventory](#complete-feature-inventory)
   - [Layer 1: Access & Interface](#layer-1-access--interface)
   - [Layer 2: Orchestration (mcp.kaede — 19 tools)](#layer-2-orchestration-mcpkaede--19-tools)
   - [Layer 3: Trello Execution (mcp.trello — 44 tools)](#layer-3-trello-execution-mcptrello--44-tools)
7. [Core Engine Modules (src/)](#core-engine-modules-src)
8. [Workflow Examples](#workflow-examples)
9. [Upstream Differences](#upstream-differences)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## What is KAEDE?

**KAEDE** (Koneksi Automated Environment DE) is a **Universal Collaborative Orchestration Platform** that bridges AI agents, Trello, and project playbooks. It provides three layers of functionality:

| Layer | Name | What It Does |
|-------|------|-------------|
| 1 | **Access & Interface** | CLI (17 commands), Trello Power-Up UI, HTTP API bridge |
| 2 | **Orchestration** (`mcp.kaede`) | 19 MCP tools: NL planning, context, enforcement, duplicate detection, templates |
| 3 | **Execution** (`mcp.trello`) | 44 MCP tools: Trello CRUD (boards, lists, cards, members, labels, checklists, comments, attachments, watch) |

KAEDE transforms natural language into Trello actions. Instead of manually clicking through Trello, you (or an AI agent) say things like:

- _"Mulai Sprint Alpha"_ — creates all sprint lists from playbook
- _"Buat card Fitur Login di list To Do"_ — creates a card with proper prefix
- _"Assign card ke Sandiko"_ — assigns a member
- _"Tutup sprint"_ — archives done cards
- _"Buat label priority high warna red"_ — creates a label
- _"Laporan sprint"_ — generates a markdown sprint report

---

## Installation & Setup

### Prerequisites

- **Bun** v1.x ([bun.sh](https://bun.sh))
- **Git** (for install)
- **Trello Account** (for Trello operations)

### Install Globally

```bash
# Method 1: One-liner (PowerShell)
iwr -Uri https://kaede.sh/install.ps1 | iex

# Method 2: From repo
git clone https://github.com/konxc/kaede-powerup.git
cd kaede-powerup
bun install
bun scripts/kaede.ts install

# Method 3: Release binary (see GitHub Releases)
# Download kaede-v1.1.0-windows-x64.zip, extract, run:
#   bin/kaede-mcp-server.exe
#   bin/kaede-trello-mcp.exe
```

After install, verify:

```bash
kaede --help          # Should show 17 commands
kaede status          # Check configuration
```

### Onboarding

```bash
# Onboarding lengkap: OAuth Trello + registrasi MCP + verifikasi
kaede setup

# Atau per langkah:
kaede auth login          # OAuth browser (auto) — --manual untuk paste token
kaede auth status         # cek akun aktif

# Atau manual: edit ~/.config/kaede/secrets.env
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
```

### After Install — What Happened?

1. MCP servers built → `dist/mcp-server.js` + `dist/kaede-mcp-server.js`
2. Files copied → `~/.kaede/dist/`, `~/.kaede/scripts/`, `~/.kaede/docs/`
3. Global binary → `kaede` command via `bun link`
4. OpenCode MCP config → `~/.config/opencode/opencode.json` registers:
   - `mcp.trello` → Trello MCP server (44 tools)
   - `mcp.kaede` → Orchestrator MCP server (19 tools)

---

## CLI Usage (17 Commands)

### `kaede setup` — Onboarding

Orchestrator onboarding (idempotent):
- Preflight lingkungan + opsional `kaede install`
- Kredensial Trello via OAuth (`kaede auth login`)
- Registrasi/repair MCP (`mcp.trello` + `mcp.kaede`) di opencode.json
- Opsional project init + verifikasi

```bash
kaede setup                 # interaktif
kaede setup --yes           # non-interaktif (auto-approve)
kaede setup --no-mcp        # skip registrasi MCP
kaede setup --no-init       # skip project init
```

### `kaede auth` — Trello Identity

```bash
kaede auth login            # OAuth browser (ephemeral localhost callback)
kaede auth login --manual   # print URL Trello → paste token
kaede auth status           # akun aktif, expiry, token (masked)
kaede auth logout           # hapus kredensial (+ opsional revoke di Trello)
kaede auth token            # cetak token masked; --raw untuk scripting
```

Token disimpan ke `~/.config/kaede/secrets.env`.

### `kaede status [--mcp]` — Check Configuration

```bash
kaede status              # Shows API Key, Token, MCP config status
kaede status --mcp        # Additionally tests actual MCP connection (lists boards)
```

### `kaede today` — View Today's Tasks

Fetches all cards assigned to you, grouped by board and list. Shows due dates with overdue warnings.

```bash
kaede today
```

### `kaede init` — Initialize Project with KAEDE

Creates `.opencode/` directory structure with:
- `project-context.md` — project metadata
- `agent-rules.md` — agent behavior rules
- `opencode.json` — MCP configuration

```bash
# Interactive
kaede init

# With flags
kaede init ../my-project --tech Laravel --db PostgreSQL --playbook playbook.md
kaede init . --name "My App" --tech React --db MySQL
```

### `kaede push <file>` — Create Cards from Markdown

Parses a markdown file where `## headings` = card titles and `- items` = descriptions.

```bash
# File mode
kaede push tasks.md

# With board/list override
kaede push tasks.md --board "My Board" --list "To Do" --labels "feature,backend"
```

**tasks.md example:**
```markdown
## User Login API
- Implement JWT authentication
- Add rate limiting
- Write tests

## Dashboard Page
- Create React components
- Add data fetching
- Responsive layout
```

### `kaede env` — Export Credentials

Exports Trello credentials in shell format for piping.

```bash
kaede env --ps | iex        # PowerShell
kaede env --bash | source   # Bash
kaede env --cmd | cmd       # Windows CMD
```

### `kaede playbook` — Parse & Display Playbook

```bash
kaede playbook parse playbook.md   # Parse and show structured data
kaede playbook show playbook.md    # Display raw content
```

### `kaede orchestrate` — Load Context

Loads and displays orchestration context from playbook + OpenKB + OpenCode.

```bash
kaede orchestrate --playbook playbook/sprint.md
kaede orchestrate --playbook playbook/sprint.md --detail
```

### `kaede run` — Execute Natural Language Intent

The core command. Executes a natural language intent against a playbook + Trello.

```bash
# Basic usage
kaede run --playbook playbook.md --intent "Mulai Sprint Alpha"

# With board ID (skip auto-detect)
kaede run --playbook playbook.md --board abc123 "Mulai Sprint Alpha"

# With extra arguments
kaede run --playbook playbook.md "Buat card Fitur Login" --list "To Do"
kaede run --playbook playbook.md "Assign card ke Sandiko" --member "sandikodev"

# Dry run (no actual Trello changes)
kaede run --playbook playbook.md --dry-run "Tutup sprint"
```

**Supported Intent Patterns:**

| Intent (ID) | Intent (EN) | What It Does |
|---|---|---|
| `mulai sprint` | `start sprint` | Create all workflow lists from playbook |
| `buat card`, `tambah task` | `create card`, `new task` | Create a card with prefix validation |
| `assign`, `tugaskan` | `assign` | Assign member to card |
| `tutup sprint` | `close sprint`, `archive sprint` | Archive all cards in Done/Selesai lists |
| `pindah semua` | `move all` | Move all cards from one list to another |
| `pindah`, `pindahkan` | `move card` | Move card to another list |
| `komentar` | `comment` | Add comment to card |
| `buat label` | `create label` | Create a new label with color |
| `arsip list` | `archive list` | Archive a list |
| `arsipkan` | `archive card` | Archive a card |
| `update card`, `ubah kartu` | `update card` | Update card details |
| `buat checklist` | `create checklist` | Create checklist on card |
| `buat board` | `create board` | Create a new board |
| `hapus anggota` | `remove member` | Remove member from card |
| `tambah label ke card` | `add label to card` | Add label to card |
| `report`, `kartu saya` | `report`, `my cards` | Show assigned cards report |
| `laporan sprint` | `sprint report` | Generate sprint report |
| `undo`, `batalkan` | `undo`, `rollback` | Undo last plan |
| `update massal` | `batch update` | Batch update cards |
| `setup sprint` | `set up sprint` | Full sprint setup with cards + checklists |
| `buat cards batch` | `batch cards` | Batch card creation |
| `setup labels batch` | `batch labels` | Batch label creation |

### `kaede build` — Build MCP Servers

Rebuilds both MCP servers from source.

```bash
kaede build
kaede build --mcp    # Build only MCP servers
```

### `kaede start [port]` — Start API Server

Starts the HTTP API server (bridge for Trello Power-Up frontend).

```bash
kaede start          # Port 3456
kaede start 8080     # Custom port
```

### `kaede test-tools` — Test Trello Connection

Tests actual connectivity to Trello API via MCP tools.

```bash
kaede test-tools
```

### `kaede template` — Card Template Manager

```bash
kaede template list                # List all 5 built-in templates
kaede template show feature        # Show feature template
kaede template apply feature --task "User Login"
kaede template apply bug --task "Login crash" --role "developer"
```

**Built-in Templates:**
| Template | Description |
|----------|-------------|
| `feature` | Feature request with acceptance criteria |
| `bug` | Bug report with steps to reproduce |
| `task` | General task with definition of done |
| `chore` | Maintenance task with checklist |
| `onboarding` | New member onboarding checklist |

### `kaede report sprint` — Generate Sprint Report

```bash
kaede report sprint --board abc123 --name "Sprint 1" --list "Done,Review"
```

### `kaede archive sprint` — Archive Sprint Cards

```bash
kaede archive sprint --board abc123 --list "Done" --action all
kaede archive sprint --board abc123 --list "Done" --action closed
```

### `kaede install` — Global Install

Full installation: builds MCP servers → copies to `~/.kaede/` → `bun link` → registers MCP in OpenCode config.

```bash
# From repo
bun scripts/kaede.ts install
```

### `kaede help` — Display Help

Shows all commands with usage examples.

```bash
kaede help
```

---

## Frontend UI (Trello Power-Up)

### Enabling the Power-Up

1. Open a Trello board
2. Go to **Power-Ups** → **Add Power-Ups**
3. Use the KAEDE Power-Up URL (or KAEDE Netlify URL)
4. Authorize with your Trello API Key & Token

### Board-Level Features

When you open any Trello board with KAEDE enabled, you'll see two buttons in the board header:

**KAEDE Dashboard** button — opens `dashboard.html`:
- Shows sprint metrics (total cards, cards per list, completion %)
- MCP server status (online/offline)
- Quick action buttons (generate plan, execute plan)
- Last updated timestamp with refresh button
- Test count indicator (209 tests passing)

**KAEDE: Connect** button — opens `connect.html`:
- MCP Server configuration panel
- Board selector (list all Trello boards)
- Playbook enforcement toggle
- Environment sync controls

### Card-Level Features

Each card gets two additional buttons:

**KAEDE: Environment** button — opens `card.html`:
- Set environment label (PROD 🔴 / STAG 🟡 / DEV 🟢)
- View/update deploy URL
- Card badges show env status on the front

**KAEDE: MCP** button — opens `mcp.html`:
- Execute MCP tools directly on the card
- Run `generate_plan`, `execute_plan`, `enforce_playbook`
- View execution history

### Authorization

`auth.html` — popup for entering:
- **API Key** — your Trello API key
- **Token** — your Trello token
- **MCP Server URL** — e.g., `http://localhost:3456`

Settings persist in Trello's board shared storage.

### Architecture

```
Trello Power-Up ↔ MCP Client (mcp-client.js) ↔ API Server (api-server.ts) ↔ MCP Servers
```

The frontend communicates with KAEDE via the HTTP bridge:
- **Dev mode**: `http://localhost:3456` (via `kaede start`)
- **Production**: Netlify functions

---

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: ACCESS & INTERFACE                                       │
│                                                                     │
│  ┌──────────────────┐  ┌────────────────┐  ┌───────────────────┐   │
│  │ Trello Power-Up  │  │ MCP Client     │  │ CLI (kaede)       │   │
│  │ (kaede.js)       │  │ (mcp-client)   │  │ 17 commands       │   │
│  │ Board + Card     │  │ HTTP bridge    │  │ Full Trello       │   │
│  │ buttons, badges, │  │ to API server  │  │ operations        │   │
│  │ auth, env mgmt   │  │ auto-detect    │  │ via MCP           │   │
│  └────────┬─────────┘  └───────┬────────┘  └────────┬──────────┘   │
│           │                    │                     │              │
│           │         HTTP :3456 │                    bun             │
│           ▼                    ▼                     │              │
│  ┌───────────────────────────────────────────────────┘              │
│  │  api-server.ts  (HTTP → JSON-RPC bridge)                        │
│  │  POST /api/tool  →  callTool(name, args)                       │
│  │  POST /api/health → server status                              │
│  └──────────────────────────┬──────────────────────────────────────┘
└─────────────────────────────┼────────────────────────────────────────
                              │
┌─────────────────────────────▼────────────────────────────────────────┐
│  LAYER 2: ORCHESTRATION  (mcp.kaede — 19 MCP tools)                 │
│                                                                      │
│  ┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────────┐    │
│  │ Context &  │ │ Duplicate    │ │ Execution │ │ Report &      │    │
│  │ Planning   │ │ Detection    │ │ & Template│ │ History       │    │
│  │            │ │              │ │           │ │               │    │
│  │ parse_     │ │ find_card    │ │ generate_ │ │ generate_     │    │
│  │ playbook   │ │ detect_      │ │ template  │ │ sprint_report │    │
│  │            │ │ duplicates   │ │           │ │               │    │
│  │ bundle_    │ │ validate_    │ │ execute_  │ │ batch_update_ │    │
│  │ context    │ │ context      │ │ plan      │ │ cards         │    │
│  │            │ │              │ │           │ │               │    │
│  │ generate_  │ │ archive_     │ │ undo_last_│ │ get_execution │    │
│  │ plan       │ │ duplicates   │ │ plan      │ │ _history      │    │
│  └────────────┘ └──────────────┘ └──────────┘ └───────────────┘    │
│  ┌────────────┐ ┌──────────────┐                                    │
│  │Enforcement │ │ Core Engine  │                                    │
│  │            │ │              │                                    │
│  │enforce_    │ │ orchestrator │                                    │
│  │playbook    │ │ plan-handlers│                                    │
│  │            │ │ auto-chainer │                                    │
│  │6 validators│ │ prompter     │                                    │
│  │            │ │ templates    │                                    │
│  └────────────┘ └──────────────┘                                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  LAYER 3: TRELLO EXECUTION  (mcp.trello — 44 MCP tools)            │
│                                                                     │
│  Boards(4) │ Lists(6) │ Cards(9) │ Members(3) │ Labels(6)         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐   │
│  │list_   │ │get_    │ │get_my_ │ │get_board_│ │get_board_    │   │
│  │boards  │ │lists   │ │cards   │ │members   │ │labels        │   │
│  │search_ │ │add_list│ │get_    │ │assign_   │ │create_label  │   │
│  │boards  │ │_to_board│ │cards_  │ │member_   │ │update_label  │   │
│  │list_   │ │archive_│ │by_list │ │to_card   │ │delete_label  │   │
│  │worksp. │ │list    │ │get_card│ │remove_   │ │search_labels │   │
│  │create_ │ │update_ │ │add_    │ │member_   │ │remove_label_ │   │
│  │board   │ │list    │ │card_to │ │from_card │ │from_card     │   │
│  │        │ │copy_   │ │_list   │ └──────────┘ └──────────────┘   │
│  │        │ │list    │ │update_ │ Checklists(7) │ Comments(2)    │
│  │        │ │move_   │ │card_   │ ┌────────────┐ ┌────────────┐ │
│  │        │ │list    │ │details │ │create_     │ │add_comment │ │
│  └────────┘ └────────┘ │move_   │ │checklist   │ │get_card_   │ │
│                        │card    │ │add_        │ │comments    │ │
│ Attachments(5)         │archive_│ │checklist_  │ └────────────┘ │
│ ┌────────────────────┐ │_card   │ │item        │                │
│ │attach_file_to_card │ │copy_   │ │get_card_   │ Watch(2)      │
│ │attach_image_to_card│ │card    │ │checklists  │ ┌────────────┐ │
│ │get_card_attachments│ │search_ │ │update_     │ │watch_card  │ │
│ │attach_data_to_card │ │cards   │ │checklist_  │ │watch_list  │ │
│ │attach_image_data_  │ └────────┘ │item        │ └────────────┘ │
│ │to_card             │           │delete_     │                │
│ └────────────────────┘           │checklist_  │ Activity(1)   │
│ Sort(1)                          │item        │ ┌────────────┐ │
│ ┌────────────┐                   │delete_     │ │get_card_   │ │
│ │sort_list_  │                   │checklist   │ │activity    │ │
│ │cards       │                   │copy_       │ └────────────┘ │
│ └────────────┘                   │checklist   │                │
│ Utility(1)                      └────────────┘                │
│ ┌──────────────┐                                              │
│ │set_board_    │                Trello REST API               │
│ │project       │              (api.trello.com/1)              │
│ └──────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Complete Feature Inventory

### Layer 1: Access & Interface

#### Trello Power-Up Capabilities

Registered via `TrelloPowerUp.initialize()` in `public/js/kaede.js`:

| Capability | Implementation | Function |
|---|---|---|
| `board-buttons` | `board.html` + `connect.html` | Dashboard & Connect buttons in board header |
| `card-buttons` | `card.html` + `mcp.html` | Environment & MCP control on each card |
| `card-badges` | `card-badges` callback | Color badge: PROD=🔴, STAG=🟡, DEV=🟢, unset=⚪ |
| `show-card` | Card detail section | Show env name, deploy URL, set env button |
| `authorization-status` | Auth check | Verify auth + apiBase stored |
| `show-authorization` | `auth.html` popup | Set MCP URL + OAuth per-user (token member-private) |
| `on-enable` / `on-disable` | Lifecycle hooks | Log Power-Up enable/disable |
| `locale` | EN/ID translations | Indonesian labels for env |

#### MCP Client (public/js/mcp-client.js)

Self-contained module `KAEDEMCP`:

| Method | Description | API Call |
|---|---|---|
| `init(t)` | Auto-detect API base from Trello storage or hostname | — |
| `health()` | Health check | `GET /api/health` |
| `callTool(name, args)` | Call any MCP tool | `POST /api/tool` |
| `generatePlan(goal, extra?)` | Generate execution plan | `POST /api/tool` → `generate_plan` |
| `executePlan(plan, boards)` | Execute plan steps | `POST /api/tool` → `execute_plan` |
| `enforcePlaybook(playbook, plan, boards)` | Validate compliance | `POST /api/tool` → `enforce_playbook` |
| `parsePlaybook(content)` | Parse playbook markdown | `POST /api/tool` → `parse_playbook` |
| `callIntent(intent, args)` | Bridge intent (local & proxy, mis. `list_boards`, `get_board_lists`); otomatis lampirkan `Authorization: Bearer` token per-user | `POST /api/mcp` |
| `listBoards()` | List boards via bridge | `POST /api/mcp` → `list_boards` |
| `executeIntent(intent, args, boardId)` | Legacy MCP call | `POST /api/mcp` |

#### HTTP Bridge (src/api-server.ts)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Server health check |
| `/api/tool` | POST | Call KAEDE MCP tools (enforce_playbook, generate_plan, parse_playbook) |
| `/api/mcp` | POST | Legacy MCP endpoint |

#### CLI Commands Summary

| Command | Purpose | Key Flags |
|---|---|---|
| `setup` | Onboarding: auth OAuth + MCP config + verify | `--yes`, `--no-mcp`, `--no-init` |
| `auth` | Trello identity | `login`, `status`, `logout`, `token` (`--manual`, `--raw`) |
| `status` | Check config + MCP connection | `--mcp` |
| `today` | View today's tasks | — |
| `init` | Init project with KAEDE | `--name`, `--tech`, `--db`, `--playbook` |
| `push` | Create cards from markdown | `--board`, `--list`, `--labels` |
| `env` | Export credentials | `--bash`, `--ps`, `--cmd` |
| `playbook` | Parse/show playbook | `parse`, `show` subcommands |
| `orchestrate` | Load context | `--playbook`, `--detail` |
| `run` | Execute NL intent | `--playbook`, `--board`, `--intent`, `--dry-run` |
| `build` | Build MCP servers | — |
| `start` | Start API server | `[port]` |
| `test-tools` | Test Trello connection | — |
| `template` | Card template manager | `list`, `show`, `apply` |
| `report` | Sprint report | `sprint --board --name --list` |
| `archive` | Archive sprint | `sprint --board --list --action` |
| `install` | Global install | — |
| `help` | Display help | — |

---

### Layer 2: Orchestration (mcp.kaede — 19 tools)

#### Context & Planning (5 tools)

**1. `parse_playbook`**
- **Input:** `content` — markdown string
- **Output:** `{ roles, workflow, conventions, labels }`
- **Parses:** Role definitions, workflow lists, naming conventions, label conventions, AI instructions
- **Handles:** EN/ID section names, nested lists, code block exclusion, markdown formatting

**2. `bundle_context`**
- **Input:** `playbookPath`, `openkbPath`, `opencodePath`
- **Output:** `{ playbook, conventions }` — merged project context
- **Purpose:** Load all project context files into a single bundle for AI agent consumption

**3. `generate_plan`**
- **Input:** `goal`, `playbook`, optional `extraArgs`, optional `boards[]`
- **Output:** `PlanStep[]` — array of actionable steps
- **Engine:**
  1. Direct pattern match against 23+ intent patterns (ID + EN)
  2. Compound split via `splitCompoundGoal` if no direct match (8 conjunctions: "lalu", "dan", "then", "setelah itu", comma, etc.)
  3. Pre-flight validation via `runPreFlight` (duplicate detection + enforcement)
  4. Arg expansion via `expandArgsChain` (auto-chain assign/comment after create)

**4. `status`**
- **Input:** none
- **Output:** `{ version, playbook, openkb, opencode }` — path accessibility checks

**5. `resolve_board`**
- **Input:** `description` — natural language board description
- **Output:** `{ keywords }` — structured search keywords

#### Duplicate Detection (4 tools)

**6. `find_card`**
- **Input:** `cards[]`, `query` — card name to search
- **Output:** `{ exact, similar[] }` — exact match + fuzzy matches

**7. `detect_duplicates`**
- **Input:** `boards[]` — board snapshots with lists and cards
- **Output:** `{ groups[] }` — duplicate groups categorized as sameList / crossList / crossBoard

**8. `validate_context`**
- **Input:** `action` (create_card/create_label/create_board), `params`, `boards[]`
- **Output:** `{ warnings[] }` — pre-flight validation warnings

**9. `archive_duplicates`**
- **Input:** `groups[]` (from detect_duplicates), `keepStrategy` (oldest/newest/longest_desc)
- **Output:** archive plan with which cards to keep/archive

#### Execution & Template (5 tools)

**10. `generate_template`**
- **Input:** `template` name (feature/bug/task/chore/onboarding), `task`, optional vars
- **Output:** card content with description + checklist + comment
- **5 Built-in Templates:**
  - **feature:** `## Description`, `## Acceptance Criteria`, `## Technical Notes`
  - **bug:** `## Steps to Reproduce`, `## Expected vs Actual`, `## Environment`
  - **task:** `## Objective`, `## Definition of Done`, `## Notes`
  - **chore:** `## Task List` (with checklist items), `## Notes`
  - **onboarding:** `## Welcome!`, `## Setup Checklist` (Bun, repo, credentials, build guide)

**11. `resolve_context`**
- **Input:** `goal` — natural language goal
- **Output:** `{ board, list, warnings }` — resolved board/list with fuzzy match warnings

**12. `execute_plan`**
- **Input:** `plan[]` (PlanStep array, each with action + params), optional `boards[]`
- **Output:** `{ results[], refMap }` — execution results with reference ID mapping
- **Features:**
  - Dependency tracking via `dependsOn` + `ref` fields
  - Auto-skip already-executed steps via check
  - Ref injection via `injectAutoRefs`
  - Cross-plan resolution via `resolveCrossPlanRefs`

**13. `undo_last_plan`**
- **Input:** none
- **Output:** `{ success, reversed[] }` — reverses each action in the last plan
- **Supported reverses:**
  - `create_board` → `close_board`
  - `create_list` → `archive_list`
  - `create_card` → `archive_card`
  - `archive_card` → `unarchive_card` (move back to original list)
  - `move_card` → `move_card` back
  - `create_label` → `delete_label`
  - `create_checklist` → `delete_checklist`
  - `add_comment` → (no-op with warning)
  - `assign_member` → `remove_member`
  - `remove_member` → `assign_member`

**14. `load_templates`**
- **Input:** `dirPath` — path to directory of template markdown files
- **Output:** `{ templates[] }` — user-defined templates loaded from files

#### Report & History (4 tools)

**15. `generate_sprint_report`**
- **Input:** `boardId`, optional `listNames[]`, optional `sprintName`
- **Output:** formatted markdown report with:
  - Total cards count
  - Cards per list breakdown
  - Completion percentage
  - Overdue cards
  - Per-member distribution

**16. `batch_update_cards`**
- **Input:** `boardId`, `filter` (listName, label, memberId, dueBefore/After), `operation` (move, update, archive)
- **Output:** `{ updated[] }` — list of cards that were updated

**17. `get_execution_history`**
- **Input:** none
- **Output:** `{ history[] }` — last 10 executed plans with actions, timestamps, status

**18. `clear_execution_history`**
- **Input:** none
- **Output:** `{ success }`

#### Enforcement (1 tool)

**19. `enforce_playbook`**
- **Input:** `playbook`, optional `plan[]`, optional `boards[]`
- **Output:** `{ safe, warnings[], summary }` — compliance check results
- **6 Validators:**
  - **`validateCardPrefix`** — checks card title uses allowed prefix (e.g., `[FEATURE]`, `[BUG]`)
  - **`validateCardLabel`** — checks card uses allowed labels from conventions
  - **`validateWorkflowList`** — checks list is in the defined workflow
  - **`validateRoleAccess`** — checks role has permission for the action
  - **`enforceSingleAction`** — validates a single action
  - **`enforcePlaybook`** — full plan validation combining all validators

---

### Layer 3: Trello Execution (mcp.trello — 44 tools)

#### Board & Workspace (4 tools)

| Tool | Parameters | Description |
|---|---|---|
| `list_boards` | `nameFilter?` (substring) | List all Trello boards, optionally filtered by name |
| `search_boards` | `query` | Search boards with relevance scoring by name/desc |
| `list_workspaces` | — | List all organizations/workspaces |
| `create_board` | `name`, `defaultLists?` (boolean) | Create a new board, optionally with default lists |

#### Lists (6 tools)

| Tool | Parameters | Description |
|---|---|---|
| `get_lists` | `boardId` | Get all lists in a board with id, name, pos, closed |
| `add_list_to_board` | `boardId`, `name`, `pos?` | Add a new list |
| `archive_list` | `boardId`, `listId` | Archive a list (and optionally all cards) |
| `update_list` | `listId`, `name?`, `pos?`, `closed?` | Update list name, position, or close state |
| `copy_list` | `sourceListId`, `boardId`, `name?` | **Copy** a list and all its cards to another board |
| `move_list` | `sourceListId`, `boardId`, `name?` | **Move** a list and all its cards to another board |

#### Cards (9 tools)

| Tool | Parameters | Description |
|---|---|---|
| `get_my_cards` | — | Get all cards assigned to the authenticated user |
| `get_cards_by_list_id` | `listId`, `fields?` | Get all cards in a specific list |
| `get_card` | `cardId`, `fields?` | Get detailed card information |
| `add_card_to_list` | `listId`, `name`, `desc?`, `due?`, `dueReminder?`, `memberIds?`, `labelIds?`, `pos?` | Create a new card with optional fields |
| `update_card_details` | `cardId`, `name?`, `desc?`, `due?`, `dueReminder?`, `pos?`, `closed?` | Update card fields |
| `move_card` | `cardId`, `listId`, `pos?` | Move card to another list |
| `archive_card` | `cardId` | Archive a card |
| `copy_card` | `cardId`, `listId`, `name?`, `keepDue?` | Duplicate a card to another list |
| `search_cards` | `query`, `boardId?` | Full-text search across one or all boards |

#### Members (3 tools)

| Tool | Parameters | Description |
|---|---|---|
| `get_board_members` | `boardId` | Get all members of a board |
| `assign_member_to_card` | `cardId`, `memberId` | Assign a member to a card |
| `remove_member_from_card` | `cardId`, `memberId` | Remove a member from a card |

#### Labels (6 tools)

| Tool | Parameters | Description |
|---|---|---|
| `get_board_labels` | `boardId` | Get all labels on a board |
| `create_label` | `boardId`, `name`, `color` | Create a new label with color |
| `update_label` | `labelId`, `name?`, `color?` | Update label name or color |
| `delete_label` | `labelId` | Delete a label |
| `search_labels` | `boardId`, `query` | Search labels by name substring or color |
| `remove_label_from_card` | `cardId`, `labelId` | Remove a single label from a card |

#### Checklists (7 tools)

| Tool | Parameters | Description |
|---|---|---|
| `create_checklist` | `cardId`, `name`, `items?[]` | Create a checklist, optionally with initial items |
| `add_checklist_item` | `checklistId`, `name`, `pos?`, `checked?` | Add an item to a checklist |
| `get_card_checklists` | `cardId` | **NEW** Get all checklists on a card with their items |
| `update_checklist_item` | `checklistId`, `itemId`, `name?`, `checked?`, `pos?` | Update item name, state, or position |
| `delete_checklist_item` | `checklistId`, `itemId` | Delete an item from a checklist |
| `delete_checklist` | `checklistId` | Delete an entire checklist |
| `copy_checklist` | `sourceChecklistId`, `cardId`, `name?` | Copy a checklist to another card |

#### Comments (2 tools)

| Tool | Parameters | Description |
|---|---|---|
| `add_comment` | `cardId`, `text` | Add a comment to a card |
| `get_card_comments` | `cardId`, `fields?` | Get comments on a card |

#### Attachments (5 tools)

| Tool | Parameters | Description |
|---|---|---|
| `attach_file_to_card` | `cardId`, `fileUrl`, `name?`, `mimeType?` | Attach a file from URL |
| `attach_image_to_card` | `cardId`, `imageUrl`, `name?` | Attach an image from URL |
| `get_card_attachments` | `cardId` | **NEW** Get all attachments with metadata (id, name, url, mimeType, bytes, date) |
| `attach_data_to_card` | `cardId`, `data` (base64 or data URL), `name?`, `mimeType?` | Attach data via FormData |
| `attach_image_data_to_card` | `cardId`, `imageData` (base64 or data URL), `name?` | Attach image data (screenshot convenience) |

#### Watch & Activity (3 tools)

| Tool | Parameters | Description |
|---|---|---|
| `watch_card` | `cardId`, `subscribed` (boolean) | Subscribe/unsubscribe from card notifications |
| `watch_list` | `listId`, `subscribed` (boolean) | Subscribe/unsubscribe from list notifications |
| `get_card_activity` | `cardId`, `filter?`, `limit?` | Get card action history (comments, moves, updates) |

#### Sort & Utility (2 tools)

| Tool | Parameters | Description |
|---|---|---|
| `sort_list_cards` | `listId`, `sortBy` (name/due/dateCreated/dateLastActivity), `reverse?` | Reorder cards in a list by criteria |
| `set_board_project` | `boardId`, `projectName` | Set project metadata in board description |

---

## Core Engine Modules (src/)

### Module Map

| Module | Location | Lines | Purpose | Exports |
|---------|----------|-------|---------|---------|
| **orchestrator** | `src/orchestrator.ts` | ~150 | Main entry, re-exports, `generatePlan()` | `generatePlan`, `expandArgsChain`, `matchHandler` |
| **plan-handlers** | `src/plan-handlers.ts` | ~350 | NL pattern → PlanStep mapping (23 patterns) | `onPlan()` handlers, `runPreFlight()` |
| **intent-handlers** | `src/intent-handlers/` (11 files) | ~500 | Runtime NL execution via live Trello | `executeIntent()` |
| **plan-executor** | `src/plan-executor.ts` | ~200 | Multi-step plan execution with deps | `executePlan()`, `undoLastPlan()` |
| **plan-executors** | `src/plan-executors/` (8 files) | ~400 | Individual action executors | `execCreateCard`, `execMoveCard`, etc. |
| **playbook-parser** | `src/playbook-parser.ts` | ~200 | Parse playbook markdown → structured data | `parsePlaybook()`, `bundleContext()` |
| **enforcer** | `src/enforcer.ts` | ~195 | Playbook compliance (6 validators) | `enforcePlaybook()`, `enforceSingleAction()`, etc. |
| **duplicate-detector** | `src/duplicate-detector.ts` | ~200 | Card duplicate detection/archiving | `findCard()`, `detectDuplicates()`, `archiveDuplicates()`, `validateContext()` |
| **auto-chainer** | `src/auto-chainer.ts` | ~140 | Compound intent splitting | `splitCompoundGoal()`, `injectAutoRefs()`, `resolveCrossPlanRefs()` |
| **templates** | `src/templates.ts` | ~150 | Card template engine (5 built-in) | `getTemplate()`, `applyTemplate()`, `listTemplates()` |
| **prompter** | `src/prompter.ts` | ~250 | AI prompt builder + smart defaults | `resolveBoard()`, `resolveList()`, `inferFromGoal()`, `resolveContext()` |
| **report-generator** | `src/report-generator.ts` | ~150 | Sprint report markdown generation | `generateSprintReport()` |
| **batch-updater** | `src/batch-updater.ts` | ~150 | Batch card update/move | `batchUpdateCards()` |
| **history-store** | `src/history-store.ts` | ~100 | Execution history (in-memory) | `getExecutionHistory()`, `clearExecutionHistory()` |
| **trello-client** | `src/trello-client.ts` | ~282 | JSON-RPC MCP client + domain services | `TrelloMCPClient` class |
| **mcp-helpers** | `src/mcp-helpers.ts` | ~50 | MCP client lifecycle helpers | `connectWithRetry()`, `ensureConnection()` |
| **api-server** | `src/api-server.ts` | ~100 | HTTP → JSON-RPC bridge | `startApiServer()` |
| **kaede-mcp-server** | `src/kaede-mcp-server.ts` | ~250 | MCP stdio server (19 tools) | `handleToolsCall`, `TOOLS` array |
| **types** | `src/types/` (4 files) | — | TypeScript type definitions | PlanTypes, PlaybookTypes, TemplateTypes, TrelloTypes |
| **interfaces** | `src/interfaces/` (10 files) | — | Interface contracts for domain services | IBoardClient, ICardClient, etc. |
| **services** | `src/services/` (10 files) | — | RPC-based service implementations | BoardService, CardService, RpcService, etc. |

### Service Layer (src/services/)

| Service | Methods | Purpose |
|---------|---------|---------|
| `RpcService` | `connect()`, `sendRequest()`, `callTool()`, `close()` | Low-level JSON-RPC 2.0 stdio client |
| `BoardService` | `listBoards()`, `listWorkspaces()`, `createBoard()` | Board CRUD |
| `CardService` | `getMyCards()`, `getCardsByListId()`, `getCard()`, `createCard()`, `updateCard()`, `moveCard()`, `archiveCard()`, `copyCard()` | Card CRUD |
| `ListService` | `getLists()`, `createList()`, `archiveList()`, `updateList()`, `sortListCards()`, `copyList()`, `moveList()` | List CRUD |
| `MemberService` | `getBoardMembers()`, `assignMember()`, `removeMember()` | Member management |
| `LabelService` | `getBoardLabels()`, `createLabel()`, `updateLabel()`, `deleteLabel()`, `addLabelToCard()`, `removeLabelFromCard()`, `searchLabels()` | Label management |
| `ChecklistService` | `createChecklist()`, `addChecklistItem()`, `deleteChecklist()`, `deleteChecklistItem()`, `updateChecklistItem()`, `getCardChecklists()`, `copyChecklist()` | Checklist management |
| `CommentService` | `addComment()`, `getCardComments()` | Comment management |
| `AttachmentService` | `attachFileToCard()`, `attachImageToCard()`, `getCardAttachments()`, `attachDataToCard()`, `attachImageDataToCard()` | Attachment management |
| `WatchService` | `watchCard()`, `unwatchCard()`, `watchList()`, `unwatchList()`, `getCardActivity()` | Watch & activity |

### Interface Contracts (src/interfaces/)

Each domain service has a corresponding interface:
- `IBoardClient` — `IRpcClient`
- `ICardClient` — extends `IBoardClient`
- `IListClient`, `IMemberClient`, `ILabelClient`
- `IChecklistClient`, `ICommentClient`, `IAttachmentClient`, `IWatchClient`

---

## Workflow Examples

### Example 1: Start a Sprint

```bash
# Step 1: Run the intent
kaede run --playbook sprint.md --intent "Mulai Sprint Alpha"

# What happens internally:
# 1. parse_playbook(sprint.md) → workflow lists: [To Do, In Progress, Review, Done]
# 2. matchHandler("mulai sprint") → PlanStep[]:
#    [{action: "create_list", list: "To Do"},
#     {action: "create_list", list: "In Progress"},
#     {action: "create_list", list: "Review"},
#     {action: "create_list", list: "Done"}]
# 3. executePlan(steps) → Trello API calls for each list creation
# 4. Results with refMap → { list:0 → "abc", list:1 → "def", ... }
```

### Example 2: Create Cards with Assignments

```bash
# Single card
kaede run --playbook sprint.md "Buat card Fitur Login di list To Do"
# → add_card_to_list( "To Do", {name: "Fitur Login"} )

# Card with assignment (auto-chain)
kaede run --playbook sprint.md "Buat card Dashboard Page" --member "sandikodev"
# → add_card_to_list() + assign_member_to_card()  (auto-chained via expandArgsChain)

# Card with comment
kaede run --playbook sprint.md "Buat card Bug Report Login" --text "Priority: High"
# → add_card_to_list() + add_comment()  (auto-chained)
```

### Example 3: Sprint Report & Archive

```bash
# Generate report
kaede report sprint --board abc123 --name "Sprint 1"

# Archive completed cards
kaede archive sprint --board abc123 --list "Done" --action all

# Or via NL
kaede run --playbook sprint.md "Tutup Sprint 1"
```

### Example 4: Compound Intents

```bash
# Multiple actions in one command (auto-chaining)
kaede run --playbook sprint.md "Buat card Fitur Login lalu assign ke Sandiko lalu tambah label feature"
# → 1. create_card("Fitur Login")
# → 2. assign_member_to_card(ref:card:0, "Sandiko")
# → 3. add_label_to_card(ref:card:0, "feature")

# Supported conjunctions: "lalu", "dan", "then", "setelah itu", "lalu", comma (,)
```

### Example 5: Via MCP (for AI Agents)

```json
// AI Agent → mcp.kaede → generate_plan
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generate_plan",
    "arguments": {
      "goal": "Mulai Sprint Alpha",
      "playbook": { "workflow": { "lists": ["To Do", "In Progress", "Review", "Done"] } }
    }
  }
}

// Response: PlanStep[]
[
  { "action": "create_list", "params": { "name": "To Do" }, "ref": "list:0" },
  { "action": "create_list", "params": { "name": "In Progress" }, "ref": "list:1" },
  { "action": "create_list", "params": { "name": "Review" }, "ref": "list:2" },
  { "action": "create_list", "params": { "name": "Done" }, "ref": "list:3" }
]

// Then AI Agent → mcp.trello → execute each step
```

### Example 6: Using Trello Tools Directly

```json
// AI Agent → mcp.trello
{
  "method": "tools/call",
  "params": {
    "name": "add_card_to_list",
    "arguments": {
      "listId": "abc123",
      "name": "Fitur Login",
      "desc": "Implementasi JWT authentication",
      "due": "2026-07-10",
      "memberIds": ["user456"],
      "labelIds": ["label789"]
    }
  }
}
```

---

## Upstream Differences

KAEDE vs `delorenj/mcp-server-trello` (upstream):

| Aspect | Upstream (45+ tools) | KAEDE |
|--------|---------------------|-------|
| **Orchestration** | ❌ | ✅ 19 mcp.kaede tools |
| **NL Intents** | ❌ | ✅ 23+ patterns (ID + EN) |
| **Playbook Awareness** | ❌ | ✅ Parse, enforce, validate playbooks |
| **Auto-Chaining** | ❌ | ✅ 8 conjunctions, compound split, ref injection |
| **Duplicate Detection** | ❌ | ✅ find_card, detect_duplicates, archive_duplicates |
| **Undo Support** | ❌ | ✅ undo_last_plan with reverse actions |
| **Execution History** | ❌ | ✅ get/clear_execution_history |
| **Playbook Enforcement** | ❌ | ✅ 6 validators (prefix, label, workflow, role, etc.) |
| **Template Engine** | ❌ | ✅ 5 built-in + custom templates |
| **Batch Operations** | ❌ | ✅ batch_update_cards |
| **Sprint Reports** | ❌ | ✅ generate_sprint_report |
| **Trello Power-Up** | ❌ | ✅ Full Power-Up with board/card buttons, badges, env mgmt |
| **HTTP Bridge** | ❌ | ✅ API server for frontend integration |
| **CLI** | ❌ | ✅ 17 CLI commands |
| **Global Install** | ❌ | ✅ `kaede install` → `~/.kaede/` + `bun link` |
| **`get_card_attachments`** | ❌ | ✅ **NEW**: List all attachments with metadata |
| **`get_card_checklists`** | ❌ | ✅ **NEW**: Get checklists + items |
| **`watch_card` / `watch_list`** | ❌ | ✅ **NEW**: Subscribe to notifications |
| **`search_labels`** | ❌ | ✅ **NEW**: Search by name/color |
| **`remove_label_from_card`** | ❌ | ✅ **NEW**: Single label removal |
| **`copy_list` / `move_list`** | ❌ | ✅ **NEW**: List operations |
| **Testing** | vitest | 209 bun tests (mocked) |

### Upstream PR Status

| PR | Tool | Status | URL |
|----|------|--------|-----|
| #98 | `get_card_attachments` + `get_card_checklists` | Open (review done) | [PR #98](https://github.com/delorenj/mcp-server-trello/pull/98) |
| #99 | `watch_card` + `watch_list` | Open (review done) | [PR #99](https://github.com/delorenj/mcp-server-trello/pull/99) |
| #100 | `search_labels` + `remove_label_from_card` | Open (fix pushed) | [PR #100](https://github.com/delorenj/mcp-server-trello/pull/100) |

---

## Testing

### Test Suite

209 tests across 9 files, all passing:

| Test file | Tests | What it tests |
|-----------|-------|---------------|
| `test/orchestrator.test.js` | 19 | parsePlaybook (13 variants), generatePlan composite intents (4), executePlan (2) |
| `test/e2e-orchestrator.test.js` | 25 | Full E2E: parsePlaybook → executeIntent (16 intent patterns + error cases) |
| `test/prompter.test.js` | 24 | resolveBoard (6), resolveList (3), inferFromGoal (7), resolveContext (4), fillCardDefaults (2) |
| `test/templates.test.js` | 17 | getTemplate (6), applyTemplate (7), generateCardFromTemplate (2) |
| `test/trello-client.test.js` | 17 | RPC client: constructor (3), sendRequest (2), close (2), callTool (2), delegates (5) |
| `test/mcp-server.test.js` | 46 | 44 Trello tools via mocked global.fetch, error cases (2) |
| `test/kaede-mcp-server.test.js` | 19 | MCP stdio RPC: init, tools/list (19 tools), status, unknown tool/method |
| `test/auto-chainer.test.js` | 16 | splitCompoundGoal (7), injectAutoRefs (4), resolveCrossPlanRefs (2), extractChainArgs (3) |
| `test/enforcer.test.js` | 23 | validateCardPrefix (5), validateCardLabel (4), validateWorkflowList (3), validateRoleAccess (3), enforcePlaybook (6), enforceSingleAction (2) |
| **Total** | **209** | **All pass, 0 fail** |

### Running Tests

```bash
# All tests
bun test
# or
bun scripts/run-tests.ts

# Individual test files
bun test test/orchestrator.test.js
bun test test/e2e-orchestrator.test.js
bun test test/mcp-server.test.js
bun test test/kaede-mcp-server.test.js
```

### Manual Testing (requires Trello credentials)

```bash
# Get test card IDs from test board
bun test/get-test-card.js

# Run attachment tests
bun test/manual-test-attachments.ts

# Run checklist tests
bun test/manual-test-checklist.ts
```

**Test Board:** [https://trello.com/b/rAKmlRj3/lab-testing-kaede](https://trello.com/b/rAKmlRj3/lab-testing-kaede)

---

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| `kaede: command not found` | bun link not set up | Run `bun scripts/kaede.ts install` from repo |
| `MCP server exited with code 1` | Server path not found or bunx entry in opencode.json | Run `kaede install` to update MCP config |
| `TRELLO_API_KEY not configured` | Secrets not set up | Run `kaede auth login` (atau `kaede setup`) |
| `playbook parse returns empty` | Markdown format not recognized | Use `## Role:` or `## Peran:` sections with `- ` list items |
| `MCP server not responding` | API server not running | Run `kaede start` (or `kaede start 8080`) |
| `Connection refused` | Wrong port | Check MCP URL in auth settings (default: localhost:3456) |
| `generate_plan returns unknown intent` | NL not recognized | Use exact intent name from `kaede help`, or check `plan-handlers.ts` patterns |

### Environment

- **Credentials:** `~/.config/kaede/secrets.env`
- **Global install:** `~/.kaede/`
- **MCP config:** `~/.config/opencode/opencode.json`
- **Dev server:** `http://localhost:3456`
- **Production UI:** `https://kaede-powerup.netlify.app`
- **Trello API docs:** [https://developer.trello.com/docs](https://developer.trello.com/docs)

### Support

- **Documentation:** Check `docs/` folder
- **Test Board:** [Lab Testing KAEDE](https://trello.com/b/rAKmlRj3/lab-testing-kaede)
- **Upstream:** [delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello)
- **Maintainer:** Sandikodev — PT Koneksi Jaringan Indonesia

---

**© 2026 PT Koneksi Jaringan Indonesia — Proprietary (internal use allowed)**
