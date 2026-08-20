# KAEDE Dashboard

Team & Role Management berdasarkan OpenKB/Playbook steering.

## Fitur

- **Dashboard** — Overview tim, project, dan access matrix
- **Teams** — Kelola anggota tim dan role assignments
- **Roles** — Definisi role dan akses berdasarkan Playbook
- **Playbook** — Konvensi dan workflow tim

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- GitHub API (Octokit)

## Setup

```bash
bun install
bun dev
```

## Environment Variables

```env
GITHUB_TOKEN=ghp_xxx
```

## Deploy

Deploy ke Vercel:

```bash
vercel deploy
```

## Integration

Dashboard ini membaca konfigurasi dari:
- **Playbook** — Role definitions, access matrix, workflow conventions
- **OpenKB** — Glossary, references, decision log
- **GitHub API** — Org members, teams, repo collaborators

Source of truth: GitHub repo dengan struktur OpenKB/Playbook.
