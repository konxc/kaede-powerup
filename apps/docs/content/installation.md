# Installation

KAEDE installs as a **global CLI** plus **two MCP servers** (`mcp.trello` and `mcp.kaede`) registered in your OpenCode config. The installer copies the **complete** runtime tree — nothing is stripped.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Prerequisites**

- [Bun](https://bun.sh) v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- Git
- OpenCode (the AI coding agent that consumes the MCP servers)

</div>

## 1. Quick Install (Linux / macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash
```

The script:

1. Checks Bun + Git.
2. Clones the repo to `~/.kaede` (or `$KAEDE_DIR`).
3. Runs `bun install`.
4. Runs `bun scripts/kaede.ts install` → builds both MCP servers, copies the full source tree to `~/.kaede`, registers MCP in `~/.config/opencode/opencode.json`, and links the `kaede` command via `bun link`.

### Windows (PowerShell)

```powershell
iwr -Uri https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.ps1 | iex
```

## 2. Manual Install

```bash
git clone https://github.com/konxc/kaede-powerup ~/.kaede
cd ~/.kaede
bun install
bun scripts/kaede.ts install
```

`kaede install` performs, in order:

| Step | What it does |
|---|---|
| **Copy tree** | Copies the whole source tree (scripts, `packages/`, `apps/`, docs) to `~/.kaede` — no components are dropped. Excludes only `node_modules`, `.git`, build junk. |
| **Build MCP** | `bun build` for `packages/kaede-trello/src/mcp-server.ts` → `~/.kaede/dist/mcp-server.js` and `packages/kaede/src/kaede-mcp-server.ts` → `~/.kaede/dist/kaede-mcp-server.js`. Fails loudly if a source is missing. |
| **Register MCP** | Writes `mcp.trello` + `mcp.kaede` into `~/.config/opencode/opencode.json`. |
| **Link** | `bun link` from `~/.kaede` → `~/.bun/bin/kaede`. |

## 3. Ensure `kaede` Is On Your PATH

`bun link` puts the binary in `~/.bun/bin`. Add it to your shell profile once:

```bash
# ~/.bashrc or ~/.zshrc
export PATH="$HOME/.bun/bin:$PATH"
```

Then reload: `source ~/.bashrc` (or open a new shell) and verify:

```bash
kaede --help
```

## 4. Authenticate with Trello

```bash
kaede setup          # full onboarding: OAuth login + MCP config + verify
# or step-by-step
kaede auth login     # opens browser OAuth
kaede auth login --manual   # paste an existing token (headless / server)
```

Credentials are stored in `~/.config/kaede/secrets.env` and are **gitignored**.

## 5. Verify

```bash
kaede status         # config overview
kaede status --mcp   # live MCP connection test (lists boards)
```

Example output:

```text
  Trello API Key  ✓ configured
  Global secrets  ✓  /home/dev/.config/kaede/secrets.env
  MCP configured  ✓  /home/dev/.config/opencode/opencode.json (global)
  MCP server      ✓ responding (7 boards)
```

## 6. Use KAEDE In A Project

```bash
cd ~/projects/my-app
kaede init . --name "My App" --tech "Bun" --db "Postgres"
```

This writes `.opencode/opencode.json` pointing at `~/.kaede/dist/*.js`, so the project keeps working even if the source checkout moves.

Then start OpenCode inside the project — both MCP servers load automatically.

---

## Installing On A Server (Agentic Coding)

This is the recommended flow for a headless Linux server (VPS, dev box, CI runner).

### Server prerequisites

```bash
# Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Git
sudo apt-get update && sudo apt-get install -y git curl   # Debian/Ubuntu
```

Add `export PATH="$HOME/.bun/bin:$PATH"` to `~/.bashrc` so it persists across SSH sessions.

### Install KAEDE

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash
source ~/.bashrc
kaede --help
```

### Authenticate without a browser

A server has no browser for OAuth. Use manual token mode:

1. On your laptop, open the [Trello API key page](https://trello.com/power-ups/admin) and generate an **API Key** + **Token**.
2. On the server:

```bash
kaede auth login --manual     # paste API Key + Token when prompted
# or write the file directly:
mkdir -p ~/.config/kaede
cat > ~/.config/kaede/secrets.env <<'EOF'
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
EOF
chmod 600 ~/.config/kaede/secrets.env
```

3. Verify:

```bash
kaede status --mcp
```

### Point OpenCode at the MCP servers

The global install already registered both servers in `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "trello": { "type": "local", "command": ["bun", "/home/USER/.kaede/dist/mcp-server.js"], "enabled": true, "timeout": 30000 },
    "kaede":  { "type": "local", "command": ["bun", "/home/USER/.kaede/dist/kaede-mcp-server.js"], "enabled": true, "timeout": 60000 }
  }
}
```

For a **per-project** setup, run `kaede init .` inside the repo instead.

### Multiple projects / users

- Each project can call `kaede init .` to get its own `.opencode/opencode.json`.
- The MCP binaries are shared at `~/.kaede/dist`, so projects stay lightweight.
- For a shared CI machine, set `KAEDE_DIR=/opt/kaede` during install to place the tree outside a single home directory.

### Keep it running

KAEDE is a CLI + stdio MCP server — it does **not** run as a background daemon. OpenCode spawns the MCP servers on demand. Nothing to keep alive.

---

## Updating

```bash
# If installed via install.sh to ~/.kaede:
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash -s -- --update

# Or from the install dir:
cd ~/.kaede && git pull --rebase && bun install && bun scripts/kaede.ts install
```

## Uninstalling

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash -s -- --uninstall
```

This unlinks the binary and removes `~/.kaede`. `~/.config/kaede` (credentials) is preserved for safety.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `kaede: command not found` | `~/.bun/bin` not on PATH | `export PATH="$HOME/.bun/bin:$PATH"` |
| `MCP server exited with code 1` | Stale path in `opencode.json` | Re-run `kaede install` |
| `Cannot find module .../packages/kaede/src/...` | Source tree not copied | Re-run `kaede install` (it copies the full tree) |
| Build fails: `source not found` | Repo layout changed | `git -C ~/.kaede pull --rebase` then `kaede install` |
| OAuth can't open browser | Headless server | `kaede auth login --manual` |
| Wrong/old boards listed | Cached credentials | `kaede auth logout && kaede auth login` |

## Next Steps

- [API Key & Token](api-key.html) — how to obtain Trello credentials
- [MCP Server](mcp-server.html) — server internals
- [OpenCode Integration](opencode.html) — MCP usage in OpenCode
- [Tools Reference](tools.html) — the full tool list (47 Trello + 45 orchestrator)
