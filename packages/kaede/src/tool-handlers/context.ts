/**
 * KAEDE MCP — Context Tool Handlers
 *
 * Menangani: status, parse_playbook, bundle_context, resolve_board, resolve_context
 */

import { existsSync } from 'fs';
import * as orch from '../orchestrator';
import * as prompter from '../prompter';

const SERVER = { name: 'KAEDE Orchestrator MCP', version: '1.0.0' as const };

export function handleStatus(args: Record<string, unknown>): Record<string, unknown> {
  let playbookOk = false;
  let openkbOk = false;
  if (args.playbookPath as string) playbookOk = existsSync(args.playbookPath as string);
  if (args.openkbPath as string) openkbOk = existsSync(args.openkbPath as string);
  return { server: SERVER, playbookPathAccessible: playbookOk, openkbPathAccessible: openkbOk };
}

export function handleParsePlaybook(args: Record<string, unknown>): Record<string, unknown> {
  return orch.parsePlaybook(args.content as string) as unknown as Record<string, unknown>;
}

export function handleBundleContext(args: Record<string, unknown>): Record<string, unknown> {
  const ctx = orch.bundleContext({
    playbook: args.playbookPath as string,
    openkb: args.openkbPath as string,
    opencode: args.opencodePath as string,
  });
  const result: Record<string, unknown> = {
    title: ctx.playbook?.title || null,
    rolesCount: ctx.playbook?.roles?.length || 0,
    lists: ctx.playbook?.workflow?.lists || [],
    labels: ctx.playbook?.conventions?.labels || [],
    openkbTerms: ctx.openkb.glossary?.length || 0,
    openkbDecisions: ctx.openkb.decisions?.length || 0,
    hasMCP: !!(ctx.opencode as Record<string, unknown>)?.mcp,
  };
  if (args.boardName) result.boardName = args.boardName as string;
  return result;
}

export function handleResolveBoard(args: Record<string, unknown>): Record<string, unknown> {
  const desc = (args.description as string) || '';
  const lower = desc.toLowerCase();

  const projectNames: string[] = [];
  const boardMatch = lower.match(/(\w+)\s+board/);
  if (boardMatch) projectNames.push(boardMatch[1]);
  const projMatch = lower.match(/project\s+(\w[\w\s]{0,20}?\w)/);
  if (projMatch) projectNames.push(projMatch[1]);

  const stopwords = new Set([
    'di', 'dan', 'ke', 'dari', 'untuk', 'yang', 'ini', 'itu', 'dengan', 'pada',
    'saya', 'kami', 'kita', 'akan', 'telah', 'sudah', 'ada', 'dapat', 'bisa',
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'board',
    'project', 'semua', 'semua', 'apapun', 'khusus', 'belum', 'menyiapkan',
  ]);
  const keywords = desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))
    .filter((w, i, a) => a.indexOf(w) === i);

  return {
    original: desc,
    suggestedNameFilter: keywords.join(' '),
    suggestedQuery: projectNames.length > 0 ? projectNames[0] : keywords[0] || '',
    projectHints: projectNames,
    keywords,
    note: 'Gunakan suggestedQuery dengan search_boards, atau suggestedNameFilter dengan list_boards(nameFilter) di mcp.trello',
  };
}

export function handleResolveContext(args: Record<string, unknown>): Record<string, unknown> {
  const goal = (args.goal as string) || '';
  const boardName = (args.boardName as string) || '';
  const list = (args.list as string) || '';
  const rawBoards = (args.boards as Array<Record<string, unknown>>) || [];
  const playbookMd = (args.playbook as string) || '';

  const boards = rawBoards.map((b) => ({
    boardId: b.boardId as string,
    boardName: (b.boardName as string) || '',
  }));

  let playbookResult: orch.PlaybookResult | null = null;
  if (playbookMd) playbookResult = orch.parsePlaybook(playbookMd);

  const ctx = prompter.resolveContext(
    { boardName, list },
    {
      goal,
      playbook: playbookResult || undefined,
      boards: boards.length > 0 ? boards : undefined,
    },
  );

  const inference = prompter.inferFromGoal(goal);
  return { resolvedContext: ctx, inference } as Record<string, unknown>;
}
