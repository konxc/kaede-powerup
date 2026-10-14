# Spesifikasi Universal OpenKB & Konteks 4-Layer KAEDE

Dokumen ini menjelaskan arsitektur hierarki konteks universal yang diinisiasi oleh **Sandiko (Founder PT Koneksi Jaringan Indonesia)** untuk menghubungkan identitas operator, aturan operasional perusahaan, knowledge base proyek, dan harness AI Agent (seperti OpenCode, Antigravity 2.0, Claude Code, OpenClaw, dan Hermes).

---

## 1. Masalah: "Agent Identity & Context Amnesia"

Dalam adopsi AI coding & task automation di dunia nyata, tim sering menghadapi dua kendala mendasar:
1. **Context Amnesia**: Agent AI tidak mengetahui siapa operatornya (*tuannya*), apa peran dan wewenangnya, serta apa aturan baku organisasi tanpa *live prompting* berulang kali setiap sesi baru dimulai.
2. **Kesenjangan Peran (Dev vs Non-Dev)**: Tim software development bekerja dengan terminal dan agentic coding harness, sedangkan tim kreatif, SEO, dan digital agency beroperasi di Trello. Trello MCP standar hanya menyediakan fungsi REST mentah tanpa pemahaman domain bisnis.

---

## 2. Hierarki Konteks 4-Layer (The Convergence Bridge)

KAEDE memecahkan masalah ini dengan membaca 4 lapisan konteks terstandarisasi:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: IDENTITAS OPERATOR & ORGANISASI                             │
│  • Organisasi: github.com/<org>/.github       (Profil & Filosofi)      │
│  • Personal  : github.com/<user>/<user>      (Persona & Visi Tuan)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: ATURAN OPERASIONAL & SOP BISNIS                              │
│  • github.com/<org-atau-user>/playbook                                 │
│    → Roles (Dev, QA, PM, Creative, SEO Specialist)                     │
│    → Workflow Lists (Backlog, Todo, In Review, Published, Done)        │
│    → Konvensi Penamaan (feat:, fix:, seo:, copy:, priority)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: PROJECT KNOWLEDGE BASE (Tool-Agnostic)                       │
│  • <repo-project>/.openkb/                                             │
│    → Menyediakan konteks universal bagi agent apa pun                  │
│      (Hermes, OpenClaw, Antigravity 2.0, OpenCode, Claude Code)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: SUBJECTIVE AGENT HARNESS & EXECUTION                         │
│  • <repo-project>/.opencode/ (Konfigurasi tool spesifik)               │
│  • KAEDE MCP + Trello (Jembatan eksekusi & state machine Trello)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Struktur Standar Direktori `.openkb/`

Setiap repositori proyek (baik software house maupun agensi digital) distandarisasikan memiliki folder `.openkb/` dengan susunan berikut:

```
.openkb/
├── brand/                         # Panduan Brand & Persona
│   ├── voice-and-tone.md          # Gaya bahasa (formal, edukatif, santai, dilarang jargon)
│   ├── personas.md                # Target audiens & pain points pembeli
│   └── visual-guidelines.md       # Palet warna, tipografi, panduan aset
├── marketing/                     # Strategi & Konversi
│   ├── keywords-matrix.md         # Daftar kata kunci primer, sekunder, dan LSI
│   ├── funnel-architecture.md     # Alur perjalanan prospek (TOFU/MOFU/BOFU)
│   └── offer-and-pricing.md       # USP, penawaran promo, handling keberatan
├── operations/                    # Tata Kelola & SOP Rilis
│   ├── sop-publishing.md          # Checklist kelayakan sebelum artikel/konten tayang
│   └── role-access.md             # Batas wewenang per peran
└── tech/                          # Arsitektur Teknis (jika proyek software)
    ├── architecture.md            # Diagram sistem & ketergantungan
    └── coding-standards.md        # Konvensi kode & pengujian
```

---

## 4. Template Agensi Digital & Marketing di KAEDE

KAEDE menyediakan built-in template yang dapat langsung dipakai untuk agensi digital:

| Template | Intent Natural Language | Fokus Output |
|---|---|---|
| **`seo-article`** | `"buat artikel seo"`, `"konten seo"` | Target keyword, slug, outline H1-H3, meta title/desc, checklist SEO on-page, integrasi WordPress. |
| **`social-media-post`** | `"buat konten sosmed"`, `"post instagram"` | Platform (IG/TikTok/LinkedIn), hook copy, isi slide carousel, link aset Canva/Drive, CTA link UTM. |
| **`lead-funnel`** | `"buat funnel"`, `"lead funnel"` | Tahap funnel (TOFU/MOFU/BOFU), lead magnet, alur landing page, nomor closing WhatsApp, tracking UTM. |
| **`web-copy`** | `"buat web copy"`, `"copy landing page"` | Headline 5-detik, value proposition, handling keberatan, tombol CTA berorientasi tindakan. |

### Contoh Penggunaan Intent:
```bash
# Otomatis membuat kartu artikel SEO terstruktur lengkap dengan checklist on-page:
kaede run --intent "buat artikel seo" --task "Panduan Otomasi Agensi AI" --keyword "otomasi agensi ai"

# Otomatis membuat kartu konten media sosial:
kaede run --intent "buat konten sosmed" --task "Tips Prompting Anti Amnesia" --platform "Instagram"
```

---

## 5. Multi-Profile Auth & Context Scoping

Untuk mengakomodasi multi-identitas di server (seperti `sandikodev`, `konxc`, `smauii`, `klubfisika`, dan klien luar), KAEDE mendukung manajemen profil terisolasi:

```bash
# 1. Simpan konfigurasi saat ini sebagai profil
kaede auth save personal
kaede auth save konxc

# 2. Lihat semua profil yang tersedia
kaede auth list

# 3. Beralih profil aktif
kaede auth switch smauii

# 4. Login langsung ke profil tertentu
kaede auth login --profile klien-a --manual

# 5. Menjalankan perintah dengan profil tertentu secara on-the-fly
kaede today --profile konxc
KAEDE_PROFILE=smauii kaede status --mcp
```

### Auto-Scoping Direktori Proyek
KAEDE secara otomatis mendeteksi file kredensial proyek lokal dengan urutan prioritas:
1. Flag `--profile <name>` atau environment variable `KAEDE_PROFILE`
2. Environment variable `KAEDE_SECRETS_PATH`
3. File lokal `./.kaede.env` atau `./.kaede/secrets.env` atau `./secrets.env`
4. Profil aktif global di `~/.config/kaede/profiles/<active>.env`
5. File global default `~/.config/kaede/secrets.env`

---

## 6. Protokol Handoff: Headless (Hermes) ↔ Coding Agent

Trello berfungsi sebagai **State Machine** kolaborasi lintas jenis agent:

1. **Request Masuk**: Klien meminta artikel baru via WhatsApp ke **Hermes Agent**.
2. **Ingest (Hermes)**: Hermes memanggil KAEDE MCP untuk membuat kartu Trello di list *"Backlog"* dengan template `seo-article`.
3. **Pengerjaan (Coding Agent)**: Developer atau agent di terminal (**OpenCode / Antigravity**) mengambil task melalui `kaede today`, menyusun konten mengacu pada `.openkb/brand/`, mempublikasikan draft via WordPress MCP, dan memindahkan kartu ke *"Review Klien"*.
4. **Notifikasi Balik (Hermes)**: Hermes mendeteksi perpindahan kartu ke *"Review Klien"* dan langsung mengirimkan link preview ke WhatsApp klien.
