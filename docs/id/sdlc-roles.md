# Peran SDLC — Siapa yang Membutuhkan KAEDE?

KAEDE menjembatani manajemen project Trello dengan AI Agent di seluruh Software Development Life Cycle. Berikut peran-peran yang terbantu dan caranya.

---

## Product Manager / Project Manager

**Masalah:**
- Setup sprint itu repetitif: bikin list, card, label, assign anggota
- Anggota tim sering lupa mengikuti SOP (konvensi label, alur list)
- Susah dapetin gambaran harian tugas setiap orang

**Solusi KAEDE:**
```
"Mulai Sprint Alpha" → KAEDE auto-bikin list sprint, isi card,
pasang label benar, assign anggota sesuai aturan playbook
```
- Orchestrasi berbasis intent: `kaede run --intent "Mulai Sprint Alpha"`
- Playbook enforcement: tulis SOP sekali di Markdown, AI Agent yang terapkan
- `kaede today` — lihat tugas harian dari semua board
- Dashboard popup per board dengan statistik environment

---

## Developer / Engineer

**Masalah:**
- Sering ganti konteks antara IDE, Trello, dan chat untuk update status card
- Update card manual terasa seperti overhead saat coding
- Lampirkan screenshot ke card butuh banyak langkah

**Solusi KAEDE:**
```
Copy screenshot dari clipboard → AI Agent lampirkan ke Trello card
via base64, tanpa perlu upload file
```
- 44 tools MCP — akses Trello komprehensif dari AI Agent
- Lampiran clipboard-to-card (screenshot base64)
- Checklist CRUD lengkap: buat, update, hapus, copy antar card
- `kaede init` — setup MCP satu perintah di project mana pun
- `kaede setup` — kredensial global, tanpa env var per project

---

## QA / Tester

**Masalah:**
- Ngulang checklist item yang sama di banyak card
- Perlu lacak histori card untuk verifikasi perubahan
- Sorting card berdasarkan due date masih manual

**Solusi KAEDE:**
```
Copy template QA checklist ke 10 card dalam satu perintah via AI Agent
```
- Template checklist: copy QA, DoD, Sprint Planning antar card
- `get_card_activity` — audit trail lengkap: komentar, perpindahan, update
- `sort_list_cards` — auto-sort card berdasarkan due date, nama, atau posisi
- Manajemen label: cari, buat, update, hapus — kontrol penuh

---

## Tech Lead / Architect

**Masalah:**
- Menjaga standar workflow konsisten di banyak tim
- Memastikan AI Agent mematuhi aturan governance project
- Butuh pemisahan bersih antara logika konteks dan eksekusi

**Solusi KAEDE:**
```
Playbook → OpenKB → OpenCode → mcp.kaede (orchestrasi) → mcp.trello (eksekusi)
```
- **Dual MCP architecture**: `mcp.kaede` (4 tools konteks) + `mcp.trello` (40+ tools eksekusi)
- Playbook parser — enforced SOP dari Markdown yang mudah dibaca manusia
- OpenKB integration — glossary & decision log bersama untuk AI Agent
- Role-based access control per `docs/role-management.md`
- Rate limiting (token bucket) — kepatuhan API Trello otomatis

---

## Stakeholder / Business Owner

**Masalah:**
- Butuh visibilitas progres project tanpa harus belajar Trello
- Ingin status level tinggi tanpa beban tambahan tim
- Khawatir biaya lisensi per-seat

**Solusi KAEDE:**
- Badge Trello menampilkan status environment (PROD/STAG/DEV) langsung di muka card
- Akses read-only board untuk non-teknis
- Lisensi proprietary: penggunaan internal tak terbatas — tanpa biaya per-seat
- `kaede status --mcp` — health check seluruh integrasi

---

## AI / ML Engineer & MCP Developer

**Masalah:**
- Bangun MCP server dari nol untuk setiap integrasi tool
- Nambah kapabilitas Trello butuh pengetahuan API yang dalam
- Belum ada cara standar untuk berkontribusi kembali ke ekosistem

**Solusi KAEDE:**
- 44 tools siap pakai — protokol JSON-RPC standar
- `CONTRIBUTING.md` — panduan langkah-demi-langkah nambah tools baru
- Auto-built MCP server via `bun run build:mcp`
- 3 upstream PR dikontribusikan ke `delorenj/mcp-server-trello`

---

## Ringkasan

| Peran | Manfaat Utama | Entry Point |
|---|---|---|
| PM/PO | Otomatisasi sprint berbasis intent | `kaede run --intent` |
| Developer | 44 tools MCP dari AI Agent | `kaede init` |
| QA/Tester | Template checklist + histori card | `get_card_activity` |
| Tech Lead | Governance via playbook | Playbook parser |
| Stakeholder | Visibilitas tanpa konfigurasi | Badge Trello |
| AI Engineer | Arsitektur MCP yang extensible | `CONTRIBUTING.md` |
