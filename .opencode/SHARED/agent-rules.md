# Agent Rules — KAEDE

## Aturan Umum
- Gunakan bahasa Indonesia
- Jawab ringkas, langsung ke titik
- Ikuti pattern kode yang sudah ada (Tailwind v4, Bun, Vanilla JS)

## Kode & Format
- HTML: semantic HTML5, proper meta tags
- CSS: Tailwind v4 utility classes, custom theme via `@theme` di `src/style.css`
- JS: Vanilla JS, no framework, Trello Power-Up client library (t-connect)
- Markdown (docs): Gunakan frontmatter untuk metadata

## Keamanan
- Jangan commit API key atau token Trello ke git
- Jangan hardcode credentials di HTML/JS
- Gunakan environment variable via Netlify

## Build & Deploy
- `bun run dev` — development
- `bun run build` — production CSS
- Push ke main → Netlify auto-deploy
- Dokumentasi di docs/*.md → auto-build ke gh-pages via GitHub Actions

## Board Selection Workflow (WAJIB)
Setiap kali user menyebut nama/deskripsi board (misal: "board backend", "project X"), WAJIB lakukan:

1. **`resolve_board(description)`** via `mcp.kaede` → dapet keywords
2. **`search_boards(query)`** atau **`list_boards(nameFilter)`** via `mcp.trello` → cari board terbaik
3. **`list_boards` tanpa filter hanya sebagai fallback** jika langkah 2 gak dapet hasil
4. **`bundle_context(playbookPath, openkbPath, opencodePath)`** — pastikan path playbook sesuai board yang dipilih

Validasi: Board description harus cocok dengan konteks yang diminta user. Jika ragu, tanya user.

## `bundle_context` — Path Rules
- `playbookPath` bisa path ke file `.md` ATAU direktori berisi file `.md`
- Jika direktori, semua `.md` akan digabung otomatis
- `openkbPath` dan `opencodePath` harus path ke direktori

## Pre-Flight Duplicate Check (WAJIB)
Sebelum membuat card/label baru (`create_card` / `create_label`), WAJIB lakukan pre-flight:

1. Ambil snapshot board via `mcp.trello`:
   - `get_board_lists(boardId)` → dapatkan semua list
   - `get_cards_by_list_id(listId, boardId)` untuk setiap list → dapatkan semua card
2. Susun `boards` array dengan format:
   ```json
   [{ "boardId": "...", "boardName": "...", "lists": [{ "listId": "...", "listName": "...", "cards": [{ "id": "...", "name": "..." }] }] }]
   ```
3. Panggil `mcp.kaede.generate_plan` dengan parameter `boards`:
   - Jika plan mengandung `pre_flight_check` dengan `blockers` → **TANYA USER** sebelum lanjut
   - Jika `warnings` saja (safe: true) → informasikan ke user, lanjutkan jika disetujui
   - Jika tidak ada `pre_flight_check` → lanjut eksekusi normal
4. Alternatif: bisa juga panggil `mcp.kaede.validate_context` atau `mcp.kaede.detect_duplicates` langsung

> **Catatan**: `generatePlan` otomatis menjalankan `validateContext` untuk goal `buat card` / `buat label` jika parameter `boards` disertakan.

## Tools yang Tersedia
| Tool | Source | Fungsi |
|---|---|---|
| `kaede_*` (9 tools) | `mcp.kaede` (Orchestrator) | Planning, context, board resolution, dedup |
| `kaede-trello_*` (44 tools) | `mcp.trello` (42+2 tools) | Eksekusi Trello + search_boards |
