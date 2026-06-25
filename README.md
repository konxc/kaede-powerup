# KAEDE — Koneksi Automated Environment DE

**Trello Power-Up** untuk manajemen environment staging/produksi langsung dari kartu Trello.

| | |
|---|---|
| **Power-Up** | [`kaede-powerup.netlify.app`](https://kaede-powerup.netlify.app) |
| **Dokumentasi** | [`konxc.github.io/kaede`](https://konxc.github.io/kaede) |
| **Repo** | `github.com/konxc/kaede-powerup` |
| **Stack** | Tailwind CSS v4 + Bun |

---

## Struktur Repo

```
├── public/              # Static site (deploy ke Netlify)
│   ├── index.html       # Landing page + iframe connector (Trello)
│   ├── board.html       # Dashboard popup
│   ├── card.html        # Environment manager per kartu
│   ├── auth.html        # Halaman otorisasi
│   ├── privacy.html     # Kebijakan privasi
│   ├── js/kaede.js      # Power-Up capabilities
│   ├── css/style.css    # Compiled CSS (auto-generated)
│   └── _redirects       # Netlify redirect rules
├── src/style.css        # Source CSS (Tailwind v4 + custom components)
├── netlify.toml         # Konfigurasi deploy Netlify
├── package.json         # Build scripts
│
├── docs/                # Dokumentasi (sumber: Markdown)
│   ├── index.md         # Ikhtisar
│   ├── api-key.md       # Panduan API Key & Token Trello
│   ├── mcp-server.md    # Setup Trello MCP Server
│   ├── opencode.md      # Integrasi OpenCode
│   ├── tools.md         # Referensi tools MCP
│   └── privacy.md       # Kebijakan privasi
│
├── scripts/
│   └── build-docs.mjs   # Build docs: Markdown → HTML statis
│
└── .github/workflows/
    └── docs.yml         # Auto-deploy docs ke gh-pages (GitHub Pages)
```

## Cara Kerja

KAEDE adalah Trello Power-Up yang:

1. **Connector** — `index.html` terhubung ke Trello via iframe
2. **Dashboard** — `board.html` menampilkan status environment
3. **Card Badge** — Badge pada kartu menunjukkan environment aktif
4. **Card Button** — Buka environment manager dari kartu

## Dev

```bash
# Install dependencies
bun install

# Development (CSS watch + static server)
bun run dev

# Build production CSS
bun run build

# Preview
bun run preview   # build + serve
```

### Build Docs

```bash
# Render Markdown → HTML (butuh marked)
npm install marked
node scripts/build-docs.mjs
# Output: dist-docs/
```

## Deploy

### Netlify (Power-Up)

Push ke `main` → Netlify auto-deploy:

- **Branch:** `main`
- **Publish directory:** `public`
- **Build command:** `bun run build`
- **URL:** `kaede-powerup.netlify.app`

### GitHub Pages (Dokumentasi)

Dokumentasi di `docs/*.md` auto-build ke `gh-pages` branch via GitHub Actions.

- **Branch:** `gh-pages` (auto-generated)
- **URL (default):** `konxc.github.io/kaede-powerup`
- **URL (target — butuh rename repo):** `konxc.github.io/kaede`

Setelah push ke `main`, workflow `.github/workflows/docs.yml`:

1. Render semua Markdown → HTML (KAEDE theme)
2. Deploy ke `gh-pages` branch
3. GitHub Pages serve dari `gh-pages`

> **Catatan:** Untuk mencapai URL `konxc.github.io/kaede`, repositori perlu di-rename dari `kaede-powerup` menjadi `kaede` di GitHub (Settings → General → Repository name). URL GitHub Pages project site selalu `{org}.github.io/{nama-repo}` dan tidak bisa diubah subpath-nya.

## Stack

| Teknologi | Versi |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | v4 |
| [Bun](https://bun.sh) | v1 |
| [delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) | v1.6.1 |
| [Marked](https://marked.js.org) | (build-time only) |
| [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) | v4 |
