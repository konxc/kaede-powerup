# Decision Log — KAEDE

Format:
```
## YYYY-MM-DD — [Judul Keputusan]
**Status**: [Proposed / Accepted / Deprecated]
**Pemutus**: [Nama]
**Konteks**: [Latar belakang / masalah]
**Keputusan**: [Apa yang diputuskan]
**Konsekuensi**: [Dampak positif & negatif]
```

---

## 2026-06-25 — Role Management Documentation

**Status**: Accepted
**Pemutus**: Sandikodev
**Konteks**: KAEDE perlu mendokumentasikan bagaimana role definitions di playbook diintegrasikan dengan Trello access dan AI Agent.
**Keputusan**: Buat docs/role-management.md yang menjelaskan mapping role → Trello → GitHub → AI Agent instructions.
**Konsekuensi**:
- (+) Dokumentasi terpusat untuk management akses
- (+) Memudahkan onboarding anggota baru

---

## 2026-06-25 — KAEDE Architecture & Roadmap (Dokumentasi Mendalam)

**Status**: Accepted
**Pemutus**: Sandikodev
**Konteks**: Setelah eksplorasi penuh codebase KAEDE + pull kerja tim sebelah (MCP server + CLI), dibutuhkan dokumentasi utuh yang menangkap: visi arsitektur, status tiap file, gap analysis, dan roadmap implementasi. Dokumentasi ini akan jadi acuan agent & developer agar tidak tumpang-tindih / salah paham.
**Keputusan**: Tambahkan entry decision-log ini + buat docs/kaede-architecture.md sebagai referensi teknis lengkap.
**Konsekuensi**:
- (+) Semua stakeholder punya referensi tunggal (source of truth)
- (+) Mencegah duplikasi usaha & misunderstanding arsitektur
- (+) Memudahkan onboarding developer baru ke project KAEDE
