# Mendapatkan Trello API Key & Token

Untuk menghubungkan AI Agent dengan Trello, kamu memerlukan dua kredensial: **API Key** dan **Token**. Keduanya didapatkan melalui Trello Power-Up Admin.

<div class="not-prose p-4 rounded-xl bg-kaede-warning/10 border border-kaede-warning/20 mb-6">

**Prasyarat**

- Akun Trello (gratis)
- Akses ke [Trello Power-Up Admin](https://trello.com/power-ups/admin)

</div>

## Metode 1: Melalui Power-Up Admin (Direkomendasikan)

<div class="not-prose space-y-4">

<div class="flex items-start gap-3">
  <span class="step-num">1</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Buka Trello Power-Up Admin</p>
    <p class="text-xs text-kaede-muted">Kunjungi <a href="https://trello.com/power-ups/admin" target="_blank" class="text-kaede-primary underline">trello.com/power-ups/admin</a> dan login dengan akun Trello kamu.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">2</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Buat Power-Up Baru</p>
    <p class="text-xs text-kaede-muted">Klik tombol <strong class="text-kaede-text">New</strong>. Isi formulir:</p>
    <ul class="text-xs text-kaede-muted mt-1 space-y-0.5">
      <li><strong class="text-kaede-text">Integration Name:</strong> <code>KAEDE - Tim Koneksi</code></li>
      <li><strong class="text-kaede-text">Email:</strong> Email tim Koneksi</li>
      <li><strong class="text-kaede-text">Support:</strong> URL repositori atau email</li>
      <li><strong class="text-kaede-text">Name:</strong> Nama Power-Up</li>
    </ul>
    <p class="text-xs text-kaede-muted mt-1">Pilih Trello instance yang sesuai, lalu klik <strong class="text-kaede-text">Create</strong>.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">3</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Generate API Key</p>
    <p class="text-xs text-kaede-muted">Di halaman Power-Up yang sudah dibuat, navigasi ke tab <strong class="text-kaede-text">API Key</strong>. Klik tombol <strong class="text-kaede-text">Generate</strong> untuk mendapatkan API Key. <strong class="text-kaede-text">Salin API Key</strong> — kamu akan membutuhkannya nanti.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">4</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Generate Token</p>
    <p class="text-xs text-kaede-muted">Di halaman yang sama, cari link <strong class="text-kaede-text">manually generate a Token</strong> (biasanya di samping deskripsi API Key). Klik link tersebut.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">5</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Authorize</p>
    <p class="text-xs text-kaede-muted">Halaman Trello authorization akan terbuka. Klik tombol <strong class="text-kaede-text">Allow</strong> untuk memberikan akses ke akun Trello kamu.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">6</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Salin Token</p>
    <p class="text-xs text-kaede-muted">Setelah di-allow, kamu akan melihat string Token. <strong class="text-kaede-text">Salin token tersebut</strong> dan simpan bersama API Key.</p>
  </div>
</div>

</div>

## Metode 2: Cara Cepat

Jika sudah punya Power-Up, langsung buka:

1. Kunjungi [trello.com/app-key](https://trello.com/app-key)
2. Salin **API Key** dari halaman tersebut
3. Klik link **Token** untuk generate token
4. Klik **Allow** dan salin token yang muncul

## Yang Perlu Diingat

- **API Key** dan **Token** bersifat rahasia — jangan commit ke git atau bagikan di publik
- Token bisa di-revoke kapan saja dari halaman Power-Up Admin
- Jika token expired, ulangi langkah generate token
- Simpan kredensial di `.env` file atau `~/.config/dev/*.env`

<div class="not-prose p-4 rounded-xl bg-kaede-surface border border-kaede-border mt-6">

**Contoh .env**

<div class="code-block">
<span class="cm"># Trello API credentials</span><br/>
TRELLO_API_KEY=<span class="str">your-api-key-here</span><br/>
TRELLO_TOKEN=<span class="str">your-token-here</span>
</div>

</div>

## Langkah Selanjutnya

Setelah mendapatkan API Key dan Token, lanjutkan ke panduan [Setup MCP Server](mcp-server.html) untuk mengonfigurasi server Trello MCP.
