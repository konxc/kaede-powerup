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
        │                  KAEDE ORCHESTRATOR                    │
        │            (Trello Power-Up & CLI Tool)                │
        └───────────────────────────┬────────────────────────────┘
                                    │ Eksekusi Intent-Driven
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                   MCP TRELLO SERVER                    │
        │               (src/mcp-server.js — 24 tools)           │
        └───────────────────────────┬────────────────────────────┘
                                    │ stdio JSON-RPC
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │                        TRELLO                          │
        │              (Board, Lists, Cards, Labels)             │
        └────────────────────────────────────────────────────────┘
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
│   ├── tools.md                 # Deskripsi 24 tools Trello MCP yang tersedia
│   ├── role-management.md       # Detail integrasi role AI Agent & Trello
│   └── kaede-architecture.md    # [DOKUMEN INI] Arsitektur mendalam & roadmap
├── public/                      # Static Assets (Deploy Netlify)
│   ├── index.html               # Dual-Mode: Power-Up Connector & Landing Page
│   ├── board.html               # Dashboard Popup statis (Env stats)
│   ├── card.html                # Environment manager per kartu (PROD/STAG/DEV)
│   ├── auth.html                # Mock Authorization page
│   ├── privacy.html             # Kebijakan privasi multibahasa
│   └── js/kaede.js              # Implementasi 7 Capabilities Trello Power-Up
├── scripts/
│   ├── kaede.mjs                # CLI Tool utama (15+ commands: playbook, orchestrate, run, start, build, install, dll.)
│   └── build-docs.mjs           # Script kompilasi Markdown → HTML
└── src/
    ├── mcp-server.js            # Sumber kode Trello MCP Server (24 tools)
    ├── api-server.mjs           # HTTP API server (port 3456)
    ├── orchestrator.js          # Orchestrator — parsePlaybook, executeIntent, bundleContext
    ├── trello-client.js         # MCP Client — 24 tool wrappers + timeout + reconnect
    ├── style.css                # CSS Source (Tailwind v4 + custom utility)
    └── index.html               # Landing page (deployed to Netlify)
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

#### C. MCP Server (`src/mcp-server.js`)
* Menyediakan implementasi protokol MCP mandiri dengan 24 Trello tools esensial (22 original + 2 checklist) tanpa ketergantungan framework eksternal yang berat.
  * *Gap*: Belum mengimplementasikan fitur pembacaan Playbook dinamis untuk mengotomatisasi serangkaian tindakan (multi-tool calls) secara cerdas.

---

## 4. Gap Analysis Strategis (Sekarang vs Target Visi)

| Fitur / Dimensi | Kondisi Sekarang (As-Is) | Target Visi (To-Be) | Gaps | Prioritas |
|---|---|---|---|---|
| **Eksekusi Trello** | Intent-driven (16 handler — playbook parse → execute via TrelloClient) | Orkestrasi otomatis multi-langkah (Cukup 1 intent, eksekusi berantai) | Handler masih standalone, belum ada pipeline/chaining | **🟡 Sedang** |
| **Playbook Integration** | Parse aktif (Markdown → section map → bundle context) | Di-parse + ditegakkan secara real-time oleh AI Agent | Output parse masih dictionary, belum fully structured untuk auto-enforcement | **🟡 Sedang** |
| **Trello State Sync** | MCP langsung (via trello-client.js wrapper, 24 tools) | Real-time Label & Metadata Sync via Trello API langsung | Power-Up frontend masih pakai Shared Storage, belum via MCP | **🟡 Sedang** |
| **API Server** | HTTP bridge aktif (port 3456, endpoint /api/mcp & /api/health) | Dashboard visual dengan metrik sprint real-time | Hanya REST proxy, belum ada UI dashboard | **🟡 Sedang** |

---

## 5. Rencana & Roadmap Pengembangan

### ✅ Fase 1 — Pembersihan & Penguatan Konteks (SELESAI)
1. **✅ Pembersihan Referensi**: Semua referensi project-specific (smauii/laravel) dihapus dari OpenKB KAEDE. KAEDE sekarang murni universal.
2. **✅ Kompilasi Otomatis**: `scripts/build-mcp.mjs` + `kaede build` command untuk build MCP server.
3. **✅ Playbook Parser**: `parsePlaybook` di `src/orchestrator.js` — shared antara CLI dan orchestrator.
4. **✅ Intent-Driven Orchestrator**: `executeIntent` dengan 16 handler (7 original + 9 tambahan: buat label, arsipkan, pindah semua, buat board, hapus anggota, tambah label, arsip list, update card, buat checklist).
5. **✅ 55 Unit & E2E Tests**: 30 unit (13 parsePlaybook + 17 TrelloClient) + 25 E2E dengan MockClient.

### 🟡 Fase 2 — Playbook Parser & Lapisan Orkestrator (BERTAHAP)
1. **✅ Upgrade KAEDE CLI**: `kaede playbook parse`, `kaede orchestrate`, `kaede run` (+dry-run), `kaede build`, `kaede start`, `kaede install`, `kaede test-tools`, `kaede status --mcp`.
2. **⬜ Orkestrasi Multi-Langkah**: Chaining intent handler — sequencing multi-step workflows dari 1 intent kompleks.
3. **⬜ Real E2E Test with Trello**: Butuh Trello credentials untuk live test.

### 🟡 Fase 3 — Integrasi Frontend Power-Up (BERTAHAP)
1. **✅ API Server**: `src/api-server.mjs` — HTTP bridge port 3456, endpoints `/api/health` & `/api/mcp`.
2. **✅ Power-Up MCP Panel**: `public/mcp.html` — kontrol panel intent langsung dari Trello popup.
3. **⬜ Sync Label Environment**: Hubungkan tombol environment di `card.html` ke MCP API untuk auto-add label.
4. **⬜ Dynamic Dashboard**: `board.html` real-time stats via MCP API.

---

*Dokumen ini merupakan referensi resmi arsitektur KAEDE PT Koneksi Jaringan Indonesia.*
