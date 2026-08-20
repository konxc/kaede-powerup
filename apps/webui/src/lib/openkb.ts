import { getFileContent } from './github';
import type { OpenKBConfig } from './types';

export async function fetchOpenKB(owner: string, repo: string, path: string): Promise<OpenKBConfig> {
  const glossaryContent = await getFileContent(owner, repo, `${path}/SHARED/glossary.md`);
  const referencesContent = await getFileContent(owner, repo, `${path}/SHARED/references.md`);
  const decisionLogContent = await getFileContent(owner, repo, `${path}/SHARED/decision-log.md`);

  const glossary = parseGlossary(glossaryContent || '');
  const references = parseReferences(referencesContent || '');
  const decisionLog = parseDecisionLog(decisionLogContent || '');

  return { glossary, references, decisionLog };
}

function parseGlossary(content: string): Record<string, string> {
  const glossary: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|$/);
    if (match) {
      glossary[match[1]] = match[2];
    }
  }

  return glossary;
}

function parseReferences(content: string): { name: string; url: string }[] {
  const references: { name: string; url: string }[] = [];
  const linkRegex = /\[(.+?)\]\((.+?)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    references.push({ name: match[1], url: match[2] });
  }

  return references;
}

function parseDecisionLog(content: string): { date: string; decision: string; context: string }[] {
  const decisions: { date: string; decision: string; context: string }[] = [];
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || '';
    const body = lines.slice(1).join('\n').trim();

    const dateMatch = title.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      decisions.push({
        date: dateMatch[1],
        decision: title.replace(dateMatch[1], '').trim(),
        context: body,
      });
    }
  }

  return decisions;
}
