/**
 * KAEDE Playbook Parser
 *
 * Pure functions untuk parsing markdown playbook menjadi
 * structured data (roles, workflow lists, conventions).
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';
import type { PlaybookResult, BundlePaths, BundleContextResult } from './types';

// ── Section Map ──

const SECTION_MAP: Record<string, string[]> = {
  roles: ['peran', 'role', 'roles & responsibilities', 'team roles', 'roles', 'siapa saja'],
  workflow: ['alur', 'workflow', 'sprint workflow', 'kanban', 'sprint'],
  conventions: ['konvensi', 'nama', 'naming', 'standards', 'aturan', 'conventions', 'convention'],
};

function mapSection(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [key, keywords] of Object.entries(SECTION_MAP)) {
    if (keywords.some((k) => lower.includes(k))) return key;
  }
  return null;
}

// ── Parse Playbook ──

export function parsePlaybook(content: string): PlaybookResult {
  const lines = content.split('\n');
  const result: PlaybookResult = {
    title: '',
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };

  let currentSection: string | null = null;
  let currentRole: PlaybookResult['roles'][0] | null = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const listItem = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.*)/);

    if (h1 && !result.title) {
      result.title = h1[1].trim();
      continue;
    }

    if (h2) {
      currentSection = mapSection(h2[1]);
      continue;
    }

    if (currentSection === 'roles' && h3) {
      if (currentRole) result.roles.push(currentRole);
      const roleName = h3[1].replace(/Peran:\s*/i, '').trim();
      currentRole = { name: roleName, responsibilities: [], access: '', aiInstructions: '' };
      continue;
    }

    if (currentRole && listItem) {
      const key = listItem[1].toLowerCase();
      const value = listItem[2].trim();
      if (key.includes('tanggung')) {
        currentRole.responsibilities.push(value);
      } else if (key.includes('akses')) {
        currentRole.access = value;
      } else if (key.includes('ai')) {
        currentRole.aiInstructions = value;
      }
    }

    if (currentSection === 'workflow') {
      const wfListLine = line.match(/^[-*\d]+\.?\s+\*\*(.+?)\*\*/);
      if (wfListLine) {
        const listName = wfListLine[1].trim();
        if (listName && !result.workflow.lists.includes(listName)) {
          result.workflow.lists.push(listName);
        }
      }
    }

    if (currentSection === 'conventions') {
      const prefixMatch = line.match(/`(feat|fix|docs|chore|refactor|test):/g);
      if (prefixMatch) {
        for (const p of prefixMatch) {
          const cleaned = p.replace(/`/g, '');
          if (!result.conventions.titlePrefixes.includes(cleaned)) {
            result.conventions.titlePrefixes.push(cleaned);
          }
        }
      }
      const labelColorMatch = line.match(/\*{0,2}(merah|kuning|hijau|red|yellow|green)\*{0,2}\s*:\s*(.+)/i);
      if (labelColorMatch) {
        result.conventions.labels.push({ color: labelColorMatch[1], meaning: labelColorMatch[2].trim() });
      }
    }
  }

  if (currentRole) result.roles.push(currentRole);
  return result;
}

// ── Read Directory Playbook ──

function readDirPlaybook(dirPath: string): PlaybookResult | null {
  try {
    const entries = readdirSync(dirPath);
    const mdFiles = entries
      .filter((f) => extname(f).toLowerCase() === '.md')
      .sort()
      .map((f) => resolve(dirPath, f));
    if (mdFiles.length === 0) return null;
    const combined = mdFiles.map((f) => readFileSync(f, 'utf-8')).join('\n\n');
    return parsePlaybook(combined);
  } catch {
    return null;
  }
}

// ── Bundle Context ──

export function bundleContext(paths: BundlePaths): BundleContextResult {
  const context: BundleContextResult = {
    playbook: null,
    openkb: { glossary: [], decisions: [] },
    opencode: null,
  };

  if (paths.playbook && existsSync(paths.playbook)) {
    try {
      if (statSync(paths.playbook).isDirectory()) {
        context.playbook = readDirPlaybook(paths.playbook);
      } else {
        const content = readFileSync(paths.playbook, 'utf-8');
        context.playbook = parsePlaybook(content);
      }
    } catch {
      context.playbook = null;
    }
  }

  if (paths.openkb) {
    try {
      const glossaryPath = resolve(paths.openkb, 'SHARED', 'glossary.md');
      if (existsSync(glossaryPath)) {
        const gl = readFileSync(glossaryPath, 'utf-8');
        context.openkb.glossary = gl.split('\n').filter((l) => l.startsWith('- **'));
      }
      const decisionPath = resolve(paths.openkb, 'SHARED', 'decision-log.md');
      if (existsSync(decisionPath)) {
        const dl = readFileSync(decisionPath, 'utf-8');
        context.openkb.decisions = dl.split('\n').filter((l) => l.startsWith('## '));
      }
    } catch {
      // openkb opsional, silent
    }
  }

  if (paths.opencode) {
    try {
      const configPath = resolve(paths.opencode, 'opencode.json');
      if (existsSync(configPath)) {
        context.opencode = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      }
    } catch {
      context.opencode = null;
    }
  }

  return context;
}
