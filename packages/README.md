# Packages — Arsitektur Modular KAEDE

## Tujuan

`packages/` adalah direktori yang menampung komponen Trello MCP dalam ekosistem KAEDE,
dengan pemisahan jelas antara **upstream** dan **custom features**.

## Struktur

```
packages/
├── mcp-server-trello/     ← Git submodule dari delorenj/mcp-server-trello
│                            (via fork sandikodev untuk kontribusi PR)
│
└── kaede-trello/           ← Custom Trello MCP KAEDE (first-class citizen)
                             Fitur yang belum / tidak akan ada di upstream
```

## Aliran Data (Runtime)

```
OpenCode (AI Agent)
    │
    ├── mcp.kaede → dist/kaede-mcp-server.js
    │   → Orchestrator: generate_plan, parse_playbook, bundle_context, status
    │   → Output: ActionStep[] (nama action saja, tanpa ID Trello)
    │
    └── mcp.trello → bunx @delorenj/mcp-server-trello
        → Eksekutor utama: 45+ tools Trello resmi dari upstream
```

`packages/kaede-trello` adalah **lib**, bukan MCP server. Digunakan langsung oleh
kode KAEDE (`src/trello-client.js`) sebagai fallback/penyangga untuk fitur yang
belum/tidak akan tersedia di upstream.

### Alur Kontribusi ke Upstream

```
┌───────────────────────────────────────────────┐
│  1. Fitur baru muncul                         │
│     ↓                                         │
│  2. Implementasi di packages/kaede-trello/    │
│     (JavaScript, kompatibel dgn delorenj)     │
│     ↓                                         │
│  3. Uji & stabilkan                           │
│     ↓                                         │
│  4. Ajukan proposal PR ke delorenj            │
│     (via packages/mcp-server-trello submodule)│
│     ↓                              ↓          │
│  5a. PR di-merge              5b. PR ditolak  │
│      → sync submodule          → tetap di     │
│      → (opsional) hapus          kaede-trello │
│        dari kaede-trello         (permanen)   │
└───────────────────────────────────────────────┘
```

> **Catatan:** Tidak semua proposal akan di-merge oleh delorenj.
> `packages/kaede-trello` adalah wadah permanen untuk fitur-fitur yang
> tetap kita butuhkan meskipun tidak di-approve upstream.

## packages/mcp-server-trello

**Git submodule** ke `github.com/sandikodev/mcp-server-trello` (fork dari
`delorenj/mcp-server-trello`). Berisi source TypeScript upstream.

Kegunaan:
- Landasan untuk kontribusi PR ke delorenj
- Source code upstream bisa dipelajari, dimodifikasi, di-PR langsung
- Update: `git submodule update --remote`

```bash
cd packages/mcp-server-trello
git checkout main
# buat branch, implementasi di TypeScript, commit, push ke origin, PR ke upstream
```

## packages/kaede-trello (Lib, Bukan MCP)

**Wadah permanen** untuk tools Trello yang belum atau tidak akan tersedia
di upstream `delorenj/mcp-server-trello`.

Fitur tambahan yang belum ada di upstream:
- **Attachments**: via base64/data URL, file URL, image data
- **Copy Card**: dengan opsi keepFromSource (all, partial, custom)
- **Sort List Cards**: sort by pos, dueDate, startDate, dateLastActivity
- **Watch/Unwatch**: card dan list
- **Activity History**: filterable card activity
- **Checklist Management**: create, delete, update item, copy checklist

Lihat `packages/kaede-trello/README.md` untuk detail lebih lanjut.

## Prioritas Pemilihan MCP Server (Client)

`src/trello-client.js` menggunakan urutan fallback:

1. **Global opencode.json** — command dari `~/.config/opencode/opencode.json`
2. **packages/kaede-trello** — `packages/kaede-trello/src/mcp-server.js` (lib)
3. **packages/mcp-server-trello** — `packages/mcp-server-trello/src/index.js`
4. **dist/** — `dist/mcp-server.js` (built fallback)
5. **~/.kaede/** — `~/.kaede/dist/mcp-server.js` (global install fallback)
