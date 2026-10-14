# Universal OpenKB Specification & KAEDE 4-Layer Context

This document outlines the universal context hierarchy architecture initiated by **Sandiko (Founder of PT Koneksi Jaringan Indonesia)** to connect operator identity, corporate operational governance, project knowledge bases, and AI Agent harnesses (including OpenCode, Antigravity 2.0, Claude Code, OpenClaw, and Hermes).

---

## 1. Problem: "Agent Identity & Context Amnesia"

When adopting AI coding agents in real-world team environments, two critical bottlenecks arise:
1. **Context Amnesia**: AI agents do not know who their operator (*master*) is, what roles and authority limits they hold, or what corporate conventions govern the project without repetitive, verbose live prompting in every session.
2. **Role Gap (Developers vs. Non-Technical Teams)**: Software engineering teams operate via terminals and agentic harnesses, while creative, SEO, and marketing teams coordinate through Trello. Standard Trello MCP servers provide raw REST operations without business domain context.

---

## 2. 4-Layer Universal Context Hierarchy (The Convergence Bridge)

KAEDE resolves this by traversing 4 standardized layers of context:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: OPERATOR & ORGANIZATIONAL IDENTITY                           │
│  • Organization: github.com/<org>/.github       (Profile & Mission)    │
│  • Personal    : github.com/<user>/<user>      (Master Persona)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: BUSINESS OPERATIONAL & PLAYBOOK SOP LAYER                    │
│  • github.com/<org-or-user>/playbook                                   │
│    → Roles (Dev, QA, PM, Creative, SEO Specialist)                     │
│    → Workflow Lists (Backlog, Todo, In Review, Published, Done)        │
│    → Naming Conventions (feat:, fix:, seo:, copy:, priority)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: PROJECT KNOWLEDGE BASE (Tool-Agnostic)                       │
│  • <project-repo>/.openkb/                                             │
│    → Provides universal business & technical context to ANY agent      │
│      (Hermes, OpenClaw, Antigravity 2.0, OpenCode, Claude Code)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: SUBJECTIVE AGENT HARNESS & EXECUTION                         │
│  • <project-repo>/.opencode/ (Tool-specific agent settings)            │
│  • KAEDE MCP + Trello (Trello Kanban execution & state engine)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Standard `.openkb/` Directory Structure

Every project repository (both software products and digital agency client workspaces) is standardized with the following structure:

```
.openkb/
├── brand/                         # Brand Guidelines & Personas
│   ├── voice-and-tone.md          # Communication style (formal, educational, clear)
│   ├── personas.md                # Target audience & buyer pain points
│   └── visual-guidelines.md       # Color palettes, typography, asset ratios
├── marketing/                     # Strategy & Funnel
│   ├── keywords-matrix.md         # Primary, secondary, and LSI keywords
│   ├── funnel-architecture.md     # Prospect journey (TOFU / MOFU / BOFU)
│   └── offer-and-pricing.md       # Value propositions, promotions, objections
├── operations/                    # Governance & Release SOPs
│   ├── sop-publishing.md          # Pre-publish QA checklist
│   └── role-access.md             # Role-based action boundaries
└── tech/                          # Technical Architecture (for software repos)
    ├── architecture.md            # System topology & dependencies
    └── coding-standards.md        # Code & testing conventions
```

---

## 4. Digital Agency & Marketing Templates in KAEDE

KAEDE provides built-in card templates tailored for digital agency workflows:

| Template | Natural Language Intent | Output Highlights |
|---|---|---|
| **`seo-article`** | `"buat artikel seo"`, `"konten seo"` | Target keyword, slug, outline H1-H3, meta title/desc, on-page SEO checklist, WordPress publish guide. |
| **`social-media-post`** | `"buat konten sosmed"`, `"post instagram"` | Platform (IG/TikTok/LinkedIn), hook copy, carousel body, Canva/Drive asset URL, UTM tracking CTA. |
| **`lead-funnel`** | `"buat funnel"`, `"lead funnel"` | Funnel stage (TOFU/MOFU/BOFU), lead magnet, landing page flow, WhatsApp closing link, UTM tracking. |
| **`web-copy`** | `"buat web copy"`, `"copy landing page"` | 5-second headline test, value proposition, objection handling, actionable CTA buttons. |

### Example CLI Intents:
```bash
# Auto-generate an SEO article card with on-page checklist:
kaede run --intent "buat artikel seo" --task "AI Agent Agency Automation" --keyword "ai agency automation"

# Auto-generate a social media content card:
kaede run --intent "buat konten sosmed" --task "3 Prompting Mistakes" --platform "Instagram"
```

---

## 5. Multi-Profile Auth & Context Scoping

To accommodate multi-identity operations on a server (e.g. `sandikodev`, `konxc`, `smauii`, `klubfisika`, and external clients), KAEDE provides isolated profile management:

```bash
# 1. Save current credentials as a named profile
kaede auth save personal
kaede auth save konxc

# 2. List all saved profiles
kaede auth list

# 3. Switch active profile
kaede auth switch smauii

# 4. Login directly into a specific profile
kaede auth login --profile client-a --manual

# 5. Run commands on-the-fly with a target profile
kaede today --profile konxc
KAEDE_PROFILE=smauii kaede status --mcp
```

### Automatic Project Directory Scoping
KAEDE automatically checks credentials in priority order:
1. CLI flag `--profile <name>` or environment variable `KAEDE_PROFILE`
2. Environment variable `KAEDE_SECRETS_PATH`
3. Local project secrets `./.kaede.env` or `./.kaede/secrets.env` or `./secrets.env`
4. Active global profile at `~/.config/kaede/profiles/<active>.env`
5. Global default `~/.config/kaede/secrets.env`

---

## 6. Handoff Protocol: Headless (Hermes) ↔ Coding Agent

Trello acts as a **State Machine** across different agent forms:

1. **Client Request**: Client sends a request via WhatsApp to **Hermes Agent**.
2. **Ingest (Hermes)**: Hermes calls KAEDE MCP to create a card in the *"Backlog"* list using the `seo-article` template.
3. **Execution (Coding Agent)**: A developer or terminal agent (**OpenCode / Antigravity**) picks up the task via `kaede today`, references `.openkb/brand/`, drafts the post via WordPress MCP, and moves the card to *"Review Klien"*.
4. **Feedback (Hermes)**: Hermes detects the card in *"Review Klien"* and notifies the WhatsApp group with the draft preview link.
