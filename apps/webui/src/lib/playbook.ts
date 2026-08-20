import matter from 'gray-matter';
import type { RoleDefinition, Role, PlaybookConfig, AccessMatrixEntry } from './types';

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Mengelola sprint, koordinasi tim, dan komunikasi stakeholder',
    trelloAccess: [
      { resource: 'All boards', permission: 'admin' },
    ],
    githubAccess: [
      { resource: 'Code Repos', permission: 'admin' },
      { resource: 'Playbook', permission: 'admin' },
      { resource: 'Issues', permission: 'triage' },
    ],
    aiInstructions: [
      'Bantu koordinasi sprint planning dan retrospektif',
      'Track progress semua card dan laporkan blocker',
      'Otomatisasi update status ke stakeholder',
    ],
  },
  {
    id: 'tech-lead',
    name: 'Senior / Tech Lead',
    description: 'Arsitektur teknis, code review, dan keputusan teknis',
    trelloAccess: [
      { resource: 'All boards', permission: 'admin' },
    ],
    githubAccess: [
      { resource: 'Code Repos', permission: 'admin' },
      { resource: 'Playbook', permission: 'admin' },
      { resource: 'Issues', permission: 'triage' },
    ],
    aiInstructions: [
      'Review code changes dan berikan feedback teknis',
      'Bantu arsitektur dan design patterns',
      'Monitor tech debt dan suggest refactoring',
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Implementasi fitur, bug fix, dan maintenance',
    trelloAccess: [
      { resource: 'Sprint Board', permission: 'view' },
      { resource: 'Product Roadmap', permission: 'view' },
    ],
    githubAccess: [
      { resource: 'Code Repos', permission: 'write' },
      { resource: 'Playbook', permission: 'write' },
      { resource: 'Issues', permission: 'create, comment' },
    ],
    aiInstructions: [
      'Bantu implementasi kode sesuai acceptance criteria',
      'Suggest unit tests dan documentation',
      'Bantu debugging dan troubleshooting',
    ],
  },
  {
    id: 'product-analyst',
    name: 'Product Analyst',
    description: 'Analisis kebutuhan, user story, dan UAT',
    trelloAccess: [
      { resource: 'Product Roadmap', permission: 'admin' },
      { resource: 'Sprint Board', permission: 'edit' },
    ],
    githubAccess: [
      { resource: 'Code Repos', permission: 'read' },
      { resource: 'Playbook', permission: 'write' },
      { resource: 'Issues', permission: 'create, comment' },
    ],
    aiInstructions: [
      'Bantu tulis user story dan acceptance criteria',
      'Review fitur dari sudut pandang user',
      'Siapkan UAT checklist dan test cases',
    ],
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder',
    description: 'Monitoring progress dan memberikan feedback',
    trelloAccess: [
      { resource: 'Product Roadmap', permission: 'comment' },
      { resource: 'Sprint Board', permission: 'comment' },
    ],
    githubAccess: [
      { resource: 'Code Repos', permission: 'none' },
      { resource: 'Playbook', permission: 'read' },
      { resource: 'Issues', permission: 'view, comment' },
    ],
    aiInstructions: [
      'Berikan ringkasan progress yang mudah dipahami',
      'Jawab pertanyaan tentang status project',
    ],
  },
];

const DEFAULT_WORKFLOW = [
  'Product Backlog',
  'Ready for Dev',
  'In Progress',
  'Code Review',
  'UAT/Testing',
  'Done',
];

const DEFAULT_ACCESS_MATRIX: AccessMatrixEntry[] = [
  {
    role: 'project-manager',
    resources: {
      sourceCode: 'admin',
      playbook: 'admin',
      trelloSprint: 'admin',
      trelloRoadmap: 'admin',
      staging: 'read',
      production: 'read',
      database: 'read',
    },
  },
  {
    role: 'tech-lead',
    resources: {
      sourceCode: 'admin',
      playbook: 'admin',
      trelloSprint: 'admin',
      trelloRoadmap: 'admin',
      staging: 'write',
      production: 'read',
      database: 'read',
    },
  },
  {
    role: 'developer',
    resources: {
      sourceCode: 'write',
      playbook: 'write',
      trelloSprint: 'read',
      trelloRoadmap: 'read',
      staging: 'write',
      production: 'none',
      database: 'none',
    },
  },
  {
    role: 'product-analyst',
    resources: {
      sourceCode: 'read',
      playbook: 'write',
      trelloSprint: 'edit',
      trelloRoadmap: 'admin',
      staging: 'read',
      production: 'none',
      database: 'none',
    },
  },
  {
    role: 'stakeholder',
    resources: {
      sourceCode: 'none',
      playbook: 'read',
      trelloSprint: 'comment',
      trelloRoadmap: 'comment',
      staging: 'none',
      production: 'none',
      database: 'none',
    },
  },
];

export function parsePlaybook(content: string): PlaybookConfig {
  const { data: frontmatter, content: body } = matter(content);

  const roles: RoleDefinition[] = DEFAULT_ROLES;
  const workflow = DEFAULT_WORKFLOW;
  const accessMatrix = DEFAULT_ACCESS_MATRIX;

  const sections = body.split(/^## /m).filter(Boolean);
  const conventions: Record<string, string> = {};

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || '';
    const content = lines.slice(1).join('\n').trim();
    if (title && content) {
      conventions[title] = content;
    }
  }

  return {
    teamRoles: roles,
    sprintWorkflow: workflow,
    conventions,
    accessMatrix,
  };
}

export function getRoleDefinitions(): RoleDefinition[] {
  return DEFAULT_ROLES;
}

export function getRoleById(id: Role): RoleDefinition | undefined {
  return DEFAULT_ROLES.find(r => r.id === id);
}

export function getAccessMatrix(): AccessMatrixEntry[] {
  return DEFAULT_ACCESS_MATRIX;
}
