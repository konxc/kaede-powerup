# @kaede/trello — KAEDE Trello MCP (Staging Area)

Package ini adalah **staging area** untuk fitur Trello MCP yang belum tersedia di upstream
[delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello).

## Strategi

```
Upstream (delorenj/mcp-server-trello)  ──PR──►  @kaede/trello (staging)
                                                    │
                                            setelah PR di-merge,
                                            fitur pindah ke upstream
                                                    │
                                            @kaede/trello → fallback only
```

1. **Kontribusi ke Upstream** — Setiap fitur baru yang kita buat di sini,
   kita usahakan untuk di-PR-kan ke `delorenj/mcp-server-trello`.
2. **Staging Area** — Sembari menunggu PR di-merge, fitur tetap tersedia
   di sini untuk digunakan langsung.
3. **Fallback** — Jika upstream sudah mendukung fitur tersebut, maka
   `@kaede/trello` akan otomatis menjadi fallback (tidak dipakai lagi).

## Cara Kerja

MCP Trello yang aktif akan dipilih secara otomatis oleh
`src/trello-client.js` dengan urutan prioritas:

1. Global `opencode.json` (jika terdaftar)
2. `packages/kaede-trello/src/mcp-server.js` (staging)
3. `dist/mcp-server.js` (built fallback)
4. `packages/mcp-server-trello/src/index.js` (upstream langsung)

## Tools yang Tersedia

Saat ini `@kaede/trello` memiliki **42 tools** Trello MCP:

- Boards: list, create
- Lists: get, add, archive, update, sort
- Cards: get, create, update, move, archive, copy
- Members: get board members, assign, remove
- Labels: get, create, update, delete, search, add/remove from card
- Checklists: create, add item, delete, update item, get, copy
- Comments: add, get
- Attachments: attach file (URL), attach image (URL/base64), get attachments
- Watch: watch/unwatch card, watch/unwatch list
- Activity: get card activity
