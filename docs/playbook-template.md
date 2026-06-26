# Template Playbook Kolaboratif Human+AI

Playbook adalah dokumen rujukan utama (*source of truth*) bagi **manusia dan AI Agent** untuk berkolaborasi dalam satu tim. Dokumen ini mendefinisikan aturan main, peran, alur kerja (SOP), konvensi teknis, dan budaya tim.

> **Cara menggunakan**: Copy file ini ke repo project kamu, edit sesuai kebutuhan, lalu jalankan `kaede init` untuk menghubungkannya dengan KAEDE orchestrator.

---

## 1. Tim & Peran

### 1.1 Struktur Tim

| Person | Role | GitHub |
|--------|------|--------|
| (nama) | Project Manager | @username |
| (nama) | Tech Lead | @username |
| (nama) | Developer | @username |
| (nama) | Product Analyst | @username |
| (nama) | Stakeholder | @username |

### 1.2 Definisi Peran

#### Peran: Project Manager (PM)
* **Tanggung Jawab**: Menentukan visi produk, memprioritaskan backlog, menyetujui UAT, mengelola stakeholder.
* **Akses Trello**: Admin (semua board).
* **AI Agent Instructions**: Bantu PM merangkum status sprint harian, deteksi card yang stagnan (>2 hari di list yang sama), dan draft release notes.

#### Peran: Tech Lead
* **Tanggung Jawab**: Arsitektur solusi, code review, mentoring developer, standar kode.
* **Akses Trello**: Admin (Sprint Board), View (Product Roadmap).
* **AI Agent Instructions**: Bantu Tech Lead review PR secara otomatis, cek kepatuhan kode terhadap standar, dan breakdown task teknis.

#### Peran: Developer
* **Tanggung Jawab**: Implementasi fitur, bug fixing, self-review, unit testing.
* **Akses Trello**: View/Edit (Sprint Board).
* **AI Agent Instructions**: Bantu developer menulis kode, generate test, dan update status Trello secara otomatis.

#### Peran: Product Analyst
* **Tanggung Jawab**: Requirement gathering, user story, UAT, komunikasi stakeholder.
* **Akses Trello**: Edit (Product Roadmap), View/Edit (Sprint Board).
* **AI Agent Instructions**: Bantu Analyst menyusun user story, draft acceptance criteria, dan validasi hasil UAT.

#### Peran: Stakeholder
* **Tanggung Jawab**: Validasi visi, approve milestone, provide resource.
* **Akses Trello**: View/Comment (semua board).
* **AI Agent Instructions**: Sediakan ringkasan eksekutif tiap sprint untuk stakeholder.

---

## 2. Alur Kerja Sprint

### 2.1 Siklus Sprint

| Fase | Durasi | Aktivitas |
|------|--------|-----------|
| **Sprint Planning** | Hari 1 (1-2 jam) | Review backlog, commit story points, breakdown task |
| **Eksekusi** | Hari 2-9 | Developer mengerjakan task, daily standup via Trello comment |
| **Code Review** | Continue | Setiap PR harus di-review <24 jam |
| **UAT** | Hari 9-10 | Product Analyst & Stakeholder validasi |
| **Sprint Review** | Hari 10 (1 jam) | Demo ke stakeholder, retrospective |

### 2.2 List Trello & Alur Card

```
Product Backlog → Ready for Dev → In Progress → Code Review → UAT/Testing → Done
```

1. **Product Backlog**: Semua ide/rencana. Setiap card harus punya user story & acceptance criteria minimal.
2. **Ready for Dev**: Card yang sudah siap dikerjakan (DoR terpenuhi). Di-prioritaskan oleh PM.
3. **In Progress**: Sedang dikerjakan. **Maksimal 3 card aktif per developer**.
4. **Code Review**: PR sudah dibuat. Wajib di-review <24 jam.
5. **UAT/Testing**: Menunggu validasi Product Analyst / Stakeholder.
6. **Done**: Semua DoD terpenuhi, sudah di-merge ke main.

### 2.3 Definition of Ready (DoR)

Card siap dikerjakan jika:
- User story lengkap dengan format: *Sebagai [X], saya ingin [Y], sehingga [Z]*
- Acceptance Criteria jelas & testable (bisa dicek ya/tidak)
- Dependencies teridentifikasi & resolved
- Story points sudah di-assign
- Technical breakdown sudah dilakukan (bila perlu)

### 2.4 Definition of Done (DoD)

Card dinyatakan selesai jika:
- Code complete & sudah di-commit
- Unit test >70% coverage (minimum)
- Feature/E2E test written untuk critical path
- Code review approved (minimal 1 reviewer)
- PR sudah di-merge ke branch utama
- UAT passed (bila ada)
- Dokumentasi diupdate (bila perlu)

---

## 3. Konvensi Trello

### 3.1 Judul Card

Gunakan format: `<tipe>: <deskripsi singkat>`

| Tipe | Contoh |
|------|--------|
| `feat` | `feat: Tambah halaman login SSO` |
| `fix` | `fix: Perbaiki validasi email duplikat` |
| `docs` | `docs: Update API documentation` |
| `refactor` | `refactor: Pisahkan UserController jadi service layer` |
| `test` | `test: Tambah unit test untuk AttendanceService` |
| `chore` | `chore: Upgrade dependency Laravel 10→11` |
| `perf` | `perf: Optimasi query presensi harian` |

### 3.2 Deskripsi Card (Template)

```markdown
## Deskripsi
[Apa masalahnya? Apa yang ingin dicapai?]

## User Story
Sebagai [Peran], saya ingin [Tindakan], sehingga [Manfaat].

## Acceptance Criteria
- [ ] Kriteria 1
- [ ] Kriteria 2
- [ ] Kriteria 3

## Technical Notes
- Stack: [Laravel / React / dll]
- Database: [tabel yang terpengaruh]
- Migration: [file migration baru?]

## Environment
- Target: [PROD / STAG / DEV]
- Deploy URL: [opsional]
```

### 3.3 Label Warna (Prioritas)

| Label | Warna | Arti |
|-------|-------|------|
| **Merah** | 🔴 | Prioritas Tinggi / Hotfix / Critical |
| **Kuning** | 🟡 | Prioritas Sedang / Fitur Reguler |
| **Hijau** | 🟢 | Prioritas Rendah / Refactoring / Tech Debt |
| **Biru** | 🔵 | Dokumentasi / Research / Learning |
| **Ungu** | 🟣 | Task Internal / Admin / Meeting |

### 3.4 Label Environment (Kustom)

| Label | Arti |
|-------|------|
| `Production` | Sudah di-deploy ke production |
| `Staging` | Sedang diuji di staging |
| `Development` | Masih dalam pengembangan lokal |

---

## 4. Konvensi Coding & Git

### 4.1 Branch Naming

| Tujuan | Format |
|--------|--------|
| Fitur baru | `feature/ISSUE-12-description` |
| Bug fix | `bugfix/ISSUE-15-description` |
| Hotfix | `hotfix/ISSUE-20-description` |
| Refactor | `refactor/ISSUE-22-description` |
| Docs | `docs/update-readme` |
| Chore | `chore/upgrade-deps` |

### 4.2 Commit Messages (Conventional Commits)

```bash
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Contoh:
```
feat(auth): implementasi login dengan Google SSO

- Tambah Google OAuth2 provider
- Buat callback handler
- Simpan refresh token ke database

Closes #42
```

### 4.3 Code Review Standards

1. **Self-review dulu** sebelum minta review: cek ulang diff sendiri, pastikan tidak ada debug code/comment
2. **PR deskriptif**: isi template PR dengan lengkap, screenshoot untuk UI changes
3. **Review <24 jam**: setiap PR wajib di-review dalam 1 hari kerja
4. **Minimal 1 approval**: tidak boleh merge sendiri
5. **Semua CI hijau**: jangan merge kalau ada test failure

### 4.4 Engineering Standards

- **Type Safety**: Hindari `any` (TypeScript) / `mixed` (PHP). Gunakan type/interface yang eksplisit.
- **Error Handling**: Semua operasi I/O, API call, dan query database harus punya error handling.
- **Logging**: Log error dengan konteks yang cukup untuk debugging (jangan log password/token).
- **Security**: Validasi & sanitize semua input user. Jangan pernah commit credential.

---

## 5. Testing Strategy

| Level | Tools | Coverage Target |
|-------|-------|-----------------|
| Unit Test | PHPUnit / Jest / Vitest | >70% |
| Feature Test | PHPUnit / Playwright | Critical path |
| E2E | Playwright / Cypress | Flow utama |
| Manual UAT | Checklist by Product Analyst | 100% AC |

---

## 6. Access Matrix

| Resource | PM | Tech Lead | Developer | Product Analyst | Stakeholder |
|----------|:---:|:---------:|:---------:|:---------------:|:-----------:|
| **Source Code** | admin | admin | write (branch) | read | read |
| **Playbook** | admin | admin | write | write | read |
| **Trello Sprint Board** | admin | admin | view/edit | view/edit | view/comment |
| **Trello Roadmap** | admin | view | view | edit | view/comment |
| **Staging** | full | full | operate | view | view |
| **Production** | full | full | ❌ | ❌ | view |
| **Database (prod)** | ❌ | emergency | ❌ | ❌ | ❌ |

---

## 7. Arsitektur & ADR

### 7.1 Apa itu ADR?
*Architecture Decision Record* (ADR) adalah catatan keputusan arsitektur penting. Simpan di `docs/adr/`.

### 7.2 Template ADR
```markdown
# ADR-XXX: [Judul Keputusan]

**Status**: [Proposed / Accepted / Deprecated]
**Date**: YYYY-MM-DD

## Context
[Mengapa keputusan ini perlu dibuat?]

## Decision
[Keputusan yang diambil]

## Consequences
[Dampak positif & negatif dari keputusan ini]
```

---

## 8. Komunikasi & Meeting

| Jenis | Frekuensi | Durasi | Peserta |
|-------|-----------|--------|---------|
| Daily Standup | Setiap hari | 15 menit | Developer + PM |
| Sprint Planning | Awal sprint | 1-2 jam | Semua tim |
| Sprint Review | Akhir sprint | 1 jam | Semua tim + stakeholder |
| Retrospective | Akhir sprint | 1 jam | Developer + PM |

### Daily Standup Format (via Trello comment)
1. **Kemarin**: Apa yang saya kerjakan?
2. **Hari ini**: Apa yang akan saya kerjakan?
3. **Blocker**: Ada kendala?

---

## 9. Labeling & Metadata (KAEDE MCP)

Template ini otomatis dibaca oleh **KAEDE Orchestrator** saat menjalankan perintah:
- `kaede orchestrate --playbook <path>` — memuat konteks tim, sprint, dan aturan
- `kaede run --playbook <path> "intent"` — mengeksekusi intent berdasarkan aturan playbook
- `kaede playbook parse <path>` — menampilkan hasil parsing playbook

### Label Color Mapping (untuk KAEDE)
| Kata Kunci | Warna Trello |
|------------|-------------|
| merah, high, critical, hotfix | `red` |
| kuning, medium, normal | `yellow` |
| hijau, low, refactor, tech debt | `green` |
| biru, blue, docs, documentation | `blue` |
| ungu, purple, admin, meeting | `purple` |

---

*Template ini adalah contoh. Edit sesuai kebutuhan tim kamu. Setelah selesai, hubungkan ke KAEDE dengan `kaede init --playbook path/to/playbook.md`.*
