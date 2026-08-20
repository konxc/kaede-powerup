# Dokumentasi KAEDE

Panduan lengkap menghubungkan Trello dengan ekosistem Agentic Development Koneksi — dari mendapatkan API credentials hingga integrasi dengan OpenCode.

## Mulai Cepat

Ikuti 3 langkah berikut untuk mulai menggunakan Trello MCP:

1. **[Dapatkan API Key & Token](api-key.html)** — Buat Power-Up Trello dan generate kredensial.
2. **[Setup MCP Server](mcp-server.html)** — Install dan konfigurasi `@delorenj/mcp-server-trello`.
3. **[Integrasi dengan OpenCode](opencode.html)** — Tambahkan MCP server ke `opencode.json`.

## Daftar Halaman

### User Documentation

<div class="grid sm:grid-cols-2 gap-4 not-prose">

<a href="api-key.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-2 text-sm font-bold">1</div>
  <h3 class="text-sm font-semibold text-kaede-text">API Key & Token</h3>
  <p class="text-xs text-kaede-muted mt-1">Panduan langkah demi langkah mendapatkan Trello API credentials melalui Power-Up admin.</p>
</a>

<a href="mcp-server.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-success/20 text-kaede-success mb-2 text-sm font-bold">2</div>
  <h3 class="text-sm font-semibold text-kaede-text">MCP Server</h3>
  <p class="text-xs text-kaede-muted mt-1">Install dan konfigurasi Trello MCP server, environment variables, dan manajemen board/workspace.</p>
</a>

<a href="opencode.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-warning/20 text-kaede-warning mb-2 text-sm font-bold">3</div>
  <h3 class="text-sm font-semibold text-kaede-text">OpenCode Integrasi</h3>
  <p class="text-xs text-kaede-muted mt-1">Cara menambahkan Trello MCP ke file opencode.json dan menggunakan tools dari AI Agent.</p>
</a>

<a href="tools.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-danger/20 text-kaede-danger mb-2 text-sm font-bold">4</div>
  <h3 class="text-sm font-semibold text-kaede-text">Referensi Tools</h3>
  <p class="text-xs text-kaede-muted mt-1">Daftar lengkap semua MCP tools: cards, lists, checklist, komentar, attachments, custom fields.</p>
</a>

</div>

### Development Documentation

<div class="grid sm:grid-cols-2 gap-4 not-prose mt-6">

<a href="DEVELOPMENT-ROADMAP.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-2 text-sm font-bold">📋</div>
  <h3 class="text-sm font-semibold text-kaede-text">Development Roadmap</h3>
  <p class="text-xs text-kaede-muted mt-1">Master development plan: 3-phase implementation, timeline, upstream contribution strategy.</p>
</a>

<a href="CONTRIBUTION-GUIDE.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-success/20 text-kaede-success mb-2 text-sm font-bold">🤝</div>
  <h3 class="text-sm font-semibold text-kaede-text">Contribution Guide</h3>
  <p class="text-xs text-kaede-muted mt-1">Panduan upstream contribution ke TRELLO MCP: PR workflow, testing, communication templates.</p>
</a>

<a href="FEATURE-SPECIFICATION.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-warning/20 text-kaede-warning mb-2 text-sm font-bold">⚙️</div>
  <h3 class="text-sm font-semibold text-kaede-text">Feature Specification</h3>
  <p class="text-xs text-kaede-muted mt-1">Detailed specs: attachments, copy card, checklist enhancements, advanced features.</p>
</a>

<a href="kaede-architecture.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-danger/20 text-kaede-danger mb-2 text-sm font-bold">🏗️</div>
  <h3 class="text-sm font-semibold text-kaede-text">Architecture</h3>
  <p class="text-xs text-kaede-muted mt-1">Arsitektur KAEDE, concern separation, orchestration layer, ecosystem overview.</p>
</a>

</div>

## Tentang Trello MCP

**MCP (Model Context Protocol)** adalah standar terbuka yang memungkinkan AI Agent berkomunikasi dengan tools eksternal. **Trello MCP Server** ([delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello)) menyediakan jembatan antara Trello API dan AI Agent — sehingga agent bisa membaca, membuat, dan mengupdate kartu Trello langsung dari percakapan.

Server ini menangani rate limiting (300 req/10s per API key, 100 req/10s per token), validasi input, dan error handling secara otomatis.

## Akses Cepat

- [Trello Power-Up Admin](https://trello.com/power-ups/admin) — Buat dan kelola Power-Up
- [GitHub: delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) — Repositori utama
- [npm: @delorenj/mcp-server-trello](https://www.npmjs.com/package/@delorenj/mcp-server-trello) — Package di npm
