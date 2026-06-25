# Template Playbook Kolaboratif Human+AI (SOP Tim)

Playbook adalah dokumen rujukan utama (source of truth) bagi manusia dan AI Agent untuk berkolaborasi dalam satu tim. Dokumen ini mendefinisikan aturan main, peran, alur kerja (SOP), dan konvensi penulisan tugas.

---

## 1. Peran & Tanggung Jawab (Roles)

Setiap anggota tim (manusia maupun AI) harus memiliki peran yang jelas. Format penulisan peran:

### Peran: Project Manager (PM)
* **Tanggung Jawab**: Mendefinisikan sasaran sprint, memprioritaskan backlog, menyetujui UAT.
* **Akses Trello**: Admin (seluruh board).
* **AI Agent Instructions**: AI harus membantu PM merangkum sprint harian dan menyusun draf rilis.

### Peran: Developer
* **Tanggung Jawab**: Menulis kode, melakukan self-review, memperbaiki bug.
* **Akses Trello**: View/Edit (Sprint Board).
* **AI Agent Instructions**: AI harus membantu developer melakukan review kode, menulis dokumentasi, dan menata card environment di Trello.

---

## 2. Alur Kerja Sprint (Sprint Workflow)

Alur pengerjaan tugas (sprint lifecycle) diatur dengan urutan List Trello berikut:

1. **Backlog**: Tempat menaruh seluruh ide/rencana mentah. Kartu ditulis dalam format User Story singkat.
2. **To Do (Ready)**: Kartu yang sudah siap dikerjakan oleh developer di sprint berjalan. Harus memiliki detail *Acceptance Criteria* yang jelas.
3. **In Progress**: Pekerjaan yang sedang aktif dikerjakan. Maksimal **3 kartu aktif** per developer secara bersamaan untuk menjaga fokus.
4. **QA / Code Review**: Kartu dipindahkan ke list ini saat pull request dibuat. AI Agent akan melakukan pengecekan kepatuhan kode.
5. **Done**: Pekerjaan selesai setelah disetujui PM atau lolos pengujian otomatis.

---

## 3. Konvensi Penamaan & Struktur Kartu Trello

Agar AI Agent dapat menyaring informasi secara presisi, gunakan aturan format berikut:

### 3.1 Judul Kartu (Card Title)
Gunakan awalan tipe tugas:
* `feat: [Nama Fitur]` — Untuk fitur baru.
* `fix: [Nama Bug]` — Untuk perbaikan masalah/error.
* `docs: [Topik]` — Untuk perubahan dokumentasi.
* `chore: [Topik]` — Untuk pekerjaan rutin/pemeliharaan.

### 3.2 Deskripsi Kartu (Card Description)
Setiap kartu harus memiliki template deskripsi berikut:
```markdown
## Deskripsi Singkat
[Apa masalahnya / apa yang ingin dicapai?]

## User Story
Sebagai [Peran], saya ingin [Tindakan], sehingga [Manfaat].

## Kriteria Penerimaan (Acceptance Criteria)
- [ ] Kriteria 1
- [ ] Kriteria 2

## Catatan Teknis / Deployment
- Target Environment: [PROD / STAG / DEV]
- Deploy URL: [Jika ada]
```

### 3.3 Labeling (Environment & Prioritas)
* **Merah**: Prioritas Tinggi / Hotfix.
* **Kuning**: Prioritas Sedang / Fitur Umum.
* **Hijau**: Prioritas Rendah / Refactoring.
* **Label Kustom**: `Production`, `Staging`, `Development` (dipasang otomatis via KAEDE Power-Up).

---

## 4. Standar Kode & Kualitas (Engineering Standards)

* **Type Safety**: Dilarang menggunakan `as any` atau `@ts-ignore` tanpa persetujuan Tech Lead.
* **Error Handling**: Semua operasi I/O dan eksternal API harus dibungkus dengan blok `try-catch` yang melacak error secara detail ke logger.
* **Commit Messages**: Mengikuti standar *Conventional Commits*.
