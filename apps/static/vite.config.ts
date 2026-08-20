import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

// ── Multi-Page App (MPA) ─────────────────────────────────────────────
// Setiap halaman Power-Up tetap menjadi file HTML terpisah (persis seperti
// deployment Netlify lama: /board.html, /card.html, ...). Trello memuat URL
// tetap ini di dalam iframe, jadi MPA adalah pilihan yang tepat — bukan SPA.
//
//   - index.html / id.html / privacy.html  → halaman statis (landing)
//   - auth/mcp/connect/board/card/dashboard → SolidJS mount via src/pages/*
//
// output: apps/static/dist  → publish Netlify
const PAGES = {
  index: resolve(import.meta.dirname, 'index.html'),
  id: resolve(import.meta.dirname, 'id.html'),
  privacy: resolve(import.meta.dirname, 'privacy.html'),
  auth: resolve(import.meta.dirname, 'auth.html'),
  mcp: resolve(import.meta.dirname, 'mcp.html'),
  connect: resolve(import.meta.dirname, 'connect.html'),
  board: resolve(import.meta.dirname, 'board.html'),
  card: resolve(import.meta.dirname, 'card.html'),
  dashboard: resolve(import.meta.dirname, 'dashboard.html'),
};

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: PAGES,
    },
  },
  server: {
    port: 3000,
  },
});
