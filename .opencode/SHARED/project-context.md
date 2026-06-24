# Project Context — KAEDE Power-Up

## Ringkasan
KAEDE (Koneksi Automated Environment DE) adalah Trello Power-Up untuk manajemen environment staging/produksi langsung dari kartu Trello. Juga berfungsi sebagai hub informasi ekosistem AI Agent PT Koneksi Jaringan Indonesia.

## Stack
- **Frontend**: HTML, Tailwind CSS v4, Bun
- **Deploy**: Netlify (Power-Up), GitHub Pages (dokumentasi)
- **MCP**: delorenj/mcp-server-trello v1.6.1
- **Build**: Tailwind CLI, Marked (build-time)

## Struktur
```
index.html        — Landing page + Trello iframe connector
board.html        — Dashboard popup per board
card.html         — Environment manager per kartu
auth.html         — Halaman otorisasi
docs/             — Dokumentasi (opencode, mcp-server, api-key, tools)
  opencode.md     — Integrasi Trello MCP dengan Opencode
  mcp-server.md   — Setup Trello MCP Server
  api-key.md      — Panduan API Key & Token Trello
  tools.md        — Referensi tools MCP
  role-management.md — Role definitions untuk akses Trello
```

## Empat Pilar Ekosistem
1. **Playbook** — SOP & workflow (human → human)
2. **OpenKB** — Knowledge base (AI ↔ human)
3. **OpenCode** — AI Agent config (.opencode/)
4. **KAEDE** — Trello ↔ MCP bridge

## Tim
| Person | Role |
|---|---|
| Sandikodev | Developer & Maintainer |
