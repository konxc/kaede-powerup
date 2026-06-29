# KAEDE — Koneksi Automated Environment DE

**Trello Power-Up** + **CLI Tool** untuk menghubungkan perencanaan tim di Trello dengan ekosistem AI Agent.

| | |
|---|---|
| **Power-Up** | [`kaede-powerup.netlify.app`](https://kaede-powerup.netlify.app) |
| **Dokumentasi** | [`konxc.github.io/kaede-powerup`](https://konxc.github.io/kaede-powerup) |
| **Repo** | `github.com/konxc/kaede-powerup` |
| **Stack** | Tailwind CSS v4 + Bun |
| **License** | Proprietary — PT Koneksi Jaringan Indonesia |

---

## Fitur

### Trello Power-Up
- **Environment Manager** — Atur label Production/Staging/Development per kartu Trello
- **Dashboard Board** — Lihat statistik lingkungan di setiap board
- **Badge Kartu** — Status environment muncul langsung di muka kartu
- **Otorisasi** — Koneksi aman ke penyedia deployment

### CLI Tool (`kaede`)
- **`kaede setup`** — Setup Trello API Key & Token interaktif
- **`kaede today`** — Lihat task Trello yang ditugaskan untuk hari ini
- **`kaede init`** — Inisialisasi KAEDE di project (konfigurasi MCP Trello)
- **`kaede env`** — Export credentials ke environment variable
- **`kaede status`** — Cek status konfigurasi

### Integrasi MCP
- **MCP Trello Server** — AI Agent bisa membaca/menulis Trello langsung
- **Wrapper otomatis** — Baca credentials dari `secrets.env`, tanpa env var manual
- **Netral** — Bisa dipakai di project Laravel, Node.js, Python, apa pun

---

## Struktur Repo

```
├── public/                  # Static site (deploy ke Netlify)
├── src/
│   ├── kaede-mcp-server.js  # KAEDE Orchestrator MCP (4 tools)
│   ├── trello-client.js     # Trello MCP Client wrapper
│   ├── orchestrator.js      # Intent engine & playbook parser
│   └── style.css            # Source CSS (Tailwind v4)
├── packages/
│   ├── README.md            # Dokumentasi arsitektur packages
│   ├── mcp-server-trello/   # Git submodule → delorenj/mcp-server-trello
│   └── kaede-trello/
│       └── src/
│           ├── mcp-server.js    # MCP Trello server (42 tools, staging)
│           └── trello/
│               └── attachments.js  # Attachment utilities
├── dist/                    # Build output (gitignored)
├── scripts/
│   ├── kaede.mjs            # CLI tool (setup, today, init, push, env, status)
│   ├── build-docs.mjs       # Build docs: Markdown → HTML
│   └── build-mcp.mjs        # Compile MCP server via bun build
├── .opencode/
│   ├── opencode.json        # Konfigurasi AI Agent
│   └── SHARED/              # Project context & agent rules
├── docs/                    # Dokumentasi (sumber: Markdown)
├── netlify.toml             # Konfigurasi deploy Netlify
├── package.json             # Build scripts + CLI entry
└── secrets.env              # Trello credentials (gitignored)
```

---

## Quick Start

### 1. Setup Credentials

```bash
# Interaktif — masukkan API Key & Token Trello
bun scripts/kaede.mjs setup
```

Atau buat `secrets.env` manual:

```env
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
```

### 2. Lihat Task Hari Ini

```bash
bun scripts/kaede.mjs today
```

### 3. Inisialisasi di Project Lain

```bash
# Dari dalam project target
bun path/to/kaede/scripts/kaede.mjs init .
```

Ini akan menambahkan konfigurasi MCP Trello ke `.opencode/opencode.json` project kamu.

### 4. Integrasi dengan Opencode

KAEDE sudah siap digunakan dengan Opencode. MCP Trello dikonfigurasi via wrapper yang otomatis membaca credentials dari `secrets.env` — tanpa perlu set env variable manual.

```bash
# Cek status konfigurasi
bun scripts/kaede.mjs status

# Export credentials ke session (PowerShell)
bun scripts/kaede.mjs env | iex

# Export credentials ke session (Bash)
eval $(bun scripts/kaede.mjs env)
```

---

## Dev

```bash
# Install dependencies
bun install

# Development (CSS watch + static server)
bun run dev

# Build production CSS
bun run build

# Preview
bun run preview
```

### KAEDE CLI (dev)

```bash
bun run kaede -- setup
bun run kaede -- today
bun run kaede -- status
```

---

## Deploy

### Netlify (Power-Up)

Push ke `main` → Netlify auto-deploy:

- **Branch:** `main`
- **Publish directory:** `public`
- **Build command:** `bun run build`
- **URL:** `kaede-powerup.netlify.app`

### GitHub Pages (Dokumentasi)

Dokumentasi di `docs/*.md` auto-build ke `gh-pages` branch via GitHub Actions.

- **URL (default):** `konxc.github.io/kaede-powerup`
- **URL (target):** `konxc.github.io/kaede` (rename repo → `kaede`)

---

## Stack

| Teknologi | Versi |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | v4 |
| [Bun](https://bun.sh) | v1 |
| [delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) | v1.7.1+ |
| [Marked](https://marked.js.org) | build-time |
| [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) | v4 |

---

## Siapa yang Membutuhkan KAEDE?

| Peran | Manfaat Utama |
|---|---|
| **Project Manager** | Sprint automation via intent — "Mulai Sprint Alpha" satu perintah |
| **Developer** | 42 tools MCP, clipboard-to-card attachment, `kaede today` |
| **QA / Tester** | Template checklist, histori card, sort by due date |
| **Tech Lead** | Playbook-enforced governance, dual MCP architecture |
| **Stakeholder** | Badge environment langsung di card, zero config |
| **AI Engineer** | Extensible MCP server, kontribusi upstream via PR |

Dokumentasi lengkap: [`docs/sdlc-roles.md`](docs/sdlc-roles.md) (EN) | [`docs/id/sdlc-roles.md`](docs/id/sdlc-roles.md) (ID)

---

## Dukung Pengembangan

KAEDE dikembangkan oleh **Sandiko** sebagai proyek open-source internal PT Koneksi Jaringan Indonesia. Jika tools ini bermanfaat, dukung pengembangan selanjutnya:

[![Trakteer](https://img.shields.io/badge/Trakteer-Sandiko-red?logo=buymeacoffee&style=for-the-badge)](https://trakteer.id/sandikodev)

Setiap dukungan berarti — mulai dari semacam kopi hingga kontribusi kode.

---

## Ekosistem

KAEDE adalah bagian dari ekosistem pengembangan PT Koneksi Jaringan Indonesia:

```
Playbook → OpenKB → OpenCode → KAEDE → Trello
  (SOP)    (KB)    (AI Agent)  (Bridge) (Board)
```

- **Playbook** — Panduan manusia ke manusia (SOP, workflow)
- **OpenKB** — Knowledge base (AI ↔ Human communication)
- **OpenCode** — Konfigurasi AI Agent
- **KAEDE** — Jembatan Trello ↔ MCP

---

## Lisensi

Proprietary — &copy; 2026 PT Koneksi Jaringan Indonesia.

KAEDE dapat digunakan dan dimodifikasi untuk project internal. Redistribusi komersial tanpa izin tidak diizinkan.
