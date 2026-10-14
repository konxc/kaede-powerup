# Instalasi

KAEDE dipasang sebagai **CLI global** plus **dua MCP server** (`mcp.trello` dan `mcp.kaede`) yang didaftarkan ke konfigurasi OpenCode Anda. Installer menyalin **seluruh** pohon runtime — tidak ada komponen yang dipangkas.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Prasyarat**

- [Bun](https://bun.sh) v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- Git
- OpenCode (AI coding agent yang memakai MCP server)

</div>

## 1. Instalasi Cepat (Linux / macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash
```

Skrip akan:

1. Memeriksa Bun + Git.
2. Meng-clone repo ke `~/.kaede` (atau `$KAEDE_DIR`).
3. Menjalankan `bun install`.
4. Menjalankan `bun scripts/kaede.ts install` → build kedua MCP server, menyalin seluruh source tree ke `~/.kaede`, mendaftarkan MCP ke `~/.config/opencode/opencode.json`, dan me-link command `kaede` via `bun link`.

### Windows (PowerShell)

```powershell
iwr -Uri https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.ps1 | iex
```

## 2. Instalasi Manual

```bash
git clone https://github.com/konxc/kaede-powerup ~/.kaede
cd ~/.kaede
bun install
bun scripts/kaede.ts install
```

`kaede install` melakukan hal berikut secara berurutan:

| Langkah | Fungsi |
|---|---|
| **Copy tree** | Menyalin seluruh source tree (scripts, `packages/`, `apps/`, docs) ke `~/.kaede` — tanpa memangkas komponen. Hanya mengecualikan `node_modules`, `.git`, dan artefak build. |
| **Build MCP** | `bun build` untuk `packages/kaede-trello/src/mcp-server.ts` → `~/.kaede/dist/mcp-server.js` dan `packages/kaede/src/kaede-mcp-server.ts` → `~/.kaede/dist/kaede-mcp-server.js`. Gagal keras jika source tidak ada. |
| **Register MCP** | Menulis `mcp.trello` + `mcp.kaede` ke `~/.config/opencode/opencode.json`. |
| **Link** | `bun link` dari `~/.kaede` → `~/.bun/bin/kaede`. |

## 3. Pastikan `kaede` Ada Di PATH

`bun link` menaruh binary di `~/.bun/bin`. Tambahkan sekali ke profil shell Anda:

```bash
# ~/.bashrc atau ~/.zshrc
export PATH="$HOME/.bun/bin:$PATH"
```

Muat ulang: `source ~/.bashrc` (atau buka shell baru), lalu verifikasi:

```bash
kaede --help
```

## 4. Autentikasi Trello

```bash
kaede setup          # onboarding lengkap: OAuth + konfigurasi MCP + verifikasi
# atau bertahap
kaede auth login     # membuka OAuth di browser
kaede auth login --manual   # tempel token yang sudah ada (server / tanpa browser)
```

Kredensial disimpan di `~/.config/kaede/secrets.env` dan **di-ignore git**.

## 5. Verifikasi

```bash
kaede status         # ringkasan konfigurasi
kaede status --mcp   # tes koneksi MCP langsung (menampilkan board)
```

Contoh keluaran:

```text
  Trello API Key  ✓ configured
  Global secrets  ✓  /home/dev/.config/kaede/secrets.env
  MCP configured  ✓  /home/dev/.config/opencode/opencode.json (global)
  MCP server      ✓ responding (7 boards)
```

## 6. Pakai KAEDE Di Sebuah Project

```bash
cd ~/projects/my-app
kaede init . --name "My App" --tech "Bun" --db "Postgres"
```

Perintah ini menulis `.opencode/opencode.json` yang menunjuk ke `~/.kaede/dist/*.js`, sehingga project tetap berjalan walau source checkout dipindah.

Lalu jalankan OpenCode di dalam project — kedua MCP server otomatis dimuat.

---

## Instalasi Di Server (Agentic Coding)

Alur yang direkomendasikan untuk server Linux headless (VPS, dev box, CI runner).

### Prasyarat server

```bash
# Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Git
sudo apt-get update && sudo apt-get install -y git curl   # Debian/Ubuntu
```

Tambahkan `export PATH="$HOME/.bun/bin:$PATH"` ke `~/.bashrc` agar permanen lintas sesi SSH.

### Install KAEDE

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash
source ~/.bashrc
kaede --help
```

### Autentikasi tanpa browser

Server tidak punya browser untuk OAuth. Gunakan mode token manual:

1. Di laptop, buka [halaman API key Trello](https://trello.com/power-ups/admin) dan buat **API Key** + **Token**.
2. Di server:

```bash
kaede auth login --manual     # tempel API Key + Token saat diminta
# atau tulis file langsung:
mkdir -p ~/.config/kaede
cat > ~/.config/kaede/secrets.env <<'EOF'
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token
EOF
chmod 600 ~/.config/kaede/secrets.env
```

3. Verifikasi:

```bash
kaede status --mcp
```

### Arahkan OpenCode ke MCP server

Instalasi global sudah mendaftarkan kedua server di `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "trello": { "type": "local", "command": ["bun", "/home/USER/.kaede/dist/mcp-server.js"], "enabled": true, "timeout": 30000 },
    "kaede":  { "type": "local", "command": ["bun", "/home/USER/.kaede/dist/kaede-mcp-server.js"], "enabled": true, "timeout": 60000 }
  }
}
```

Untuk setup **per-project**, jalankan `kaede init .` di dalam repo.

### Banyak project / user

- Tiap project bisa memanggil `kaede init .` untuk mendapat `.opencode/opencode.json` sendiri.
- Binary MCP dipakai bersama di `~/.kaede/dist`, jadi project tetap ringan.
- Untuk mesin CI bersama, set `KAEDE_DIR=/opt/kaede` saat install agar tree tidak bergantung pada satu home directory.

### Menjaga proses

KAEDE adalah CLI + MCP server berbasis stdio — **bukan** daemon background. OpenCode men-spawn MCP server sesuai kebutuhan. Tidak ada yang perlu dijaga hidup.

---

## Update

```bash
# Jika dipasang via install.sh ke ~/.kaede:
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash -s -- --update

# Atau dari direktori install:
cd ~/.kaede && git pull --rebase && bun install && bun scripts/kaede.ts install
```

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash -s -- --uninstall
```

Perintah ini melepas link binary dan menghapus `~/.kaede`. `~/.config/kaede` (kredensial) sengaja dipertahankan demi keamanan.

## Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `kaede: command not found` | `~/.bun/bin` tidak ada di PATH | `export PATH="$HOME/.bun/bin:$PATH"` |
| `MCP server exited with code 1` | Path usang di `opencode.json` | Jalankan ulang `kaede install` |
| `Cannot find module .../packages/kaede/src/...` | Source tree tidak tersalin | Jalankan ulang `kaede install` (menyalin seluruh tree) |
| Build gagal: `source not found` | Layout repo berubah | `git -C ~/.kaede pull --rebase` lalu `kaede install` |
| OAuth tak bisa buka browser | Server headless | `kaede auth login --manual` |
| Board salah/terlalu lama | Kredensial ter-cache | `kaede auth logout && kaede auth login` |

## Selanjutnya

- [API Key & Token](api-key.html) — cara mendapatkan kredensial Trello
- [MCP Server](mcp-server.html) — seluk-beluk server
- [Integrasi OpenCode](opencode.html) — penggunaan MCP di OpenCode
- [Referensi Tools](tools.html) — daftar tool lengkap (47 Trello + 45 orchestrator)
