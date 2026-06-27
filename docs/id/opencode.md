# Integrasi Trello MCP dengan OpenCode

Setelah Trello MCP server berjalan, langkah selanjutnya adalah menghubungkannya ke **OpenCode** — AI coding agent yang digunakan tim Koneksi. Dengan integrasi ini, AI Agent bisa membaca dan menulis Trello langsung dari percakapan.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Prasyarat**

- Trello MCP Server sudah terinstall — [lihat panduan](mcp-server.html)
- Trello API Key & Token — [lihat panduan](api-key.html)
- OpenCode sudah terinstall di environment kerja

</div>

## 1. Tambahkan MCP Server ke OpenCode

Edit file `.opencode/opencode.json` di repositori kamu:

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

<div class="not-prose p-3 rounded-lg bg-kaede-surface border border-kaede-border mt-2">

**Jangan hardcode credentials!** Di environment production, gunakan environment variable dari `~/.config/dev/*.env` sebagai pengganti nilai langsung.

</div>

## 2. Verifikasi Koneksi

1. Restart OpenCode session
2. Coba perintah:

    ```
    Coba list semua board Trello yang saya punya.
    ```

3. Jika OpenCode meresponse dengan daftar board, koneksi berhasil!

## 3. Contoh Penggunaan

Berikut contoh percakapan dengan AI Agent setelah integrasi:

<div class="not-prose glass rounded-xl p-4 space-y-3">

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-success px-1.5 py-0.5 rounded bg-kaede-success/20 shrink-0 mt-0.5">You</span>
  <p class="text-xs text-kaede-muted">"Apa task yang sedang dalam status 'In Progress' di board project saya?"</p>
</div>

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-primary px-1.5 py-0.5 rounded bg-kaede-primary/20 shrink-0 mt-0.5">AI</span>
  <p class="text-xs text-kaede-muted">"Ada 3 kartu di list 'In Progress': 'Fix login bug' (dimulai 24 Juni), 'Update dashboard' (due 28 Juni), 'Integrasi API payment' (due 30 Juni)."</p>
</div>

<div class="border-t border-kaede-border/50 pt-2 flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-success px-1.5 py-0.5 rounded bg-kaede-success/20 shrink-0 mt-0.5">You</span>
  <p class="text-xs text-kaede-muted">"Buat kartu baru 'Setup CI/CD pipeline' di list 'To Do' dengan label development."</p>
</div>

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-primary px-1.5 py-0.5 rounded bg-kaede-primary/20 shrink-0 mt-0.5">AI</span>
  <p class="text-xs text-kaede-muted">"Kartu 'Setup CI/CD pipeline' sudah dibuat di list 'To Do' dengan label development."</p>
</div>

</div>

## 4. Mengatur Board Aktif

Sebelum memulai, set board yang akan dikerjakan:

    Set active board saya ke board "Sprint 24".

Atau jika tahu Board ID:

    Gunakan tool set_active_board dengan boardId "abc123xyz".

## 5. Best Practices

- **Gunakan board aktif:** Set active board di awal sesi agar konteks jelas
- **Periksa dulu:** Minta AI untuk "List boards" sebelum memulai
- **Labels:** Gunakan label ID dari Trello (bisa dicek via tool `get_board_custom_fields`)
- **Workspace restriction:** Aktifkan `TRELLO_ALLOWED_WORKSPACES` untuk keamanan

## 6. Keamanan Credentials

Ikuti aturan berikut untuk menjaga keamanan:

- Jangan commit `.env` atau credentials ke git
- Gunakan `~/.config/dev/*.env` untuk menyimpan secrets
- Di OpenCode, gunakan referensi environment variable, bukan nilai hardcode
- Rotate token secara berkala

## Langkah Selanjutnya

Setelah integrasi berhasil, lihat [Referensi Tools](tools.html) untuk daftar lengkap semua tools yang tersedia.
