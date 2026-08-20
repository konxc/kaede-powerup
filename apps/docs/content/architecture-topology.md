# Arsitektur & Topologi Deploy — Mode 1 vs Mode 2

Dokumen ini mendefinisikan **disiplin arsitektur** untuk semua mode deploy KAEDE. Tujuannya satu: tidak ada dua implementasi yang saling bertentangan — satu kebenaran di lokal, satu permukaan yang aman & stateless di Netlify.

> Berlaku untuk: Power-Up (`public/`), Netlify Function (`netlify/functions/trello-proxy.mjs`), HTTP bridge lokal (`src/api-server.ts`).

---

## 1. Tiga Mode yang Pernah Ada (dan Nasibnya)

| # | Mode | Cara Kerja | Status |
|---|---|---|---|
| **1** | **Full Orchestrator Lokal** — `kaede start` | Browser ↔ HTTP bridge `http://localhost:3456` ↔ `src/kaede-mcp-server.ts` (45 tools, pakai `secrets.env` global) | ✅ **Primer untuk pengguna internal** |
| **2** | **Stateless Serverless (OAuth per-user)** — `trello-proxy.mjs` | Browser (Power-Up di Netlify) ↔ `/.netlify/functions/trello-proxy` ↔ Trello REST. Tiap user authorize akunnya SENDIRI (token per-user, member-private) → proxy validasi server-side (`/1/tokens/{token}`) → operasi atas nama user tsb | ✅ **Wajib untuk pihak ke-3 / public** |
| **3** | **Browser-Direct REST** | Browser ↔ `api.trello.com` pakai key/token dari Trello shared storage | ❌ **Dihapus** (Fase 3) — key/token tidak lagi disimpan di shared storage |

Aturan emas:

1. **Orkestrasi = hanya lokal.** `generate_plan`, `execute_plan`, `undo_last_plan`, `bundle_context`, `load_templates`, history, dan semua tool git/GitHub **tidak pernah** diekspos di serverless.
2. **Serverless = lapisan tipis.** Proxy hanya mem-forward operasi sederhana ke Trello REST dengan **token per-user** (path publik) atau **token service-account** (path integrator via `X-KAEDE-Key`) — kredensial akun user browser tidak pernah dipakai bersama.
3. **Kredensial tidak pernah di browser.** Tidak ada `key`/`token`/`KAEDE_API_KEY` service-account di `localStorage` atau Trello shared storage. Token yang ada di browser hanyalah token OAuth **per-user** (scope member-private, hanya data milik user tersebut).

---

## 2. Diagram Topologi

```
                     ┌────────────────────────────────────────────┐
                     │            Power-Up (Trello iframe)         │
                     │   board.html · card.html · mcp.html         │
                     │         └─ js/mcp-client.js                 │
                     │   detectBase(): localhost → lokal           │
                     │                lainnya → proxy              │
                     │   Bearer: token per-user (member-private)   │
                     └───────────────┬───────────────┬─────────────┘
                                     │               │
                       MODE 1        │               │  MODE 2
                   (lokal/dev)       │               │  (Netlify / public)
                                     ▼               ▼
                    ┌─────────────────────┐  ┌──────────────────────────┐
                    │ api-server.ts :3456 │  │ trello-proxy.mjs (Fn)     │
                    │  health · tool · mcp │  │  health · tool · mcp      │
                    │  └─ 45 tools (penuh) │  │  └─ subset A+B+C (aman)   │
                    │     + git + history   │  │  + validasi /1/tokens/{t}│
                    │     + bundle_context  │  │  + X-KAEDE-Key (integr.) │
                    └──────────┬──────────┘  └──────────┬───────────────┘
                               │                        │ env: TRELLO_API_KEY
                               │ secrets.env            │      TRELLO_TOKEN
                               ▼                        ▼      KAEDE_API_KEY
                          Trello REST              Trello REST
                         (kredensial server)      (token per-user / service)
```

### Pemilihan mode otomatis (`mcp-client.js`)

```js
function detectBase(host) {
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3456';
  return '/.netlify/functions/trello-proxy';
}
```

- Host `localhost` → **Mode 1** (full orchestrator, 45 tools).
- Host lain (Netlify domain, custom domain) → **Mode 2** (proxy, subset aman).
- Override: `apiBase` di Trello shared storage (dikelola `auth.html`) — hanya untuk pengguna internal.

---

## 3. Capability Matrix — 45 Tools

Klasifikasi tool `mcp.kaede` menjadi 4 kategori. **Hanya kategori A + B + C yang boleh ada di serverless.** Kategori D **wajib lokal**.

| Kategori | Definisi | Tools | Proxy Netlify |
|---|---|---|---|
| **A — Pure (context/planning)** | Tanpa akses Trello; murni komputasi atas input | `parse_playbook`, `generate_plan`*, `enforce_playbook`, `detect_duplicates`, `validate_context`, `generate_template`, `resolve_board`, `resolve_context`, `find_card`, `parse_acceptance_criteria`, `parse_card_comments`, `check_label_consistency`, `bundle_context`†, `load_templates`†, `status`† | ✅ (tanpa auth) kecuali `generate_plan` (stub "unsupported") dan † (butuh filesystem lokal) |
| **B — Baca Trello (read)** | Membaca data Trello **atas nama token per-user** | `list_boards`, `list_workspaces`, `search_boards`, `search_cards`, `get_lists`, `get_cards_by_list_id`, `get_card`, `get_board_members`, `get_board_labels`, `get_my_cards`, `generate_sprint_report` | ✅ (wajib auth) |
| **C — Tulis terkendali (write)** | Mutasi Trello **atas nama token per-user** | `create_card`, `create_list`, `create_label`, `move_card`, `add_comment`, `add_label_to_card`*, `remove_label_from_card`* | ✅ (wajib auth) |
| **D — Local-only** | Butuh filesystem, proses, state, atau repo lokal | `execute_plan`, `undo_last_plan`, `batch_update_cards`, `archive_duplicates`, `get_execution_history`, `clear_execution_history`, `bundle_context`, `load_templates`, `status`, `get_git_status`, `get_git_branches`, `get_git_log`, `get_commit_diff`, `get_git_stashes`, `scan_pull_requests`, `get_pr_details`, `search_commits`, `get_commit`, `get_repo_info`, `detect_auth_status`, `get_current_user`, `review_card_implementation` | ❌ (stub / 404) |

\* `generate_plan` adalah tool kategori A yang **di-stub** di proxy (mengembalikan "unsupported, use kaede start") karena orkestrasi multi-step bukan tanggung jawab lapisan stateless. `add_label_to_card` / `remove_label_from_card` ditambahkan di proxy untuk kebutuhan sync label `card.html` (kategori C).

† `bundle_context`, `load_templates`, `status` mengakses path filesystem lokal → tidak relevan di serverless; dimasukkan kategori D untuk keperluan guard.

### Sisi `mcp.trello` (upstream + lib)

Tools eksekusi mentah (44 tool upstream + fallback lib) hanya dieksekusi oleh **orchestrator lokal** (Mode 1). Proxy Netlify **tidak** mengekspos tool upstream secara mentah — ia hanya menyediakan intent terkendali yang di-whitelist (lihat `INTENT_HANDLERS` di `trello-proxy.mjs`).

---

## 4. Aturan Kebijakan Auth Proxy (Mode 2 — Per-User OAuth)

| Operasi | Kategori | Header yang dibutuhkan |
|---|---|---|
| Pure tools (parse/enforce/detect_duplicates) | A | tanpa auth (murni komputasi, tidak sentuh Trello) |
| Semua intent Trello (baca A/B + tulis C) | B + C | `Authorization: Bearer <token-per-user>` **atau** `X-KAEDE-Key: <KAEDE_API_KEY>` (integrator) |
| `generate_sprint_report` (tool, sentuh Trello) | B | sama seperti di atas |

- **Path publik (Power-Up):** setiap user authorize akun Trello-nya sendiri via popup OAuth (lihat `auth.html`). Token per-user disimpan di Trello shared storage scope **member-private** (`kaede_token`) dan dikirim sebagai `Authorization: Bearer <token>`. Proxy memvalidasi token **server-side** via `GET /1/tokens/{token}?key=<consumerKey>`, lalu menjalankan panggilan Trello **atas nama user itu** → least-privilege: user hanya melihat/mengubah data miliknya sendiri. Proxy tetap stateless (tidak menyimpan token apa pun).
- **Path integrator (server-to-server):** aplikasi pihak ke-3 memegang `KAEDE_API_KEY` (env server, bukan browser) dan mengirim `X-KAEDE-Key`; proxy memakai token service-account (`TRELLO_TOKEN`) atas nama akun service KAEDE. **Wajib** set `KAEDE_API_KEY` untuk mengaktifkan path ini.
- **Tanpa salah satu auth** (atau token invalid) → `401`. `KAEDE_API_KEY`/`TRELLO_TOKEN` tidak dikonfigurasi pada path yang membutuhkannya → `503` fail-closed.
- **Tidak ada lagi "baca terbuka".** Endpoint proxy publik tidak mengekspos data org ke siapa pun tanpa autentikasi. Data yang bisa diakses dibatasi oleh scope token masing-masing user.
- CORS mengizinkan header `Content-Type`, `Authorization`, dan `X-KAEDE-Key`.
- **Allowed origins (Power-Up Admin):** tambahkan origin Netlify (mis. `https://*.netlify.app`) dan `http://localhost:*` agar popup OAuth `client.js` dapat kembali (redirect) ke aplikasi. Consumer key (`TRELLO_API_KEY`) bersifat publik untuk client-side app; **secret konsumen** tidak pernah digunakan di browser.

---

## 5. Integrasi Pihak Ke-3 (Pola OpenHive)

Untuk produk eksternal yang memanggil KAEDE (misal portal internal, aplikasi web pihak ke-3):

- Panggil endpoint proxy `/.netlify/functions/trello-proxy` (Mode 2), **bukan** `api.trello.com` langsung.
- Server aplikasi menyimpan `KAEDE_API_KEY` + `KAEDE_API_URL` di **env server**, tidak pernah di browser.
- Aplikasi melakukan operasi atas nama **akun service KAEDE** dengan header `X-KAEDE-Key` (kredensial Trello milik server), atau meneruskan token per-user end-user jika aplikasi sudah punya alur OAuth sendiri.
- Referensi pola implementasi: repositori OpenHive (SvelteKit 5 + Better Auth) — server-side credential bridge; integrasi penuh dijadwalkan di fase berikutnya.

Kontrak endpoint yang diekspos (lihat dokumentasi tools): `POST /` (health), `POST /api/health`, `POST /api/tool` (tool ter-whitelist), `POST /api/mcp` (intent ter-whitelist).

---

## 6. Checklist Implementasi (Agar Tidak Drift)

- [x] Tool kategori D tidak pernah muncul di `INTENT_HANDLERS` / `handleTool` proxy (dijaga tes `test/netlify-proxy.test.js`).
- [x] Semua intent Trello di proxy lewat `resolveAuth()` (Bearer per-user atau X-KAEDE-Key integrator) — tidak ada "baca terbuka".
- [x] Token service-account tidak pernah ada di `public/*` / `mcp-client.js` / shared storage; yang ada di browser hanyalah token per-user (member-private).
- [x] `auth.html` menulis `kaede_token` hanya ke scope **member-private** (bukan board-shared).
- [x] Parity: output `parse_playbook` & `enforce_playbook` proxy ≡ implementasi `src/` (dijaga tes).
- [x] `dashboard.html` hanya untuk pengembangan lokal (bukan bagian dari Power-Up Netlify).

---

*Dokumen ini adalah acuan disiplin arsitektur KAEDE. Pelanggaran (mis. menambah tool kategori D ke proxy) harus disertai pembaruan dokumen ini dan tes terkait.*
