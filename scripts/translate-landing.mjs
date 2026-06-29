/**
 * Translate KAEDE landing page between Indonesian and English.
 *
 * The English version (public/index.html) is the source of truth.
 * Run: bun scripts/translate-landing.mjs
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
const idToEn = [
  // === Document ===
  ['lang="id"', 'lang="en"'],
  ['<title>KAEDE — Ekosistem Koneksi</title>', '<title>KAEDE — Connection Ecosystem</title>'],

  // === Hero ===
  [
    'Jembatan antara <strong class="text-kaede-text font-semibold">Trello</strong> dan ekosistem\n        <strong class="text-kaede-text font-semibold">Agentic Development</strong> Koneksi —\n        tempat tim bersatu, AI terbantu, dan workflow berjalan mulus.',
    'A bridge between <strong class="text-kaede-text font-semibold">Trello</strong> and Koneksi\'s\n        <strong class="text-kaede-text font-semibold">Agentic Development</strong> ecosystem —\n        where teams unite, AI assists, and workflows run smoothly.',
  ],
  ['Mulai Pakai Power-Up', 'Get Started with Power-Up'],
  ['Pelajari Ekosistem', 'Learn Ecosystem'],

  // === About / Tentang ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Tentang</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">About</span>',
  ],
  ['Apa itu <span class="text-kaede-primary">KAEDE</span>?', 'What is <span class="text-kaede-primary">KAEDE</span>?'],
  [
    'KAEDE adalah proyek integrasi milik <strong class="text-kaede-text">PT Koneksi Jaringan Indonesia</strong>\n          yang menghubungkan Trello — tempat tim merencanakan dan melacak pekerjaan — dengan ekosistem\n          pengembangan berbasis <strong class="text-kaede-text">Agentic AI</strong>.',
    'KAEDE is an integration project owned by <strong class="text-kaede-text">PT Koneksi Jaringan Indonesia</strong>\n          that connects Trello — where teams plan and track work — with the\n          development ecosystem based on <strong class="text-kaede-text">Agentic AI</strong>.',
  ],
  [
    'Dimulai sebagai Trello Power-Up untuk manajemen environment (Production / Staging / Development),\n          KAEDE berkembang menjadi <strong class="text-kaede-text">jembatan utama</strong> antara perencanaan\n          tim di Trello dan eksekusi berbasis AI Agent melalui protokol MCP OpenCode.',
    'Starting as a Trello Power-Up for environment management (Production / Staging / Development),\n          KAEDE has evolved into the <strong class="text-kaede-text">core bridge</strong> between team planning\n          on Trello and AI Agent execution via the OpenCode MCP protocol.',
  ],
  [
    '<strong class="text-kaede-text">Power-Up Trello</strong> — Kelola environment, badge, dan autorisasi langsung dari kartu Trello.',
    '<strong class="text-kaede-text font-semibold text-kaede-text">Trello Power-Up</strong> — Manage environments, badges, and authorization directly from Trello cards.',
  ],
  [
    '<strong class="text-kaede-text">MCP Bridge</strong> — Membuka data Trello untuk dibaca dan ditulis oleh AI Agent melalui MCP OpenCode.',
    '<strong class="text-kaede-text font-semibold text-kaede-text">MCP Bridge</strong> — Exposes Trello data for reading and writing by AI Agents via OpenCode MCP.',
  ],
  [
    '<strong class="text-kaede-text">Knowledge Hub</strong> — Pusat informasi ekosistem Koneksi untuk seluruh anggota tim.',
    '<strong class="text-kaede-text font-semibold text-kaede-text">Knowledge Hub</strong> — The central information hub of the Koneksi ecosystem for all team members.',
  ],
  ['Terakhir diperbarui Juni 2026', 'Last updated June 2026'],

  // === Ecosystem ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Ekosistem</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Ecosystem</span>',
  ],
  [
    '<h2 class="text-3xl sm:text-4xl font-bold mt-2">Empat Pilar Pengembangan Koneksi</h2>',
    '<h2 class="text-3xl sm:text-4xl font-bold mt-2">Four Pillars of Koneksi Development</h2>',
  ],
  [
    'Setiap repositori di organisasi Koneksi bisa memiliki keempat komponen ini.\n          Masing-masing punya peran yang berbeda tapi saling melengkapi.',
    'Every repository in the Koneksi organization can have all four components.\n          Each has a distinct yet complementary role.',
  ],

  // Pillar: Playbook
  [
    'Panduan <strong class="text-kaede-text">manusia ke manusia</strong>.\n            Berisi workflow, SOP, standar kualitas, onboarding, ADR.\n            Disimpan di repositori <code class="text-kaede-warning text-[10px]">{org}/playbook</code>.',
    '<strong class="text-kaede-text">Human-to-human</strong> guidance.\n            Workflows, SOPs, quality standards, onboarding, ADRs.\n            Stored in the <code class="text-kaede-warning text-[10px]">{org}/playbook</code> repository.',
  ],

  // Pillar: OpenKB
  [
    'Protokol komunikasi <strong class="text-kaede-text">AI ↔ Human</strong>.\n            File <code class="text-kaede-success text-[10px]">.openkb/</code> di setiap repo.\n            SHARED (glossary, decisions) + PERSONAL (catatan pribadi).',
    '<strong class="text-kaede-text">AI ↔ Human</strong> communication protocol.\n            <code class="text-kaede-success text-[10px]">.openkb/</code> directory in each repo.\n            SHARED (glossary, decisions) + PERSONAL (private notes).',
  ],

  // Pillar: OpenCode
  [
    'Konfigurasi <strong class="text-kaede-text">AI Agent</strong>.\n            File <code class="text-kaede-primary text-[10px]">.opencode/</code> di setiap repo.\n            Agent types, permissions, project context, aturan main.',
    '<strong class="text-kaede-text">AI Agent</strong> configuration.\n            <code class="text-kaede-primary text-[10px]">.opencode/</code> directory in each repo.\n            Agent types, permissions, project context, rules.',
  ],

  // Pillar: KAEDE
  [
    'Jembatan <strong class="text-kaede-text">Trello ↔ MCP</strong>.\n            Power-Up Trello untuk menghubungkan perencanaan tim\n            dengan eksekusi agentic. Juga pusat informasi ekosistem ini.',
    '<strong class="text-kaede-text">Trello ↔ MCP</strong> bridge.\n            Trello Power-Up connecting team planning\n            with agentic execution. Also the ecosystem\'s information hub.',
  ],

  // How they connect
  [
    '<h3 class="text-sm font-semibold mb-4">Bagaimana Mereka Terhubung?</h3>',
    '<h3 class="text-sm font-semibold mb-4">How They Connect?</h3>',
  ],
  [
    'Manusia menulis panduan di <strong>Playbook</strong> → AI membaca konteks dari <strong>OpenKB</strong> →\n          Agent dikonfigurasi lewat <strong>OpenCode</strong> → <strong>KAEDE</strong> menghubungkan semuanya ke Trello.',
    'Humans write guidelines in <strong>Playbook</strong> → AI reads context from <strong>OpenKB</strong> →\n          Agent is configured via <strong>OpenCode</strong> → <strong>KAEDE</strong> connects everything to Trello.',
  ],

  // === OpenKB Section ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-success">Protokol</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-success">Protocol</span>',
  ],
  [
    '<p class="text-kaede-muted mt-1">Open Knowledge Base — bahasa komunikasi AI ↔ Human</p>',
    '<p class="text-kaede-muted mt-1">Open Knowledge Base — AI ↔ Human communication language</p>',
  ],
  [
    'OpenKB adalah protokol yang memungkinkan <strong class="text-kaede-text">AI Agent</strong> dan\n          <strong class="text-kaede-text">manusia</strong> berbagi konteks secara dua arah.\n          Disimpan sebagai direktori <code class="text-kaede-success text-[11px] font-mono">.openkb/</code>\n          di setiap repositori.',
    'OpenKB is a protocol that enables <strong class="text-kaede-text">AI Agents</strong> and\n          <strong class="text-kaede-text">humans</strong> to share context bidirectionally.\n          Stored as a <code class="text-kaede-success text-[11px] font-mono">.openkb/</code> directory\n          in each repository.',
  ],
  ['Dua ruang penyimpanan:', 'Two storage spaces:'],
  [
    'Glossary istilah, referensi eksternal, keputusan arsitektur (decision-log).\n              Komit ke git — bisa dibaca semua orang dan AI.',
    'Term glossary, external references, architectural decisions (decision-log).\n              Committed to git — readable by everyone and AI.',
  ],
  [
    'Catatan pribadi, preferensi lokal, eksperimen. Khusus individu —\n              tidak masuk git, tidak terbaca orang lain.',
    'Personal notes, local preferences, experiments. Individual only —\n              not in git, not readable by others.',
  ],
  [
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Struktur Direktori</h4>',
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Directory Structure</h4>',
  ],
  ['<span class="cm"># Setiap repo bisa punya ini:</span>', '<span class="cm"># Each repo can have this:</span>'],
  ['<span class="cm"># Istilah &amp; singkatan</span>', '<span class="cm"># Terms &amp; abbreviations</span>'],
  ['<span class="cm"># Link &amp; referensi</span>', '<span class="cm"># Links &amp; references</span>'],
  ['<span class="cm"># Keputusan arsitektur</span>', '<span class="cm"># Architecture decisions</span>'],
  ['<span class="cm"># Konteks proyek</span>', '<span class="cm"># Project context</span>'],
  ['<span class="cm"># Tidak di-track</span>', '<span class="cm"># Not tracked</span>'],
  [
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Alur Komunikasi</h4>',
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Communication Flow</h4>',
  ],
  [
    '<span><strong class="text-kaede-text">AI membaca OpenKB</strong> sebelum membantu — paham konteks, istilah, aturan.</span>',
    '<span><strong class="text-kaede-text">AI reads OpenKB</strong> before assisting — understands context, terms, rules.</span>',
  ],
  [
    '<span><strong class="text-kaede-text">Manusia menulis OpenKB</strong> — catat keputusan, update glossary, tambah referensi.</span>',
    '<span><strong class="text-kaede-text">Humans write OpenKB</strong> — record decisions, update glossary, add references.</span>',
  ],
  [
    '<span><strong class="text-kaede-text">Dua arah</strong> — AI bisa rekomen update ke OpenKB, manusia review dan approve.</span>',
    '<span><strong class="text-kaede-text">Bidirectional</strong> — AI can suggest updates to OpenKB, humans review and approve.</span>',
  ],

  // === Playbook Section ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-warning">Panduan</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-warning">Guide</span>',
  ],
  [
    '<p class="text-kaede-muted mt-1">Standard operasional untuk manusia</p>',
    '<p class="text-kaede-muted mt-1">Operational standards for humans</p>',
  ],
  [
    'Playbook adalah kumpulan dokumen <strong class="text-kaede-text">human-to-human</strong>\n          yang berisi standar, workflow, dan SOP pengembangan tim Koneksi.\n          Disimpan di repositori terpisah: <code class="text-kaede-warning text-[11px] font-mono">{org}/playbook</code>.',
    'A Playbook is a collection of <strong class="text-kaede-text">human-to-human</strong>\n          documents containing standards, workflows, and SOPs for the Koneksi team.\n          Stored in a separate repository: <code class="text-kaede-warning text-[11px] font-mono">{org}/playbook</code>.',
  ],
  ['<span>Trello integration — dari kartu ke kode</span>', '<span>Trello integration — from card to code</span>'],
  ['<span>Onboarding anggota tim baru</span>', '<span>New team member onboarding</span>'],
  ['<span>Quality standard &amp; code review</span>', '<span>Quality standard &amp; code review</span>'],

  // Playbook vs OpenKB table
  [
    '<th class="text-left py-2 pr-3 font-semibold text-kaede-text">Aspek</th>',
    '<th class="text-left py-2 pr-3 font-semibold text-kaede-text">Aspect</th>',
  ],
  ['<td class="py-2 pr-3 text-kaede-text">Pembaca</td>', '<td class="py-2 pr-3 text-kaede-text">Audience</td>'],
  ['<td class="py-2 pr-3">Manusia</td>', '<td class="py-2 pr-3">Humans</td>'],
  ['<td class="py-2">AI Agent + Manusia</td>', '<td class="py-2">AI Agent + Humans</td>'],
  ['<td class="py-2 pr-3 text-kaede-text">Lokasi</td>', '<td class="py-2 pr-3 text-kaede-text">Location</td>'],
  ['<td class="py-2 pr-3 text-kaede-text">Format</td>', '<td class="py-2 pr-3 text-kaede-text">Format</td>'],
  ['<td class="py-2 pr-3">Dokumentasi naratif</td>', '<td class="py-2 pr-3">Narrative documentation</td>'],
  ['<td class="py-2">Struktur direktori baku</td>', '<td class="py-2">Standard directory structure</td>'],

  // === OpenCode Section ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Konfigurasi</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Configuration</span>',
  ],
  [
    '<p class="text-kaede-muted mt-1">Konfigurasi AI Agent di setiap repositori</p>',
    '<p class="text-kaede-muted mt-1">AI Agent configuration per repository</p>',
  ],
  [
    'OpenCode adalah tools AI Agent yang digunakan tim Koneksi.\n          Setiap repositori bisa memiliki direktori <code class="text-kaede-primary text-[11px] font-mono">.opencode/</code>\n          yang mengkonfigurasi bagaimana AI Agent berperilaku di repo tersebut.',
    'OpenCode is the AI Agent tool used by the Koneksi team.\n          Each repository can have an <code class="text-kaede-primary text-[11px] font-mono">.opencode/</code>\n          directory that configures how AI Agents behave in that repo.',
  ],
  [
    'Setiap repo punya beberapa <em>agent</em> dengan peran berbeda:\n              <code class="text-[10px]">build</code> (eksekusi),\n              <code class="text-[10px]">plan</code> (perencanaan),\n              <code class="text-[10px]">review</code> (review),\n              <code class="text-[10px]">docs</code> (dokumentasi).\n              Masing-masing punya permission berbeda.',
    'Each repo has several <em>agents</em> with different roles:\n              <code class="text-[10px]">build</code> (execution),\n              <code class="text-[10px]">plan</code> (planning),\n              <code class="text-[10px]">review</code> (review),\n              <code class="text-[10px]">docs</code> (documentation).\n              Each has different permissions.',
  ],
  [
    'File <code class="text-[10px]">SHARED/project-context.md</code> dan\n              <code class="text-[10px]">SHARED/agent-rules.md</code> memberi tahu AI\n              tentang stack teknis, tim, aturan main, dan kebiasaan repo tersebut.',
    'Files like <code class="text-[10px]">SHARED/project-context.md</code> and\n              <code class="text-[10px]">SHARED/agent-rules.md</code> inform the AI\n              about the tech stack, team, rules, and repo conventions.',
  ],
  [
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Contoh Struktur</h4>',
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Example Structure</h4>',
  ],
  ['<span class="cm"># Stack, tim, repo</span>', '<span class="cm"># Stack, team, repo</span>'],
  ['<span class="cm"># Aturan main agent</span>', '<span class="cm"># Agent rules</span>'],
  [
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Integrasi dengan KAEDE</h4>',
    '<h4 class="text-xs font-semibold uppercase tracking-wider text-kaede-muted mb-3">Integration with KAEDE</h4>',
  ],
  [
    'Melalui <strong class="text-kaede-text">MCP (Model Context Protocol)</strong>,\n            OpenCode bisa memanggil KAEDE untuk membaca dan menulis data Trello —\n            membuat kartu, mengubah label, mengecek assignment — langsung dari\n            percakapan dengan AI Agent.',
    'Through <strong class="text-kaede-text">MCP (Model Context Protocol)</strong>,\n            OpenCode can call KAEDE to read and write Trello data —\n            creating cards, updating labels, checking assignments — directly from\n            conversations with the AI Agent.',
  ],

  // === Workflow / TACO Section ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Workflow</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Workflow</span>',
  ],
  [
    'Koneksi menjalankan pengembangan dengan pendekatan <strong class="text-kaede-text">Human In The Loop</strong>\n          (HITL) — AI Agent membantu eksekusi, manusia tetap memegang kendali.',
    'Koneksi runs development with a <strong class="text-kaede-text">Human In The Loop</strong>\n          (HITL) approach — AI Agents assist execution, humans remain in control.',
  ],

  // Timeline steps
  ['<span>Perencanaan</span>', '<span>Planning</span>'],
  [
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-warning/20 text-kaede-warning">Product + BA</span>',
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-warning/20 text-kaede-warning">Product + BA</span>',
  ],
  [
    'Product Manager dan Business Analyst menyusun kebutuhan di Trello:\n              membuat kartu, menentukan prioritas, melampirkan konteks.\n              Setiap kartu bisa diberi label environment (Production/Staging/Development)\n              melalui KAEDE Power-Up.',
    'Product Manager and Business Analyst define requirements in Trello:\n              creating cards, setting priorities, attaching context.\n              Each card can be assigned an environment label (Production/Staging/Development)\n              via the KAEDE Power-Up.',
  ],

  ['<span>Konteks AI</span>', '<span>AI Context</span>'],
  [
    'Sebelum memulai, AI Agent membaca <strong>OpenKB</strong> dan\n              <strong>OpenCode</strong> di repositori untuk memahami konteks:\n              istilah proyek, keputusan arsitektur, stack teknis, aturan main.\n              Agent juga bisa membaca kartu Trello terkait melalui KAEDE.',
    'Before starting, the AI Agent reads <strong>OpenKB</strong> and\n              <strong>OpenCode</strong> in the repository to understand the context:\n              project terms, architectural decisions, tech stack, rules.\n              The Agent can also read related Trello cards via KAEDE.',
  ],

  ['<span>Eksekusi</span>', '<span>Execution</span>'],
  [
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-primary/20 text-kaede-primary">Developer + Agent</span>',
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-primary/20 text-kaede-primary">Developer + Agent</span>',
  ],
  [
    'Developer (Frontend, Backend, UI/UX, Junior) bekerja dengan bantuan\n              AI Agent. Agent membantu menulis kode, mengecek pattern, menjalankan test.\n              Developer tetap memegang kendali — AI adalah <em>pair programmer</em>,\n              bukan pengganti.',
    'Developers (Frontend, Backend, UI/UX, Junior) work with the assistance of\n              AI Agents. The Agent helps write code, check patterns, run tests.\n              The Developer stays in control — AI is a <em>pair programmer</em>,\n              not a replacement.',
  ],

  ['<span>Review</span>', '<span>Review</span>'],
  [
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-danger/20 text-kaede-danger">Senior (HITL)</span>',
    '<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-kaede-danger/20 text-kaede-danger">Senior (HITL)</span>',
  ],
  [
    '<strong>Human In The Loop</strong> — Senior Developer me-review semua\n              perubahan sebelum di-merge. Memastikan kualitas, konsistensi, dan\n              keamanan. AI Agent membantu review (static analysis, pattern check)\n              tapi keputusan akhir tetap di tangan manusia.',
    '<strong>Human In The Loop</strong> — Senior Developer reviews all\n              changes before merging. Ensures quality, consistency, and\n              security. AI Agents assist with review (static analysis, pattern check)\n              but the final decision remains with the human.',
  ],

  ['<span>Deploy &amp; Laporkan</span>', '<span>Deploy &amp; Report</span>'],
  [
    'Setelah di-merge, otomatis terdeploy. Kartu Trello diupdate —\n              status, environment, link deploy. Semua terdokumentasi di\n              decision-log OpenKB untuk konteks masa depan.',
    'After merging, it is automatically deployed. Trello cards are updated —\n              status, environment, deploy links. Everything is documented in the\n              OpenKB decision-log for future context.',
  ],

  // === Power-Up Guide / Panduan ===
  [
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Panduan</span>',
    '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Guide</span>',
  ],
  [
    '<h2 class="text-3xl sm:text-4xl font-bold mt-2">Menggunakan KAEDE Power-Up</h2>',
    '<h2 class="text-3xl sm:text-4xl font-bold mt-2">Using KAEDE Power-Up</h2>',
  ],
  [
    'Cara menginstall dan memanfaatkan KAEDE di Trello tim Koneksi.',
    'How to install and use KAEDE on your Koneksi team Trello.',
  ],
  [
    '<h3 class="text-sm font-semibold">Install Power-Up</h3>',
    '<h3 class="text-sm font-semibold">Install Power-Up</h3>',
  ],
  [
    'Buka <code class="text-[10px]">trello.com/power-ups/admin</code>,\n          klik <strong>Create</strong> atau tambahkan KAEDE yang sudah didaftarkan.\n          Masukkan URL: <code class="text-[10px] break-all">https://kaede-powerup.netlify.app</code>',
    'Open <code class="text-[10px]">trello.com/power-ups/admin</code>,\n          click <strong>Create</strong> or add an existing KAEDE registration.\n          Enter the URL: <code class="text-[10px] break-all">https://kaede-powerup.netlify.app</code>',
  ],
  [
    '<h3 class="text-sm font-semibold">Aktifkan di Board</h3>',
    '<h3 class="text-sm font-semibold">Enable on Board</h3>',
  ],
  [
    'Buka board Trello tim → <strong>Power-Ups</strong> → cari "KAEDE" →\n          <strong>Enable</strong>. Tombol KAEDE akan muncul di header board.',
    'Open your team Trello board → <strong>Power-Ups</strong> → search for "KAEDE" →\n          <strong>Enable</strong>. The KAEDE button will appear in the board header.',
  ],
  [
    '<h3 class="text-sm font-semibold">Kelola Environment</h3>',
    '<h3 class="text-sm font-semibold">Manage Environment</h3>',
  ],
  [
    'Buka kartu → klik <strong>KAEDE: Environment</strong> →\n          pilih Production / Staging / Development.\n          Badge akan muncul di muka kartu.',
    'Open a card → click <strong>KAEDE: Environment</strong> →\n          select Production / Staging / Development.\n          A badge will appear on the card face.',
  ],
  [
    'KAEDE MCP Server sudah aktif. AI Agent di OpenCode bisa membaca dan menulis\n        Trello secara langsung — semua 22 tools sudah tersedia melalui\n        <code class="text-[10px]">dist/mcp-server.js</code>.',
    'The KAEDE MCP Server is active. AI Agents in OpenCode can read and write\n        Trello directly — all 22 tools are available via\n        <code class="text-[10px]">dist/mcp-server.js</code>.',
  ],
  [
    '<span class="px-2.5 py-1 rounded bg-kaede-success/20 text-kaede-success">22 Tools</span>',
    '<span class="px-2.5 py-1 rounded bg-kaede-success/20 text-kaede-success">22 Tools</span>',
  ],
];

// ── EN → ID translations (reverse) ──
const enToId = idToEn.map(([id, en]) => [en, id]);

// Apply translations
const translations = mode === 'id' ? enToId : idToEn;
let applied = 0;
for (const [from, to] of translations) {
  if (html.includes(from)) {
    html = html.replace(from, to);
    applied++;
  }
}

writeFileSync(dstFile, html, 'utf-8');
console.log(`✓ Translated ${applied}/${translations.length} strings → ${dstFile}`);
