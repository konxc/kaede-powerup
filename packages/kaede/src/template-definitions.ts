/**
 * KAEDE Built-in Template Definitions
 *
 * Setiap template adalah CardTemplateDef dengan descriptionTemplate
 * (markdown), checklistTemplates (array), commentTemplate (nullable),
 * dan defaultLabels.
 */

import type { CardTemplateDef } from './types';

export const BUILT_IN_TEMPLATES: Record<string, CardTemplateDef> = {
  feature: {
    name: 'feature',
    descriptionTemplate: `## {{task}}

### User Story
**As a** {{role}}  
**I want** {{want}}  
**So that** {{benefit}}

### Tech Stack
{{techStack}}

### References
{{reference}}`,
    checklistTemplates: [
      '{{feature}} works as expected (functional test)',
      'Validation: invalid input handled gracefully',
      'Edge case: empty/null state handled',
      'Error handling: API failure shows user-friendly message',
      'No regression in existing tests',
      'Code follows {{convention}} conventions',
      'Responsive on mobile & desktop',
    ],
    commentTemplate: `Panduan mengerjakan **{{task}}**:

1. Baca referensi: {{reference}}
2. Cek template implementasi di cards dengan label sejenis
3. Ikuti konvensi: {{convention}}
4. Pastikan semua Acceptance Criteria terpenuhi
5. Buat PR dengan template yang sudah disediakan

Semangat! 🚀`,
    defaultLabels: ['enhancement'],
  },

  bug: {
    name: 'bug',
    descriptionTemplate: `## Bug: {{task}}

### Severity
{{priority}}

### Environment
- **Browser/Device:** {{techStack}}
- **Feature area:** {{feature}}

### Steps to Reproduce
1. Go to...
2. Click on...
3. See error

### Expected Behavior
{{benefit}}

### Actual Behavior
{{want}}

### Error Logs
\`\`\`
[Paste error logs here]
\`\`\``,
    checklistTemplates: [
      'Bug confirmed and reproducible',
      'Root cause identified',
      'Fix implemented and tested',
      'Regression test added (prevents recurrence)',
      'Code review completed',
      'Deployed to staging for verification',
    ],
    commentTemplate: `Panduan fix bug **{{task}}**:

1. Reproduksi bug sesuai steps
2. Identifikasi root cause
3. Implementasi fix
4. Tambah regression test
5. Minta review sebelum merge

Referensi: {{reference}}`,
    defaultLabels: ['bug'],
  },

  task: {
    name: 'task',
    descriptionTemplate: `## {{task}}

### Description
{{want}}

### Tech Stack
{{techStack}}

### Context
{{benefit}}

### References
{{reference}}`,
    checklistTemplates: [
      'Implementation complete',
      'Unit tests written and passing',
      'Self-review completed',
      'PR created with proper description',
      'Documentation updated if needed',
    ],
    commentTemplate: `Cara mengerjakan **{{task}}**:

1. Pahami requirement di deskripsi
2. Implementasi sesuai standar {{convention}}
3. Test secara lokal
4. Buat PR

Deadline: bicarakan dengan tim jika ada blocker.`,
    defaultLabels: [],
  },

  chore: {
    name: 'chore',
    descriptionTemplate: `## {{task}}

### What needs to be done
{{want}}

### Why
{{benefit}}

### References
{{reference}}`,
    checklistTemplates: [
      'Task completed',
      'No side effects on existing functionality',
      'Team notified (if relevant)',
    ],
    commentTemplate: null,
    defaultLabels: ['chore'],
  },

  onboarding: {
    name: 'onboarding',
    descriptionTemplate: `## Onboarding: {{task}}

### Welcome!
{{want}}

### Technical Context
- **Project:** {{feature}}
- **Stack:** {{techStack}}
- **Conventions:** {{convention}}

### Your First Task
{{benefit}}

### References
{{reference}}`,
    checklistTemplates: [
      'Development environment set up',
      'Repo cloned and running locally',
      'Read master-plan.md (high level overview)',
      'Read team-playbook.md (culture & workflow)',
      'Completed first task PR',
      'Understood deployment process',
    ],
    commentTemplate: `Selamat datang! 🎉

Panduan onboarding **{{task}}**:

1. **Setup**: Pastikan environment development sudah jalan (bun, Laravel, PostgreSQL)
2. **Explore**: Baca kode yang sudah ada untuk paham pattern
3. **First task**: Kerjakan task pertama sebagai learning
4. **Bertanya**: Jangan ragu tanya di grup WhatsApp jika ada blocker

Key references: {{reference}}

Happy coding!`,
    defaultLabels: ['onboarding'],
  },

  'user-story': {
    name: 'user-story',
    descriptionTemplate: `## User Story: {{task}}

### Story
**As a** {{role}}
**I want** {{want}}
**So that** {{benefit}}

### Priority
{{priority}}

### Sprint
{{sprint}}

### Business Rules
1. {{reference}}

### Edge Cases
- {{convention}}

### Dependencies
- {{feature}}`,
    checklistTemplates: [
      'User story written following INVEST principles',
      'Acceptance criteria: functional — specific and testable',
      'Acceptance criteria: non-functional — performance, security, UX',
      'Business rules documented',
      'Edge cases identified and handled',
      'Mockup/wireframe attached (Figma/Excalidraw)',
      'Dependencies identified and linked',
      'Out of scope items documented',
    ],
    commentTemplate: `Panduan mengerjakan User Story **{{task}}**:

1. Baca user story lengkap di deskripsi
2. Pahami acceptance criteria (functional & non-functional)
3. Implementasi sesuai business rules
4. Handle edge cases yang sudah didokumentasikan
5. Pastikan dependencies terpenuhi

Referensi: {{reference}}
Priority: {{priority}}`,
    defaultLabels: ['enhancement'],
  },

  'sprint-planning': {
    name: 'sprint-planning',
    descriptionTemplate: `## Sprint Planning: {{task}}

### Sprint Goal
{{want}}

### Theme
{{feature}}

### Duration
{{sprint}}

### Key Results
- {{benefit}}

### References
{{reference}}`,
    checklistTemplates: [
      'Previous sprint review completed',
      'Backlog items prioritized',
      'Task estimation done (Planning Poker)',
      'Capacity planning completed',
      'Task assignment per developer',
      'Risks & mitigation identified',
      'Sprint commitment signed off',
    ],
    commentTemplate: `Panduan Sprint Planning **{{task}}**:

1. **Pre-Planning** (H-1): Product Analyst siapkan user story. Tech Lead breakdown teknis.
2. **Sprint Planning** (60-90 menit):
   - Review sprint sebelumnya
   - Present sprint goal
   - Review backlog (prioritas)
   - Estimation dengan Planning Poker
   - Capacity planning
   - Task assignment
3. **Post-Planning**: Update Trello, assign issues, setup milestone

Tech stack: {{techStack}}
Convention: {{convention}}`,
    defaultLabels: ['planning'],
  },

  'sprint-retro': {
    name: 'sprint-retro',
    descriptionTemplate: `## Sprint Retrospective: {{task}}

### What Went Well 😊
- {{want}}

### What to Improve 🤔
- {{benefit}}

### Action Items
- {{reference}}

### Sprint Context
Project: {{feature}}
Stack: {{techStack}}
Convention: {{convention}}`,
    checklistTemplates: [
      'Went Well items documented',
      'To Improve items documented',
      'Action items with assignee & deadline',
      'Action items added to next sprint backlog',
      'Team discussed openly without blame',
    ],
    commentTemplate: null,
    defaultLabels: ['retrospective'],
  },

  'daily-standup': {
    name: 'daily-standup',
    descriptionTemplate: `## Daily Standup: {{task}}

### What I Did Yesterday
{{want}}

### What I'll Do Today
{{benefit}}

### Blockers
{{reference}}

### Context
Sprint: {{sprint}}
Project: {{feature}}
Stack: {{techStack}}`,
    checklistTemplates: [
      'Progress update shared with team',
      'Blockers escalated if any',
      'Plan for today clear',
    ],
    commentTemplate: `Format Daily Standup:

1. **What I did yesterday**: {{want}}
2. **What I'll do today**: {{benefit}}
3. **Blockers**: {{reference}}

Pastikan update singkat (max 2 menit/orang).
Jika ada blocker, segera escalate ke Tech Lead.`,
    defaultLabels: ['standup'],
  },

  'seo-article': {
    name: 'seo-article',
    descriptionTemplate: `## SEO Article: {{task}}

### Target Keyword & Intent
- **Primary Keyword:** {{keyword}}
- **Search Intent:** Informational / Commercial / Transactional
- **Target Audience:** {{role}}

### Article Specification
- **Target Slug:** /{{task}}
- **Canonical URL:** {{reference}}
- **Pillar / Topic Cluster:** {{feature}}

### Outline & Content Structure
1. **Hook & Problem Statement (H1)**: {{want}}
2. **Core Solution & Educational Content (H2)**: {{benefit}}
3. **Step-by-step Implementation / Case Study (H2-H3)**
4. **Conclusion & Call to Action (CTA)**: {{ctaLink}}

### References & Sources
{{reference}}`,
    checklistTemplates: [
      'Keyword research verified in keywords-matrix.md',
      'Primary keyword placed in H1, first 100 words, and title tag',
      'Meta title (50-60 chars) and meta description (150-160 chars) written',
      'Internal links added to related topic cluster articles',
      'All images optimized (WebP format) with descriptive alt-text',
      'Brand voice & tone validated against .openkb/brand/',
      'Readability & grammar check complete (short paragraphs, bullet points)',
      'Draft published in CMS / WordPress with canonical URL',
    ],
    commentTemplate: `Panduan artikel SEO **{{task}}**:

1. Pastikan keyword "{{keyword}}" terdistribusi alami (tidak keyword stuffing).
2. Cek panduan brand di .openkb/brand/voice-and-tone.md.
3. Publish draft via WordPress MCP setelah review selesai.`,
    defaultLabels: ['seo', 'content'],
  },

  'social-media-post': {
    name: 'social-media-post',
    descriptionTemplate: `## Social Media: {{task}}

### Post Information
- **Platform:** {{platform}}
- **Publication Schedule:** {{publishDate}}
- **Target Audience:** {{role}}

### Copywriting & Angles
**Hook:**
{{want}}

**Core Body / Carousel Slide Content:**
{{benefit}}

**Call to Action (CTA):**
{{ctaLink}}

### Visual & Media Assets
- **Design / Canva / Asset Link:** {{assetUrl}}
- **Format:** Carousel / Single Post / Short Video / Reel`,
    checklistTemplates: [
      'Copywriting hook approved (passes 3-second attention check)',
      'Visual asset created according to brand guidelines',
      'CTA link tested with proper UTM tracking parameters',
      'Hashtags researched and relevant mentions tagged',
      'Brand voice & visual consistency checked against .openkb',
      'Scheduled in publishing tool or published to live platform',
    ],
    commentTemplate: `Panduan konten sosmed **{{task}}**:

1. Periksa aspect ratio visual (1:1 feed / 9:16 story/reels).
2. Gunakan UTM link di bio/caption: {{ctaLink}}
3. Cek engagement & respon komentar dalam 1 jam pertama rilis.`,
    defaultLabels: ['social-media', 'creative'],
  },

  'lead-funnel': {
    name: 'lead-funnel',
    descriptionTemplate: `## Lead Funnel: {{task}}

### Funnel Strategy
- **Funnel Stage:** {{funnelStage}}
- **Target Audience:** {{role}}
- **Core Offer / Lead Magnet:** {{offer}}

### Conversion Architecture
- **Traffic Source:** Ads (Meta/Google/TikTok) / Organic Content
- **Landing Page URL:** {{reference}}
- **Closing Destination:** WhatsApp / CRM / Checkout ({{ctaLink}})

### Core Problem & Benefit
- **Problem Faced:** {{want}}
- **Desired Transformation:** {{benefit}}`,
    checklistTemplates: [
      'Landing page copy aligned with ad creative message',
      'Opt-in form / WhatsApp lead trigger tested & verified',
      'Tracking pixel, Conversions API & UTM events firing correctly',
      'Lead magnet / offer delivery tested end-to-end',
      'Auto-responder follow up sequence active',
      'A/B testing hook variations prepared',
    ],
    commentTemplate: `Panduan kampanye funnel **{{task}}**:

1. Pastikan pesan landing page dan iklan selaras (message match).
2. Verifikasi nomor WhatsApp tujuan aktif dan auto-responder menyapa prospek.
3. Monitor conversion rate dan Cost Per Lead (CPL).`,
    defaultLabels: ['marketing', 'funnel'],
  },

  'web-copy': {
    name: 'web-copy',
    descriptionTemplate: `## Web Copy: {{task}}

### Page Objective
- **Page / Section:** {{feature}}
- **Target Persona:** {{role}}
- **Primary Goal:** {{want}}

### Value Proposition & Objection Handling
- **Main Benefit:** {{benefit}}
- **Key Objections Addressed:** Price, Trust, Implementation Time
- **Call to Action (CTA):** {{ctaLink}}

### References & Wireframe
{{reference}}`,
    checklistTemplates: [
      'Hero section headline passes the 5-second clarity test',
      'Value proposition clearly distinguishes USP from competitors',
      'Social proof, testimonials, and trust badges positioned effectively',
      'Benefit-driven copy with scannable subheaders & bullets',
      'Friction points eliminated on form fields and CTA buttons',
      'Mobile typography and readability validated',
    ],
    commentTemplate: `Panduan copywriting web **{{task}}**:

1. Gunakan voice & tone dari .openkb/brand/voice-and-tone.md.
2. Fokus pada benefit bagi pembaca (WIIFM: What's in it for me).
3. Pastikan tombol CTA kontras dan kata kerja berorientasi tindakan.`,
    defaultLabels: ['copywriting', 'web'],
  },
};
