# Playbook Template

> **🌐 Help Wanted — English version coming soon.**
>
> The Indonesian version is available at [`docs/id/playbook-template.md`](id/playbook-template.html).
>
> [Contribute an English translation →](https://github.com/konxc/kaede-powerup/issues/new?template=translation.yml)

## Duplicate Prevention

### Card Naming Convention
Gunakan prefix untuk menghindari duplikasi nama card antar sprint/board:

- `[FEAT]` — Fitur baru (e.g., `[FEAT] Login with Google`)
- `[FIX]` — Bug fix (e.g., `[FIX] Null pointer on empty state`)
- `[CHORE]` — Tugas maintenance (e.g., `[CHORE] Update dependencies`)
- `[DOCS]` — Dokumentasi (e.g., `[DOCS] API endpoint reference`)
- `[TEST]` — Testing (e.g., `[TEST] E2E login flow`)
- `[REFACTOR]` — Refaktor kode (e.g., `[REFACTOR] Extract payment module`)

### Duplicate Policy
- `on_duplicate`: `warn` (default) — tampilkan warning, izinkan lanjut
- `cross_board_allowed`: `false` (default) — card dengan nama sama di board berbeda akan di-info
- `block_on_exact_match`: `false` — jika `true`, card duplikat di list yang sama akan di-block

### Pre-Flight Workflow
Setiap pembuatan card/label baru WAJIB melalui pre-flight check:
1. Ambil snapshot list & card via `mcp.trello`
2. Sertakan `boards` parameter ke `mcp.kaede.generate_plan`
3. Jika ada `pre_flight_check` dengan `blockers`, tanya user sebelum lanjut
4. Jika hanya `warnings`, informasikan user dan lanjutkan jika disetujui

### Integrasi dengan Tools KAEDE
- `find_card` — Cari card by name (exact + similar)
- `detect_duplicates` — Scan semua board untuk duplikat
- `validate_context` — Validasi sebelum create (nama, list, cross-board)
- `archive_duplicates` — Generate plan archive untuk duplikat
- `generate_plan` (dengan `boards`) — Auto pre-flight untuk create_card/create_label
