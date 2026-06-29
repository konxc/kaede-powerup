# KAEDE Architecture & Roadmap — Human+AI Collaborative Orchestration System

KAEDE (Koneksi Automated Environment DE) is developed as a **Universal Collaborative Orchestration Platform**. KAEDE bridges high-level communication (work reference documents) with low-level technical execution on Trello, enabling teams of Humans and AI to work together synergistically without friction.

---

## 1. Big Vision & Architecture Philosophy

### 1.1 Core Problem: Manual MCP Overhead
Using an AI Agent to manage tasks on Trello manually (e.g. using a basic Trello MCP) is exhausting and error-prone. Every interaction requires the Agent to repeatedly call raw tools (`create_card`, `add_label`, `move_card`, `assign_member`, etc.) without full business context understanding. AI Agents often get "lost" trying to grasp team rules, sprint flow, or writing conventions.

### 1.2 KAEDE Solution: Intent-Driven Orchestrator
KAEDE acts as an intelligence & orchestration layer sitting above technical execution. Under this system, humans/PMs simply define SOPs and priorities, and KAEDE converts them into a unified set of instructions understood by the AI Agent (Opencode) to execute the Trello MCP automatically and precisely.

---

## 2. Data Flow & Four-Pillar Ecosystem

The collaborative system within the PT Koneksi Jaringan Indonesia ecosystem is organized into the following four pillars:

```
        ┌────────────────────────────────────────────────────────┐
        │                        PLAYBOOK                        │
        │      (Human → Human: SOP, Workflow, Work References)     │
        │    Written by Manager, PM, Lead, or business owner      │
        └───────────────────────────┬────────────────────────────┘
                                    │ KAEDE reads & integrates
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                        OPENKB                          │
        │        (Human ↔ AI: Glossary, Decision Log, Context)   │
        │          Located in every Workspace / Project          │
        └───────────────────────────┬────────────────────────────┘
                                    │ Loaded as instructions
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                       OPENCODE                         │
        │       (Agent Config: Execution Rules, Commands)        │
        │          Located in every Workspace / Project          │
        └───────────────────────────┬────────────────────────────┘
                                    │ Directs execution
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                  MCP.KAEDE (Pure Context)              │
        │        (kaede-mcp-server.js — 4 context tools)         │
        │   parse_playbook, bundle_context, generate_plan, status │
        └──────────────────────┬─────────────────────────────────┘
                               │ Plan (ActionStep[] with names)
                               ▼
        ┌────────────────────────────────────────────────────────┐
        │                  MCP.TRELLO (Executor)                 │
        │            (mcp-server.js — 24 Trello tools)           │
        └──────────────────────┬─────────────────────────────────┘
                              │ stdio JSON-RPC
                              ▼
        ┌────────────────────────────────────────────────────────┐
        │                        TRELLO                          │
        │              (Board, Lists, Cards, Labels)             │
        └────────────────────────────────────────────────────────┘

        Both MCP servers (mcp.kaede & mcp.trello) are registered in
        ~/.config/opencode/opencode.json as separate entries.
        The AI Agent calls mcp.kaede for context & plan,
        then mcp.trello for execution on Trello.
```

### Detailed Flow Explanation:
1. **Playbook (Human → Human)**: Markdown/YAML documents containing team SOPs, sprint rules, role responsibilities (ROLES), and work conventions. The Playbook dictates how humans collaborate with other humans.
2. **OpenKB (Human ↔ AI)**: Provides a shared knowledge bridge. Stores a glossary of terms, project references, and technical decision history (decision log) so the AI Agent understands team-specific terminology.
3. **OpenCode (Agent Config)**: Contains the `.opencode/opencode.json` manifest that configures the AI Agent's technical capabilities, the list of allowed MCP tools, and custom commands.
4. **KAEDE (Orchestrator)**: Integrates the three documents above. KAEDE reads the Playbook to understand "how tasks should be organized" and reads OpenKB to understand "what the project context is", then directs the AI Agent to act intelligently when managing Trello via the Trello MCP Server.

---

## 3. Codebase Structure & Current Implementation Status

### 3.1 Project Directory Structure
```
powerup-konxc/
├── .github/workflows/docs.yml   # CI/CD auto-deploy Markdown documentation → HTML
├── .opencode/
│   ├── opencode.json            # AI Agent & local MCP Server configuration
│   └── SHARED/
│       ├── agent-rules.md       # Basic AI Agent behavior rules
│       └── project-context.md   # KAEDE global project context
├── .openkb/
│   ├── TEMPLATE.md              # Standard knowledge base template
│   └── SHARED/
│       ├── decision-log.md      # Architecture & feature decision records
│       ├── glossary.md          # 14 key terms of the KAEDE ecosystem
│       └── references.md        # Repository links & external tools
├── dist/
│   └── mcp-server.js            # Compiled Trello MCP Server (target: Bun)
├── docs/
│   ├── index.md                 # Documentation overview
│   ├── api-key.md               # Guide for obtaining Trello credentials
│   ├── mcp-server.md            # Trello MCP Server configuration
│   ├── opencode.md              # Opencode integration documentation
│   ├── tools.md                 # Description of 24 available Trello MCP tools
│   ├── role-management.md       # AI Agent role & Trello integration details
│   └── kaede-architecture.md    # [THIS DOCUMENT] In-depth architecture & roadmap
├── public/                      # Static Assets (Netlify Deploy)
│   ├── index.html               # Dual-Mode: Power-Up Connector & Landing Page
│   ├── board.html               # Static Dashboard Popup (Env stats)
│   ├── card.html                # Per-card Environment manager (PROD/STAG/DEV)
│   ├── auth.html                # Mock Authorization page
│   ├── privacy.html             # Multilingual privacy policy
│   └── js/kaede.js              # Implementation of 7 Trello Power-Up Capabilities
├── scripts/
│   ├── kaede.mjs                # Main CLI Tool (15+ commands: playbook, orchestrate, run, start, build, install, etc.)
│   └── build-docs.mjs           # Markdown → HTML compilation script
└── src/
    ├── mcp-server.js            # Trello MCP Server source code (24 tools)
    ├── api-server.mjs           # HTTP API server (port 3456)
    ├── orchestrator.js          # Orchestrator — parsePlaybook, executeIntent, bundleContext, generatePlan
    ├── trello-client.js         # MCP Client — 24 tool wrappers + timeout + reconnect
    ├── style.css                # CSS Source (Tailwind v4 + custom utility)
    └── index.html               # Landing page (deployed to Netlify)
```

### 3.2 File-by-File Analysis & Gap Assessment

#### A. Frontend Power-Up (`public/`)
* **`index.html`**: A very clever dual-mode design. When loaded inside a Trello iframe, it hides the site visuals and activates the Power-Up connector. When accessed directly, it acts as the ecosystem landing page.
* **`js/kaede.js`**: Successfully registers 7 Trello capabilities (board button, card button, badge, show-card panel, auth hooks, locale, lifecycle).
  * *Gap*: All frontend operations still depend on Trello's local Shared Storage and `localStorage`. Not yet connected to real-time status from the MCP Server or a centralized database.
* **`card.html` & `board.html`**: Successfully provide minimal UI for environment management (PROD, STAG, DEV).
  * *Gap*: Static state. Environment selection on cards does not yet trigger actual Label addition on Trello dynamically. Board popup environment status calculations are buggy because they only increment without tracking previous state.

#### B. CLI Tool (`scripts/kaede.mjs`)
* 15+ commands: `playbook parse/show`, `orchestrate`, `run` (+dry-run), `build`, `start`, `install`, `init`, `setup`, `today`, `status` (+--mcp), `test-tools`, `env`, `push`.
* *Gap*: No direct integration with Google Calendar / academic schedule for auto-syncing sprint timelines yet.

#### C.1. Trello MCP Server (`src/mcp-server.js`) — Executor
* Provides a standalone MCP protocol implementation with 24 essential Trello tools (22 original + 2 checklist). Functions purely as an executor — receives commands with Trello IDs and executes them.
  * *Gap*: No multi-tool chaining feature yet. Use the context layer above it (`mcp.kaede`) for that.

#### C.2. KAEDE Orchestrator MCP (`src/kaede-mcp-server.js`) — Pure Context
* The second MCP server that stands alone as a pure context provider. Has no access to Trello.
* **4 tools**: `parse_playbook` (parse playbook → structured), `bundle_context` (merge playbook + openkb + opencode), `generate_plan` (intent → ActionStep[] with names), `status` (check playbook & openkb paths).
* Designed to be called by the AI Agent as the first step: `mcp.kaede.generate_plan` → receive plan → resolve IDs via `mcp.trello.*` → execute.
* Does not import `trello-client.js`, no Trello dependencies whatsoever.
* *Gap*: No automatic validation that resolved Trello IDs are correct before execution.

---

## 4. Strategic Gap Analysis (Current vs Target Vision)

| Feature / Dimension | Current State (As-Is) | Target Vision (To-Be) | Gaps | Priority |
|---|---|---|---|---|
| **Trello Execution** | Plan via `mcp.kaede.generate_plan` (16 intent → ActionStep[]), execution via `mcp.trello.*` (24 tools) | Automated multi-step orchestration (1 intent → chained execution) | Plan → execute is still manual (AI agent chain), no auto-chaining on server | **🟡 Medium** |
| **Playbook Integration** | Active parsing (Markdown → section map → bundle context) | Parsed + enforced in real-time by the AI Agent | Parse output is still a dictionary, not fully structured for auto-enforcement | **🟡 Medium** |
| **Trello State Sync** | Direct MCP (via trello-client.js wrapper, 24 tools) | Real-time Label & Metadata Sync via Trello API directly | Power-Up frontend still uses Shared Storage, not via MCP | **🟡 Medium** |
| **API Server** | HTTP bridge active (port 3456, endpoint /api/mcp & /api/health) | Visual dashboard with real-time sprint metrics | Only a REST proxy, no dashboard UI yet | **🟡 Medium** |

---

## 5. Development Plan & Roadmap

### ✅ Phase 1 — Cleanup & Context Strengthening (COMPLETE)
1. **✅ Reference Cleanup**: All project-specific references (smauii/laravel) removed from KAEDE OpenKB. KAEDE is now purely universal.
2. **✅ Auto-Compilation**: `scripts/build-mcp.mjs` + `kaede build` command for building the MCP server.
3. **✅ Playbook Parser**: `parsePlaybook` in `src/orchestrator.js` — shared between CLI and orchestrator.
4. **✅ Intent-Driven Orchestrator**: `executeIntent` with 16 handlers (7 original + 9 additional: create label, archive, move all, create board, remove member, add label, archive list, update card, create checklist).
5. **✅ generatePlan()**: 16 intent pattern handlers → returns ActionStep[] with names (without Trello IDs).
6. **✅ Pure Context Refactor**: `mcp.kaede` separated from Trello — 4 tools, zero Trello dependencies.

### 🟡 Phase 2 — MCP Enhancements & Concern Separation (IN PROGRESS)
1. **⬜ Attachments Implementation** (5 tools): `attach_file_to_card`, `attach_image_to_card`, `attach_data_to_card`, `attach_image_data_to_card`, `get_card_attachments` (new contribution)
2. **⬜ Copy Card** (1 tool): `copy_card` with keepFromSource options
3. **⬜ Checklist Enhancements** (4 tools): Delete checklist/item, update checklist item, get card checklists (new contribution)
4. **⬜ Advanced Features** (5 tools): Watch card/list, get card activity, search labels, remove label from card
5. **⬜ Upstream Contribution** (3 PRs): Prepare and submit PRs to delorenj/mcp-server-trello
6. **⬜ Code Architecture Refactor**: Modular structure (tools/, trello/ directories)

**Documentation:**
- [`DEVELOPMENT-ROADMAP.md`](DEVELOPMENT-ROADMAP.html) — Master development plan
- [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) — Upstream contribution guide
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) — Detailed feature specs

### 🟡 Phase 3 — Frontend Power-Up Integration (PHASED)
1. **✅ API Server**: `src/api-server.mjs` — HTTP bridge port 3456, endpoints `/api/health` & `/api/mcp`.
2. **✅ Power-Up MCP Panel**: `public/mcp.html` — intent control panel directly from Trello popup.
3. **⬜ Sync Label Environment**: Connect environment buttons in `card.html` to the MCP API for auto-adding labels.
4. **⬜ Dynamic Dashboard**: `board.html` real-time stats via MCP API.

---

*This document is the official architecture reference for KAEDE, PT Koneksi Jaringan Indonesia.*
