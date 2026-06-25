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
        │               (src/mcp-server.js — 22 tools)           │
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
│   ├── tools.md                 # Deskripsi 22 tools Trello MCP yang tersedia
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
│   ├── kaede.mjs                # CLI Tool utama (setup, today, init, push, env, status)
│   └── build-docs.mjs           # Script kompilasi Markdown → HTML
└── src/
    ├── mcp-server.js            # Sumber kode Trello MCP Server (22 tools)
    └── style.css                # CSS Source (Tailwind v4 + custom utility)
```

### 3.2 Analisis File-by-File & Penilaian Gaps

#### A. Frontend Power-Up (`public/`)
* **`index.html`**: Dual-mode yang sangat cerdas. Jika diload di dalam iframe Trello, ia menyembunyikan visual situs dan mengaktifkan konektor Power-Up. Jika diakses langsung, ia bertindak sebagai landing page ekosistem.
* **`js/kaede.js`**: Berhasil mendaftarkan 7 capabilities Trello (tombol board, tombol kartu, badge, show-card panel, auth hooks, locale, lifecycle).
  * *Gap*: Seluruh operasional frontend masih bergantung pada Trello Shared Storage lokal dan `localStorage`. Belum terhubung dengan status real-time dari MCP Server atau database terpusat.
* **`card.html` & `board.html`**: Berhasil membuat UI minimalis untuk manajemen environment (PROD, STAG, DEV).
  * *Gap*: Status statis. Pilihan environment di kartu belum memicu penambahan Label asli di Trello secara dinamis. Perhitungan status lingkungan di board popup rawan bug karena hanya increment-only tanpa melacak state lama.

#### B. CLI Tool (`scripts/kaede.mjs`)
* Menyediakan fungsionalitas asisten yang mumpuni (`setup` untuk credentialing, `today` untuk melihat tugas harian, `init` untuk menyuntikkan template config ke project lain, `push` untuk membuat kartu dari file markdown).
  * *Gap*: Saat inisialisasi (`kaede init`), path playbook masih diasumsikan berada di `../smauii-playbook` (hardcoded). Konfigurasi ini harus dibuat lebih universal.

#### C. MCP Server (`src/mcp-server.js`)
* Menyediakan implementasi protokol MCP mandiri dengan 22 Trello tools esensial tanpa ketergantungan framework eksternal yang berat.
  * *Gap*: Belum mengimplementasikan fitur pembacaan Playbook dinamis untuk mengotomatisasi serangkaian tindakan (multi-tool calls) secara cerdas.

---

## 4. Gap Analysis Strategis (Sekarang vs Target Visi)

| Fitur / Dimensi | Kondisi Sekarang (As-Is) | Target Visi (To-Be) | Gaps | Prioritas |
|---|---|---|---|---|
| **Eksekusi Trello** | Tool-by-tool (Sangat manual, AI harus panggil tools satu per satu) | Orkestrasi otomatis (Cukup panggil satu intent kustom, server eksekusi beruntun) | Butuh lapisan orkestrasi di atas 22 tool dasar | **🔴 Tinggi** |
| **Playbook Integration** | Dokumen teks pasif (Hanya dibaca manusia) | Di-parse secara aktif oleh KAEDE CLI & AI Agent untuk menegakkan aturan alur kerja | Tambah utilitas `kaede.mjs` untuk meng-interpretasikan Playbook Markdown/YAML | **🔴 Tinggi** |
| **Trello State Sync** | Local / Shared Storage saja | Real-time Label & Metadata Sync ke Trello API | Frontend Power-Up panggil Trello API / MCP Server untuk memanipulasi board | **🟡 Sedang** |
| **Kemitraan Peran** | Dokumentasi template | AI Agent secara dinamis meload role rules `~/.openkb/ROLES/*.md` berdasarkan role user | Script otomatisasi sinkronisasi role dari repository playbook ke KB lokal | **🟡 Sedang** |

---

## 5. Rencana & Roadmap Pengembangan

### Fase 1 — Pembersihan & Penguatan Konteks (Pondasi)
1. **Pembersihan Referensi**: Menghapus seluruh residu dan referensi yang merujuk pada project luar seperti Laravel/smauii secara tidak sengaja untuk memastikan KAEDE murni universal.
2. **Kompilasi Otomatis**: Membuat file build automation (misalnya `scripts/build-mcp.mjs` atau perintah kustom di Bun) untuk mengotomatisasi kompilasi `src/mcp-server.js` ke `dist/mcp-server.js`.

### Fase 2 — Playbook Parser & Lapisan Orkestrator (Kecerdasan)
1. **Upgrade KAEDE CLI**: Tambahkan command `kaede playbook parse <path>` untuk membaca target playbook, memetakan roles, dan mengidentifikasi format workflow yang valid.
2. **Orkestrasi Alur Kerja Trello**: Buat utilitas orkestrator terpadu yang memetakan niat (misal: "Mulai Sprint") menjadi langkah eksekusi: membuat board baru, menyalin daftar standar dari Playbook, membuat label, dan mengundang anggota yang relevan sesuai SOP playbook.

### Fase 3 — Integrasi Frontend Power-Up
1. **Sync Label Environment**: Hubungkan tombol environment di `card.html` agar tidak hanya menyimpan status di Shared Storage, tetapi juga secara otomatis membuat dan menempelkan Label berwarna (PROD - Merah, STAG - Kuning, DEV - Hijau) di kartu Trello asli.
2. **Dynamic Dashboard**: Perbaiki `board.html` agar melacak jumlah kartu di setiap environment secara dinamis menggunakan API Trello yang sesungguhnya.

---

*Dokumen ini merupakan referensi resmi arsitektur KAEDE PT Koneksi Jaringan Indonesia.*
