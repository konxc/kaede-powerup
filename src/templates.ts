/**
 * KAEDE Card Template Engine
 *
 * Generates card descriptions, acceptance criteria checklists,
 * and guidance comments from playbook conventions + template variables.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';
import type { CardTemplateDef, BuiltInTemplate, TemplateVars, TemplateResult, UserTemplateSource } from './types';
import { BUILT_IN_TEMPLATES } from './template-definitions';

// ── User-defined Templates ──

const USER_DEFINED_TEMPLATES: Map<string, CardTemplateDef> = new Map();

// ── Render Helper ──

function fillTemplate(tpl: string, vars: TemplateVars): string {
  const fallback = (key: string): string => {
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    return vars[key] || vars[key.toLowerCase()] || `{{${key}}}`;
  };

  return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : fallback(key);
  });
}

// ── Parse Markdown Playbook Template into CardTemplateDef ──

export function parseMarkdownTemplate(content: string, name: string): CardTemplateDef | null {
  const lines = content.split('\n');
  let descriptionTemplate = '';
  const checklistTemplates: string[] = [];
  let commentTemplate = '';
  const defaultLabels: string[] = [];
  let inChecklist = false;
  let inDescription = false;
  let inComment = false;
  const descriptionLines: string[] = [];
  const commentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ') && !line.includes('Template') && !line.includes('Examples') && !line.includes('Tips') && !line.includes('Practices')) {
      if (inChecklist) inChecklist = false;
      inDescription = true;
      descriptionLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      if (line.toLowerCase().includes('acceptance') || line.toLowerCase().includes('checklist') || line.toLowerCase().includes('criteria')) {
        inChecklist = true;
        inDescription = false;
        continue;
      }
      if (line.toLowerCase().includes('comment') || line.toLowerCase().includes('panduan') || line.toLowerCase().includes('guid')) {
        inComment = true;
        inDescription = false;
        inChecklist = false;
        continue;
      }
    }

    if (line.startsWith('- [ ]') && inChecklist) {
      checklistTemplates.push(line.replace(/^- \[ \]\s*/, '').trim());
      continue;
    }

    if (line.match(/^labels?:\s*/i)) {
      const labels = line.replace(/^labels?:\s*/i, '').split(',').map((s) => s.trim().toLowerCase());
      defaultLabels.push(...labels);
      continue;
    }

    if (inComment) {
      commentLines.push(line);
    }

    if (line.startsWith('> ') || line.startsWith('---')) {
      continue;
    }
  }

  descriptionTemplate = descriptionLines.join('\n').trim();
  if (!descriptionTemplate) {
    descriptionTemplate = `## {{task}}\n\n### Description\n{{want}}\n\n### Benefit\n{{benefit}}\n\n### References\n{{reference}}`;
  }

  const commentText = commentLines.join('\n').trim();
  if (!commentText) {
    commentTemplate = undefined as unknown as string;
  } else {
    commentTemplate = commentText;
  }

  return {
    name,
    descriptionTemplate,
    checklistTemplates: checklistTemplates.length > 0 ? checklistTemplates : ['Task completed', 'Code reviewed', 'Documentation updated'],
    commentTemplate: commentTemplate || undefined,
    defaultLabels,
  };
}

// ── Load User-Defined Templates ──

export function loadTemplatesFromDir(dirPath: string): UserTemplateSource[] {
  const loaded: UserTemplateSource[] = [];
  if (!existsSync(dirPath)) return loaded;

  try {
    if (!statSync(dirPath).isDirectory()) return loaded;
    const entries = readdirSync(dirPath);
    const mdFiles = entries
      .filter((f) => extname(f).toLowerCase() === '.md')
      .sort();

    for (const file of mdFiles) {
      const fullPath = resolve(dirPath, file);
      const content = readFileSync(fullPath, 'utf-8');
      const name = file.replace(/\.md$/i, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      const template = parseMarkdownTemplate(content, name);
      if (template) {
        USER_DEFINED_TEMPLATES.set(name, template);
        loaded.push({ path: fullPath, name });
      }
    }
  } catch {
    // silent
  }

  return loaded;
}

export function clearUserTemplates(): void {
  USER_DEFINED_TEMPLATES.clear();
}

// ── Public API ──

export function getTemplate(name: string): CardTemplateDef | null {
  if (name in BUILT_IN_TEMPLATES) return BUILT_IN_TEMPLATES[name];
  if (USER_DEFINED_TEMPLATES.has(name)) return USER_DEFINED_TEMPLATES.get(name) || null;
  return null;
}

export function listTemplates(): CardTemplateDef[] {
  const builtIn = Object.values(BUILT_IN_TEMPLATES);
  const userDefined = Array.from(USER_DEFINED_TEMPLATES.values());
  return [...builtIn, ...userDefined];
}

export function applyTemplate(
  source: CardTemplateDef | BuiltInTemplate | string,
  vars: TemplateVars,
): TemplateResult {
  const template = typeof source === 'string' ? getTemplate(source) : source;
  if (!template) {
    return {
      description: vars.description || vars.task || '',
      checklist: [],
      comment: undefined,
      labels: [],
    };
  }

  const def = template as CardTemplateDef;
  const defaults: TemplateVars = {
    role: 'user',
    want: 'this feature',
    benefit: 'improve workflow',
    feature: 'SMART Absen',
    techStack: 'Laravel + React + PostgreSQL',
    convention: 'PSR-12 / Conventional Commits',
    reference: 'master-plan.md',
    priority: 'Medium',
    ...vars,
  };

  return {
    description: fillTemplate(def.descriptionTemplate, defaults),
    checklist: def.checklistTemplates.map((t) => fillTemplate(t, defaults)),
    comment: def.commentTemplate ? fillTemplate(def.commentTemplate, defaults) : undefined,
    labels: def.defaultLabels ? [...def.defaultLabels] : [],
  };
}

export function generateCardFromTemplate(
  templateName: BuiltInTemplate | string,
  vars: TemplateVars,
): TemplateResult {
  return applyTemplate(templateName, vars);
}
