# Packages — KAEDE Modular Architecture

`packages/` adalah direktori untuk kode modular yang dipisahkan dari inti project
(`src/`, `scripts/`). Setiap package memiliki tanggung jawab spesifik dan bisa
dibangun, diuji, dan dikembangkan secara independen.

## Strategi Upstream + Staging

KAEDE menggunakan arsitektur **dual-track Trello MCP**:

```
delorenj/mcp-server-trello (upstream)
  └── packages/mcp-server-trello/  — git submodule, upstream source
  └── packages/kaede-trello/       — staging area, custom tools

Alur:
  1. Fitur baru dikembangkan di packages/kaede-trello/
  2. PR dikirim ke delorenj/mcp-server-trello (via fork sandikodev)
  3. Setelah PR di-merge, fitur dianggap stabil
  4. packages/kaede-trello → fallback only, upstream jadi primary
```

### packages/mcp-server-trello

**Git submodule** ke `github.com/sandikodev/mcp-server-trello` (fork dari
`delorenj/mcp-server-trello`). Berisi source upstream yang bisa dijalankan
langsung tanpa build. Untuk berkontribusi:

```bash
cd packages/mcp-server-trello
git checkout main
# buat branch, commit, push ke origin, PR ke upstream
```

### packages/kaede-trello

**Staging area** untuk tools Trello MCP yang belum tersedia di upstream.
Berisi `mcp-server.js` (42 tools) dengan fitur tambahan seperti:
- Attachments via base64/data URL
- Copy card dengan keepFromSource
- Sort list cards
- Watch/unwatch card & list
- Activity history
- Checklist management lengkap

Lihat `packages/kaede-trello/README.md` untuk detail lebih lanjut.

## Cara Mendaftarkan ke OpenCode

MCP Trello didaftarkan di `.opencode/opencode.json` atau
`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "trello": {
      "type": "local",
      "command": ["bun", "packages/kaede-trello/src/mcp-server.js"],
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

Atau jika ingin menggunakan upstream langsung:

```json
{
  "mcp": {
    "trello": {
      "type": "local",
      "command": ["bun", "packages/mcp-server-trello/src/index.js"],
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

## Prioritas Pemilihan MCP Server

`src/trello-client.js` otomatis memilih server dengan urutan:

1. **Global opencode.json** — command dari `~/.config/opencode/opencode.json`
2. **packages/kaede-trello** — `packages/kaede-trello/src/mcp-server.js`
3. **packages/mcp-server-trello** — `packages/mcp-server-trello/src/index.js`
4. **dist/** — `dist/mcp-server.js` (built fallback)
5. **~/.kaede/** — `~/.kaede/dist/mcp-server.js` (global install fallback)
6. **cwd/dist/** — `process.cwd()/dist/mcp-server.js`
