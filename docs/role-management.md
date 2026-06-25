# Role Management — Integrasi Role dengan Trello & AI Agent

> Bagaimana role definitions dipetakan ke akses Trello, GitHub, dan diintegrasikan dengan AI Agent melalui KAEDE.

---

## Konsep

Setiap anggota tim memiliki role yang mendefinisikan:
1. **Akses Trello** — Board mana yang bisa dilihat/diedit
2. **Akses GitHub** — Repo mana yang bisa dibaca/ditulis
3. **AI Instructions** — Bagaimana AI Agent harus berperilaku saat membantu role ini

KAEDE menghubungkan ketiganya melalui konfigurasi yang terpusat.

---

## Template Mapping Role → Trello Access

| Role | Board | Permission |
|------|-------|------------|
| **Product Analyst** | Product Roadmap | admin |
| | Sprint Board | edit |
| **Developer** | Sprint Board | view, comment |
| | Product Roadmap | view |
| **Senior/Tech Lead** | All boards | admin |
| **Project Manager** | All boards | admin |
| **Stakeholder** | Product Roadmap | view, comment |
| | Sprint Board | view, comment |

*Sesuaikan nama board dan permission sesuai kebutuhan project masing-masing.*

---

## Template Mapping Role → GitHub Access

| Role | Code Repos | Playbook | Issues |
|------|-----------|----------|--------|
| Product Analyst | read | write | create, comment |
| Developer | write (branch) | write | create, comment |
| Senior/Tech Lead | admin | admin | triage |
| Project Manager | admin | admin | triage |
| Stakeholder | ❌ | read | view, comment |

*Sesuaikan akses per repo sesuai struktur organisasi masing-masing.*

---

## Integrasi dengan AI Agent

KAEDE menyediakan mekanisme agar AI Agent dapat membaca role konteks user melalui file `~/.openkb/ROLES/<role>.md` yang disalin dari playbook project.

### Cara Kerja

1. **Playbook** mendefinisikan role di `playbook/ROLES/<role>.md`
2. **Developer** menyalin file role ke `~/.openkb/ROLES/<role>.md`
3. **AI Agent** membaca file role tersebut sebagai instruksi tambahan
4. **KAEDE Power-Up** membaca akses dari Trello storage

### Format Role File

File role (`~/.openkb/ROLES/<role>.md`) berisi:

```markdown
# Role: [Nama Role]

## Tanggung Jawab
- [Daftar tanggung jawab utama]

## AI Instructions
- [Bagaimana AI Agent harus membantu role ini]
- [Preferensi komunikasi]

## Tool Access
- Trello: [level akses]
- GitHub: [level akses]
- Lainnya: [level akses]

## Output yang Diharapkan
- [Daftar output per peran]
```

### Integrasi dengan Opencode

Setiap developer mengonfigurasi Opencode untuk membaca role file:

```json
{
  "instructions": [
    ".opencode/SHARED/project-context.md",
    "~/.openkb/ROLES/<role>.md"
  ]
}
```

---

## Setup Role Baru

1. Buat file `playbook/ROLES/<role>.md` (copy dari `_TEMPLATE.md`)
2. Update matrix akses di dokumentasi project
3. Assign role ke user di Trello board settings
4. User setup: `cp playbook/ROLES/<role>.md ~/.openkb/ROLES/`

---

## Contoh Dinamis: Satu Orang, Banyak Role

Seorang anggota tim bisa memiliki role berbeda di project berbeda:

```
Person A — Profile
├── Skill: [Business Analysis, UI/UX Design]
│
├── PROJECT: Project Alpha
│   └── ROLE: Product Analyst
│       ├── playbook/ROLES/product-analyst.md
│       ├── Trello: Product Roadmap (admin)
│       └── Output: User story, UAT sign-off
│
└── PROJECT: Project Beta
    └── ROLE: UI/UX Designer
        ├── playbook/ROLES/ui-ux-designer.md
        ├── Trello: Design Board (admin)
        └── Output: Wireframe, design system
```

Cukup ganti file role yang di-load → AI Agent langsung berubah perilaku sesuai role baru.

---

*Dokumen ini adalah bagian dari [KAEDE](https://kaede-powerup.netlify.app). Dapat digunakan kembali untuk project manapun.*
