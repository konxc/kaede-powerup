# @kaede/trello — KAEDE Custom Trello Library

**Wadah permanen** untuk tools Trello yang belum atau tidak akan tersedia
di upstream [`delorenj/mcp-server-trello`](https://github.com/delorenj/mcp-server-trello).

Package ini adalah **lib** (bukan MCP server) yang digunakan langsung oleh
kode KAEDE (`src/trello-client.ts`) sebagai penyangga/fallback. Kode tetap
kompatibel dengan struktur upstream agar mudah di-port ke TypeScript dan
di-PR-kan ke delorenj.

## Filosofi

```
delorenj/mcp-server-trello (upstream, MCP server)
  → Tools resmi, stabil, dikelola komunitas
  → 45+ tools Trello standar

@kaede/trello (package ini, lib)
  → Tools custom KAEDE, fitur tambahan
  → 42 tools yang belum/tidak akan tersedia di upstream
  → BUKAN MCP server — digunakan langsung oleh kode KAEDE
```

## Hubungan dengan Upstream

```
┌───────────────────────────────────────────────┐
│  1. Fitur baru muncul                          │
│     ↓                                         │
│  2. Implementasi di sini (JavaScript)          │
│     (kompatibel dgn struktur delorenj)          │
│     ↓                                         │
│  3. Uji & stabilkan                           │
│     ↓                                         │
│  4. Port ke TypeScript                         │
│     ↓                                         │
│  5. Ajukan proposal PR ke delorenj             │
│     (via packages/mcp-server-trello submodule) │
│     ↓                              ↓          │
│  6a. PR di-merge             6b. PR ditolak    │
│      → sync submodule           → tetap di     │
│      → (opsional) hapus           sini         │
│        dari sini                 (permanen)     │
└───────────────────────────────────────────────┘
```

Tidak semua proposal akan di-merge oleh delorenj. Package ini adalah
wadah permanen untuk fitur yang tetap kita butuhkan.

## Tools

Menyediakan **42 tools**, termasuk fitur yang belum ada di upstream:

| Kategori | Tools |
|---|---|
| **Attachments** | attach file (URL), attach image (URL/base64/data URL), get attachments |
| **Copy Card** | copy dengan opsi keepFromSource (all, partial, custom) |
| **Sort** | sort list cards by pos, dueDate, startDate, dateLastActivity |
| **Watch** | watch/unwatch card, watch/unwatch list |
| **Activity** | get card activity dengan filter & limit |
| **Checklists** | delete checklist, delete item, update item, copy checklist |

## Build

```bash
# Dari root project
cd packages/kaede-trello
bun run build

# Atau dari root
bun run build:mcp
```

Output: `dist/mcp-server.js`

## Penggunaan

`packages/kaede-trello` digunakan langsung oleh `src/trello-client.ts` sebagai
fallback. Tidak perlu registrasi MCP terpisah — cukup `mcp.trello` (upstream)
dan `mcp.kaede` (orchestrator) di `.opencode/opencode.json`.
