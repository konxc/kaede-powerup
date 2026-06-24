# Setup Trello MCP Server

**MCP Server Trello** ([delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello)) adalah server open source yang menyediakan jembatan antara Trello API dan AI Agent melalui protokol MCP. Server ini menangani rate limiting, validasi input, dan error handling secara otomatis.

<div class="not-prose p-4 rounded-xl bg-kaede-success/10 border border-kaede-success/20 mb-6">

**Prasyarat**

- Node.js 18+ atau **Bun** v1.0+ (direkomendasikan — 2.8-4.4x lebih cepat)
- Trello API Key & Token — [lihat panduan](api-key.html)

</div>

## Installasi

### Opsi A: Menggunakan Bunx (Termudah)

```bash
bunx @delorenj/mcp-server-trello
```

### Opsi B: Clone Repositori

```bash
git clone https://github.com/delorenj/mcp-server-trello.git
cd mcp-server-trello
bun install
bun run build
```

## Environment Variables

Buat file `.env` di direktori server:

```env
# Required: Trello API credentials
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token

# Optional: Default board ID (bisa diubah via set_active_board)
TRELLO_BOARD_ID=your-board-id

# Optional: Initial workspace ID
TRELLO_WORKSPACE_ID=your-workspace-id

# Optional: Proxy untuk corporate network
https_proxy=http://your-proxy:8080

# Optional: Batasi akses ke workspace tertentu
TRELLO_ALLOWED_WORKSPACES=workspace-id-1,workspace-id-2
```

## Konfigurasi untuk OpenCode / Claude Desktop

Tambahkan MCP server ke file konfigurasi MCP client-mu:

### Contoh untuk Claude Desktop

```json
{
  "mcpServers": {
    "trello": {
      "command": "bunx",
      "args": ["@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      }
    }
  }
}
```

### Contoh untuk OpenCode

```json
{
  "mcp": {
    "trello": {
      "type": "local",
      "command": "bunx",
      "args": ["@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      },
      "enabled": true
    }
  }
}
```

## Verifikasi Setup

Untuk memastikan server berjalan dengan benar:

1. Jalankan server: `bunx @delorenj/mcp-server-trello`
2. Buka MCP client (OpenCode / Claude Desktop)
3. Coba perintah: *"List all my Trello boards"*
4. Jika response muncul, setup berhasil!

## Manajemen Board & Workspace

Server mendukung multiple board dan workspace. Kamu bisa:

- **Dynamic board selection:** Gunakan `set_active_board` untuk berganti board tanpa restart
- **Multi-board support:** Semua method menerima parameter `boardId` opsional
- **Workspace restriction:** Batasi akses AI ke workspace tertentu via `TRELLO_ALLOWED_WORKSPACES`

Konfigurasi yang sudah dipilih akan persist di `~/.trello-mcp/config.json`.

## Rate Limiting

Server menerapkan **token bucket algorithm** untuk mematuhi batas API Trello:

- 300 requests per 10 detik per API key
- 100 requests per 10 detik per token
- Request akan di-queue jika limit tercapai

## Troubleshooting

<div class="not-prose space-y-2 mt-3">

<div class="p-3 rounded-lg bg-kaede-surface border border-kaede-border">
  <p class="text-xs font-medium text-kaede-text">Error: <code>Suspicious link removed</code> pada board URL</p>
  <p class="text-xs text-kaede-muted mt-1">Abaikan — ini adalah false positive dari Trello. Board ID tetap bisa digunakan.</p>
</div>

<div class="p-3 rounded-lg bg-kaede-surface border border-kaede-border">
  <p class="text-xs font-medium text-kaede-text">Error: <code>Authentication failed</code></p>
  <p class="text-xs text-kaede-muted mt-1">Pastikan API Key dan Token benar. Generate ulang token jika perlu.</p>
</div>

<div class="p-3 rounded-lg bg-kaede-surface border border-kaede-border">
  <p class="text-xs font-medium text-kaede-text">Error: <code>Rate limit exceeded</code></p>
  <p class="text-xs text-kaede-muted mt-1">Tunggu beberapa detik — server akan meng-queue request secara otomatis.</p>
</div>

</div>

## Langkah Selanjutnya

Jika server sudah berjalan, lanjut ke panduan [Integrasi OpenCode](opencode.html) untuk mengonfigurasi AI Agent-mu.
