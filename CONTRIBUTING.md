# Contributing to KAEDE MCP

Terima kasih atas minat Anda untuk berkontribusi! Dokumen ini adalah panduan lengkap untuk berkontribusi pada project KAEDE MCP.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Adding New Tools](#adding-new-tools)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Translations](#translations)
9. [Submitting Changes](#submitting-changes)
10. [Upstream Contribution](#upstream-contribution)

---

## Code of Conduct

- Be professional and respectful
- Communication in English (default) or Indonesian is welcome
- Follow existing architecture and conventions
- Do not commit credentials or secrets

---

## Getting Started

### Prerequisites

- **Bun** v1.x (JavaScript runtime)
- **Git** (version control)
- **Trello Account** (for testing)

### Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/konxc/kaede-powerup.git
   cd kaede-powerup
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Setup Credentials (GLOBAL)**
   ```bash
   bun scripts/kaede.mjs setup
   ```
   
   Ini akan membuat file credentials di:
   - Linux/Mac: `~/.config/kaede/secrets.env`
   - Windows: `C:\Users\<You>\.config\kaede\secrets.env`

   ⚠️ **PENTING:** JANGAN buat `secrets.env` di folder project!

4. **Build MCP Server**
   ```bash
   bun run build:mcp
   ```

5. **Verify Build**
   ```bash
   ls -lh dist/mcp-server.js
   # Should show ~20 KB
   ```

---

## Development Setup

### Project Structure

```
kaede-powerup/
├── packages/
│   └── kaede-trello/
│       └── src/
│           ├── mcp-server.js          # Main MCP server
│           └── trello/
│               └── attachments.js     # Utility module
├── src/
│   ├── trello-client.js               # Client wrapper
│   ├── kaede-mcp-server.js            # Orchestrator
│   ├── api-server.mjs                 # API server
│   └── orchestrator.js                # Orchestrator logic
├── test/
│   ├── manual-test-*.js               # Test scripts
│   └── *-TESTING.md                   # Test guides
├── docs/
│   └── DEVELOPMENT-ROADMAP.md
├── scripts/
│   └── kaede.mjs                      # CLI tool
├── public/                            # Static assets
├── pr-submissions/                    # PR submissions
└── README.md
```

### Build Commands

```bash
# Development (CSS watch)
bun run dev

# Build MCP servers
bun run build:mcp

# Build production CSS
bun run build

# Preview
bun run preview
```

---

## How to Contribute

### Ways to Contribute

1. **Bug Fixes** — Fix issues in existing code
2. **New Features** — Add new MCP tools
3. **Documentation** — Improve docs and guides
4. **Testing** — Manual testing and bug reports
5. **Upstream PRs** — Contribute to delorenj/mcp-server-trello

### Workflow

1. **Fork** the repository
2. **Create branch** from `main`
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make changes** following existing patterns
4. **Test** manually with test board
5. **Commit** with clear messages
6. **Push** and create Pull Request

---

## Adding New Tools

### Step-by-Step Guide

#### 1. Add Tool Handler (`packages/kaede-trello/src/mcp-server.js`)

Find the appropriate section and add your handler:

```javascript
case 'your_tool_name': {
  const { arg1, arg2 } = args;
  
  // Validation
  if (!arg1) {
    throw new Error('arg1 is required');
  }

  // Trello API call
  const response = await trelloPost(`/endpoint`, { arg1, arg2 });
  
  // Return structured result
  return {
    id: response.id,
    name: response.name,
    success: true,
  };
}
```

#### 2. Add Tool Definition (same file)

Add to the toolSchema list:

```javascript
toolSchema('your_tool_name', 'Description of what it does', {
  arg1: { type: 'string', description: 'Description of arg1' },
  arg2: { type: 'number', description: 'Description of arg2' },
}, ['arg1']), // Required arguments
```

#### 3. Add Wrapper Method (`src/trello-client.js`)

```javascript
async yourToolName(arg1, arg2) {
  return this.callTool('your_tool_name', { arg1, arg2 });
}
```

#### 4. Rebuild MCP Server

```bash
bun run build:mcp
```

#### 5. Test

Use test board: https://trello.com/b/rAKmlRj3/lab-testing-kaede

---

## Testing

### Manual Testing

1. **Get Test Card ID**
   ```bash
   bun test/get-test-card.js
   ```

2. **Run Test Script**
   ```bash
   # Windows PowerShell
   $env:TEST_CARD_ID="67xxx..."; bun test/manual-test-attachments.js
   
   # Linux/Mac
   TEST_CARD_ID="67xxx..." bun test/manual-test-attachments.js
   ```

3. **Verify in Trello UI**
   - Open test board
   - Check if changes are visible
   - Screenshot for documentation

### Test Documentation

Create test guide in `test/`:

```markdown
# Tool Name — Testing Guide

## Setup
- Test board URL
- Required setup

## Test Cases
- [ ] Test case 1
- [ ] Test case 2

## Expected Results
- What should happen

## Issues Found
- List any bugs
```

---

## Documentation

### Documentation Standards

- **English** is the default language for `docs/`. Indonesian translations live in `docs/id/`.
- **Clear headings** with hierarchy
- **Code examples** with syntax highlighting
- **Screenshots** for UI changes

### Files to Update

When adding features, update:

1. `CHANGELOG.md` — Document changes
2. `README.md` — Update if user-facing changes
3. `docs/[lang]/DEVELOPMENT-ROADMAP.md` — Mark phase complete

---

## Translations

Documentation is available in multiple languages. You can contribute by translating or improving existing translations.

### Language Structure

```
docs/           ← English (default)
docs/id/        ← Bahasa Indonesia
docs/[lang]/    ← Other languages (created by contributors)
```

### How to Contribute a Translation

1. **Check existing issues** — someone may already be working on it
2. **Open a translation issue** — use the [translation template](https://github.com/konxc/kaede-powerup/issues/new?template=translation.yml)
3. **Fork and translate** — create `docs/[lang]/filename.md` mirroring the English version
4. **Submit a PR** — reference the issue number

### Documents Needing Translation

| English (`docs/`) | Indonesian (`docs/id/`) | Status |
|---|---|---|
| `index.md` | ✅ | Both ready |
| `api-key.md` | ✅ | Both ready |
| `mcp-server.md` | ✅ | Both ready |
| `opencode.md` | ✅ | Both ready |
| `tools.md` | ✅ | Both ready |
| `sdlc-roles.md` | ✅ | Both ready |
| `sponsorship.md` | ✅ | Both ready |
| `role-management.md` | ⬜ | Help wanted — [translate](https://github.com/konxc/kaede-powerup/issues/new?template=translation.yml) |
| `kaede-architecture.md` | ⬜ | Help wanted — [translate](https://github.com/konxc/kaede-powerup/issues/new?template=translation.yml) |
| `playbook-template.md` | ⬜ | Help wanted — [translate](https://github.com/konxc/kaede-powerup/issues/new?template=translation.yml) |

---

## Submitting Changes

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `refactor` — Code restructuring
- `test` — Adding tests

**Example:**
```
feat(mcp-server): add get_card_attachments tool

- Implement handler in packages/kaede-trello/src/mcp-server.js
- Add wrapper method in trello-client.js
- Add test script and documentation

Closes #42
```

### Pull Request Checklist

- [ ] Code follows existing patterns
- [ ] MCP server builds successfully
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No secrets committed

---

## Upstream Contribution

### Strategy

KAEDE implements features first, then contributes to upstream TRELLO MCP.

### Process

1. **Implement in KAEDE**
   - Full implementation
   - Testing
   - Documentation

2. **Prepare Upstream PR**
   - Port code to delorenj/mcp-server-trello structure
   - Add TypeScript types
   - Add tests (vitest)
   - Update upstream README

3. **Submit PR**
   - Fork delorenj/mcp-server-trello
   - Create feature branch
   - Submit PR with clear description
   - Reference KAEDE implementation

4. **Sync After Merge**
   - Update KAEDE to use upstream tool
   - Remove wrapper code
   - Update documentation

### Target Contributions

**Priority 1:**
- `get_card_attachments` — Missing in upstream
- `get_card_checklists` — Missing in upstream

**Priority 2:**
- `watch_card` + `watch_list` — Enhanced implementation
- `sort_list_cards` — Useful addition

---

## Questions?

- **Documentation:** Check `docs/` folder
- **Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede
- **Upstream:** https://github.com/delorenj/mcp-server-trello
- **API Docs:** https://developer.trello.com/docs

---

## Thank You!

Kontribusi Anda membantu KAEDE berkembang menjadi platform orkestrasi yang lebih baik untuk tim AI Agent di Indonesia. 🚀

**Maintained by:** Sandikodev  
**Organization:** PT Koneksi Jaringan Indonesia  
**License:** Proprietary (internal use allowed)