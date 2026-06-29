/**
 * Translate KAEDE landing page between Indonesian and English.
 *
 * The English version (public/index.html) is the source of truth.
 * Run: bun scripts/translate-landing.ts
 *   --to=en   (default) translate id.html → index.html
 *   --to=id   translate index.html → id.html
 *
 * For full accuracy, maintain parallel source files and update both manually.
 */

import { readFileSync, writeFileSync } from 'fs';

const mode = process.argv.includes('--to=id') ? 'id' : 'en';
const srcFile = mode === 'id' ? 'public/index.html' : 'public/id.html';
const dstFile = mode === 'id' ? 'public/id.html' : 'public/index.html';

let html = readFileSync(srcFile, 'utf-8');

// ── ID → EN translations ──
const idToEn: Array<[string, string]> = [
  // === Document ===
  ['lang="id"', 'lang="en"'],
  ['<title>KAEDE — Ekosistem Koneksi</title>', '<title>KAEDE — Connection Ecosystem</title>'],

  // === Hero ===
  [
    'Jembatan antara <strong class="text-kaede-text font-semibold">Trello</strong> dan ekosistem\n        <strong class="text-kaede-text font-semibold">Agentic Development</strong> Koneksi —\n        tempat tim bersatu, AI terbantu, dan workflow berjalan mulus.',
    'A bridge between <strong class="text-kaede-text font-semibold">Trello</strong> and Koneksi\'s\n        <strong class="text-kaede-text font-semibold">Agentic Development</strong> ecosystem —\n        where teams unite, AI assists, and workflows run smoothly.',
  ],
  [
    'Jembatan antara <strong class="text-kaede-text font-semibold">Trello</strong> dan ekosistem\n          <strong class="text-kaede-text font-semibold">Agentic Development</strong> Koneksi —\n          tempat tim bersatu, AI terbantu, dan workflow berjalan mulus.',
    'A bridge between <strong class="text-kaede-text font-semibold">Trello</strong> and Koneksi\'s\n          <strong class="text-kaede-text font-semibold">Agentic Development</strong> ecosystem —\n          where teams unite, AI assists, and workflows run smoothly.',
  ],

  // === Join Button ===
  ['Gabung', 'Join Now'],
  ['Bergabunglah', 'Join Now'],

  // === Stats ===
  ['Power-Up Aktif', 'Power-Up Active'],
  ['Total Tools MCP', 'MCP Tools Total'],
  ['Tim Terbantu', 'Teams Empowered'],
  ['dipasang', 'installed'],
  ['tersedia', 'available'],
  ['aktif dan tumbuh', 'active and growing'],

  // === Fitur ===
  ['Semua Fitur', 'All Features'],
  ['Fitur Utama', 'Key Features'],
  ['Integrasi MCP', 'MCP Integration'],
  ['Integrasi MCP penuh dengan 46 alat untuk kendali Trello dari AI Agent favoritmu.', 'Full MCP integration with 46 tools for Trello control from your favorite AI Agent.'],
  ['Manajemen Tim', 'Team Management'],
  ['Kelola peran, akses, dan workflow tim secara terstruktur dengan Playbook.', 'Manage team roles, access, and workflows in a structured way with Playbook.'],
  ['Power-Up Trello', 'Trello Power-Up'],
  ['Fitur environment, dashboard, dan akses cepat MCP langsung dari antarmuka Trello.', 'Environment features, dashboard, and quick MCP access directly from the Trello interface.'],
  ['Multibahasa', 'Multilingual'],
  ['Dokumentasi dan antarmuka tersedia dalam Bahasa Indonesia dan Inggris.', 'Documentation and interface available in both Indonesian and English.'],
  ['Open Source', 'Open Source'],
  ['Kode sumber terbuka di GitHub — kontribusi, fork, dan kustomisasi sesuai kebutuhan.', 'Open source on GitHub — contribute, fork, and customize as needed.'],
  ['CLI & Orchestrator', 'CLI & Orchestrator'],
  ['Alat baris perintah untuk setup cepat, lihat tugas, inisialisasi proyek, dan otomatisasi.', 'Command-line tools for quick setup, task viewing, project initialization, and automation.'],

  // === Use Cases ===
  ['Cara Penggunaan', 'Use Cases'],
  ['Untuk Profesional', 'For Professionals'],
  ['Untuk Developer', 'For Developers'],
  ['Untuk Tim', 'For Teams'],
  ['Integrasikan KAEDE dengan AI Agent favoritmu dan biarkan AI yang mengelola Trello untukmu.', 'Integrate KAEDE with your favorite AI Agent and let AI manage Trello for you.'],
  ['Gunakan 46 alat MCP untuk otomatisasi Trello dari lingkungan pengembanganmu.', 'Use 46 MCP tools for Trello automation from your development environment.'],
  ['Kelola workflow Agile, sprint, dan tugas tim dengan Power-Up Trello yang terintegrasi.', 'Manage Agile workflows, sprints, and team tasks with integrated Trello Power-Up.'],

  // === CTA ===
  ['Mulai Sekarang', 'Get Started'],
  ['Dokumentasi', 'Documentation'],
  ['Lihat GitHub', 'View on GitHub'],
  ['siap membantu tim Anda', 'ready to help your team'],

  // === Footer ===
  ['Dibuat dengan', 'Made with'],
  ['oleh Tim Koneksi', 'by Koneksi Team'],
  ['Hak Cipta', 'Copyright'],
  ['Semua Hak Dilindungi.', 'All rights reserved.'],
  ['Kebijakan Privasi', 'Privacy Policy'],
  ['Server MCP', 'MCP Server'],
  ['Daftar Fitur', 'Features'],
  ['Sponsor', 'Sponsorship'],
];

// ── EN → ID translations ──
const enToId: Array<[string, string]> = idToEn.map(([id, en]) => [en, id]);

const translations = mode === 'id' ? enToId : idToEn;

for (const [src, dst] of translations) {
  html = html.replaceAll(src, dst);
}

writeFileSync(dstFile, html, 'utf-8');
console.log(`  \x1b[36m  ✓\x1b[0m Translated ${srcFile} → ${dstFile}`);
