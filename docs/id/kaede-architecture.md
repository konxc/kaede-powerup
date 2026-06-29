# Arsitektur & Roadmap KAEDE — Sistem Orkestrasi Kolaboratif Human+AI

KAEDE (Koneksi Automated Environment DE) dikembangkan sebagai **Platform Orkestrasi Kolaboratif Universal**. KAEDE menjembatani komunikasi tingkat tinggi (dokumen acuan kerja) dengan eksekusi teknis tingkat rendah di Trello, memungkinkan tim yang terdiri dari Manusia dan AI untuk bekerja secara sinergis tanpa gesekan.

---

## 1. Visi Besar & Filosofi Arsitektur

### 1.1 Masalah Utama: Overhead Penggunaan MCP Secara Manual
Menggunakan AI Agent untuk mengelola tugas di Trello secara manual (misalnya menggunakan Trello MCP dasar) sangat melelahkan dan rawan error. Setiap interaksi mengharuskan Agent memanggil tools mentah secara berulang (`create_card`, `add_label`, `move_card`, `assign_member`, dll.) tanpa pemahaman konteks bisnis yang utuh. AI Agent seringkali "tersesat" dalam memahami aturan main tim, sprint flow, atau konvensi penulisan.

### 1.2 Solusi KAEDE: Orkestrator Berbasis Niat (Intent-Driven Orchestrator)
KAEDE bertindak sebagai lapisan kecerdasan (intelligence & orchestration layer) yang berdiri di atas eksekusi teknis. Di bawah sistem ini, manusia/PM cukup menentukan SOP dan prioritas, dan KAEDE mengonversinya menjadi rangkaian instruksi terpadu yang dipahami oleh AI Agent (Opencode) untuk mengeksekusi Trello MCP secara otomatis dan presisi.

---

## 2. Aliran Data & Ekosistem Empat Pilar

Sistem kolaboratif di dalam ekosistem PT Koneksi Jaringan Indonesia diatur dalam empat pilar berikut:

```
        ┌────────────────────────────────────────────────────────┐
        │                        PLAYBOOK                        │
        │      (Human → Human: SOP, Workflow, Acuan Kerja)        │
        │    Ditulis oleh Manager, PM, Lead, atau Owner bisnis   │
        └───────────────────────────┬────────────────────────────┘
                                    │ KAEDE baca & integrasikan
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                        OPENKB                          │
        │        (Human ↔ AI: Glossary, Decision Log, Context)   │
        │          Terletak di setiap Workspace / Project        │
        └───────────────────────────┬────────────────────────────┘
                                    │ Di-load sebagai instruksi
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                       OPENCODE                         │
        │       (Konfigurasi Agent: Aturan Eksekusi, Commands)   │
        │          Terletak di setiap Workspace / Project        │
        └───────────────────────────┬────────────────────────────┘
                                    │ Mengarahkan eksekusi
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                  MCP.KAEDE (Pure Context)              │
        │        (kaede-mcp-server.js — 4 context tools)         │
        │   parse_playbook, bundle_context, generate_plan, status │
        └──────────────────────┬─────────────────────────────────┘
                               │ Plan (ActionStep[] with names)
                               ▼
        ┌────────────────────────────────────────────────────────┐
        │                  MCP.TRELLO (Executor)                 │
        │            (@delorenj/mcp-server-trello — 45+ tools)       │
        └──────────────────────┬─────────────────────────────────┘
                              │ stdio JSON-RPC
                              ▼
        ┌────────────────────────────────────────────────────────┐
        │                        TRELLO                          │
        │              (Board, Lists, Cards, Labels)             │
        └────────────────────────────────────────────────────────┘

        Kedua MCP server (mcp.kaede & mcp.trello) terdaftar di
        ~/.config/opencode/opencode.json sebagai entry terpisah.
        AI Agent memanggil mcp.kaede untuk context & plan,
        lalu mcp.trello untuk eksekusi ke Trello.
```

### Penjelasan Detil Aliran:
1. **Playbook (Human → Human)**: Dokumen Markdown/YAML yang berisi SOP tim, sprint rules, tanggung jawab peran (ROLES), dan konvensi pengerjaan. Playbook mendikte bagaimana manusia bekerja sama dengan manusia lain.
2. **OpenKB (Human ↔ AI)**: Menyediakan jembatan pengetahuan bersama. Menyimpan daftar istilah (glossary), referensi project, dan riwayat keputusan teknis (decision log) agar AI Agent memahami istilah khusus yang digunakan tim.
3. **OpenCode (Agent Config)**: Berisi manifest `.opencode/opencode.json` yang mengonfigurasi kemampuan teknis AI Agent, daftar tools MCP yang diizinkan, serta perintah-perintah kustom.
4. **KAEDE (Orchestrator)**: Mengintegrasikan ketiga dokumen di atas. KAEDE membaca Playbook untuk memahami "bagaimana tugas harus diatur" dan membaca OpenKB untuk memahami "apa konteks project-nya", lalu mengarahkan AI Agent untuk bertindak cerdas saat mengelola Trello melalui Trello MCP Server.

---

## 3. Struktur Codebase & Status Implementasi Aktual

### 3.1 Struktur Direktori Project
```
powerup-konxc/
├── .github/workflows/docs.yml   # CI/CD auto-deploy dokumentasi Markdown → HTML
├── .opencode/
│   ├── opencode.json            # Konfigurasi AI Agent & MCP Server lokal
│   └── SHARED/
│       ├── agent-rules.md       # Aturan dasar perilaku AI Agent
│       └── project-context.md   # Konteks global project KAEDE
├── .openkb/
│   ├── TEMPLATE.md              # Template standar knowledge base
│   └── SHARED/
│       ├── decision-log.md      # Catatan keputusan arsitektur & fitur
│       ├── glossary.md          # 14 istilah kunci ekosistem KAEDE
│       └── references.md        # Tautan repositori & alat eksternal
├── dist/
│   └── mcp-server.js            # Kompilan Trello MCP Server (target: Bun)
├── docs/
│   ├── index.md                 # Ikhtisar dokumentasi
│   ├── api-key.md               # Panduan mendapatkan kredensial Trello
│   ├── mcp-server.md            # Konfigurasi Trello MCP Server
│   ├── opencode.md              # Dokumentasi integrasi Opencode
│   ├── tools.md                 # Deskripsi tools Trello MCP yang tersedia
│   ├── role-management.md       # Detail integrasi role AI Agent & Trello
│   └── kaede-architecture.md    # [DOKUMEN INI] Arsitektur mendalam & roadmap
├── public/                      # Static Assets (Deploy Netlify)
│   ├── index.html               # Dual-Mode: Power-Up Connector & Landing Page
│   ├── board.html               # Dashboard Popup statis (Env stats)
│   ├── card.html                # Environment manager per kartu (PROD/STAG/DEV)
│   ├── auth.html                # Mock Authorization page
│   ├── privacy.html             # Kebijakan privasi multibahasa
│   └── js/kaede.js              # Implementasi 7 Capabilities Trello Power-Up
├── packages/
│   ├── README.md                # Dokumentasi arsitektur packages
│   ├── mcp-server-trello/       # Git submodule → delorenj/mcp-server-trello (upstream)
│   └── kaede-trello/
│       └── src/
│           ├── mcp-server.js    # Lib Trello (42 tools, fallback/penyangga)
│           └── trello/
│               └── attachments.js  # Attachment utilities
├── scripts/
│   ├── kaede.mjs                # CLI Tool utama (15+ commands)
│   ├── build-docs.mjs           # Script kompilasi Markdown → HTML
│   └── build-mcp.mjs            # Build MCP server via bun build
├── src/
│   ├── kaede-mcp-server.js      # KAEDE Orchestrator MCP (4 tools)
│   ├── trello-client.js         # MCP Client — 42+ tool wrappers
│   ├── orchestrator.js          # Orchestrator — parsePlaybook, executeIntent, bundleContext, generatePlan
│   ├── api-server.mjs           # HTTP API server (port 3456)
│   ├── style.css                # CSS Source (Tailwind v4 + custom utility)
│   └── index.html               # Landing page (deployed to Netlify)
├── .gitmodules                  # Konfigurasi submodule mcp-server-trello
├── package.json                 # Build scripts + CLI entry
```

### 3.2 Analisis File-by-File & Penilaian Gaps

#### A. Frontend Power-Up (`public/`)
* **`index.html`**: Dual-mode yang sangat cerdas. Jika diload di dalam iframe Trello, ia menyembunyikan visual situs dan mengaktifkan konektor Power-Up. Jika diakses langsung, ia bertindak sebagai landing page ekosistem.
* **`js/kaede.js`**: Berhasil mendaftarkan 7 capabilities Trello (tombol board, tombol kartu, badge, show-card panel, auth hooks, locale, lifecycle).
  * *Gap*: Seluruh operasional frontend masih bergantung pada Trello Shared Storage lokal dan `localStorage`. Belum terhubung dengan status real-time dari MCP Server atau database terpusat.
* **`card.html` & `board.html`**: Berhasil membuat UI minimalis untuk manajemen environment (PROD, STAG, DEV).
  * *Gap*: Status statis. Pilihan environment di kartu belum memicu penambahan Label asli di Trello secara dinamis. Perhitungan status lingkungan di board popup rawan bug karena hanya increment-only tanpa melacak state lama.

#### B. CLI Tool (`scripts/kaede.mjs`)
* 15+ commands: `playbook parse/show`, `orchestrate`, `run` (+dry-run), `build`, `start`, `install`, `init`, `setup`, `today`, `status` (+--mcp), `test-tools`, `env`, `push`.
* *Gap*: Belum ada integrasi langsung dengan Google Calendar / jadwal akademik untuk auto-sync sprint timeline.

C.1. MCP Trello Server (`packages/kaede-trello/src/mcp-server.js`) — Executor
* Menyediakan implementasi protokol MCP mandiri dengan 42 tools. Fungsinya murni sebagai executor — menerima perintah dengan ID Trello dan mengeksekusinya.
  * *Gap*: Belum ada fitur multi-tool chaining. Untuk itu, gunakan layer context di atasnya (`mcp.kaede`).

#### C.2. KAEDE Orchestrator MCP (`src/kaede-mcp-server.js`) — Pure Context
* Server MCP kedua yang berdiri sendiri sebagai penyedia konteks murni. Tidak memiliki akses ke Trello.
* **4 tools**: `parse_playbook` (parse playbook → structured), `bundle_context` (gabung playbook + openkb + opencode), `generate_plan` (intent → ActionStep[] dengan nama), `status` (cek path playbook & openkb).
* Dirancang untuk dipanggil AI Agent sebagai langkah pertama: `mcp.kaede.generate_plan` → terima plan → resolve ID via `mcp.trello.*` → eksekusi.
* Tidak mengimpor `trello-client.js`, tidak ada dependency Trello sama sekali.
* *Gap*: Belum ada validasi otomatis bahwa ID Trello yang di-resolve benar sebelum eksekusi.

---

## 4. Gap Analysis Strategis (Sekarang vs Target Visi)

| Fitur / Dimensi | Kondisi Sekarang (As-Is) | Target Visi (To-Be) | Gaps | Prioritas |
|---|---|---|---|---|
| **Eksekusi Trello** | Plan via `mcp.kaede.generate_plan` (16 intent → ActionStep[]), eksekusi via `mcp.trello.*` (45+ tools) | Orkestrasi otomatis multi-langkah (Cukup 1 intent, eksekusi berantai) | Plan → execute masih manual (AI agent chain), belum auto-chaining di server | **🟡 Sedang** |
| **Playbook Integration** | Parse aktif (Markdown → section map → bundle context) | Di-parse + ditegakkan secara real-time oleh AI Agent | Output parse masih dictionary, belum fully structured untuk auto-enforcement | **🟡 Sedang** |
| **Trello State Sync** | MCP langsung (via trello-client.js wrapper, 45+ tools) | Real-time Label & Metadata Sync via Trello API langsung | Power-Up frontend masih pakai Shared Storage, belum via MCP | **🟡 Sedang** |
| **API Server** | HTTP bridge aktif (port 3456, endpoint /api/mcp & /api/health) | Dashboard visual dengan metrik sprint real-time | Hanya REST proxy, belum ada UI dashboard | **🟡 Sedang** |

---

## 5. Rencana & Roadmap Pengembangan

### ✅ Fase 1 — Pembersihan & Penguatan Konteks (SELESAI)
1. **✅ Pembersihan Referensi**: Semua referensi project-specific (smauii/laravel) dihapus dari OpenKB KAEDE. KAEDE sekarang murni universal.
2. **✅ Kompilasi Otomatis**: `scripts/build-mcp.mjs` + `kaede build` command untuk build MCP server.
3. **✅ Playbook Parser**: `parsePlaybook` di `src/orchestrator.js` — shared antara CLI dan orchestrator.
4. **✅ Intent-Driven Orchestrator**: `executeIntent` dengan 16 handler (7 original + 9 tambahan: buat label, arsipkan, pindah semua, buat board, hapus anggota, tambah label, arsip list, update card, buat checklist).
5. **✅ generatePlan()**: 16 intent pattern handlers → mengembalikan ActionStep[] dengan nama (tanpa ID Trello).
6. **✅ Pure Context Refactor**: `mcp.kaede` dipisah dari Trello — 4 tools, zero dependency Trello.

### 🟡 Fase 2 — MCP Enhancements & Concern Separation (IN PROGRESS)
1. **⬜ Attachments Implementation** (5 tools): `attach_file_to_card`, `attach_image_to_card`, `attach_data_to_card`, `attach_image_data_to_card`, `get_card_attachments` (new contribution)
2. **⬜ Copy Card** (1 tool): `copy_card` dengan keepFromSource options
3. **⬜ Checklist Enhancements** (4 tools): Delete checklist/item, update checklist item, get card checklists (new contribution)
4. **⬜ Advanced Features** (5 tools): Watch card/list, get card activity, search labels, remove label from card
5. **⬜ Upstream Contribution** (3 PRs): Prepare dan submit PRs ke delorenj/mcp-server-trello
6. **⬜ Code Architecture Refactor**: Modular structure (tools/, trello/ directories)

**Documentation:**
- [`DEVELOPMENT-ROADMAP.md`](DEVELOPMENT-ROADMAP.html) — Master development plan
- [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) — Upstream contribution guide
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) — Detailed feature specs

### 🟡 Fase 3 — Integrasi Frontend Power-Up (BERTAHAP)
1. **✅ API Server**: `src/api-server.mjs` — HTTP bridge port 3456, endpoints `/api/health` & `/api/mcp`.
2. **✅ Power-Up MCP Panel**: `public/mcp.html` — kontrol panel intent langsung dari Trello popup.
3. **⬜ Sync Label Environment**: Hubungkan tombol environment di `card.html` ke MCP API untuk auto-add label.
4. **⬜ Dynamic Dashboard**: `board.html` real-time stats via MCP API.

---

*Dokumen ini merupakan referensi resmi arsitektur KAEDE PT Koneksi Jaringan Indonesia.*
