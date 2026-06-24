# Role Management — Integrasi Role dengan Trello & AI Agent

> Bagaimana role definitions di `playbook/ROLES/` dipetakan ke akses Trello, GitHub,
> dan diintegrasikan dengan AI Agent melalui KAEDE Power-Up.

---

## Konsep

Setiap anggota tim memiliki role yang mendefinisikan:
1. **Akses Trello** — Board mana yang bisa dilihat/diedit
2. **Akses GitHub** — Repo mana yang bisa dibaca/ditulis
3. **AI Instructions** — Bagaimana AI Agent harus berperilaku saat membantu role ini

KAEDE menghubungkan ketiganya.

---

## Mapping Role → Trello Access

| Role | Board | Permission |
|---|---|---|
| **Product Analyst** | Product Roadmap | admin |
| | Sprint Board | edit |
| **Junior Developer** | Sprint Board | view, comment |
| | Product Roadmap | view |
| **Senior Developer** | All boards | admin |
| **Project Manager** | All boards | admin |
| **Stakeholder** | Product Roadmap | view, comment |
| | Sprint Board | view, comment |

---

## Mapping Role → GitHub Access

| Role | core.git | webapp.git | playbook.git | Issues |
|---|---|---|---|---|
| Product Analyst | read | read | write | create, comment |
| Junior Developer | write (branch) | write (branch) | write | create, comment |
| Senior Developer | admin | admin | admin | triage |
| Project Manager | admin | admin | admin | triage |
| Stakeholder | ❌ | ❌ | read | view, comment |

---

## Integrasi dengan AI Agent

KAEDE Power-Up menyediakan API endpoint yang bisa dipanggil oleh AI Agent
untuk mengetahui role current user dan aksesnya:

```
GET /api/role/{username}
→ Response: { role: "product-analyst", trello: {...}, github: {...} }
```

Format MCP request dari AI Agent:

```json
{
  "tool": "get_user_role",
  "params": {
    "username": "ahmad-hanif"
  }
}
```

Response:

```json
{
  "role": "product-analyst",
  "instructions": "~/.openkb/ROLES/product-analyst.md",
  "trello": {
    "boards": ["Product Roadmap", "Sprint Board"],
    "permission": "edit"
  },
  "github": {
    "repos": ["aksesekolah", "core", "playbook"],
    "access": "read"
  }
}
```

---

## Setup Role Baru

1. Buat file `playbook/ROLES/<role>.md` (copy dari `_TEMPLATE.md`)
2. Update `access/matrix-per-role.md`
3. Assign role ke user di KAEDE dashboard
4. User setup: `~/.openkb/ROLES/<role>.md` (copy dari playbook)

---

*Dokumen ini adalah bagian dari [KAEDE Power-Up](https://kaede-powerup.netlify.app).*
