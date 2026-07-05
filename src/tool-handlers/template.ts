/**
 * KAEDE MCP — Template Tool Handlers
 *
 * Menangani: generate_template, load_templates
 */

import { existsSync } from 'fs';
import * as tmpl from '../templates';

export function handleGenerateTemplate(args: Record<string, unknown>): Record<string, unknown> {
  const templateName = (args.template as string) || '';
  const vars: Record<string, string | undefined> = {
    task: (args.task as string) || '',
    role: args.role as string | undefined,
    want: args.want as string | undefined,
    benefit: args.benefit as string | undefined,
    feature: args.feature as string | undefined,
    techStack: args.techStack as string | undefined,
    convention: args.convention as string | undefined,
    reference: args.reference as string | undefined,
    priority: args.priority as string | undefined,
    assignee: args.assignee as string | undefined,
    sprint: args.sprint as string | undefined,
    technologies: args.technologies as string | undefined,
  };
  const result = tmpl.generateCardFromTemplate(templateName, vars);
  return result as Record<string, unknown>;
}

export function handleLoadTemplates(args: Record<string, unknown>): Record<string, unknown> {
  const dirPath = args.dirPath as string;
  if (!existsSync(dirPath)) {
    return { success: false, error: `Directory not found: ${dirPath}` } as Record<string, unknown>;
  }
  const count = tmpl.loadTemplatesFromDir(dirPath);
  return { success: true, templatesLoaded: count, totalTemplates: tmpl.listTemplates().length } as Record<string, unknown>;
}
