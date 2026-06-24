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
