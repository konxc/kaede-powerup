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
- **`kaede setup`** — Onboarding lengkap: auth OAuth Trello + registrasi MCP + verifikasi (`--yes`, `--no-mcp`, `--no-init`)
- **`kaede auth`** — Login/logout akun Trello via OAuth: `login`, `status`, `logout`, `token`
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
├── apps/
│   └── web/                 # Trello Power-Up & Web Dashboard (Vite + Tailwind v4)
├── packages/
│   ├── README.md            # Dokumentasi arsitektur packages
│   ├── mcp-server-trello/   # [Submodule] Git submodule → delorenj/mcp-server-trello
│   └── kaede-trello/        # Library Trello MCP (42 tools standalone)
├── src/                     # KAEDE Orchestrator MCP (backend engine)
│   ├── kaede-mcp-server.ts  # Entry point MCP server
│   ├── orchestrator.ts      # Intent engine barrel
│   ├── intent-handlers/     # Domain intent handlers
│   ├── plan-executors/      # Domain plan executors
│   ├── tool-handlers/       # Domain tool handlers
│   └── services/            # Domain service classes
├── apps/docs/content/                    # Dokumentasi & Laporan (Markdown & reports)
│   ├── IMPLEMENTATION-SUMMARY.md
│   ├── SUMMARY.md
│   └── pr-submissions/      # PR submission drafts
├── dist/                    # Build output (gitignored)
├── scripts/
│   ├── kaede.ts            # CLI tool (setup, today, init, env, status)
│   ├── build-docs.ts       # Build docs: Markdown → HTML
│   └── build-mcp.ts        # Compile MCP server via bun build
├── .opencode/               # Konfigurasi & aturan AI Agent
├── netlify.toml             # Konfigurasi deploy Netlify & functions
├── package.json             # Root monorepo package.json (workspaces)
└── secrets.env              # Trello credentials (gitignored, dipindah ke global)
```

---

## Quick Start

### 1. Onboarding

```bash
# Onboarding lengkap: OAuth Trello (browser) + registrasi MCP + verifikasi
bun scripts/kaede.ts setup

# Atau langkah per langkah:
bun scripts/kaede.ts auth login     # OAuth browser (auto) / --manual untuk paste token
bun scripts/kaede.ts auth status    # cek akun aktif
```

Atau buat `secrets.env` manual:

```env
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
```

### 2. Lihat Task Hari Ini

```bash
bun scripts/kaede.ts today
```

### 3. Inisialisasi di Project Lain

```bash
# Dari dalam project target
bun path/to/kaede/scripts/kaede.ts init .
```

Ini akan menambahkan konfigurasi MCP Trello ke `.opencode/opencode.json` project kamu.

### 4. Integrasi dengan Opencode

KAEDE sudah siap digunakan dengan Opencode. MCP Trello dikonfigurasi via wrapper yang otomatis membaca credentials dari `secrets.env` — tanpa perlu set env variable manual.

```bash
# Cek status konfigurasi
bun scripts/kaede.ts status

# Export credentials ke session (PowerShell)
bun scripts/kaede.ts env | iex

# Export credentials ke session (Bash)
eval $(bun scripts/kaede.ts env)
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

Dokumentasi di `apps/docs/content/*.md` auto-build ke `gh-pages` branch via GitHub Actions.

- **URL (default):** `konxc.github.io/kaede-powerup`
- **URL (target):** `konxc.github.io/kaede` (rename repo → `kaede`)

---

## Deployment Modes

KAEDE beroperasi dalam **dua mode disiplin** (detail: [`apps/docs/content/architecture-topology.md`](apps/docs/content/architecture-topology.md)):

| Mode | Kapan | Kemampuan |
|---|---|---|
| **Mode 1 — Full Orchestrator Lokal** (`kaede start`) | Pengembangan / internal | 45 tools MCP + git + history + `bundle_context`. Kredensial dari `secrets.env`. |
| **Mode 2 — Stateless Serverless** (`trello-proxy.mjs`) | Power-Up public / pihak ke-3 | Subset aman kategori A+B+C. Auth per-user (`Authorization: Bearer` token OAuth member-private, divalidasi server-side via `/1/tokens`) ATAU path integrator `X-KAEDE-Key`. **Semua intent butuh auth** — tidak ada baca terbuka. |

Aturan utama:

- **Orkestrasi hanya lokal** — `generate_plan`, `execute_plan`, `undo_last_plan`, tool git tidak pernah diekspos di serverless.
- **Kredensial service tidak pernah di browser** — browser hanya menyimpan token OAuth **per-user** di scope member-private (`kaede_token`); tidak ada key/token service di Trello shared storage (browser-direct REST dihapus).
- Pemilihan mode otomatis via hostname (`localhost` → Mode 1, lainnya → Mode 2) di `public/js/mcp-client.js`.

**Env Netlify yang wajib diset:**

```
TRELLO_API_KEY=<consumer key publik Power-Up>
TRELLO_TOKEN=<token akun service>
KAEDE_API_KEY=<key untuk path integrator pihak ke-3>
```

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
| **Developer** | 42 tools lib via KAEDE, clipboard-to-card attachment, `kaede today` |
| **QA / Tester** | Template checklist, histori card, sort by due date |
| **Tech Lead** | Playbook-enforced governance, MCP + lib architecture |
| **Stakeholder** | Badge environment langsung di card, zero config |
| **AI Engineer** | Extensible MCP server, kontribusi upstream via PR |

Dokumentasi lengkap: [`apps/docs/content/sdlc-roles.md`](apps/docs/content/sdlc-roles.md) (EN) | [`apps/docs/content/id/sdlc-roles.md`](apps/docs/content/id/sdlc-roles.md) (ID)

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
