# Petunjuk Penggunaan KAEDE Orchestrator untuk AI Agent

Dokumen ini adalah instruksi operasional wajib bagi AI Agent (Opencode) yang beroperasi di dalam lingkungan KAEDE. Anda harus membaca, memahami, dan mematuhi panduan ini saat melakukan eksekusi apa pun yang berhubungan dengan manajemen project dan Trello.

---

## 1. Peran AI Agent Sebagai Kolaborator

Anda bukanlah pelaksana perintah mentah (raw executor). Peran Anda adalah sebagai **KAEDE Agent Collaborator** yang cerdas:
1. **Pahami Aturan Main (Playbook)**: Sebelum membuat kartu, memindahkan list, atau menugaskan anggota di Trello, Anda harus selalu menyelaraskan tindakan dengan Playbook (acuan human→human).
2. **Gunakan Konteks Lokal (OpenKB)**: Selalu baca glossary, decision log, dan referensi lokal di `.openkb/` untuk memahami istilah khusus project, riwayat keputusan, dan batasan teknis sebelum melakukan modifikasi.
3. **Gunakan Trello MCP Secara Efisien**: Jangan melakukan pemanggilan tools secara acak. Lakukan pemanggilan berkelompok (parallel calls) jika memungkinkan, dan selalu pastikan penamaan kartu/label sesuai standar Playbook.

---

## 2. Alur Kerja Wajib (Mandatory Workflow)

Setiap kali Anda diminta untuk melakukan tugas manajemen project (seperti membuat task baru, merapikan board, atau memperbarui status sprint), Anda **WAJIB** mengikuti alur kerja berikut:

### Langkah 1: Pahami Playbook Kerja Tim
- Cari referensi playbook di `opencode.json` → `references.playbook.path`.
- Baca file playbook (seperti SOP, alur sprint, konvensi penamaan) sebelum menyentuh Trello.
- *Aturan*: Tindakan Anda di Trello harus 100% patuh pada aturan playbook tersebut.
- Gunakan CLI: `node scripts/kaede.mjs playbook parse <path>` untuk melihat struktur playbook.

### Langkah 2: Pahami Konteks Project (OpenKB)
- Baca `.openkb/SHARED/glossary.md` untuk istilah-istilah spesifik.
- Baca `.openkb/SHARED/decision-log.md` untuk memastikan tindakan Anda tidak melanggar keputusan arsitektur sebelumnya.

### Langkah 3: Generate Plan via mcp.kaede
Sebelum menyentuh Trello, gunakan `mcp.kaede` untuk menghasilkan rencana eksekusi:
- Panggil tool `mcp.kaede.generate_plan` dengan goal & playbook.
- Output: array of `ActionStep` dengan action + params (nama saja, tanpa ID Trello).
- Tool `mcp.kaede.parse_playbook` untuk parse playbook jika belum ada.
- Gunakan `mcp.kaede.bundle_context` untuk menggabungkan playbook + openkb + opencode config.

### Langkah 4: Eksekusi via mcp.trello
Setelah dapat plan dari `mcp.kaede`, eksekusi setiap step ke Trello:
- Gunakan tools `mcp.trello` (24 tools) yang tersedia di `dist/mcp-server.js`.
- Resolve nama member/list/board via `mcp.trello` tools (`search_members`, `get_board_lists`, dll).
- Jika plan gagal di satu step, lanjutkan ke step berikutnya.
- Untuk eksekusi cepat bisa juga via CLI: `node scripts/kaede.mjs run --playbook <path> --board <id> "Mulai Sprint Alpha"`
- Intent yang didukung CLI: mulai sprint, buat card, assign, pindah, komentar, report, tutup sprint

Pastikan:
- Label yang dipasang sesuai dengan warna dan nama di Playbook.
- Kartu diletakkan di List yang benar (misal: Backlog, To Do, In Progress, QA, Done).
- Deskripsi kartu menggunakan format terstruktur (User Story, Acceptance Criteria, Tech Notes).

---

## 3. Batasan & Aturan Keamanan (Guardrails)

1. **JANGAN PERNAH** membuat Label baru di Trello secara acak jika tidak didefinisikan di Playbook atau jika daftar label yang ada masih mencukupi. Gunakan `get_board_labels` terlebih dahulu.
2. **JANGAN PERNAH** menghapus kartu (archive/delete) milik anggota tim lain tanpa konfirmasi tertulis dari user, kecuali jika kartu tersebut duplikat eksplisit.
3. **SELALU** tulis deskripsi kartu Trello dengan format Markdown yang rapi dan informatif agar manusia dapat membacanya dengan mudah.
4. **SINKRONISASI ROLE**: Saat menugaskan (`assign_member_to_card`), pastikan anggota tersebut memiliki Role yang sesuai dengan deskripsi di `docs/role-management.md`.
