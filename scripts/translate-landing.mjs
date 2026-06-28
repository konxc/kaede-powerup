import { readFileSync, writeFileSync } from 'fs';

const idHtml = readFileSync('public/id.html', 'utf-8');

// Replace lang="id" with lang="en"
let enHtml = idHtml.replace('lang="id"', 'lang="en"');

// Replace title
enHtml = enHtml.replace('<title>KAEDE — Ekosistem Koneksi</title>', '<title>KAEDE — Connection Ecosystem</title>');

// Translate Hero Section
enHtml = enHtml.replace('Jembatan antara <strong class="text-kaede-text font-semibold">Trello</strong> dan ekosistem', 'A bridge between <strong class="text-kaede-text font-semibold">Trello</strong> and Koneksi\'s');
enHtml = enHtml.replace('<strong class="text-kaede-text font-semibold">Agentic Development</strong> Koneksi —', '<strong class="text-kaede-text font-semibold">Agentic Development</strong> ecosystem —');
enHtml = enHtml.replace('tempat tim bersatu, AI terbantu, dan workflow berjalan mulus.', 'where teams unite, AI assists, and workflows run smoothly.');
enHtml = enHtml.replace('Mulai Pakai Power-Up', 'Get Started with Power-Up');
enHtml = enHtml.replace('Pelajari Ekosistem', 'Learn Ecosystem');

// Translate About Section
enHtml = enHtml.replace('<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Tentang</span>', '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">About</span>');
enHtml = enHtml.replace('Apa itu <span class="text-kaede-primary">KAEDE</span>?', 'What is <span class="text-kaede-primary">KAEDE</span>?');
enHtml = enHtml.replace('KAEDE adalah proyek integrasi milik <strong class="text-kaede-text">PT Koneksi Jaringan Indonesia</strong>', 'KAEDE is an integration project owned by <strong class="text-kaede-text">PT Koneksi Jaringan Indonesia</strong>');
enHtml = enHtml.replace('yang menghubungkan Trello — tempat tim merencanakan dan melacak pekerjaan — dengan ekosistem', 'that connects Trello — where teams plan and track work — with the');
enHtml = enHtml.replace('pengembangan berbasis <strong class="text-kaede-text">Agentic AI</strong>.', 'development ecosystem based on <strong class="text-kaede-text">Agentic AI</strong>.');
enHtml = enHtml.replace('Dimulai sebagai Trello Power-Up untuk manajemen environment (Production / Staging / Development),', 'Starting as a Trello Power-Up for environment management (Production / Staging / Development),');
enHtml = enHtml.replace('KAEDE berkembang menjadi <strong class="text-kaede-text">jembatan utama</strong> antara perencanaan', 'KAEDE has evolved into the <strong class="text-kaede-text">core bridge</strong> between team planning');
enHtml = enHtml.replace('tim di Trello dan eksekusi berbasis AI Agent melalui protokol MCP OpenCode.', 'on Trello and AI Agent execution via the OpenCode MCP protocol.');
enHtml = enHtml.replace('<strong class="text-kaede-text">Power-Up Trello</strong> — Kelola environment, badge, dan autorisasi langsung dari kartu Trello.', '<strong class="text-kaede-text font-semibold text-kaede-text">Trello Power-Up</strong> — Manage environments, badges, and authorization directly from Trello cards.');
enHtml = enHtml.replace('<strong class="text-kaede-text">MCP Bridge</strong> — Membuka data Trello untuk dibaca dan ditulis oleh AI Agent melalui MCP OpenCode.', '<strong class="text-kaede-text font-semibold text-kaede-text">MCP Bridge</strong> — Exposes Trello data for reading and writing by AI Agents via OpenCode MCP.');
enHtml = enHtml.replace('<strong class="text-kaede-text">Knowledge Hub</strong> — Pusat informasi ekosistem Koneksi untuk seluruh anggota tim.', '<strong class="text-kaede-text font-semibold text-kaede-text">Knowledge Hub</strong> — The central information hub of the Koneksi ecosystem for all team members.');
enHtml = enHtml.replace('Terakhir diperbarui Juni 2026', 'Last updated June 2026');

// Translate Ecosystem Section
enHtml = enHtml.replace('<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Ekosistem</span>', '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Ecosystem</span>');
enHtml = enHtml.replace('Alur Kerja Terpadu', 'Integrated Workflow');
enHtml = enHtml.replace('KAEDE adalah bagian dari ekosistem pengembangan PT Koneksi Jaringan Indonesia:', 'KAEDE is part of PT Koneksi Jaringan Indonesia\'s development ecosystem:');
enHtml = enHtml.replace('Playbook — Panduan manusia ke manusia (SOP, alur sprint).', 'Playbook — Human-to-human guidelines (SOP, sprint workflow).');
enHtml = enHtml.replace('OpenKB — Knowledge base (komunikasi AI ↔ Manusia).', 'OpenKB — Knowledge base (AI ↔ Human communication).');
enHtml = enHtml.replace('OpenCode — Konfigurasi AI Agent dan lokal environment.', 'OpenCode — AI Agent configuration and local environment.');
enHtml = enHtml.replace('KAEDE — Jembatan Trello ↔ MCP & pelacak environment.', 'KAEDE — Trello ↔ MCP bridge and environment tracker.');
enHtml = enHtml.replace('Trello — Tempat target pelacakan dan eksekusi pekerjaan.', 'Trello — The target board where work is tracked and executed.');

// Translate OpenKB Section
enHtml = enHtml.replace('Di mana pengetahuan disimpan', 'Where knowledge is stored');
enHtml = enHtml.replace('Basis Pengetahuan Bersama', 'Shared Knowledge Base');
enHtml = enHtml.replace('OpenKB adalah standar kami untuk menyimpan dokumentasi produk, keputusan,', 'OpenKB is our standard for storing product documentation, decisions,');
enHtml = enHtml.replace('dan istilah. Disimpan sebagai direktori <code class="text-kaede-success text-[11px] font-mono">.openkb/</code>', 'and terms. It is stored as a <code class="text-kaede-success text-[11px] font-mono">.openkb/</code> directory');
enHtml = enHtml.replace('di setiap repositori, membuatnya mudah diakses baik oleh developer maupun AI Agent.', 'in each repository, making it easily accessible for both developers and AI Agents.');
enHtml = enHtml.replace('Struktur Direktori', 'Directory Structure');
enHtml = enHtml.replace('<span class="cm"># Setiap repo bisa punya ini:</span>', '<span class="cm"># Each repo can have this:</span>');
enHtml = enHtml.replace('<span class="cm"># Istilah &amp; singkatan</span>', '<span class="cm"># Terms &amp; abbreviations</span>');
enHtml = enHtml.replace('<span class="cm"># Link &amp; referensi</span>', '<span class="cm"># Links &amp; references</span>');
enHtml = enHtml.replace('<span class="cm"># Keputusan arsitektur</span>', '<span class="cm"># Architecture decisions</span>');
enHtml = enHtml.replace('<span class="cm"># Konteks proyek</span>', '<span class="cm"># Project context</span>');
enHtml = enHtml.replace('<span class="cm"># Tidak di-track</span>', '<span class="cm"># Not tracked</span>');
enHtml = enHtml.replace('Alur Komunikasi', 'Communication Flow');
enHtml = enHtml.replace('Interaksi data berjalan mulus tanpa duplikasi data.', 'Data interaction flows smoothly without duplication.');

// Translate Playbook Section
enHtml = enHtml.replace('Panduan Alur &amp; Peran', 'Workflow & Role Guidelines');
enHtml = enHtml.replace('Playbook adalah dokumen markdown (biasanya <code class="text-kaede-warning text-[11px] font-mono">playbook.md</code>)', 'A Playbook is a markdown document (usually <code class="text-kaede-warning text-[11px] font-mono">playbook.md</code>)');
enHtml = enHtml.replace('yang menetapkan aturan tim, konvensi penamaan, dan alur kerja. KAEDE mem-parse', 'that defines team rules, naming conventions, and workflows. KAEDE parses');
enHtml = enHtml.replace('playbook ini untuk memahami daftar list sprint dan label kartu Anda.', 'the playbook to understand your sprint lists and card labels.');
enHtml = enHtml.replace('Konvensi Nama Kartu', 'Card Naming Conventions');
enHtml = enHtml.replace('Mengikuti struktur <code class="text-[10px]">feat:</code>, <code class="text-[10px]">fix:</code>, dsb.', 'Following the <code class="text-[10px]">feat:</code>, <code class="text-[10px]">fix:</code> structure, etc.');
enHtml = enHtml.replace('Warna Label Trello', 'Trello Label Colors');
enHtml = enHtml.replace('Menentukan arti warna label per proyek.', 'Determining the meaning of label colors per project.');
enHtml = enHtml.replace('Alur List Kartu', 'List Workflows');
enHtml = enHtml.replace('Menentukan urutan kolom dari Backlog hingga Done.', 'Determining list ordering from Backlog to Done.');

// Translate OpenCode Section
enHtml = enHtml.replace('Ekosistem AI Agent', 'AI Agent Ecosystem');
enHtml = enHtml.replace('AI Agent yang Berkonfigurasi', 'Configured AI Agents');
enHtml = enHtml.replace('OpenCode adalah lapisan konfigurasi untuk AI Agent di ekosistem kami.', 'OpenCode is the configuration layer for AI Agents in our ecosystem.');
enHtml = enHtml.replace('Menentukan tipe agent, izin eksekusi (edit, terminal), dan perintah kustom.', 'It defines agent types, execution permissions (edit, terminal), and custom commands.');
enHtml = enHtml.replace('Contoh Struktur', 'Example Structure');
enHtml = enHtml.replace('<span class="cm"># 4 agent types + permissions</span>', '<span class="cm"># 4 agent types + permissions</span>');
enHtml = enHtml.replace('<span class="cm"># Stack, tim, repo</span>', '<span class="cm"># Stack, team, repo</span>');
enHtml = enHtml.replace('<span class="cm"># Aturan main agent</span>', '<span class="cm"># Agent rules</span>');
enHtml = enHtml.replace('Integrasi dengan KAEDE', 'Integration with KAEDE');
enHtml = enHtml.replace('Melalui <strong class="text-kaede-text">MCP (Model Context Protocol)</strong>,', 'Through <strong class="text-kaede-text">MCP (Model Context Protocol)</strong>,');
enHtml = enHtml.replace('OpenCode bisa memanggil KAEDE untuk membaca dan menulis data Trello —', 'OpenCode can call KAEDE to read and write Trello data —');
enHtml = enHtml.replace('membuat kartu, mengubah label, mengecek assignment — langsung dari', 'creating cards, updating labels, checking assignments — directly from');
enHtml = enHtml.replace('percakapan dengan AI Agent.', 'conversations with the AI Agent.');

// Translate Workflow Section
enHtml = enHtml.replace('<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Alur Kerja</span>', '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Workflow</span>');
enHtml = enHtml.replace('Dari Ide hingga Selesai', 'From Idea to Done');
enHtml = enHtml.replace('Siklus Kerja Terotomatisasi', 'Automated Work Cycle');
enHtml = enHtml.replace('Lihat bagaimana Playbook, OpenCode, KAEDE, dan Trello bekerja bersama:', 'See how Playbook, OpenCode, KAEDE, and Trello work together:');
enHtml = enHtml.replace('Tulis Playbook', 'Write Playbook');
enHtml = enHtml.replace('Tulis aturan sprint dan workflow dalam file Markdown.', 'Define sprint rules and workflows in a Markdown file.');
enHtml = enHtml.replace('Jalankan Perintah', 'Run Command');
enHtml = enHtml.replace('Gunakan CLI kaede untuk inisialisasi proyek dan sinkronisasi kredensial.', 'Use the kaede CLI to initialize the project and sync credentials.');
enHtml = enHtml.replace('Hubungkan AI', 'Connect AI');
enHtml = enHtml.replace('AI Agent membaca playbook dan mengakses Trello melalui MCP.', 'The AI Agent reads the playbook and accesses Trello via MCP.');
enHtml = enHtml.replace('Kelola Kartu', 'Manage Cards');
enHtml = enHtml.replace('Gunakan Power-Up Trello untuk melihat environment dan badge secara visual.', 'Use the Trello Power-Up to view environments and badges visually.');

// Translate Power-Up / Steps Section
enHtml = enHtml.replace('<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Power-Up</span>', '<span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-primary">Power-Up</span>');
enHtml = enHtml.replace('Integrasi Trello &amp; MCP', 'Trello &amp; MCP Integration');
enHtml = enHtml.replace('Siap untuk Memulai?', 'Ready to Start?');
enHtml = enHtml.replace('Ikuti langkah berikut untuk mengintegrasikan KAEDE ke dalam alur kerja Anda:', 'Follow these steps to integrate KAEDE into your workflow:');
enHtml = enHtml.replace('Pasang Trello Power-Up', 'Install Trello Power-Up');
enHtml = enHtml.replace('Buka <code class="text-[10px]">trello.com/power-ups/admin</code>,', 'Open <code class="text-[10px]">trello.com/power-ups/admin</code>,');
enHtml = enHtml.replace('buat custom Power-Up, dan atur URL iframe ke', 'create a custom Power-Up, and set the iframe URL to');
enHtml = enHtml.replace('Konfigurasi CLI', 'Configure CLI');
enHtml = enHtml.replace('Jalankan <code class="text-[10px]">node scripts/kaede.mjs setup</code>', 'Run <code class="text-[10px]">node scripts/kaede.mjs setup</code>');
enHtml = enHtml.replace('untuk menyimpan kredensial API Trello secara lokal.', 'to configure Trello API credentials locally.');
enHtml = enHtml.replace('Aktifkan MCP Server', 'Enable MCP Server');
enHtml = enHtml.replace('Tambahkan konfigurasi MCP Trello ke global atau', 'Add the Trello MCP server config to the global or');
enHtml = enHtml.replace('proyek-level <code class="text-[10px]">opencode.json</code>.', 'project-level <code class="text-[10px]">opencode.json</code>.');
enHtml = enHtml.replace('Mulai Kerja', 'Start Working');
enHtml = enHtml.replace('Gunakan <code class="text-[10px]">kaede today</code> untuk melihat tugas,', 'Use <code class="text-[10px]">kaede today</code> to see tasks,');
enHtml = enHtml.replace('atau minta AI Agent untuk mengoordinasikan alur kerja.', 'or ask the AI Agent to coordinate workflows.');
enHtml = enHtml.replace('KAEDE MCP Server sudah aktif. AI Agent di OpenCode bisa membaca dan menulis', 'The KAEDE MCP Server is active. AI Agents in OpenCode can read and write');
enHtml = enHtml.replace('Trello secara langsung — semua 22 tools sudah tersedia melalui', 'Trello directly — all 22 tools are available via');

writeFileSync('public/index.html', enHtml, 'utf-8');
console.log('Successfully translated public/index.html to English');
