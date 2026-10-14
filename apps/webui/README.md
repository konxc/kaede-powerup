# KAEDE Workspace PoC

PoC ini membuktikan login GitHub, workspace owner-only, instalasi GitHub App, dan pemilihan repo sumber. Login OAuth hanya mengenali pengguna; repo privat hanya dapat dilihat setelah GitHub App dipasang pada akun/organisasi dan repo dipilih.

## Setup Lokal

1. Buat GitHub OAuth App dengan callback `http://localhost:3001/api/auth/callback/github`.
2. Buat GitHub App dengan homepage `http://localhost:3001`, setup URL `http://localhost:3001/api/github/callback`, dan permission **Contents: Read-only**. Metadata read-only diberikan GitHub secara otomatis.
3. Salin `.env.example` ke `.env.local`, lalu isi OAuth client ID/secret, `AUTH_SECRET`, GitHub App ID, slug, dan private key. OAuth client ID dan GitHub App ID adalah nilai yang berbeda.
4. Instal dependency dan migrasikan database:

```bash
bun install
bun run --filter @kaede/webui db:migrate
bun run dev:webui
```

Jika memakai Turso, isi `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`. Tanpa keduanya, aplikasi memakai `file:local.db`.

## Alur PoC

1. Buka `http://localhost:3001` dan sign in dengan GitHub.
2. Buat workspace `SMA UII Yogyakarta`.
3. Hubungkan GitHub App ke organisasi SMA UII-Yogyakarta. Pada halaman GitHub, pilih akses ke repo yang dibutuhkan saja.
4. Kembali ke workspace dan pilih source type `Workspace playbook`, `Project repository`, atau `Owner profile / knowledge`.
5. Untuk `sandikodev/sandikodev`, instal GitHub App pada akun personal `sandikodev` juga, lalu hubungkan instalasi itu dari workspace yang sama.

App private key dan installation token hanya dipakai server. KAEDE tidak meminta Personal Access Token dan tidak memberikan token GitHub kepada browser.

## Batas PoC Saat Ini

- Repo picker membaca metadata repo yang tersedia pada instalasi App dan menyimpan pilihan repo per workspace.
- Isi repo belum diambil atau diindeks untuk context bundle/MCP; pembacaan playbook/OpenKB dan konsumsi oleh agent adalah tahap implementasi berikutnya.
- Workspace masih owner-only; undangan anggota dan integrasi Slack/Telegram/WhatsApp belum termasuk.

Deploy ke Vercel setelah mengatur environment variables yang sama dan mengganti callback/setup URL dengan domain deployment.
