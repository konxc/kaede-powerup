# Packages — Arsitektur Modular KAEDE

## Tujuan

Direktori `packages/` adalah rumah bagi komponen Trello MCP dalam ekosistem KAEDE.
Memisahkan concerns antara **upstream** dan **staging area** agar codebase punya arah yang jelas.

## Struktur

```
packages/
├── mcp-server-trello/     ← Git submodule dari delorenj/mcp-server-trello
│                            (via fork sandikodev untuk kontribusi PR)
│
└── kaede-trello/           ← Staging area untuk fitur custom KAEDE
                             (sebelum di-PR ke upstream)
```

## Aliran Data (Runtime)

```
OpenCode (AI Agent)
    │
    ├── mcp.kaede (dist/kaede-mcp-server.js)
    │   → Orchestrator: parse_playbook, bundle_context, generate_plan, status
    │   → Output: ActionStep[] (nama action saja, tanpa ID Trello)
    │
    └── mcp.trello (@delorenj/mcp-server-trello via bunx)
        → Eksekutor: menjalankan ActionStep ke Trello API
        → 45+ tools resmi dari upstream
```

> **Catatan Penting:** `mcp.trello` di runtime mengarah ke **upstream**
> `@delorenj/mcp-server-trello` (via npm/bunx), BUKAN ke `packages/kaede-trello/`.
> `packages/kaede-trello/` adalah staging ground untuk pengembangan.

## Strategi Kontribusi

```
┌─────────────────────────────────────────────────────────┐
│  1. Ide fitur baru                                       │
│     ↓                                                    │
│  2. Implementasi di packages/kaede-trello/ (JavaScript)  │
│     ↓                                                    │
│  3. Uji & stabilkan                                      │
│     ↓                                                    │
│  4. Port ke TypeScript                                   │
│     ↓                                                    │
│  5. PR ke packages/mcp-server-trello/ (fork → upstream)  │
│     ↓                                                    │
│  6. PR di-merge oleh delorenj                            │
│     ↓                                                    │
│  7. Sync submodule ke versi terbaru                      │
│     ↓                                                    │
│  8. Hapus fitur dari packages/kaede-trello/              │
│     (sudah ada di upstream)                              │
└─────────────────────────────────────────────────────────┘
```

## Kenapa Submodule?

- **Landasan kontribusi** — source upstream bisa dimodifikasi dan di-PR langsung
- **Riwayat terpisah** — tidak campur aduk dengan KAEDE
- **Update** cukup `git submodule update --remote`

## packages/mcp-server-trello

**Git submodule** ke `github.com/sandikodev/mcp-server-trello` (fork dari
`delorenj/mcp-server-trello`). Berisi source TypeScript upstream.

Untuk berkontribusi:
```bash
cd packages/mcp-server-trello
git checkout main
# buat branch, implementasi, commit, push ke origin, PR ke upstream
```

## packages/kaede-trello

**Staging area** — tempat pengembangan fitur Trello MCP yang belum tersedia
di upstream. Setelah fitur di-PR dan di-merge, staging area bisa dikosongkan.

Berisi `mcp-server.js` (42 tools) dengan fitur tambahan seperti:
- Attachments via base64/data URL
- Copy card dengan keepFromSource
- Sort list cards
- Watch/unwatch card & list
- Activity history
- Checklist management lengkap

Lihat `packages/kaede-trello/README.md` untuk detail lebih lanjut.

## Registrasi di OpenCode

Konfigurasi runtime di `.opencode/opencode.json`:

```json
{
  "mcp": {
    "kaede": {
      "type": "local",
      "command": ["bun", "dist/kaede-mcp-server.js"],
      "description": "Orchestrator — generate_plan, parse_playbook, bundle_context, status",
      "enabled": true,
      "timeout": 60000
    },
    "trello": {
      "type": "local",
      "command": ["bunx", "@delorenj/mcp-server-trello"],
      "description": "Eksekutor upstream — 45+ tools Trello resmi",
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

> **Untuk pengembangan:** Jika ingin menguji fitur staging, arahkan sementara
> `mcp.trello` ke `packages/kaede-trello/src/mcp-server.js`.
> Jangan commit perubahan ini ke production.

## Prioritas Pemilihan MCP Server (Client)

`src/trello-client.js` menggunakan urutan fallback ini:

1. **Global opencode.json** — command dari `~/.config/opencode/opencode.json`
2. **packages/kaede-trello** — `packages/kaede-trello/src/mcp-server.js`
3. **packages/mcp-server-trello** — `packages/mcp-server-trello/src/index.js`
4. **dist/** — `dist/mcp-server.js` (built fallback)
5. **~/.kaede/** — `~/.kaede/dist/mcp-server.js` (global install fallback)
