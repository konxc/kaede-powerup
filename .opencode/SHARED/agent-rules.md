# Agent Rules — KAEDE

## Aturan Umum
- Gunakan bahasa Indonesia
- Jawab ringkas, langsung ke titik
- Ikuti pattern kode yang sudah ada (Tailwind v4, Bun, Vanilla JS)

## Kode & Format
- HTML: semantic HTML5, proper meta tags
- CSS: Tailwind v4 utility classes, custom theme via `@theme` di `apps/static/src/style.css`
- JS: Vanilla JS, no framework, Trello Power-Up client library (t-connect)
- Markdown (docs): Gunakan frontmatter untuk metadata

## Keamanan
- Jangan commit API key atau token Trello ke git
- Jangan hardcode credentials di HTML/JS
- Gunakan environment variable via Netlify

## Direktori Off-Limits
- **`.opencode/`** — Config AI agent (opencode.json, skills, agent rules). JANGAN dimodifikasi tanpa izin user.
- **`.openkb/`** — Knowledge base (glossary, decision log, references). JANGAN dimodifikasi tanpa izin user.
- Kedua direktori ini vital untuk operasional AI agent. Jika perlu perubahan, tanyakan user dulu.

## Struktur Monorepo
```
apps/
  static/     → Power-Up UI (Vite+SolidJS) → Netlify deploy
  webui/      → Dashboard (Next.js) → Vercel deploy
  docs/       → Documentation (Markdown → HTML) → GitHub Pages
packages/
  kaede/      → Core orchestrator + MCP server + tests
  kaede-trello/ → Custom MCP tools (lib fallback)
scripts/      → CLI scripts (kaede.ts, kaede-auth.ts, etc)
```

## Build & Deploy
- `bun run dev` — development
- `bun run build:static` — production CSS
- `bun run build:docs` — build documentation
- `bun run build:mcp` — build MCP servers
- Push ke main → Netlify auto-deploy
- Dokumentasi di `apps/docs/content/*.md` → auto-build ke gh-pages via GitHub Actions

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
| `git_*` / `github_*` (15 tools) | `mcp.kaede` (Git Integration) | Git status, commits, PRs, card review |

## Git & GitHub Workflow (WAJIB untuk Code Review)

Setiap kali user meminta review hasil kerja tim atau verifikasi implementasi card:

1. **Deteksi Auth** — `detect_auth_status()` → pastikan gh CLI / SSH / token tersedia
2. **Get Repo Info** — `get_repo_info()` → dapatkan owner/repo dari git remote
3. **Scan Commits** — `search_commits(query=cardId)` → cari commit terkait card
4. **Scan PRs** — `scan_pull_requests()` → cari PR terkait
5. **Review Card** — `review_card_implementation(card)` → auto-verify acceptance criteria vs commits

### Auth Strategies (Auto-Detect)
- **gh CLI** (primary) — `gh auth status`, `gh api`, `gh pr`
- **SSH** — git remote URL `git@github.com:owner/repo.git`
- **Token** — `GH_TOKEN` atau `GITHUB_TOKEN` environment variable
- **HTTPS** — git remote dengan credentials

### Commit Message Convention
Pattern: `<type>: <description>` atau `<type>(<scope>): <description>`
- `feat:` — fitur baru
- `fix:` — bug fix
- `docs:` — dokumentasi
- `chore:` — maintenance
- `refactor:` — refactoring
- Sertakan card ID di message untuk auto-link (e.g., `feat: BE-014 fix sick_permission`)

### PR Workflow Dinamis
- Agent harus cek `.git/config` untuk remote URL
- Agent harus cek playbook/openkb untuk konvensi tim
- Branch naming: `feat/<card-id>-<slug>` atau `fix/<card-id>-<slug>`
- PR title harus menyertakan card ID untuk auto-tracking
